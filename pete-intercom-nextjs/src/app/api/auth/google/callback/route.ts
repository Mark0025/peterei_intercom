/**
 * Google OAuth Callback Route
 *
 * Handles the redirect from Google after user authorizes access.
 * Exchanges authorization code for tokens and displays them.
 * This is step 2 of the OAuth flow.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode, testOAuthConnection } from '@/services/email-oauth';
import { logInfo, logError } from '@/services/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Check for authorization errors
    if (error) {
      logError(`[OAuth] Authorization denied: ${error}`);
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>OAuth Error</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { background: #fee; border: 2px solid #f00; padding: 20px; border-radius: 5px; }
            h1 { color: #c00; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>❌ Authorization Denied</h1>
            <p>You denied access to Gmail. The app cannot send emails without authorization.</p>
            <p>Error: ${error}</p>
            <p><a href="/api/auth/google">Try again</a></p>
          </div>
        </body>
        </html>
        `,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code) {
      logError('[OAuth] No authorization code received');
      return NextResponse.json(
        { error: 'No authorization code received' },
        { status: 400 }
      );
    }

    logInfo('[OAuth] Exchanging authorization code for tokens');

    const tokens = await getTokensFromCode(code);

    if (!tokens.refresh_token) {
      logError('[OAuth] No refresh token received - user may have already authorized');
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>OAuth Issue</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .warning { background: #ffc; border: 2px solid #fa0; padding: 20px; border-radius: 5px; }
            h1 { color: #a60; }
          </style>
        </head>
        <body>
          <div class="warning">
            <h1>⚠️ No Refresh Token</h1>
            <p>Google did not provide a refresh token. This usually happens when you've already authorized this app.</p>
            <p>To get a new refresh token:</p>
            <ol>
              <li>Go to <a href="https://myaccount.google.com/permissions" target="_blank">Google Account Permissions</a></li>
              <li>Remove "Pete Intercom App" access</li>
              <li><a href="/api/auth/google">Try authorization again</a></li>
            </ol>
          </div>
        </body>
        </html>
        `,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Test the connection
    const connectionTest = await testOAuthConnection(tokens.refresh_token);

    if (!connectionTest.success) {
      logError(`[OAuth] Connection test failed: ${connectionTest.error}`);
      return NextResponse.json(
        { error: 'OAuth tokens obtained but connection test failed', details: connectionTest.error },
        { status: 500 }
      );
    }

    logInfo(`[OAuth] Success! Connected as: ${connectionTest.email}`);

    // Display tokens to user for manual .env configuration
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OAuth Success</title>
        <style>
          body { font-family: 'Monaco', 'Courier New', monospace; max-width: 800px; margin: 50px auto; padding: 20px; }
          .success { background: #efe; border: 2px solid #0a0; padding: 20px; border-radius: 5px; }
          h1 { color: #070; }
          pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
          code { background: #e0e0e0; padding: 2px 6px; border-radius: 3px; }
          .warning { background: #ffc; padding: 10px; border-radius: 5px; margin: 20px 0; }
          .info { background: #def; padding: 10px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="success">
          <h1>✅ OAuth Authorization Successful!</h1>
          <p><strong>Connected as:</strong> ${connectionTest.email}</p>
        </div>

        <div class="info">
          <h2>📝 Add This to Your .env File</h2>
          <p>Copy the refresh token below and add it to <code>pete-intercom-nextjs/.env</code>:</p>
          <pre>GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</pre>
        </div>

        <div class="warning">
          <h2>⚠️ Security Notice</h2>
          <ul>
            <li><strong>Do NOT commit this token to git</strong></li>
            <li><strong>Do NOT share this token</strong></li>
            <li>The .env file is already in .gitignore</li>
            <li>You can revoke access anytime at <a href="https://myaccount.google.com/permissions" target="_blank">Google Account Permissions</a></li>
          </ul>
        </div>

        <div class="info">
          <h2>🧪 Test Email Service</h2>
          <p>After adding the token to .env, restart the server and run:</p>
          <pre>pnpm exec tsx src/tests/test-email-oauth.ts</pre>
        </div>

        <div class="info">
          <h2>📋 Debug Info (Optional)</h2>
          <details>
            <summary>Click to view full token details</summary>
            <pre>${JSON.stringify(tokens, null, 2)}</pre>
          </details>
        </div>
      </body>
      </html>
      `,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[OAuth] Callback error: ${errorMessage}`);

    return NextResponse.json(
      { error: 'OAuth callback failed', details: errorMessage },
      { status: 500 }
    );
  }
}