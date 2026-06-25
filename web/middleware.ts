import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register', '/reset-password', '/'];
// const ADMIN_ROUTES = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookie (set by client side hook)
  const sessionCookie = request.cookies.get('__session')?.value;

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
  // const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  if (!sessionCookie && !isPublicRoute) {
    // Redirect unauthenticated users trying to access protected routes
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (sessionCookie && isPublicRoute && pathname !== '/') {
    // Redirect authenticated users trying to access login/register
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Future: Check roles from token claims for admin routes

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
