import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

const publicRoutes = ['/login', '/api/auth'];
const adminRoutes = ['/users', '/settings'];

export default auth((req) => {
    const { pathname } = req.nextUrl;

    // Allow public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Redirect unauthenticated users to login
    if (!req.auth) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Check admin routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
        if (req.auth.user.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', req.url));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)'],
};
