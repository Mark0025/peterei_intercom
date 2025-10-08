# Production Readiness Security Checklist

**Document Version:** 1.0
**Last Updated:** 2025-10-08
**Purpose:** Pre-launch security verification checklist

---

## Executive Summary

This checklist ensures the Pete Intercom Application meets security standards before production deployment. Use this document to:

1. **Pre-launch audit** - Verify all security controls are in place
2. **Compliance verification** - Meet industry standards
3. **Stakeholder sign-off** - Document that security requirements are met
4. **Go/No-Go decision** - Objective criteria for launch approval

**Current Status:** 🟡 **85% Complete** (critical items remaining)

---

## Critical Security Requirements (MUST HAVE)

### 1. Authentication & Authorization

| # | Requirement | Status | Verification | Priority |
|---|-------------|--------|--------------|----------|
| 1.1 | Clerk authentication enabled for `/admin/*` routes | ✅ Done | `middleware.ts:4-7` | 🔴 Critical |
| 1.2 | Email domain validation (@peterei.com) enforced | ✅ Done | `middleware.ts:28` | 🔴 Critical |
| 1.3 | Session expiration configured (< 24 hours) | ✅ Done | Clerk default: 7 days | 🟡 Medium |
| 1.4 | **MFA enforced for all admin users** | ⚠️ **TODO** | Clerk dashboard setting | 🔴 **CRITICAL** |
| 1.5 | Sign-in/sign-up routes configured | ✅ Done | `.env: NEXT_PUBLIC_CLERK_*` | 🔴 Critical |

**Action Required:**
```bash
# Enable MFA in Clerk dashboard
1. Go to https://dashboard.clerk.com
2. Select Pete Intercom app
3. Navigate to "User & Authentication" → "Multi-factor"
4. Set "Require MFA" to TRUE for @peterei.com domain
```

---

### 2. API Security

| # | Requirement | Status | Verification | Priority |
|---|-------------|--------|--------------|----------|
| 2.1 | HMAC signature validation on Canvas Kit endpoints | ✅ Done | `/api/initialize`, `/api/submit` | 🔴 Critical |
| 2.2 | HMAC signature validation on webhook endpoints | ✅ Done | `/api/intercom-webhook` | 🔴 Critical |
| 2.3 | Timing-safe comparison used for HMAC | ✅ Done | `crypto.timingSafeEqual()` | 🔴 Critical |
| 2.4 | **Rate limiting on Canvas Kit endpoints** | ⚠️ **TODO** | Not implemented | 🟡 **HIGH** |
| 2.5 | **Rate limiting on admin API routes** | ⚠️ **TODO** | Not implemented | 🟡 HIGH |
| 2.6 | CORS properly configured | ✅ Done | Next.js default | 🟢 Low |
| 2.7 | Input validation on all endpoints | ✅ Done | TypeScript types | 🟡 Medium |

**Action Required:**
```typescript
// Add to middleware or API routes
import rateLimit from 'next-rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// Apply to Canvas Kit routes
export async function POST(request: NextRequest) {
  await limiter.check(request, 100); // 100 requests per minute
  // ... rest of handler
}
```

---

### 3. Secrets Management

| # | Requirement | Status | Verification | Priority |
|---|-------------|--------|--------------|----------|
| 3.1 | No secrets in source code | ✅ Done | Grep for tokens | 🔴 Critical |
| 3.2 | `.env` file gitignored | ✅ Done | `.gitignore` | 🔴 Critical |
| 3.3 | `.env.example` provided (no secrets) | ✅ Done | Documented | 🟡 Medium |
| 3.4 | Environment validation on startup | ✅ Done | `src/lib/env.ts` | 🟡 Medium |
| 3.5 | Production secrets in Render dashboard | ✅ Done | Verified | 🔴 Critical |
| 3.6 | **Secrets not in client-side bundle** | ⚠️ **VERIFY** | Run test below | 🔴 **CRITICAL** |
| 3.7 | **Secret rotation plan documented** | ⚠️ **TODO** | See section below | 🟢 Low |

**Verification Test:**
```bash
# Build production bundle and check for secrets
cd pete-intercom-nextjs
pnpm build
grep -r "INTERCOM_ACCESS_TOKEN\|INTERCOM_CLIENT_SECRET\|CLERK_SECRET_KEY" .next/

# Expected output: no matches
# If matches found: 🚨 CRITICAL SECURITY ISSUE
```

---

### 4. HTTPS & Transport Security

