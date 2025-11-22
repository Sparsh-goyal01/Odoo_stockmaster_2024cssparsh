import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { operationSchema } from '@/lib/validations'

// GET /api/operations/transfers/[id] - Get a single transfer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const transferId = parseInt(params.id)

    const transfer = await prisma.operation.findUnique({
      where: { id: transferId, opType: 'TRANSFER' },
      include: {
        warehouse: true,
        sourceLocation: {
          include: { warehouse: true },
        },
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
            sourceLocation: {
              include: { warehouse: true },
            },
            destinationLocation: {
              include: { warehouse: true },
            },
          },
        },
      },
    })

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }

    return NextResponse.json(transfer)
  } catch (error: any) {
    console.error('Error fetching transfer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transfer' },
      { status: 500 }
    )
  }
}

// PUT /api/operations/transfers/[id] - Update a transfer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const transferId = parseInt(params.id)
    const body = await request.json()

    // Check if transfer exists and is editable
    const existingTransfer = await prisma.operation.findUnique({
      where: { id: transferId, opType: 'TRANSFER' },
    })

    if (!existingTransfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }

    if (existingTransfer.status === 'DONE' || existingTransfer.status === 'CANCELED') {
      return NextResponse.json(
        { error: 'Cannot edit a transfer that is DONE or CANCELED' },
        { status: 400 }
      )
    }

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

    // Update transfer in a transaction
    const transfer = await prisma.$transaction(async (tx: any) => {
      // Delete existing lines
      await tx.operationLine.deleteMany({
        where: { operationId: transferId },
      })

      // Update operation
      return await tx.operation.update({
        where: { id: transferId },
        data: {
          warehouseId,
          sourceLocationId,
          destinationLocationId,
          notes,
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
    })

    return NextResponse.json(transfer)
  } catch (error: any) {
    console.error('Error updating transfer:', error)
    return NextResponse.json(
      { error: 'Failed to update transfer' },
      { status: 500 }
    )
  }
}

// DELETE /api/operations/transfers/[id] - Delete a transfer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const transferId = parseInt(params.id)

    // Check if transfer exists and is deletable
    const existingTransfer = await prisma.operation.findUnique({
      where: { id: transferId, opType: 'TRANSFER' },
    })

    if (!existingTransfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }

    if (existingTransfer.status === 'DONE') {
      return NextResponse.json(
        { error: 'Cannot delete a validated transfer' },
        { status: 400 }
      )
    }

    // Delete transfer and its lines (cascade)
    await prisma.operation.delete({
      where: { id: transferId },
    })

    return NextResponse.json({ message: 'Transfer deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting transfer:', error)
    return NextResponse.json(
      { error: 'Failed to delete transfer' },
      { status: 500 }
    )
  }
}
