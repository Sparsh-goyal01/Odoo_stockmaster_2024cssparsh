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

    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get('warehouseId')
    const categoryId = searchParams.get('categoryId')
    const opType = searchParams.get('opType')
    const status = searchParams.get('status')

    // Build filters for operations
    const operationWhere: any = {}
    if (warehouseId) {
      operationWhere.warehouseId = parseInt(warehouseId)
    }
    if (opType) {
      operationWhere.opType = opType.toUpperCase()
    }
    if (status) {
      operationWhere.status = status.toUpperCase()
    }

    // Build filters for products
    const productWhere: any = { 
      isActive: true,
      userId: user.userId 
    }
    if (categoryId) {
      productWhere.categoryId = parseInt(categoryId)
    }

    // ========== KPIs ==========

    // Fetch all active products with their stock quants
    const allProducts = await prisma.product.findMany({
      where: productWhere,
      include: {
        stockQuants: warehouseId
          ? {
              where: {
                location: {
                  warehouseId: parseInt(warehouseId),
                },
              },
            }
          : true,
      },
    })

    // Total Products in Stock (with StockQuant > 0)
    const totalProducts = allProducts.filter((product: any) => {
      const totalStock = product.stockQuants.reduce(
        (sum: number, sq: any) => sum + Number(sq.quantity),
        0
      )
      return totalStock > 0
    }).length

    // Low Stock Items (compared against reorder rules)
    const reorderRulesWhere: any = {
      userId: user.userId
    }
    if (warehouseId) {
      reorderRulesWhere.OR = [
        { warehouseId: parseInt(warehouseId), userId: user.userId },
        { warehouseId: null, userId: user.userId }, // Global rules
      ]
    }

    const reorderRules = await prisma.reorderRule.findMany({
      where: reorderRulesWhere,
      include: {
        product: {
          include: {
            stockQuants: warehouseId
              ? {
                  where: {
                    location: {
                      warehouseId: parseInt(warehouseId),
                    },
                  },
                }
              : true,
          },
        },
      },
    })

    let lowStock = 0
    const uniqueLowStockProducts = new Set<number>()

    for (const rule of reorderRules) {
      if (!rule.product || !rule.product.isActive) continue

      const totalStock = rule.product.stockQuants.reduce(
        (sum: number, sq: any) => sum + Number(sq.quantity),
        0
      )

      if (totalStock > 0 && totalStock <= Number(rule.minQty)) {
        uniqueLowStockProducts.add(rule.product.id)
      }
    }
    lowStock = uniqueLowStockProducts.size

    // Out of Stock Items - Only count products that have stock quants but current quantity is 0
    // This means they've been received before but are now out of stock
    const outOfStock = allProducts.filter((product: any) => {
      // Must have at least one stock quant record (meaning stock was tracked)
      if (product.stockQuants.length === 0) return false
      
      const totalStock = product.stockQuants.reduce(
        (sum: number, sq: any) => sum + Number(sq.quantity),
        0
      )
      return totalStock === 0
    }).length

    // Pending Operations (not DONE or CANCELED)
    const pendingStatuses = ['DRAFT', 'WAITING', 'READY']

    // Get user's warehouse IDs for filtering operations
    const userWarehouses = await prisma.warehouse.findMany({
      where: { userId: user.userId, isActive: true } as any,
      select: { id: true },
    })
    const warehouseIds = userWarehouses.map((w: any) => w.id)

    const [pendingReceipts, pendingDeliveries, pendingTransfers] =
      await Promise.all([
        prisma.operation.count({
          where: {
            ...operationWhere,
            opType: 'RECEIPT',
            status: opType || status ? operationWhere.status : { in: pendingStatuses },
            warehouseId: { in: warehouseIds },
          },
        }),
        prisma.operation.count({
          where: {
            ...operationWhere,
            opType: 'DELIVERY',
            status: opType || status ? operationWhere.status : { in: pendingStatuses },
            warehouseId: { in: warehouseIds },
          },
        }),
        prisma.operation.count({
          where: {
            ...operationWhere,
            opType: 'TRANSFER',
            status: opType || status ? operationWhere.status : { in: pendingStatuses },
            warehouseId: { in: warehouseIds },
          },
        }),
      ])

    // ========== Recent Activity ==========

    // Recent Receipts (latest 5 DONE)
    const recentReceipts = await prisma.operation.findMany({
      where: {
        ...(warehouseId && { warehouseId: parseInt(warehouseId) }),
        opType: 'RECEIPT',
        status: 'DONE',
        warehouseId: { in: warehouseIds },
      },
      take: 5,
      orderBy: { validatedAt: 'desc' },
      select: {
        id: true,
        documentNumber: true,
        partnerName: true,
        status: true,
        validatedAt: true,
        warehouse: {
          select: {
            name: true,
          },
        },
      },
    })

    // Recent Deliveries (latest 5 DONE)
    const recentDeliveries = await prisma.operation.findMany({
      where: {
        ...(warehouseId && { warehouseId: parseInt(warehouseId) }),
        opType: 'DELIVERY',
        status: 'DONE',
        warehouseId: { in: warehouseIds },
      },
      take: 5,
      orderBy: { validatedAt: 'desc' },
      select: {
        id: true,
        documentNumber: true,
        partnerName: true,
        status: true,
        validatedAt: true,
        warehouse: {
          select: {
            name: true,
          },
        },
      },
    })

    // Recent Stock Moves (latest 5)
    // Get all locations belonging to user's warehouses
    const userLocations = await prisma.location.findMany({
      where: {
        warehouseId: { in: warehouseIds },
        ...(warehouseId && { warehouseId: parseInt(warehouseId) }),
      },
      select: { id: true },
    })
    const locationIds = userLocations.map((l: any) => l.id)

    const recentMovesWhere: any = {
      OR: [
        { fromLocationId: { in: locationIds } },
        { toLocationId: { in: locationIds } },
      ]
    }

    const recentMoves = await prisma.stockMove.findMany({
      where: recentMovesWhere,
      take: 5,
      orderBy: { moveDate: 'desc' },
      select: {
        id: true,
        moveDate: true,
        quantity: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        fromLocation: {
          select: {
            id: true,
            name: true,
            warehouse: {
              select: {
                name: true,
              },
            },
          },
        },
        toLocation: {
          select: {
            id: true,
            name: true,
            warehouse: {
              select: {
                name: true,
              },
            },
          },
        },
        operation: {
          select: {
            documentNumber: true,
            opType: true,
          },
        },
      },
    })

    return NextResponse.json({
      kpis: {
        totalProducts,
        lowStock,
        outOfStock,
        pendingReceipts,
        pendingDeliveries,
        pendingTransfers,
      },
      recentActivity: {
        receipts: recentReceipts,
        deliveries: recentDeliveries,
        moves: recentMoves,
      },
    })
  } catch (error: any) {
    console.error('Dashboard summary error:', error)
    console.error('Error details:', error.message, error.stack)
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard summary',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
