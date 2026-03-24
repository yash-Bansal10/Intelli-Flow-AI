import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Public paths that do not require authentication
  const publicPaths = ['/login']
  
  // Excluded paths (static assets, api routes)
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isStaticRoute = request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname.includes('/images/')

  if (isApiRoute || isStaticRoute) {
    return NextResponse.next()
  }

  const isAuth = request.cookies.has('intelliflow_auth')
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname)

  if (!isAuth && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuth && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
