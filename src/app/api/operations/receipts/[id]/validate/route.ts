import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { processReceiptValidation } from '@/lib/stock'

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

    // Process receipt validation (increases stock)
    const validatedReceipt = await processReceiptValidation(receiptId, user.userId)

    return NextResponse.json({
      message: 'Receipt validated successfully',
      data: validatedReceipt,
    })
  } catch (error: any) {
    console.error('Validate receipt error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to validate receipt' },
      { status: 400 }
    )
  }
}
