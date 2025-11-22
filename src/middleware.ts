import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password']
const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // Check if user has a token (basic check, full verification happens in API routes)
  const hasToken = !!token

  // Redirect root to appropriate page
  if (pathname === '/') {
    if (hasToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user has token and trying to access auth pages, redirect to dashboard
  if (hasToken && authPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If user doesn't have token and trying to access protected pages, redirect to login
  if (!hasToken && !publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
