# OAuth Troubleshooting - Insufficient Authentication Scopes

## Error You're Seeing

```json
{
  "error": "OAuth tokens obtained but connection test failed",
  "details": "Request had insufficient authentication scopes."
}
```

## Root Cause

Your existing Google OAuth credentials (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`) were created for **Google Sign-In** but don't have the **Gmail API** enabled.

## Solution: Enable Gmail API

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Select your project (the one with your OAuth credentials)
3. Or find it by searching for your Client ID: `270854057287-8sbbvuttpvelvo3ghsampd3g4992j9vj`

### Step 2: Enable Gmail API

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. Search for **"Gmail API"**
3. Click on **"Gmail API"**
4. Click the blue **"Enable"** button

### Step 3: Verify OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Make sure your app is configured with:
   - **User Type:** External (for testing)
   - **Test users:** Add your email (mark@peterei.com)
3. Click **"Add or Remove Scopes"**
4. Search for and add:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/userinfo.email`
5. Save changes

### Step 4: Update Authorized Redirect URIs

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click on your OAuth 2.0 Client ID
3. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
4. Save changes

### Step 5: Try Authorization Again

1. **Visit:** http://localhost:3000/api/auth/google
2. **Sign in** with your Google account
3. **Grant permissions** (you should now see Gmail send permission)
4. **Copy the refresh token** and add to `.env`

---

## Alternative Solution: Create New OAuth Credentials

If you don't want to modify your existing OAuth app (maybe it's used elsewhere), create new credentials specifically for email:

### Step 1: Create New OAuth 2.0 Client ID

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Choose **"Web application"**
4. Name it: **"Pete Intercom Email Service"**
5. Add **Authorized redirect URI:**
   ```
   http://localhost:3000/api/auth/google/callback
   ```
6. Click **"Create"**
7. Copy the **Client ID** and **Client Secret**

### Step 2: Update .env with New Credentials

Replace the old credentials in your `.env`:

```bash
# New OAuth credentials for email
GOOGLE_CLIENT_ID=your_new_client_id_here
GOOGLE_CLIENT_SECRET=your_new_client_secret_here
```

### Step 3: Enable Gmail API (same as above)

Follow **Step 2** from the first solution to enable Gmail API.

### Step 4: Authorize Again

1. Restart server: `PORT=3000 pnpm dev`
2. Visit: http://localhost:3000/api/auth/google
3. Grant permissions
4. Copy refresh token to `.env`

---

## Verifying the Fix

After enabling Gmail API and authorizing:

```bash
# Test OAuth connection
pnpm exec tsx src/tests/test-email-oauth.ts
```

**Expected output:**
```
📝 Test 2: OAuth Connection Test
   Testing connection to Gmail API...
   ✅ PASSED - OAuth connection successful
   Connected as: mark@peterei.com
```

---

## Quick Checklist

- [ ] Gmail API enabled in Google Cloud Console
- [ ] OAuth consent screen configured with correct scopes
- [ ] Redirect URI added: `http://localhost:3000/api/auth/google/callback`
- [ ] Authorized with Google account
- [ ] Refresh token added to `.env`
- [ ] Server restarted
- [ ] Test passed: `pnpm exec tsx src/tests/test-email-oauth.ts`

---

## Still Having Issues?

### Check Gmail API Quota

1. Go to **"APIs & Services"** → **"Enabled APIs & services"**
2. Click **"Gmail API"**
3. Check if you have quota available
4. Default quota: 1 billion requests/day (plenty for this app)

### Check Test User Access

If your OAuth app is in "Testing" mode:

1. Go to **"OAuth consent screen"**
2. Scroll to **"Test users"**
3. Add your email: mark@peterei.com
4. Save changes

### Debug Mode

Add this to your test to see more details:

```bash
# Run with debug logging
GOOGLE_APPLICATION_CREDENTIALS_DEBUG=1 pnpm exec tsx src/tests/test-email-oauth.ts
```

---

## Once Working

After successful authorization:

1. ✅ Test emails: `pnpm exec tsx src/tests/test-email-oauth.ts`
2. ✅ Test onboarding form: http://localhost:3000/popout
3. ✅ Verify emails arrive at mark@peterei.com
4. ✅ Close GitHub Issue #3
5. ✅ Commit changes

---

**Need the direct link?**

Enable Gmail API: https://console.cloud.google.com/apis/library/gmail.googleapis.com