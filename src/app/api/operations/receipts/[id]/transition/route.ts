import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { processReceiptValidation } from '@/lib/stock'

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

    const receiptId = parseInt(params.id)

    if (isNaN(receiptId)) {
      return NextResponse.json({ error: 'Invalid receipt ID' }, { status: 400 })
    }

    const body = await request.json()
    const { action } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Get current receipt
    const receipt = await prisma.operation.findUnique({
      where: { id: receiptId, opType: 'RECEIPT' },
      include: {
        lines: true,
      },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    // Check if receipt has lines
    if (receipt.lines.length === 0 && action !== 'cancel') {
      return NextResponse.json(
        { error: 'Cannot process receipt without lines' },
        { status: 400 }
      )
    }

    // Validate transition
    const currentStatus = receipt.status
    const targetStatus = action.toUpperCase()

    if (currentStatus === 'DONE') {
      return NextResponse.json(
        { error: 'Receipt already validated' },
        { status: 400 }
      )
    }

    if (currentStatus === 'CANCELED') {
      return NextResponse.json(
        { error: 'Cannot modify canceled receipt' },
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
        const validatedReceipt = await processReceiptValidation(
          receiptId,
          user.userId
        )

        // Fetch updated receipt with relations
        const result = await prisma.operation.findUnique({
          where: { id: validatedReceipt.id },
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

        return NextResponse.json(result)
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Failed to validate receipt' },
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

    const updatedReceipt = await prisma.operation.update({
      where: { id: receiptId },
      data: updateData,
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
    console.error('Receipt transition error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
