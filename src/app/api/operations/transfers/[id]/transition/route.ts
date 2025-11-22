import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { processTransferValidation } from '@/lib/stock'

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['WAITING', 'CANCELED'],
  WAITING: ['READY', 'CANCELED'],
  READY: ['DONE', 'CANCELED'],
  DONE: [],
  CANCELED: [],
}

// POST /api/operations/transfers/[id]/transition - Change transfer status
export async function POST(
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
    const { newStatus } = await request.json()

    if (!newStatus) {
      return NextResponse.json(
        { error: 'New status is required' },
        { status: 400 }
      )
    }

    // Get current transfer
    const transfer = await prisma.operation.findUnique({
      where: { id: transferId, opType: 'TRANSFER' },
    })

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }

    // Check if transition is valid
    const allowedTransitions = VALID_TRANSITIONS[transfer.status]
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${transfer.status} to ${newStatus}`,
        },
        { status: 400 }
      )
    }

    // If transitioning to DONE, validate and process the transfer
    if (newStatus === 'DONE') {
      try {
        const updatedTransfer = await processTransferValidation(
          transferId,
          decoded.userId
        )
        return NextResponse.json(updatedTransfer)
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Failed to validate transfer' },
          { status: 400 }
        )
      }
    }

    // For other transitions, just update the status
    const updatedTransfer = await prisma.operation.update({
      where: { id: transferId },
      data: {
        status: newStatus,
        ...(newStatus === 'CANCELED' && {
          validatedBy: decoded.userId,
          validatedAt: new Date(),
        }),
      },
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
    })

    return NextResponse.json(updatedTransfer)
  } catch (error: any) {
    console.error('Error transitioning transfer status:', error)
    return NextResponse.json(
      { error: 'Failed to update transfer status' },
      { status: 500 }
    )
  }
}
