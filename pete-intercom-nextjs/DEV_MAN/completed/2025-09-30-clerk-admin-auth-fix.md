# Clerk Admin Authentication Fix - 2025-09-30

## Problem
Users with `@peterei.com` email addresses were unable to access `/admin` routes despite being authenticated. The middleware was returning a 403 "Unauthorized" error.

## Root Cause
Clerk's JWT session claims **do not include the email address by default**. The middleware was checking `sessionClaims.email`, which was `undefined`.

**Session claims structure:**
```json
{
  "azp": "https://peterei-intercom.onrender.com",
  "exp": 1759275783,
  "iat": 1759275723,
  "iss": "https://gorgeous-swift-68.clerk.accounts.dev",
  "sid": "sess_33RM5sD81jS5aGChVJZgGnKTQqe",
  "sub": "user_33QaFj4R6mnpoUma8bdMAow1IOM",
  "v": 2
  // ❌ NO EMAIL FIELD
}
```

## Solution
Use `clerkClient()` to fetch the full user object from Clerk's API and extract the primary email address.

**Updated middleware.ts:**
```typescript
import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const authResult = await auth();

    if (!authResult.userId) {
      return authResult.redirectToSignIn();
    }

    // ✅ Fetch user data from Clerk API
    const client = await clerkClient();
    const user = await client.users.getUser(authResult.userId);
    const userEmail = user.emailAddresses.find(
      e => e.id === user.primaryEmailAddressId
    )?.emailAddress;

    if (!userEmail || !userEmail.endsWith('@peterei.com')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access restricted to @peterei.com users only' },
        { status: 403 }
      );
    }
  }
});
```

## Key Learnings

1. **Session claims are minimal** - Clerk JWTs contain only basic info (`sub`, `sid`, `iss`, etc.)
2. **Use clerkClient for user data** - Always fetch full user object when you need email, metadata, or other user properties
3. **Debug logging is essential** - Adding `console.log` for session claims revealed the missing email immediately
4. **Production testing matters** - This only showed up in production, not local development

## Related Files
- `/middleware.ts` - Route protection logic
- `/src/components/navigation.tsx` - Client-side UI hiding for non-admins

## Commits
- `eda87ab` fix(auth): fetch email from Clerk API instead of session claims
- `eb7fd9d` debug(middleware): add logging to troubleshoot admin access
- `85be4f5` fix(auth): correct email domain typo peterie -> peterei
- `b13a366` feat(ui): hide Admin nav link from non-admin users
- `41781e5` feat(auth): restrict admin routes to @peterie.com users only

## Testing
1. ✅ User with `@peterei.com` email can access `/admin`
2. ✅ User with other email domains blocked with 403
3. ✅ Unauthenticated users redirected to sign-in
4. ✅ Admin nav link hidden from non-admin users

## Deployment
- **Production URL:** https://peterei-intercom.onrender.com/admin
- **Branch:** `Next-refactor`
- **Status:** ✅ Deployed and working
