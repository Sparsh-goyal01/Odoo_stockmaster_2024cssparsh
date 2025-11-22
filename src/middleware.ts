import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/jwt'

const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password']
const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // Check if user is authenticated
  const isAuthenticated = token ? await verifyToken(token) : null

  // Redirect root to appropriate page
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && authPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If user is not authenticated and trying to access protected pages, redirect to login
  if (!isAuthenticated && !publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
