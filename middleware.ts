import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/admin', '/cashier', '/dashboard']

// Routes that are only accessible when not authenticated
const publicRoutes = ['/']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.includes(pathname)
  
  // Get the authentication token from cookies or headers
  // Since we're using localStorage in the client, we'll need to handle this differently
  // For now, let's allow all routes and handle authentication in the client components
  
  // In a production app, you'd want to use httpOnly cookies or server-side sessions
  // For this demo, we'll rely on client-side authentication checks
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}