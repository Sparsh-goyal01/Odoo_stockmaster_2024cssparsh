import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createOTPToken } from '@/lib/auth'
import { forgotPasswordSchema } from '@/lib/validations'
import { sendOTPEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = forgotPasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({
        message: 'If the email exists, an OTP has been sent',
      })
    }

    // Generate OTP
    const otp = await createOTPToken(user.id)

    // Send OTP via email
    await sendOTPEmail(email, otp)

    return NextResponse.json({
      message: 'If the email exists, an OTP has been sent',
      // In development only - remove in production!
      dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
