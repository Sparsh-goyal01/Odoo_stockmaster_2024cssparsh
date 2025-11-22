import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { processDeliveryValidation } from '@/lib/stock'

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

    // Process delivery validation (decreases stock, validates availability)
    const validatedDelivery = await processDeliveryValidation(deliveryId, user.userId)

    return NextResponse.json({
      message: 'Delivery validated successfully',
      data: validatedDelivery,
    })
  } catch (error: any) {
    console.error('Validate delivery error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to validate delivery' },
      { status: 400 }
    )
  }
}
