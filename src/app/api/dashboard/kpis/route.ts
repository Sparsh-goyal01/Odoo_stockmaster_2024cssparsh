import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    // Verify authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Total products count
    const totalProducts = await prisma.product.count({
      where: { isActive: true },
    })

    // Get low stock items by checking against reorder rules
    const reorderRules = await prisma.reorderRule.findMany({
      include: {
        product: {
          include: {
            stockQuants: true,
          },
        },
      },
    })

    let lowStockItems = 0
    for (const rule of reorderRules) {
      if (!rule.product.isActive) continue
      
      const totalStock = rule.product.stockQuants.reduce(
        (sum: number, sq: any) => sum + Number(sq.quantity),
        0
      )
      
      if (totalStock <= Number(rule.minQty) && totalStock > 0) {
        lowStockItems++
      }
    }

    // Get out of stock items
    const productsWithStock = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        stockQuants: true,
      },
    })

    const outOfStockItems = productsWithStock.filter((product: any) => {
      const totalStock = product.stockQuants.reduce(
        (sum: number, sq: any) => sum + Number(sq.quantity),
        0
      )
      return totalStock <= 0
    }).length

    // Fetch pending operations in parallel
    const [
      pendingReceipts,
      pendingDeliveries,
      pendingTransfers,
      pendingAdjustments,
      recentOperations,
    ] = await Promise.all([

      // Pending receipts (not DONE or CANCELED)
      prisma.operation.count({
        where: {
          opType: 'RECEIPT',
          status: { notIn: ['DONE', 'CANCELED'] },
        },
      }),

      // Pending deliveries
      prisma.operation.count({
        where: {
          opType: 'DELIVERY',
          status: { notIn: ['DONE', 'CANCELED'] },
        },
      }),

      // Pending transfers
      prisma.operation.count({
        where: {
          opType: 'TRANSFER',
          status: { notIn: ['DONE', 'CANCELED'] },
        },
      }),

      // Pending adjustments
      prisma.operation.count({
        where: {
          opType: 'ADJUSTMENT',
          status: { notIn: ['DONE', 'CANCELED'] },
        },
      }),

      // Recent operations (last 10)
      prisma.operation.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          documentNumber: true,
          opType: true,
          status: true,
          createdAt: true,
          warehouse: {
            select: {
              name: true,
            },
          },
          creator: {
            select: {
              name: true,
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      kpis: {
        totalProducts,
        lowStockItems,
        outOfStockItems,
        pendingReceipts,
        pendingDeliveries,
        pendingTransfers,
        pendingAdjustments,
        totalPendingOperations:
          pendingReceipts + pendingDeliveries + pendingTransfers + pendingAdjustments,
      },
      recentOperations,
    })
  } catch (error) {
    console.error('Dashboard KPIs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
