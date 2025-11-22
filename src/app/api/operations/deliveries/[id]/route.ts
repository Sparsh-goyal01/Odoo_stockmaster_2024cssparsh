import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { operationSchema } from '@/lib/validations'
import { validateDeliveryOperation } from '@/lib/stock'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deliveryId = parseInt(params.id)

    if (isNaN(deliveryId)) {
      return NextResponse.json({ error: 'Invalid delivery ID' }, { status: 400 })
    }

    const delivery = await prisma.operation.findUnique({
      where: { id: deliveryId, opType: 'DELIVERY' },
      include: {
        warehouse: true,
        sourceLocation: true,
        lines: {
          include: {
            product: true,
            sourceLocation: true,
          },
          orderBy: { id: 'asc' },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        validator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    return NextResponse.json(delivery)
  } catch (error) {
    console.error('Get delivery error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deliveryId = parseInt(params.id)

    if (isNaN(deliveryId)) {
      return NextResponse.json({ error: 'Invalid delivery ID' }, { status: 400 })
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

    // Check if delivery exists
    const existingDelivery = await prisma.operation.findUnique({
      where: { id: deliveryId, opType: 'DELIVERY' },
    })

    if (!existingDelivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    // Only allow editing DRAFT or WAITING deliveries
    if (!['DRAFT', 'WAITING'].includes(existingDelivery.status)) {
      return NextResponse.json(
        { error: `Cannot edit delivery in ${existingDelivery.status} status` },
        { status: 400 }
      )
    }

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

    // Update delivery in transaction
    const delivery = await prisma.$transaction(async (tx: any) => {
      // Delete existing lines
      await tx.operationLine.deleteMany({
        where: { operationId: deliveryId },
      })

      // Update operation
      const operation = await tx.operation.update({
        where: { id: deliveryId },
        data: {
          warehouseId,
          sourceLocationId: sourceLocationId || null,
          partnerName: partnerName || null,
          notes: notes || null,
        },
      })

      // Create new lines
      await tx.operationLine.createMany({
        data: lines.map((line: any) => ({
          operationId: deliveryId,
          productId: line.productId,
          quantity: line.quantity,
          unitOfMeasure: line.unitOfMeasure,
          sourceLocationId: line.sourceLocationId || null,
          remarks: line.remarks || null,
        })),
      })

      return operation
    })

    // Fetch updated delivery with relations
    const updatedDelivery = await prisma.operation.findUnique({
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

    return NextResponse.json(updatedDelivery)
  } catch (error) {
    console.error('Update delivery error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deliveryId = parseInt(params.id)

    if (isNaN(deliveryId)) {
      return NextResponse.json({ error: 'Invalid delivery ID' }, { status: 400 })
    }

    // Check if delivery exists
    const delivery = await prisma.operation.findUnique({
      where: { id: deliveryId, opType: 'DELIVERY' },
    })

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    // Only allow deleting DRAFT deliveries
    if (delivery.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only delete deliveries in DRAFT status' },
        { status: 400 }
      )
    }

    // Delete delivery (cascades to lines)
    await prisma.operation.delete({
      where: { id: deliveryId },
    })

    return NextResponse.json({ message: 'Delivery deleted successfully' })
  } catch (error) {
    console.error('Delete delivery error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
