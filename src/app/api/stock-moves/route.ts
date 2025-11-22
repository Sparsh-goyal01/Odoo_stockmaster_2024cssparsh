import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const warehouseId = searchParams.get('warehouseId')
    const locationId = searchParams.get('locationId')
    const opType = searchParams.get('opType')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      AND: [],
    }

    // Product filter
    if (productId) {
      where.productId = parseInt(productId)
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.moveDate = {}
      if (dateFrom) {
        where.moveDate.gte = new Date(dateFrom)
      }
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        where.moveDate.lte = endDate
      }
    }

    // Operation type filter
    if (opType) {
      where.operation = {
        opType: opType.toUpperCase(),
      }
    }

    // Location and Warehouse filters (mutually exclusive handling)
    if (locationId) {
      // Specific location filter - from or to
      where.AND.push({
        OR: [
          { fromLocationId: parseInt(locationId) },
          { toLocationId: parseInt(locationId) },
        ],
      })
    } else if (warehouseId) {
      // Warehouse filter (get all locations in warehouse)
      const warehouseIdInt = parseInt(warehouseId)
      const locations = await prisma.location.findMany({
        where: { warehouseId: warehouseIdInt },
        select: { id: true },
      })
      const locationIds = locations.map((l: any) => l.id)
      
      // Filter moves where either from or to location is in this warehouse
      where.AND.push({
        OR: [
          { fromLocationId: { in: locationIds } },
          { toLocationId: { in: locationIds } },
        ],
      })
    }

    // Clean up empty AND array
    if (where.AND.length === 0) {
      delete where.AND
    }

    // Fetch stock moves with pagination
    const [stockMoves, total] = await Promise.all([
      prisma.stockMove.findMany({
        where,
        skip,
        take: limit,
        orderBy: { moveDate: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          operation: {
            select: {
              id: true,
              opType: true,
              documentNumber: true,
            },
          },
          fromLocation: {
            select: {
              id: true,
              name: true,
              warehouse: {
                select: {
                  id: true,
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
                  id: true,
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.stockMove.count({ where }),
    ])

    // Transform the data for frontend
    const moves = stockMoves.map((move: any) => ({
      id: move.id,
      moveDate: move.moveDate,
      operationType: move.operation.opType,
      documentNumber: move.operation.documentNumber,
      product: {
        id: move.product.id,
        name: move.product.name,
        sku: move.product.sku,
      },
      fromLocation: move.fromLocation
        ? {
            id: move.fromLocation.id,
            name: move.fromLocation.name,
            warehouseName: move.fromLocation.warehouse.name,
            warehouseId: move.fromLocation.warehouse.id,
          }
        : null,
      toLocation: move.toLocation
        ? {
            id: move.toLocation.id,
            name: move.toLocation.name,
            warehouseName: move.toLocation.warehouse.name,
            warehouseId: move.toLocation.warehouse.id,
          }
        : null,
      quantity: move.quantity,
      user: {
        id: move.user.id,
        name: move.user.name,
        email: move.user.email,
      },
      reason: move.reason,
    }))

    return NextResponse.json({
      moves,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Stock moves API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock moves' },
      { status: 500 }
    )
  }
}
