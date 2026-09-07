import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public routes
  const isPublicRoute = 
    pathname === '/' || 
    pathname === '/login' || 
    pathname === '/register' ||
    pathname.startsWith('/api/auth');

  const token = request.cookies.get('auth_token')?.value;

  // 1. If trying to access a protected route without a token
  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. If trying to access login/register while already logged in
  if ((pathname === '/login' || pathname === '/register') && token) {
    try {
      const session = verifyToken(token);
      if (session) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      // If token is invalid, let them stay on login
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
