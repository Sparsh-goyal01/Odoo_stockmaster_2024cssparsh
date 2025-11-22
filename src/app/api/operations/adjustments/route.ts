import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { operationSchema } from '@/lib/validations'
import { generateDocumentNumber } from '@/lib/utils'

// GET /api/operations/adjustments - List all adjustments with filters
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const warehouseId = searchParams.get('warehouseId')
    const locationId = searchParams.get('locationId')
    const productId = searchParams.get('productId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {
      opType: 'ADJUSTMENT',
    }

    if (status) {
      where.status = status
    }

    if (warehouseId) {
      where.warehouseId = parseInt(warehouseId)
    }

    if (locationId) {
      where.destinationLocationId = parseInt(locationId)
    }

    if (productId) {
      where.lines = {
        some: {
          productId: parseInt(productId),
        },
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    const [adjustments, total] = await Promise.all([
      prisma.operation.findMany({
        where,
        include: {
          warehouse: true,
          destinationLocation: {
            include: { warehouse: true },
          },
          createdByUser: {
            select: { id: true, name: true, email: true },
          },
          validatedByUser: {
            select: { id: true, name: true, email: true },
          },
          lines: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.operation.count({ where }),
    ])

    return NextResponse.json({
      adjustments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching adjustments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch adjustments' },
      { status: 500 }
    )
  }
}

// POST /api/operations/adjustments - Create a new adjustment
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const validation = operationSchema.safeParse({
      ...body,
      opType: 'ADJUSTMENT',
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { warehouseId, destinationLocationId, notes, lines } = body

    if (!destinationLocationId) {
      return NextResponse.json(
        { error: 'Location is required for adjustments' },
        { status: 400 }
      )
    }

    // Validate location
    const location = await prisma.location.findUnique({
      where: { id: destinationLocationId },
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    if (location.warehouseId !== warehouseId) {
      return NextResponse.json(
        { error: 'Location does not belong to the selected warehouse' },
        { status: 400 }
      )
    }

    // Generate document number
    const count = await prisma.operation.count({
      where: { opType: 'ADJUSTMENT' },
    })
    const documentNumber = generateDocumentNumber('ADJUSTMENT', count)

    // Create adjustment
    const adjustment = await prisma.operation.create({
      data: {
        opType: 'ADJUSTMENT',
        documentNumber,
        status: 'DRAFT',
        warehouseId,
        destinationLocationId,
        notes,
        createdBy: decoded.userId,
        lines: {
          create: lines.map((line: any) => ({
            productId: line.productId,
            quantity: line.quantity, // This is the counted quantity
            unitOfMeasure: line.unitOfMeasure,
            destinationLocationId: line.destinationLocationId || destinationLocationId,
            remarks: line.remarks, // Reason for adjustment
          })),
        },
      },
      include: {
        warehouse: true,
        destinationLocation: {
          include: { warehouse: true },
        },
        lines: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(adjustment, { status: 201 })
  } catch (error: any) {
    console.error('Error creating adjustment:', error)
    return NextResponse.json(
      { error: 'Failed to create adjustment' },
      { status: 500 }
    )
  }
}
