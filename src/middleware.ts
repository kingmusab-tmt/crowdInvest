
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isPublicPath = path === '/login' || path === '/signup' || path === '/';

  // In a real app, the token would be from a secure, http-only cookie.
  // For this demo, we check for a generic session cookie that Firebase Auth might set.
  // Note: Firebase Auth for web uses IndexedDB for session persistence by default,
  // so a simple cookie check might not be sufficient for robust auth state detection
  // on the server without additional setup (like passing tokens).
  // This is a simplified approach for demonstration.
  const token = request.cookies.get('firebaseIdToken') || request.cookies.get('__session');

  // If the user is logged in and tries to access a public-only path, redirect them.
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the user is not logged in and tries to access a protected path, redirect them.
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/admin/:path*',
  ],
};
