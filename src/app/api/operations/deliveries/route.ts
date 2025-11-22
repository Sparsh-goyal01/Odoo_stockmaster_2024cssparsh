import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { operationSchema } from '@/lib/validations'
import { generateDocumentNumber } from '@/lib/utils'
import { validateDeliveryOperation } from '@/lib/stock'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const warehouseId = searchParams.get('warehouseId')
    const customer = searchParams.get('customer') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      opType: 'DELIVERY',
      AND: [],
    }

    // Status filter
    if (status && status !== 'all') {
      where.AND.push({ status })
    }

    // Warehouse filter
    if (warehouseId && warehouseId !== 'all') {
      where.AND.push({ warehouseId: parseInt(warehouseId) })
    }

    // Customer search
    if (customer) {
      where.AND.push({
        partnerName: { contains: customer, mode: 'insensitive' },
      })
    }

    // Date range filter
    if (dateFrom || dateTo) {
      const dateFilter: any = {}
      if (dateFrom) {
        dateFilter.gte = new Date(dateFrom)
      }
      if (dateTo) {
        dateFilter.lte = new Date(dateTo)
      }
      where.AND.push({ createdAt: dateFilter })
    }

    // Remove AND if empty
    if (where.AND.length === 0) {
      delete where.AND
    }

    // Fetch deliveries
    const [deliveries, total] = await Promise.all([
      prisma.operation.findMany({
        where,
        include: {
          warehouse: true,
          sourceLocation: true,
          lines: {
            include: { product: true },
          },
        },
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.operation.count({ where }),
    ])

    return NextResponse.json({
      data: deliveries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get deliveries error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = operationSchema.safeParse({
      ...body,
      opType: 'DELIVERY',
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const {
      warehouseId,
      sourceLocationId,
      partnerName,
      notes,
      lines,
    } = validation.data

    // Validate source location
    if (sourceLocationId) {
      const locationValidation = await validateDeliveryOperation(
        warehouseId,
        sourceLocationId
      )
      if (!locationValidation.valid) {
        return NextResponse.json(
          { error: locationValidation.error },
          { status: 400 }
        )
      }
    }

    // Validate products exist
    const productIds = lines.map((line) => line.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found' },
        { status: 400 }
      )
    }

    // Generate document number
    const count = await prisma.operation.count({
      where: { opType: 'DELIVERY' },
    })
    const documentNumber = generateDocumentNumber('DELIVERY', count)

    // Create delivery in transaction
    const delivery = await prisma.$transaction(async (tx: any) => {
      // Create operation
      const operation = await tx.operation.create({
        data: {
          opType: 'DELIVERY',
          documentNumber,
          status: 'DRAFT',
          warehouseId,
          sourceLocationId: sourceLocationId || null,
          partnerName: partnerName || null,
          notes: notes || null,
          createdBy: user.userId,
        },
      })

      // Create operation lines
      await tx.operationLine.createMany({
        data: lines.map((line: any) => ({
          operationId: operation.id,
          productId: line.productId,
          quantity: line.quantity,
          unitOfMeasure: line.unitOfMeasure,
          sourceLocationId: line.sourceLocationId || null,
          remarks: line.remarks || null,
        })),
      })

      return operation
    })

    // Fetch created delivery with relations
    const createdDelivery = await prisma.operation.findUnique({
      where: { id: delivery.id },
      include: {
        warehouse: true,
        sourceLocation: true,
        lines: {
          include: {
            product: true,
            sourceLocation: true,
          },
        },
      },
    })

    return NextResponse.json(createdDelivery, { status: 201 })
  } catch (error) {
    console.error('Create delivery error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