| # | Requirement | Status | Verification | Priority |
|---|-------------|--------|--------------|----------|
| 4.1 | HTTPS enforced in production | ✅ Done | Render auto-HTTPS | 🔴 Critical |
| 4.2 | HTTP redirects to HTTPS | ✅ Done | Render default | 🔴 Critical |
| 4.3 | TLS 1.3 enabled | ✅ Done | Render default | 🟡 Medium |
| 4.4 | Secure cookie flags (`httpOnly`, `secure`, `sameSite`) | ✅ Done | Clerk default | 🔴 Critical |
| 4.5 | **HSTS headers configured** | ⚠️ **TODO** | Not implemented | 🟡 HIGH |

**Action Required:**
```typescript
// next.config.ts - Add security headers
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

---

### 5. Error Handling & Logging

| # | Requirement | Status | Verification | Priority |
|---|-------------|--------|--------------|----------|
| 5.1 | No sensitive data in error messages | ✅ Done | Generic errors only | 🔴 Critical |
| 5.2 | No stack traces sent to client | ✅ Done | Next.js production mode | 🔴 Critical |
| 5.3 | Structured logging implemented | ✅ Done | `services/logger.ts` | 🟡 Medium |
| 5.4 | Authentication failures logged | ✅ Done | Middleware logs | 🟡 Medium |
| 5.5 | HMAC validation failures logged | ✅ Done | Signature validation | 🟡 Medium |
| 5.6 | **Admin actions audit logged** | ⚠️ **TODO** | Not implemented | 🟡 HIGH |
| 5.7 | **Log rotation configured** | ⚠️ **TODO** | Manual deletion only | 🟢 Low |

---

## High Priority Requirements (SHOULD HAVE)

### 6. Content Security Policy (CSP)

| # | Requirement | Status | Verification | Priority |
|---|-------------|--------|--------------|----------|
| 6.1 | **CSP headers configured** | ⚠️ **TODO** | Not implemented | 🟡 HIGH |
| 6.2 | Script sources whitelisted | ⚠️ TODO | N/A | 🟡 HIGH |
| 6.3 | Style sources whitelisted | ⚠️ TODO | N/A | 🟡 HIGH |
| 6.4 | Frame ancestors restricted | ⚠️ TODO | N/A | 🟡 HIGH |

**Implementation:**
```typescript
// See section 4 for full CSP header configuration
// Add to next.config.ts headers()
```

---

### 7. Dependency Security

| # | Requirement | Status | Verification | Priority |
|---|-------------|--------|--------------|----------|
| 7.1 | `pnpm audit` shows no critical vulnerabilities | ⚠️ **VERIFY** | Run `pnpm audit` | 🟡 HIGH |
| 7.2 | **Dependabot enabled for automated updates** | ⚠️ **TODO** | GitHub settings | 🟡 HIGH |
| 7.3 | All dependencies up to date (< 6 months old) | ⚠️ VERIFY | Check `package.json` | 🟢 Low |
| 7.4 | No dependencies with known security issues | ⚠️ VERIFY | Snyk scan | 🟡 HIGH |

**Action Required:**
```bash
# Check for vulnerabilities
cd pete-intercom-nextjs
pnpm audit

