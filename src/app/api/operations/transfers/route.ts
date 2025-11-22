import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { operationSchema } from '@/lib/validations'
import { generateDocumentNumber } from '@/lib/utils'
import { validateTransferOperation } from '@/lib/stock'

// GET /api/operations/transfers - List all transfers with filters
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
    const sourceWarehouseId = searchParams.get('sourceWarehouseId')
    const destinationWarehouseId = searchParams.get('destinationWarehouseId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {
      opType: 'TRANSFER',
    }

    if (status) {
      where.status = status
    }

    if (sourceWarehouseId) {
      where.warehouseId = parseInt(sourceWarehouseId)
    }

    if (destinationWarehouseId) {
      where.destinationLocationId = {
        in: await prisma.location
          .findMany({
            where: { warehouseId: parseInt(destinationWarehouseId) },
            select: { id: true },
          })
          .then((locs: any) => locs.map((l: any) => l.id)),
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

    const [transfers, total] = await Promise.all([
      prisma.operation.findMany({
        where,
        include: {
          warehouse: true,
          sourceLocation: {
            include: { warehouse: true },
          },
          destinationLocation: {
            include: { warehouse: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
          validator: {
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
      transfers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching transfers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transfers' },
      { status: 500 }
    )
  }
}

// POST /api/operations/transfers - Create a new transfer
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
      opType: 'TRANSFER',
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { warehouseId, sourceLocationId, destinationLocationId, notes, lines } = body

    if (!sourceLocationId || !destinationLocationId) {
      return NextResponse.json(
        { error: 'Source and destination locations are required for transfers' },
        { status: 400 }
      )
    }

    // Validate locations
    const destinationLocation = await prisma.location.findUnique({
      where: { id: destinationLocationId },
    })

    if (!destinationLocation) {
      return NextResponse.json(
        { error: 'Destination location not found' },
        { status: 404 }
      )
    }

    const locationValidation = await validateTransferOperation(
      warehouseId,
      sourceLocationId,
      destinationLocation.warehouseId,
      destinationLocationId
    )

    if (!locationValidation.valid) {
      return NextResponse.json(
        { error: locationValidation.error },
        { status: 400 }
      )
    }

    // Generate document number
    const count = await prisma.operation.count({
      where: { opType: 'TRANSFER' },
    })
    const documentNumber = generateDocumentNumber('TRANSFER', count)

    // Create transfer
    const transfer = await prisma.operation.create({
      data: {
        opType: 'TRANSFER',
        documentNumber,
        status: 'DRAFT',
        warehouseId,
        sourceLocationId,
        destinationLocationId,
        notes,
        createdBy: decoded.userId,
        lines: {
          create: lines.map((line: any) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitOfMeasure: line.unitOfMeasure,
            sourceLocationId: line.sourceLocationId || sourceLocationId,
            destinationLocationId: line.destinationLocationId || destinationLocationId,
            remarks: line.remarks,
          })),
        },
      },
      include: {
        warehouse: true,
        sourceLocation: {
          include: { warehouse: true },
        },
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

    return NextResponse.json(transfer, { status: 201 })
  } catch (error: any) {
    console.error('Error creating transfer:', error)
    return NextResponse.json(
      { error: 'Failed to create transfer' },
      { status: 500 }
    )
  }
}
