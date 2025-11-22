import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { processDeliveryValidation } from '@/lib/stock'

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['WAITING', 'CANCELED'],
  WAITING: ['READY', 'CANCELED'],
  READY: ['DONE', 'CANCELED'],
}

export async function POST(
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
    const { action } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Get current delivery
    const delivery = await prisma.operation.findUnique({
      where: { id: deliveryId, opType: 'DELIVERY' },
      include: {
        lines: true,
      },
    })

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    // Check if delivery has lines
    if (delivery.lines.length === 0 && action !== 'cancel') {
      return NextResponse.json(
        { error: 'Cannot process delivery without lines' },
        { status: 400 }
      )
    }

    // Validate transition
    const currentStatus = delivery.status
    const targetStatus = action.toUpperCase()

    if (currentStatus === 'DONE') {
      return NextResponse.json(
        { error: 'Delivery already validated' },
        { status: 400 }
      )
    }

    if (currentStatus === 'CANCELED') {
      return NextResponse.json(
        { error: 'Cannot modify canceled delivery' },
        { status: 400 }
      )
    }

    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || []

    if (!allowedTransitions.includes(targetStatus)) {
      return NextResponse.json(
        {
          error: `Invalid transition from ${currentStatus} to ${targetStatus}`,
        },
        { status: 400 }
      )
    }

    // Handle DONE transition specially (stock validation)
    if (targetStatus === 'DONE') {
      try {
        const validatedDelivery = await processDeliveryValidation(
          deliveryId,
          user.userId
        )

        // Fetch updated delivery with relations
        const result = await prisma.operation.findUnique({
          where: { id: validatedDelivery.id },
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

        return NextResponse.json(result)
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Failed to validate delivery' },
          { status: 400 }
        )
      }
    }

    // Handle other transitions (WAITING, READY, CANCELED)
    const updateData: any = { status: targetStatus }

    if (targetStatus === 'CANCELED') {
      updateData.validatedBy = user.userId
      updateData.validatedAt = new Date()
    }

    const updatedDelivery = await prisma.operation.update({
      where: { id: deliveryId },
      data: updateData,
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
    console.error('Delivery transition error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
