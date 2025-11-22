import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/jwt'

const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password']
const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // Allow API auth routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  const isAuthenticated = token ? verifyToken(token) !== null : false

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && authPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !publicPaths.includes(pathname) && !pathname.startsWith('/api/auth')) {
    // Allow root path to redirect naturally
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    if (!pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // API routes require authentication
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
