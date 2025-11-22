import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { operationSchema } from '@/lib/validations'
import { validateReceiptOperation } from '@/lib/stock'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const receiptId = parseInt(params.id)

    if (isNaN(receiptId)) {
      return NextResponse.json({ error: 'Invalid receipt ID' }, { status: 400 })
    }

    const receipt = await prisma.operation.findUnique({
      where: { id: receiptId, opType: 'RECEIPT' },
      include: {
        warehouse: true,
        destinationLocation: true,
        lines: {
          include: {
            product: true,
            destinationLocation: true,
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

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    return NextResponse.json(receipt)
  } catch (error) {
    console.error('Get receipt error:', error)
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

    const receiptId = parseInt(params.id)

    if (isNaN(receiptId)) {
      return NextResponse.json({ error: 'Invalid receipt ID' }, { status: 400 })
    }

    const body = await request.json()
    const validation = operationSchema.safeParse({
      ...body,
      opType: 'RECEIPT',
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const {
      warehouseId,
      destinationLocationId,
      partnerName,
      notes,
      lines,
    } = validation.data

    // Check if receipt exists
    const existingReceipt = await prisma.operation.findUnique({
      where: { id: receiptId, opType: 'RECEIPT' },
    })

    if (!existingReceipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    // Only allow editing DRAFT or WAITING receipts
    if (!['DRAFT', 'WAITING'].includes(existingReceipt.status)) {
      return NextResponse.json(
        { error: `Cannot edit receipt in ${existingReceipt.status} status` },
        { status: 400 }
      )
    }

    // Validate destination location
    if (destinationLocationId) {
      const locationValidation = await validateReceiptOperation(
        warehouseId,
        destinationLocationId
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

    // Update receipt in transaction
    const receipt = await prisma.$transaction(async (tx: any) => {
      // Delete existing lines
      await tx.operationLine.deleteMany({
        where: { operationId: receiptId },
      })

      // Update operation
      const operation = await tx.operation.update({
        where: { id: receiptId },
        data: {
          warehouseId,
          destinationLocationId: destinationLocationId || null,
          partnerName: partnerName || null,
          notes: notes || null,
        },
      })

      // Create new lines
      await tx.operationLine.createMany({
        data: lines.map((line: any) => ({
          operationId: receiptId,
          productId: line.productId,
          quantity: line.quantity,
          unitOfMeasure: line.unitOfMeasure,
          destinationLocationId: line.destinationLocationId || null,
          remarks: line.remarks || null,
        })),
      })

      return operation
    })

    // Fetch updated receipt with relations
    const updatedReceipt = await prisma.operation.findUnique({
      where: { id: receipt.id },
      include: {
        warehouse: true,
        destinationLocation: true,
        lines: {
          include: {
            product: true,
            destinationLocation: true,
          },
        },
      },
    })

    return NextResponse.json(updatedReceipt)
  } catch (error) {
    console.error('Update receipt error:', error)
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

    const receiptId = parseInt(params.id)

    if (isNaN(receiptId)) {
      return NextResponse.json({ error: 'Invalid receipt ID' }, { status: 400 })
    }

    // Check if receipt exists
    const receipt = await prisma.operation.findUnique({
      where: { id: receiptId, opType: 'RECEIPT' },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    // Only allow deleting DRAFT receipts
    if (receipt.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only delete receipts in DRAFT status' },
        { status: 400 }
      )
    }

    // Delete receipt (cascades to lines)
    await prisma.operation.delete({
      where: { id: receiptId },
    })

    return NextResponse.json({ message: 'Receipt deleted successfully' })
  } catch (error) {
    console.error('Delete receipt error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
