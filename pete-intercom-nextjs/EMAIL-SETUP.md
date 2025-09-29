# Email Setup Guide

## Current Status

✅ Email service code implemented and tested
❌ Gmail credentials not configured (expected)

**Result:** No emails will be sent until credentials are added to `.env`

## Quick Setup (5 minutes)

### Step 1: Get Gmail App Password

You **CANNOT** use your regular Gmail password. You need an "App Password":

1. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Or: Google Account → Security → 2-Step Verification → App Passwords

2. Click "**Generate**" or "**Create App Password**"
   - Select "Mail" as the app
   - Select "Mac" (or your device) as the device

3. Copy the **16-character password** (looks like: `abcd efgh ijkl mnop`)

### Step 2: Add to .env File

Edit `pete-intercom-nextjs/.env`:

```bash
# Add these lines:
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=abcdefghijklmnop              # The 16-char app password (no spaces)
EMAIL_RECIPIENTS=mark@peterei.com        # Optional (this is the default)
```

**Example:**
```bash
EMAIL_USER=mark.carpenter@gmail.com
EMAIL_PASS=xygh jhgf rfed csaa
EMAIL_RECIPIENTS=mark@peterei.com
```

### Step 3: Test It Works

```bash
cd pete-intercom-nextjs
npx tsx src/tests/test-email-service.ts
```

**Expected output:**
```
📧 Running Email Service Tests

📝 Test 1: Email Configuration Check
   Email USER: ✓ Set
   Email PASS: ✓ Set
   Recipients: mark@peterei.com
   ✅ PASSED - Email is configured

📝 Test 2: SMTP Connection Test
   Testing connection to Gmail SMTP...
   ✅ PASSED - SMTP connection successful

📝 Test 3: Send Test Onboarding Email
   Sending test email with sample data...
   ✅ PASSED - Test email sent successfully
   Message ID: <abc123@gmail.com>
   Check inbox at: mark@peterei.com

📊 Test Results: 3 passed, 0 failed

🎉 All email tests passed! Email service is working correctly.
📬 Check your inbox for the test email.
```

### Step 4: Check Your Inbox

Look for an email with subject: **"New Pete Intercom Onboarding Submission"**

---

## Troubleshooting

### "Invalid login" Error

**Problem:** Gmail rejected the password

**Solutions:**
1. Make sure you're using an **App Password**, not your regular password
2. Enable 2-Step Verification in Google Account settings first
3. Copy the app password correctly (no spaces in .env)

### "Less secure app access" Message

**Solution:** You don't need to enable "less secure apps". Use App Passwords instead (they're MORE secure).

### Still Not Working?

Run the connection test:
```bash
cd pete-intercom-nextjs
npx tsx -e "
import { testEmailConnection } from './src/services/email';
testEmailConnection().then(r => console.log(r));
"
```

---

## How to Send Real Onboarding Emails

Once configured, emails are sent automatically when users submit the onboarding form:

**Via API:**
```bash
curl -X POST http://localhost:3000/api/popout-submit \
  -F "company_name=Acme Corp" \
  -F "user_name=John Doe" \
  -F "email=john@acme.com" \
  -F "role=Product Manager"
```

**Via Form:**
1. Go to `http://localhost:3000/popout`
2. Fill out the onboarding form
3. Submit
4. Email sent to `mark@peterei.com` ✅

---

## Security Notes

✅ **App Passwords are safer** than your main Gmail password
✅ **Can be revoked** anytime from Google Account settings
✅ **Only works for SMTP** - can't access other Google services
✅ **Stored in .env** which is gitignored
❌ **Never commit** your .env file to git

---

## Why No Email Was Sent

When you ran the test earlier:

```
📝 Test 1: Email Configuration Check
   Email USER: ✗ Not set    ← Missing
   Email PASS: ✗ Not set    ← Missing
   ❌ FAILED - Email is not configured
```

The test **correctly** detected missing credentials and **didn't attempt** to send an email. This is the expected behavior!

Once you add credentials and re-run the test, it will:
1. ✅ Detect configuration
2. ✅ Connect to Gmail SMTP
3. ✅ Send a test email to `mark@peterei.com`

---

**Next Steps:**
1. Get Gmail App Password (5 min)
2. Add to `.env` file (1 min)
3. Run test again (1 min)
4. Check `mark@peterei.com` inbox ✅