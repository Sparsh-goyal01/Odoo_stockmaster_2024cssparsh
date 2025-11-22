import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { processAdjustmentValidation } from '@/lib/stock'

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['WAITING', 'CANCELED'],
  WAITING: ['READY', 'CANCELED'],
  READY: ['DONE', 'CANCELED'],
  DONE: [],
  CANCELED: [],
}

// POST /api/operations/adjustments/[id]/transition - Change adjustment status
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

    const adjustmentId = parseInt(params.id)
    const { newStatus } = await request.json()

    if (!newStatus) {
      return NextResponse.json(
        { error: 'New status is required' },
        { status: 400 }
      )
    }

    // Get current adjustment
    const adjustment = await prisma.operation.findUnique({
      where: { id: adjustmentId, opType: 'ADJUSTMENT' },
    })

    if (!adjustment) {
      return NextResponse.json({ error: 'Adjustment not found' }, { status: 404 })
    }

    // Check if transition is valid
    const allowedTransitions = VALID_TRANSITIONS[adjustment.status]
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${adjustment.status} to ${newStatus}`,
        },
        { status: 400 }
      )
    }

    // If transitioning to DONE, validate and process the adjustment
    if (newStatus === 'DONE') {
      try {
        const updatedAdjustment = await processAdjustmentValidation(
          adjustmentId,
          decoded.userId
        )
        return NextResponse.json(updatedAdjustment)
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Failed to validate adjustment' },
          { status: 400 }
        )
      }
    }

    // For other transitions, just update the status
    const updatedAdjustment = await prisma.operation.update({
      where: { id: adjustmentId },
      data: {
        status: newStatus,
        ...(newStatus === 'CANCELED' && {
          validatedBy: decoded.userId,
          validatedAt: new Date(),
        }),
      },
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
          },
        },
      },
    })

    return NextResponse.json(updatedAdjustment)
  } catch (error: any) {
    console.error('Error transitioning adjustment status:', error)
    return NextResponse.json(
      { error: 'Failed to update adjustment status' },
      { status: 500 }
    )
  }
}
