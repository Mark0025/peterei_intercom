import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const authResult = await auth();

    // Require authentication first
    if (!authResult.userId) {
      return authResult.redirectToSignIn();
    }

    // Check if user email ends with @peterei.com
    const userEmail = authResult.sessionClaims?.email as string | undefined;

    // Debug logging
    console.log('[Middleware] User ID:', authResult.userId);
    console.log('[Middleware] User email:', userEmail);
    console.log('[Middleware] Session claims:', JSON.stringify(authResult.sessionClaims, null, 2));

    if (!userEmail || !userEmail.endsWith('@peterei.com')) {
      console.log('[Middleware] Access denied - email does not end with @peterei.com');
      return NextResponse.json(
        { error: 'Unauthorized - Admin access restricted to @peterei.com users only' },
        { status: 403 }
      );
    }

    console.log('[Middleware] Access granted for:', userEmail);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
