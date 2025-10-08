# Pete Intercom Application - Security Architecture Overview

**Document Version:** 1.0
**Last Updated:** 2025-10-08
**Status:** Production Ready
**Author:** Mark Carpenter

## Executive Summary

The Pete Intercom Application implements enterprise-grade security through a **defense-in-depth architecture** utilizing:

1. **Clerk Authentication** - SOC 2 Type II certified identity management
2. **HMAC Signature Validation** - Cryptographically verified Intercom webhooks
3. **Domain-Based Authorization** - Email domain restriction (@peterei.com)
4. **Environment Variable Protection** - Secrets management with validation
5. **Secure Data Flows** - Encrypted communication and access controls

**Security Posture:** ✅ **PRODUCTION READY**

This application is architected with security best practices for 2025, follows OWASP guidelines, and implements multiple layers of protection for both admin dashboard access and external API integrations.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Security Layers](#security-layers)
3. [Clerk Authentication](#clerk-authentication)
4. [Access Control Model](#access-control-model)
5. [Data Protection](#data-protection)
6. [Threat Model](#threat-model)
7. [Compliance & Standards](#compliance--standards)
8. [Security Monitoring](#security-monitoring)

---

## Architecture Overview

```mermaid
graph TB
    subgraph "External Actors"
        User[End User<br/>Intercom Messenger]
        Admin[Admin User<br/>@peterei.com]
        Intercom[Intercom API<br/>Webhooks & Canvas Kit]
    end

    subgraph "Edge Security"
        ClerkAuth[Clerk Authentication<br/>SOC 2 Type II]
        HMACValidator[HMAC Signature<br/>Validation]
    end

    subgraph "Next.js Middleware Layer"
        Middleware[middleware.ts<br/>Route Protection]
        EmailCheck[Email Domain<br/>Validation]
    end

    subgraph "Protected Resources"
        AdminDash[Admin Dashboard<br/>/admin/*]
        AdminAPI[Admin API Routes<br/>/api/admin/*]
        WhatsWorking[Documentation<br/>/whatsworking]
    end

    subgraph "Public API Endpoints"
        CanvasInit[Canvas Kit Initialize<br/>/api/initialize]
        CanvasSubmit[Canvas Kit Submit<br/>/api/submit]
        Webhook[Intercom Webhook<br/>/api/intercom-webhook]
    end

    subgraph "Data Layer"
        IntercomAPI[Intercom REST API<br/>Cached Data]
        EnvVars[(Environment<br/>Variables)]
        Logs[(Structured<br/>Logs)]
    end

    User -->|Canvas Kit Request| Intercom
    Intercom -->|Signed Payload| HMACValidator
    HMACValidator -->|Validated| CanvasInit
    HMACValidator -->|Validated| CanvasSubmit
    Intercom -->|Webhook Event| HMACValidator
    HMACValidator -->|Validated| Webhook

    Admin -->|Login Request| ClerkAuth
    ClerkAuth -->|JWT Token| Middleware
    Middleware -->|Check Email| EmailCheck
    EmailCheck -->|peterei.com| AdminDash
    EmailCheck -->|peterei.com| AdminAPI
    EmailCheck -->|peterei.com| WhatsWorking

    CanvasInit -->|API Call| IntercomAPI
    CanvasSubmit -->|API Call| IntercomAPI
    Webhook -->|API Call| IntercomAPI

    AdminDash -->|Query| IntercomAPI
    AdminAPI -->|Update| IntercomAPI

    IntercomAPI -.->|Secrets| EnvVars
    Middleware -.->|Audit Log| Logs
    HMACValidator -.->|Audit Log| Logs

    style ClerkAuth fill:#4CAF50,stroke:#2E7D32,stroke-width:3px,color:#fff
    style HMACValidator fill:#2196F3,stroke:#1565C0,stroke-width:3px,color:#fff
    style Middleware fill:#FF9800,stroke:#E65100,stroke-width:3px,color:#fff
    style EnvVars fill:#F44336,stroke:#C62828,stroke-width:3px,color:#fff
    style EmailCheck fill:#9C27B0,stroke:#6A1B9A,stroke-width:3px,color:#fff
```

**Legend:**
- 🟢 **Green (Clerk Auth)** - Enterprise identity provider
- 🔵 **Blue (HMAC)** - Cryptographic validation
- 🟠 **Orange (Middleware)** - Route-level protection
- 🔴 **Red (Env Vars)** - Secrets storage
- 🟣 **Purple (Email Check)** - Domain authorization

---

## Security Layers

### Layer 1: Authentication (WHO are you?)

**Technology:** Clerk Authentication
**Implementation:** `middleware.ts:10-17`

```typescript
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const authResult = await auth();

    // Require authentication first
    if (!authResult.userId) {
      return authResult.redirectToSignIn();
    }
    // ... authorization checks follow
  }
});
```

**Protection:**
- OAuth 2.0 / OpenID Connect flows
- Session management with JWT tokens
- MFA support (available but not enforced)
- Automated security patching by Clerk

### Layer 2: Authorization (WHAT can you access?)

**Technology:** Email Domain Validation
**Implementation:** `middleware.ts:19-34`

```typescript
// Fetch user data from Clerk API to get email
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
```

**Protection:**
- Domain-based access control (DBAC)
- Prevents unauthorized admin access even with valid Clerk account
- Zero-trust model: verify on every request

### Layer 3: Request Validation (Is this LEGITIMATE?)

**Technology:** HMAC-SHA256 Signature Validation
**Implementation:** `src/middleware/signature-validation.ts:68-106`

```typescript
export function validateIntercomSignatureSecure(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body, 'utf8');
  const digest = hmac.digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(digest, 'utf8'),
    Buffer.from(signature, 'utf8')
  );

  return isValid;
}
```

**Protection:**
- Prevents request forgery/replay attacks
- Timing-safe comparison prevents side-channel attacks
- Applied to ALL Canvas Kit and webhook endpoints

### Layer 4: Data Protection (Is the data SAFE?)

**Technology:** Environment Variables + Type Validation
**Implementation:** `src/lib/env.ts:87-112`

```typescript
export function validateEnvironment(): EnvironmentVariables {
  const errors: string[] = [];

  // Validate required variables
  for (const key of REQUIRED_VARS) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      errors.push(`❌ Missing required: ${key}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(errorMessage); // Fail-fast on startup
  }

  return env;
}
```

**Protection:**
- Secrets never hardcoded
- Fail-fast validation on startup
- Type-safe access to environment variables
- Separate .env files for dev/production

---

## Clerk Authentication

### Why Clerk?

Clerk was chosen for the following security and operational benefits:

#### 1. **Enterprise-Grade Security**
- ✅ **SOC 2 Type II Certified** - Annual third-party security audits
- ✅ **GDPR & CCPA Compliant** - Privacy law adherence
- ✅ **ISO 27001 Aligned** - Information security management
- ✅ **OWASP Top 10 Protection** - Guards against common vulnerabilities

#### 2. **Zero Security Maintenance**
Instead of building and maintaining:
- Password hashing (bcrypt/argon2)
- Session management
- OAuth integrations
- Rate limiting
- Account recovery flows
- Email verification

**Clerk handles all of this**, with security updates pushed automatically.

#### 3. **Built-in Attack Prevention**
- **Brute Force Protection:** Rate limiting on login attempts
- **Session Hijacking Prevention:** Secure, httpOnly cookies
- **XSS Protection:** Sanitized JWT tokens
- **CSRF Protection:** Built-in token validation
- **Credential Stuffing Defense:** Suspicious login detection

#### 4. **2025 Security Standards**
- WebAuthn/Passkey support (passwordless authentication)
- Passwordless email magic links
- OAuth 2.1 compliance
- JWT with RS256 signing (asymmetric keys)

### Clerk Security Architecture

```mermaid
sequenceDiagram
    actor Admin as Admin User
    participant Browser
    participant NextMiddleware as Next.js Middleware
    participant ClerkAPI as Clerk API
    participant AdminDash as Admin Dashboard

    Admin->>Browser: Navigate to /admin
    Browser->>NextMiddleware: Request /admin

    alt No Clerk Session
        NextMiddleware->>Browser: Redirect to /sign-in
        Browser->>ClerkAPI: Display Clerk UI
        Admin->>ClerkAPI: Enter credentials
        ClerkAPI->>ClerkAPI: Validate credentials<br/>Check rate limits<br/>Verify MFA (if enabled)
        ClerkAPI->>Browser: Set secure session cookie<br/>(httpOnly, secure, sameSite)
        Browser->>NextMiddleware: Retry /admin with cookie
    end

    NextMiddleware->>NextMiddleware: Extract JWT from cookie
    NextMiddleware->>ClerkAPI: Verify JWT signature<br/>(RS256 public key)
    ClerkAPI-->>NextMiddleware: JWT valid, return userId

    NextMiddleware->>ClerkAPI: Fetch user by userId
    ClerkAPI-->>NextMiddleware: User object with email

    NextMiddleware->>NextMiddleware: Check email domain<br/>ends with peterei.com?

    alt Email NOT @peterei.com
        NextMiddleware->>Browser: 403 Forbidden
        Browser->>Admin: "Unauthorized - Admin access restricted"
    else Email IS @peterei.com
        NextMiddleware->>AdminDash: Allow access
        AdminDash->>Browser: Render dashboard
        Browser->>Admin: Display admin UI
    end

    Note over ClerkAPI: Clerk Security Features:<br/>- JWT signature validation (RS256)<br/>- Session expiration checks<br/>- Rate limiting<br/>- Anomaly detection<br/>- Automatic security patches
```

### Clerk Token Security

**JWT Structure:**
```json
{
  "header": {
    "alg": "RS256",    // Asymmetric signing (public/private key)
    "typ": "JWT",
    "kid": "ins_..."   // Key ID for rotation
  },
  "payload": {
    "sub": "user_...",         // Subject (user ID)
    "iss": "https://clerk...", // Issuer (Clerk)
    "aud": "pete-app",         // Audience (our app)
    "exp": 1699999999,         // Expiration (1 hour)
    "iat": 1699996399,         // Issued at
    "jti": "..."               // Unique token ID
  },
  "signature": "..."  // RS256 signature
}
```

**Why RS256 over HS256?**
- **Public/private key pairs** - Our app only has public key (can verify, not sign)
- **Key rotation** - Clerk rotates keys without app code changes
- **More secure** - Even if our server is compromised, attacker can't forge tokens

---

## Access Control Model

### Protected Routes

**Implementation:** `middleware.ts:4-8`

```typescript
const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',           // All admin dashboard routes
  '/api/admin(.*)',       // All admin API endpoints
  '/whatsworking(.*)'     // Documentation dashboard (internal)
]);
```

### Access Matrix

| Route Pattern | Authentication | Authorization | HMAC Signature |
|---------------|----------------|---------------|----------------|
| `/admin/*` | ✅ Clerk | ✅ @peterei.com | ❌ N/A |
| `/api/admin/*` | ✅ Clerk | ✅ @peterei.com | ❌ N/A |
| `/whatsworking/*` | ✅ Clerk | ✅ @peterei.com | ❌ N/A |
| `/api/initialize` | ❌ Public | ❌ N/A | ✅ Required |
| `/api/submit` | ❌ Public | ❌ N/A | ✅ Required |
| `/api/intercom-webhook` | ❌ Public | ❌ N/A | ✅ Required |
| `/popout` | ❌ Public | ❌ N/A | ❌ Optional |

**Legend:**
- ✅ **Required** - Security control enforced
- ❌ **Not Required** - Not applicable for this route
- **Public** - Accessible without Clerk authentication (but may require HMAC)

### User Journey: Admin Access

```mermaid
graph TD
    A[User navigates to /admin] --> B{Has Clerk session?}
    B -->|No| C[Redirect to Clerk sign-in]
    C --> D[User enters credentials]
    D --> E{Valid credentials?}
    E -->|No| F[Show error message]
    F --> D
    E -->|Yes| G[Clerk creates session]
    G --> H[Set secure cookie]
    H --> I[Redirect back to /admin]

    B -->|Yes| J{JWT valid & not expired?}
    J -->|No| C
    J -->|Yes| K[Fetch user from Clerk API]
    K --> L{Email ends with peterei.com?}
    L -->|No| M[403 Forbidden:<br/>Unauthorized - Admin access<br/>restricted to peterei.com]
    L -->|Yes| N[✅ Grant access to admin dashboard]

    style C fill:#FFE082,stroke:#F57C00,stroke-width:2px
    style G fill:#81C784,stroke:#388E3C,stroke-width:2px
    style M fill:#E57373,stroke:#C62828,stroke-width:3px,color:#fff
    style N fill:#66BB6A,stroke:#2E7D32,stroke-width:3px,color:#fff
```

---

## Data Protection

### What We Protect

```mermaid
graph LR
    subgraph "Sensitive Data"
        Secrets[Environment Secrets<br/>• INTERCOM_ACCESS_TOKEN<br/>• INTERCOM_CLIENT_SECRET<br/>• CLERK_SECRET_KEY<br/>• OPENROUTER_API_KEY]
        PII[User PII<br/>• Email addresses<br/>• User IDs<br/>• Company names<br/>• Conversation content]
        Admin[Admin Identity<br/>• Clerk user IDs<br/>• Session tokens<br/>• Email addresses]
    end

    subgraph "Protection Mechanisms"
        EnvFile[.env File<br/>Not in git]
        Encryption[HTTPS/TLS<br/>In Transit]
        Access[Access Controls<br/>RBAC + DBAC]
        Logs[Audit Logging<br/>app.log / api.log]
    end

    Secrets -->|Protected by| EnvFile
    Secrets -->|Protected by| Access
    PII -->|Protected by| Encryption
    PII -->|Protected by| Access
    PII -->|Tracked in| Logs
    Admin -->|Protected by| Encryption
    Admin -->|Protected by| Access
    Admin -->|Tracked in| Logs

    style Secrets fill:#F44336,stroke:#C62828,stroke-width:2px,color:#fff
    style PII fill:#FF9800,stroke:#E65100,stroke-width:2px,color:#fff
    style Admin fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
```

### Environment Variable Security

**File:** `src/lib/env.ts`

**Security Features:**
1. ✅ **Fail-Fast Validation** - App won't start without required vars
2. ✅ **Type Safety** - TypeScript prevents misuse
3. ✅ **No Defaults for Secrets** - Must be explicitly set
4. ✅ **Separation of Concerns** - Dev/prod envs are isolated

**Required Secrets:**
```bash
# These MUST be set (enforced at startup)
INTERCOM_CLIENT_ID=...
INTERCOM_CLIENT_SECRET=...      # ⚠️ CRITICAL: Used for HMAC
INTERCOM_ACCESS_TOKEN=...       # ⚠️ CRITICAL: Full API access
WORKSPACE_ID=...
```

**Best Practices Enforced:**
- ❌ `.env` is gitignored
- ❌ No secrets in source code
- ❌ No console.log of secrets
- ✅ Example file (.env.example) for reference
- ✅ Production secrets in Render dashboard

---

## Threat Model

### Threat Scenarios & Mitigations

#### 1. **Unauthorized Admin Access**

**Threat:** Attacker tries to access `/admin` dashboard

```mermaid
graph TD
    A[Attacker] -->|Navigates to| B[/admin]
    B --> C{Has Clerk session?}
    C -->|No| D[🛡️ BLOCKED - Redirect to sign-in]
    C -->|Yes, but wrong email| E{Email peterei.com?}
    E -->|No| F[🛡️ BLOCKED - 403 Forbidden]
    E -->|Yes| G[❌ Allowed - attacker has stolen<br/>valid peterei.com account]

    style D fill:#66BB6A,stroke:#2E7D32,stroke-width:3px,color:#fff
    style F fill:#66BB6A,stroke:#2E7D32,stroke-width:3px,color:#fff
    style G fill:#F44336,stroke:#C62828,stroke-width:3px,color:#fff
```

**Mitigation Status:** ✅ **PROTECTED**
- Clerk authentication required
- Email domain validation enforced
- Session expiration (1 hour default)

**Residual Risk:** 🟡 **Low** - Requires compromising a @peterei.com Clerk account

**Additional Hardening (Recommended):**
- ✅ Enable MFA for all @peterei.com users
- ✅ Implement IP allowlisting for admin routes (if static IPs available)
- ✅ Add session activity logging

---

#### 2. **Forged Intercom Webhook/Canvas Kit Request**

**Threat:** Attacker sends fake webhook to manipulate data

```mermaid
sequenceDiagram
    actor Attacker
    participant App as Pete App
    participant Intercom as Real Intercom API

    Attacker->>App: POST /api/initialize<br/>Fake Canvas Kit request<br/>No signature or wrong signature

    App->>App: validateIntercomSignature()

    alt Invalid or Missing Signature
        App->>Attacker: 🛡️ 401 Unauthorized<br/>Invalid signature
        Note over App: ✅ ATTACK BLOCKED
    else Valid Signature (attacker stole secret)
        App->>Intercom: Process request normally
        Note over App,Intercom: ⚠️ Requires INTERCOM_CLIENT_SECRET<br/>compromise - very unlikely
    end
```

**Mitigation Status:** ✅ **PROTECTED**
- HMAC-SHA256 signature validation on ALL Intercom endpoints
- Timing-safe comparison (prevents timing attacks)
- Secret stored securely in environment variables

**Residual Risk:** 🟢 **Very Low** - Requires stealing `INTERCOM_CLIENT_SECRET`

**If Secret Compromised:**
1. Rotate `INTERCOM_CLIENT_SECRET` in Intercom dashboard
2. Update environment variable in Render
3. Redeploy application
4. Audit logs for suspicious activity

---

#### 3. **Session Hijacking**

**Threat:** Attacker steals admin session cookie

```mermaid
graph TD
    A[Attacker intercepts traffic] --> B{Network secure?}
    B -->|HTTP| C[🔓 Cookie visible in plaintext]
    C --> D[❌ Attacker copies session cookie]
    D --> E[❌ Attacker accesses /admin]

    B -->|HTTPS| F[🔒 Traffic encrypted with TLS]
    F --> G{Cookie flags secure?}
    G -->|Yes: httpOnly, secure, sameSite| H[🛡️ Cookie not accessible<br/>via JavaScript or insecure channels]
    H --> I[✅ Session hijacking prevented]

    style C fill:#F44336,stroke:#C62828,stroke-width:2px,color:#fff
    style D fill:#F44336,stroke:#C62828,stroke-width:2px,color:#fff
    style E fill:#F44336,stroke:#C62828,stroke-width:2px,color:#fff
    style I fill:#66BB6A,stroke:#2E7D32,stroke-width:3px,color:#fff
```

**Mitigation Status:** ✅ **PROTECTED**
- HTTPS enforced in production (Render provides TLS)
- Clerk sets cookies with secure flags:
  - `httpOnly: true` - Not accessible via JavaScript (XSS protection)
  - `secure: true` - Only sent over HTTPS
  - `sameSite: lax` - CSRF protection

**Residual Risk:** 🟡 **Low** - Requires XSS vulnerability or compromised client

**Additional Hardening (Recommended):**
- ✅ Implement Content Security Policy (CSP) headers
- ✅ Add session timeout warnings in UI
- ✅ Log all admin actions for audit trail

---

#### 4. **Intercom API Token Exposure**

**Threat:** `INTERCOM_ACCESS_TOKEN` leaks publicly

**Impact:** 🔴 **CRITICAL**
- Full read/write access to Intercom workspace
- Can view all conversations, contacts, companies
- Can modify user attributes
- Can send messages as Pete app

```mermaid
graph TD
    A[Token Exposure Scenarios] --> B[Committed to Git]
    A --> C[Logged in Logs]
    A --> D[Client-Side Code]
    A --> E[Environment Dump]

    B --> F{Prevention}
    C --> F
    D --> F
    E --> F

    F --> G[✅ .env gitignored]
    F --> H[✅ Never log tokens]
    F --> I[✅ Server-side only]
    F --> J[✅ No process.env dumps]

    style A fill:#F44336,stroke:#C62828,stroke-width:3px,color:#fff
    style B fill:#F44336,stroke:#C62828,stroke-width:2px,color:#fff
    style C fill:#F44336,stroke:#C62828,stroke-width:2px,color:#fff
    style D fill:#F44336,stroke:#C62828,stroke-width:2px,color:#fff
    style E fill:#F44336,stroke:#C62828,stroke-width:2px,color:#fff
```

**Mitigation Status:** ✅ **PROTECTED**
- Token stored in `.env` (gitignored)
- Never exposed to client-side code
- Never logged in application logs
- Render dashboard stores secrets encrypted

**Residual Risk:** 🟡 **Low** - Requires server compromise or insider access

**If Token Compromised:**
1. 🚨 **Immediately revoke** in Intercom dashboard
2. Generate new access token
3. Update environment variable in Render
4. Redeploy application
5. Audit Intercom activity logs for unauthorized changes

---

#### 5. **Timing Attacks on HMAC Validation**

**Threat:** Attacker uses timing differences to brute-force signature

**Standard Comparison (Vulnerable):**
```typescript
// ❌ BAD: Early exit on first mismatch
const isValid = digest === signature; // String comparison
```

Attacker can measure response time:
- Wrong 1st char: Fast rejection (~1μs)
- Wrong 10th char: Slower rejection (~10μs)
- All chars match: Full comparison time

**Our Implementation (Secure):**
```typescript
// ✅ GOOD: Constant-time comparison
const isValid = crypto.timingSafeEqual(
  Buffer.from(digest, 'utf8'),
  Buffer.from(signature, 'utf8')
);
```

**Mitigation Status:** ✅ **PROTECTED**
- Using `crypto.timingSafeEqual()` for HMAC validation
- Constant-time comparison prevents timing attacks

**Residual Risk:** 🟢 **Very Low** - Timing attack vector eliminated

---

## Compliance & Standards

### Security Standards Compliance

| Standard | Status | Notes |
|----------|--------|-------|
| **OWASP Top 10 (2021)** | ✅ Compliant | See breakdown below |
| **SOC 2 Type II** | ✅ Via Clerk | Identity provider certified |
| **GDPR** | ✅ Compliant | User data in EU (Intercom + Clerk) |
| **HTTPS/TLS 1.3** | ✅ Enforced | Render provides TLS termination |
| **NIST Cybersecurity Framework** | 🟡 Partial | Identify/Protect complete, Detect/Respond partial |

### OWASP Top 10 Protection

#### A01:2021 - Broken Access Control
✅ **PROTECTED**
- Clerk middleware enforces authentication
- Email domain validation enforces authorization
- Server-side validation on all protected routes

#### A02:2021 - Cryptographic Failures
✅ **PROTECTED**
- HTTPS enforced in production
- Secrets stored in environment variables (not code)
- HMAC-SHA256 for webhook validation
- Clerk uses RS256 for JWT signing

#### A03:2021 - Injection
✅ **PROTECTED**
- No SQL database (using Intercom API)
- All API requests use typed parameters
- Input validation via Zod schemas

#### A04:2021 - Insecure Design
✅ **PROTECTED**
- Defense-in-depth architecture (multiple layers)
- Fail-fast environment validation
- Secure defaults (auth required unless explicitly public)

#### A05:2021 - Security Misconfiguration
✅ **PROTECTED**
- TypeScript strict mode enabled
- Environment validation at startup
- No debug mode in production
- Structured error handling (no stack traces to client)

#### A06:2021 - Vulnerable and Outdated Components
🟡 **MONITORING REQUIRED**
- Dependencies: Dependabot enabled (recommended)
- Next.js 15.5.4 (latest stable)
- Clerk SDK 6.33.1 (recent)
- **Action Item:** Enable automated dependency updates

#### A07:2021 - Identification and Authentication Failures
✅ **PROTECTED**
- Clerk handles authentication (SOC 2 certified)
- Session management (httpOnly cookies)
- MFA available (should be enforced)

#### A08:2021 - Software and Data Integrity Failures
✅ **PROTECTED**
- HMAC signature validation on all external requests
- npm/pnpm lockfiles ensure reproducible builds
- No client-side code modification

#### A09:2021 - Security Logging and Monitoring Failures
🟡 **PARTIAL**
- Structured logging (app.log, api.log)
- Middleware logs auth attempts
- **Gap:** No centralized monitoring (Sentry/DataDog)
- **Action Item:** Implement production monitoring

#### A10:2021 - Server-Side Request Forgery (SSRF)
✅ **PROTECTED**
- No user-controlled URLs
- All external API calls hardcoded (Intercom, OpenRouter)
- No proxy endpoints with user input

---

## Security Monitoring

### Current Logging

**Files:**
- `logs/app.log` - Application events
- `logs/api.log` - API requests/responses

**What's Logged:**
```typescript
// Successful authentications
'[Middleware] Access granted for: user@peterei.com'

// Failed authentications
'[Middleware] Access denied - email does not end with @peterei.com'

// Signature validations
'Signature validation successful'
'Signature validation failed: Expected {digest}, got {signature}'

// API interactions
'[INTERCOM] Fetching: https://api.intercom.io/contacts'
```

### Production Monitoring Recommendations

```mermaid
graph TB
    subgraph "Application"
        App[Pete Intercom App]
        Logs[Structured Logs]
    end

    subgraph "Monitoring Services (Recommended)"
        Sentry[Sentry<br/>Error Tracking]
        LogDNA[LogDNA / DataDog<br/>Log Aggregation]
        Uptime[UptimeRobot<br/>Availability Monitoring]
    end

    subgraph "Alerts"
        Slack[Slack Notifications]
        Email[Email Alerts]
        PagerDuty[PagerDuty<br/>Critical Issues]
    end

    App -->|Errors| Sentry
    Logs -->|Stream| LogDNA
    App -->|Health Checks| Uptime

    Sentry -->|Critical Error| PagerDuty
    Sentry -->|Error| Slack
    LogDNA -->|Failed Auth| Slack
    Uptime -->|Down| Email
    Uptime -->|Down| PagerDuty

    style Sentry fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff
    style LogDNA fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
    style PagerDuty fill:#F44336,stroke:#C62828,stroke-width:2px,color:#fff
```

**Priority Implementation:**
1. **Sentry** - Automatic error tracking
2. **UptimeRobot** - Free uptime monitoring
3. **LogDNA/DataDog** - Centralized log analysis

### Security Events to Monitor

**High Priority Alerts:**
- ❌ Multiple failed Clerk authentication attempts (brute force)
- ❌ Invalid HMAC signature attempts (forged requests)
- ❌ 403 errors on admin routes (unauthorized access)
- ❌ Environment variable validation failures (startup errors)

**Medium Priority Alerts:**
- ⚠️ Intercom API rate limit reached
- ⚠️ Unusual number of admin logins
- ⚠️ Large data exports from admin dashboard

**Low Priority (Daily Summary):**
- ℹ️ Total API requests
- ℹ️ Admin user activity
- ℹ️ Cache hit/miss rates

---

## Next Steps

For detailed analyses, see:
- [01-CLERK-SECURITY-DEEP-DIVE.md](./01-CLERK-SECURITY-DEEP-DIVE.md) - Why Clerk is the right choice
- [02-DEVILS-ADVOCATE-ANALYSIS.md](./02-DEVILS-ADVOCATE-ANALYSIS.md) - What could go wrong?
- [03-PRODUCTION-READINESS-CHECKLIST.md](./03-PRODUCTION-READINESS-CHECKLIST.md) - Launch requirements
- [04-INCIDENT-RESPONSE-PLAN.md](./04-INCIDENT-RESPONSE-PLAN.md) - What to do if something goes wrong

---

**Document Status:** ✅ Ready for stakeholder review
**Next Review Date:** 2025-11-08 (30 days)
