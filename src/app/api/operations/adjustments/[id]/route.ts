import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { operationSchema } from '@/lib/validations'

// GET /api/operations/adjustments/[id] - Get a single adjustment with current stock info
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

    const adjustmentId = parseInt(params.id)

    const adjustment = await prisma.operation.findUnique({
      where: { id: adjustmentId, opType: 'ADJUSTMENT' },
      include: {
        warehouse: true,
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
            destinationLocation: {
              include: { warehouse: true },
            },
          },
        },
      },
    })

    if (!adjustment) {
      return NextResponse.json({ error: 'Adjustment not found' }, { status: 404 })
    }

    // Get current recorded quantities for each product/location
    const linesWithCurrentStock = await Promise.all(
      adjustment.lines.map(async (line: any) => {
        const locationId = line.destinationLocationId || adjustment.destinationLocationId
        
        const stockQuant = locationId
          ? await prisma.stockQuant.findUnique({
              where: {
                productId_locationId: {
                  productId: line.productId,
                  locationId: locationId,
                },
              },
            })
          : null

        return {
          ...line,
          recordedQuantity: stockQuant ? Number(stockQuant.quantity) : 0,
          countedQuantity: Number(line.quantity),
          difference: Number(line.quantity) - (stockQuant ? Number(stockQuant.quantity) : 0),
        }
      })
    )

    return NextResponse.json({
      ...adjustment,
      lines: linesWithCurrentStock,
    })
  } catch (error: any) {
    console.error('Error fetching adjustment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch adjustment' },
      { status: 500 }
    )
  }
}

// PUT /api/operations/adjustments/[id] - Update an adjustment
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

    const adjustmentId = parseInt(params.id)
    const body = await request.json()

    // Check if adjustment exists and is editable
    const existingAdjustment = await prisma.operation.findUnique({
      where: { id: adjustmentId, opType: 'ADJUSTMENT' },
    })

    if (!existingAdjustment) {
      return NextResponse.json({ error: 'Adjustment not found' }, { status: 404 })
    }

    if (existingAdjustment.status === 'DONE' || existingAdjustment.status === 'CANCELED') {
      return NextResponse.json(
        { error: 'Cannot edit an adjustment that is DONE or CANCELED' },
        { status: 400 }
      )
    }

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

    // Update adjustment in a transaction
    const adjustment = await prisma.$transaction(async (tx: any) => {
      // Delete existing lines
      await tx.operationLine.deleteMany({
        where: { operationId: adjustmentId },
      })

      // Update operation
      return await tx.operation.update({
        where: { id: adjustmentId },
        data: {
          warehouseId,
          destinationLocationId,
          notes,
          lines: {
            create: lines.map((line: any) => ({
              productId: line.productId,
              quantity: line.quantity, // Counted quantity
              unitOfMeasure: line.unitOfMeasure,
              destinationLocationId: line.destinationLocationId || destinationLocationId,
              remarks: line.remarks,
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
    })

    return NextResponse.json(adjustment)
  } catch (error: any) {
    console.error('Error updating adjustment:', error)
    return NextResponse.json(
      { error: 'Failed to update adjustment' },
      { status: 500 }
    )
  }
}

// DELETE /api/operations/adjustments/[id] - Delete an adjustment
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

    const adjustmentId = parseInt(params.id)

    // Check if adjustment exists and is deletable
    const existingAdjustment = await prisma.operation.findUnique({
      where: { id: adjustmentId, opType: 'ADJUSTMENT' },
    })

    if (!existingAdjustment) {
      return NextResponse.json({ error: 'Adjustment not found' }, { status: 404 })
    }

    if (existingAdjustment.status === 'DONE') {
      return NextResponse.json(
        { error: 'Cannot delete a validated adjustment' },
        { status: 400 }
      )
    }

    // Delete adjustment and its lines (cascade)
    await prisma.operation.delete({
      where: { id: adjustmentId },
    })

    return NextResponse.json({ message: 'Adjustment deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting adjustment:', error)
    return NextResponse.json(
      { error: 'Failed to delete adjustment' },
      { status: 500 }
    )
  }
}
