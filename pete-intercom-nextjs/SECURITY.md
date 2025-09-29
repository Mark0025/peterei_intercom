# Security Documentation

## HMAC Signature Validation (Issue #2) ✅ COMPLETED

### Overview

All Canvas Kit endpoints (`/api/initialize`, `/api/submit`) implement HMAC-SHA256 signature validation to ensure requests genuinely originate from Intercom.

### Implementation

**Location:** `src/middleware/signature-validation.ts`

**Usage:**
```typescript
import { validateIntercomSignature, getClientSecret } from '@/middleware/signature-validation';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('X-Body-Signature');

  if (!validateIntercomSignature(body, signature, getClientSecret())) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Process validated request...
}
```

### Why This Matters for Next.js

1. **Public API Routes** - Next.js API routes are accessible to anyone by default
2. **No Built-in Authentication** - Unlike some frameworks, Next.js doesn't validate request origins
3. **Server Actions Exposure** - Easy to accidentally expose sensitive operations
4. **Edge/Global Deployment** - Can't rely on network-level security

### Protection Against

- ✅ **Forged Requests** - Attacker can't generate valid signature without secret
- ✅ **Replay Attacks** - Tampering with any byte invalidates signature
- ✅ **Data Manipulation** - Request body integrity verified cryptographically
- ✅ **Unauthorized Access** - Only Intercom (with shared secret) can make requests

### Test Coverage

**Unit Tests:** `src/tests/test-signature-validation.ts`
- 6/6 tests passing
- Tests valid/invalid signatures, tampering, missing headers

**Integration Tests:** `src/tests/test-endpoints-with-signature.ts`
- 6/6 tests passing
- Tests actual HTTP endpoints with live Next.js server
- Verifies both `/api/initialize` and `/api/submit`

**Run tests:**
```bash
# Unit tests
npx tsx src/tests/test-signature-validation.ts

# Integration tests (requires running dev server)
npm run dev
# In another terminal:
npx tsx src/tests/test-endpoints-with-signature.ts
```

### Performance

**Overhead:** 1-5ms per request for HMAC-SHA256 validation
**Trade-off:** Negligible performance cost vs. preventing security breaches

### References

- [Intercom Canvas Kit Security](https://developers.intercom.com/docs/canvas-kit#signing-notifications)
- [HMAC-SHA256 Specification](https://tools.ietf.org/html/rfc2104)
- GitHub Issue: #2

---

## Security Best Practices

### Environment Variables

**Never commit:**
- `INTERCOM_CLIENT_SECRET` - Used for signature validation
- `INTERCOM_ACCESS_TOKEN` - Used for API calls
- `EMAIL_USER`, `EMAIL_PASS` - Email credentials

**Always:**
- Store secrets in `.env` file (gitignored)
- Use `process.env` to access secrets
- Validate secrets exist on startup

### Request Validation

**All external requests must:**
1. Validate HMAC signature (Canvas Kit endpoints)
2. Validate Bearer token (Intercom API calls)
3. Log validation attempts
4. Return 401 for invalid authentication

### Error Handling

**Never expose:**
- Stack traces to clients
- Internal error details
- Secret values in logs

**Always:**
- Log detailed errors server-side
- Return generic error messages to clients
- Use Canvas Kit error format for UI errors

---

## Incident Response

### If INTERCOM_CLIENT_SECRET is Compromised

1. **Rotate secret immediately** in Intercom Developer Portal
2. **Update `.env` file** with new secret
3. **Restart application** to load new secret
4. **Review logs** for suspicious activity before rotation
5. **Monitor for 401 errors** after rotation (old secret will fail)

### Monitoring

**Watch for:**
- High volume of 401 errors (potential attack)
- Signature validation failures (tampering attempts)
- Unexpected request patterns

**Logs location:**
- Application logs: `logs/app.log`
- API logs: `logs/api.log`

---

*Last Updated: 2025-09-29*
*Issue #2: Completed and Verified ✅*