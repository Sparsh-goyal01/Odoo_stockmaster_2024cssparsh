import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { verifyToken, type JWTPayload } from './jwt'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  // TEMPORARILY BYPASSING AUTH - Return dummy user
  return {
    userId: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER'
  }
  
  /* Original code - uncomment to re-enable auth
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return null
    }

    const payload = verifyToken(token)
    if (!payload) {
      return null
    }

    return payload
  } catch (error) {
    return null
  }
  */
}

export async function getCurrentUserFromDB() {
  const payload = await getCurrentUser()
  if (!payload) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return user
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createOTPToken(userId: number): Promise<string> {
  const code = generateOTP()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await prisma.otpToken.create({
    data: {
      userId,
      code,
      expiresAt,
    },
  })

  return code
}

export async function verifyOTP(userId: number, code: string): Promise<boolean> {
  const otpToken = await prisma.otpToken.findFirst({
    where: {
      userId,
      code,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  })

  if (!otpToken) {
    return false
  }

  await prisma.otpToken.update({
    where: { id: otpToken.id },
    data: { used: true },
  })

  return true
}