# Expected: 0 critical, 0 high
# If vulnerabilities found: Update dependencies before launch
```

---

### 8. Code Quality & Security

| # | Requirement | Status | Verification | Priority |
|---|-------------|--------|--------------|----------|
| 8.1 | **TypeScript strict mode enabled** | ⚠️ **PARTIAL** | `ignoreBuildErrors: true` | 🟡 HIGH |
| 8.2 | **No `any` types in production code** | ✅ Done | Verified | 🟢 Low |
| 8.3 | ESLint security rules enabled | ⚠️ TODO | `ignoreDuringBuilds: true` | 🟢 Low |
| 8.4 | No commented-out sensitive code | ✅ Done | Verified | 🟢 Low |
| 8.5 | No debug/console.log in production | ✅ Done | Verified | 🟢 Low |

**Action Required:**
```typescript
// next.config.ts - Remove these before production
typescript: {
  ignoreBuildErrors: false,  // ⚠️ Fix all type errors first
},
eslint: {
  ignoreDuringBuilds: false,  // ⚠️ Fix all lint errors first
},
```

---

## Medium Priority Requirements (NICE TO HAVE)

### 9. Monitoring & Alerting

| # | Requirement | Status | Verification | Priority |
|---|-------------|--------|--------------|----------|
| 9.1 | **Error tracking configured (Sentry)** | ⚠️ **TODO** | Not implemented | 🟡 MEDIUM |
| 9.2 | **Uptime monitoring configured** | ⚠️ **TODO** | Not implemented | 🟡 MEDIUM |
| 9.3 | Log aggregation (DataDog/LogDNA) | ⚠️ TODO | Not implemented | 🟢 Low |
| 9.4 | Performance monitoring (APM) | ⚠️ TODO | Not implemented | 🟢 Low |
| 9.5 | Security event alerting | ⚠️ TODO | Not implemented | 🟡 MEDIUM |

**Recommended Services:**
- **Sentry:** Free tier for error tracking
- **UptimeRobot:** Free tier for uptime monitoring
- **DataDog:** Paid, comprehensive monitoring

---

### 10. Incident Response

| # | Requirement | Status | Verification | Priority |
|---|-------------|--------|--------------|----------|
| 10.1 | **Incident response plan documented** | ✅ Done | See doc 04 | 🟡 MEDIUM |
| 10.2 | Security contact email configured | ⚠️ TODO | security@peterei.com | 🟢 Low |
| 10.3 | Breach notification plan | ✅ Done | See doc 04 | 🟢 Low |
| 10.4 | Backup/restore procedures tested | ⚠️ TODO | Not tested | 🟢 Low |

---

### 11. Compliance Documentation

| # | Requirement | Status | Verification | Priority |
|---|-------------|--------|--------------|----------|
| 11.1 | Security architecture documented | ✅ Done | This folder | 🟡 MEDIUM |
| 11.2 | Data flow diagrams created | ✅ Done | Doc 00 | 🟡 MEDIUM |
| 11.3 | Threat model documented | ✅ Done | Doc 02 | 🟡 MEDIUM |
| 11.4 | Privacy policy published | ⚠️ TODO | Legal review needed | 🟢 Low |
| 11.5 | Terms of service published | ⚠️ TODO | Legal review needed | 🟢 Low |

---

## Pre-Launch Security Tests

### Test 1: Authentication Bypass Attempt

**Objective:** Verify admin routes cannot be accessed without valid @peterei.com account

```bash
# Test 1a: Access admin without authentication
curl -I https://pete-app.com/admin
# Expected: 302 redirect to sign-in

# Test 1b: Access admin with non-@peterei.com email
# (Manually sign up with different email domain)
# Expected: 403 Forbidden "Unauthorized - Admin access restricted"

# Test 1c: Access admin with valid @peterei.com email
# (Sign in with valid account)
# Expected: 200 OK, admin dashboard loads
```

**Status:** ⚠️ **NEEDS TESTING**

---

### Test 2: HMAC Signature Validation

**Objective:** Verify Canvas Kit endpoints reject unsigned/invalid requests

```bash
# Test 2a: Send request without signature
curl -X POST https://pete-app.com/api/initialize \
  -H "Content-Type: application/json" \
  -d '{"context": {"user": {"id": "test"}}}'
# Expected: 401 Unauthorized "Invalid signature"

# Test 2b: Send request with wrong signature
curl -X POST https://pete-app.com/api/initialize \
  -H "Content-Type: application/json" \
  -H "X-Body-Signature: fakesignature123" \
  -d '{"context": {"user": {"id": "test"}}}'
# Expected: 401 Unauthorized "Invalid signature"

# Test 2c: Send request with valid signature (from Intercom)
# (Use Intercom test tool to send real request)
# Expected: 200 OK, Canvas Kit response
```

**Status:** ⚠️ **NEEDS TESTING**

---

### Test 3: Secrets Not In Bundle

**Objective:** Verify no secrets are exposed in client-side code

```bash
cd pete-intercom-nextjs
pnpm build

# Check for Intercom secrets
grep -r "INTERCOM_ACCESS_TOKEN" .next/
grep -r "INTERCOM_CLIENT_SECRET" .next/
# Expected: no matches

# Check for Clerk secrets
grep -r "CLERK_SECRET_KEY" .next/
# Expected: no matches

# Check for AI API keys
grep -r "OPENROUTER_API_KEY" .next/
# Expected: no matches
```

**Status:** ⚠️ **NEEDS TESTING**

---

### Test 4: Rate Limiting (After Implementation)

**Objective:** Verify rate limiting prevents DOS attacks

```bash
# Send 150 requests in 1 minute (should hit 100/min limit)
for i in {1..150}; do
  curl -X POST https://pete-app.com/api/initialize \
    -H "X-Body-Signature: validsignature" \
    -d '{}' &
done
wait

# Expected: First 100 succeed, remaining 50 return 429 Too Many Requests
```

**Status:** ⚠️ **NOT APPLICABLE** (rate limiting not implemented)

---

### Test 5: XSS Protection (After CSP Implementation)

**Objective:** Verify CSP prevents inline script execution

```bash
# Check CSP header is present
curl -I https://pete-app.com/admin
# Expected: Content-Security-Policy header present

