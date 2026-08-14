import { NextRequest, NextResponse } from 'next/server';

export default function middleware(req: NextRequest) {
  const isLoginPage = req.nextUrl.pathname === '/login';
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  if (demoMode) {
    // Public Render demo: allow direct access to the application.
    return NextResponse.next();
  }

  if (!isLoginPage) {
    const authCookie = req.cookies.get('iocl-auth');
    if (!authCookie) {
      return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
