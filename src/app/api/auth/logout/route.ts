import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  // Clear cookie using next/headers cookies()
  const cookieStore = await cookies()
  cookieStore.delete('token')

  return NextResponse.json({ message: 'Logged out successfully' })
}