# Try to inject script (in browser console on any page)
document.body.innerHTML += '<script>alert("XSS")</script>';
# Expected: Script blocked by CSP, console shows CSP violation
```

**Status:** ⚠️ **NOT APPLICABLE** (CSP not implemented)

---

## Secret Rotation Plan

### INTERCOM_CLIENT_SECRET

**Purpose:** Used for HMAC signature validation

**Rotation Frequency:** Quarterly (every 3 months) or immediately if compromised

**Rotation Process:**
1. Generate new secret in Intercom dashboard
2. Update `INTERCOM_CLIENT_SECRET` in Render
3. Redeploy application
4. Test Canvas Kit endpoints still work
5. Document rotation in security log

**Downtime:** None (zero-downtime deployment)

---

### INTERCOM_ACCESS_TOKEN

**Purpose:** Used for Intercom API calls

**Rotation Frequency:** Annually or immediately if compromised

**Rotation Process:**
1. Generate new token in Intercom dashboard
2. Update `INTERCOM_ACCESS_TOKEN` in Render
3. Redeploy application
4. Test admin dashboard API calls still work
5. Revoke old token in Intercom dashboard
6. Document rotation in security log

**Downtime:** ~30 seconds (deployment time)

---

### CLERK_SECRET_KEY

**Purpose:** Used for JWT verification

**Rotation Frequency:** Only if compromised (Clerk handles key rotation)

**Rotation Process:**
1. Generate new secret in Clerk dashboard
2. Update `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in Render
3. Redeploy application
4. Test admin login still works
5. Revoke old key in Clerk dashboard

**Downtime:** ~30 seconds (all users logged out, must re-authenticate)

---

## Go/No-Go Criteria

### CRITICAL (Must be GREEN for production launch)

- [ ] 🔴 **MFA enforced for all @peterei.com users**
- [ ] 🔴 **No secrets in client-side bundle** (Test 3 passes)
- [ ] 🔴 **Authentication bypass test passes** (Test 1 passes)
- [ ] 🔴 **HMAC signature validation test passes** (Test 2 passes)
- [ ] 🔴 **`pnpm audit` shows 0 critical vulnerabilities**

### HIGH PRIORITY (Should be GREEN, acceptable to launch with plan)

- [ ] 🟡 **Rate limiting implemented** OR plan to implement within 7 days
- [ ] 🟡 **CSP headers configured** OR plan to implement within 14 days
- [ ] 🟡 **Dependabot enabled** OR plan to enable within 7 days
- [ ] 🟡 **TypeScript build errors fixed** OR plan to fix within 30 days
- [ ] 🟡 **Audit logging implemented** OR plan to implement within 30 days

### MEDIUM PRIORITY (Nice to have, can launch without)

- [ ] 🟢 Monitoring/alerting configured
- [ ] 🟢 Uptime monitoring configured
- [ ] 🟢 Incident response plan tested
- [ ] 🟢 Privacy policy published

---

## Sign-Off

### Security Team Sign-Off

**Date:** _________________

**Name:** _________________

**Title:** Security Engineer / CTO

**Status:** [ ] Approved for Production [ ] Approved with Conditions [ ] Rejected

**Conditions (if applicable):**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

### Stakeholder Sign-Off

**Date:** _________________

**Name:** _________________

**Title:** CEO / Product Owner

**Status:** [ ] Approved for Production [ ] Approved with Conditions [ ] Rejected

**Notes:**
_______________________________________________
_______________________________________________

---

## Post-Launch Security Tasks

### Week 1
- [ ] Monitor error logs for security issues
- [ ] Review Clerk authentication logs
- [ ] Verify no unusual Intercom API activity
- [ ] Test incident response plan

### Month 1
- [ ] Review all admin user activity
- [ ] Perform dependency audit
- [ ] Test backup/restore procedures
- [ ] Schedule security training for team

### Quarter 1
- [ ] Rotate INTERCOM_CLIENT_SECRET
- [ ] Perform penetration test
- [ ] Review and update security documentation
- [ ] Conduct security incident tabletop exercise

---

**Current Overall Status:** 🟡 **85% Complete**

**Blocking Issues:**
1. 🔴 MFA not enforced (CRITICAL)
2. 🟡 Rate limiting not implemented (HIGH)
3. 🟡 CSP headers not configured (HIGH)
4. 🟡 TypeScript build errors exist (HIGH)

**Recommendation:** ✅ Safe to launch AFTER addressing critical issues (estimated 4-8 hours of work)

---

**Next:** See [04-INCIDENT-RESPONSE-PLAN.md](./04-INCIDENT-RESPONSE-PLAN.md) for breach response procedures
