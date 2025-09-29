/**
 * OAuth-Based Email Service for Onboarding Notifications
 *
 * Uses Google OAuth2 credentials for Gmail API access instead of SMTP.
 * This allows sending emails without requiring an App Password.
 *
 * @see Issue #3: Email Integration (OAuth Implementation)
 */

import { google } from 'googleapis';
import { logInfo, logError } from './logger';

/**
 * OAuth configuration from environment variables
 */
const OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: 'http://localhost:3000/api/auth/google/callback',
  recipients: process.env.EMAIL_RECIPIENTS || 'mark@peterei.com',
} as const;

/**
 * Create OAuth2 client
 */
function createOAuth2Client() {
  if (!OAUTH_CONFIG.clientId || !OAUTH_CONFIG.clientSecret) {
    throw new Error(
      'OAuth configuration missing: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env'
    );
  }

  return new google.auth.OAuth2(
    OAUTH_CONFIG.clientId,
    OAUTH_CONFIG.clientSecret,
    OAUTH_CONFIG.redirectUri
  );
}

/**
 * Get authorization URL for user to grant access
 */
export function getAuthUrl(): string {
  const oauth2Client = createOAuth2Client();

  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}> {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Format onboarding answers as readable email text
 */
function formatAnswers(answers: Record<string, string>): string {
  const formatted = Object.entries(answers)
    .map(([key, value]) => {
      const readableKey = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      return `${readableKey}: ${value}`;
    })
    .join('\n');

  return formatted;
}

/**
 * Create email message in RFC 2822 format
 */
function createEmailMessage(
  to: string,
  subject: string,
  textBody: string,
  htmlBody: string
): string {
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    htmlBody,
  ];

  return messageParts.join('\n');
}

/**
 * Send onboarding completion email using Gmail API
 *
 * @param answers - Key-value pairs of onboarding questions and answers
 * @param refreshToken - OAuth refresh token for Gmail access
 * @returns Promise that resolves when email is sent
 */
export async function sendOnboardingEmailOAuth(
  answers: Record<string, string>,
  refreshToken: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    logInfo(`Attempting to send onboarding email with ${Object.keys(answers).length} answers (OAuth)`);

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    .meta { background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .answers { background: #fff; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0; }
    .answer-item { padding: 10px 0; border-bottom: 1px solid #ecf0f1; }
    .answer-key { font-weight: bold; color: #2c3e50; }
    .answer-value { color: #555; margin-top: 5px; }
    .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎉 New Onboarding Submission</h1>

    <div class="meta">
      <strong>Submitted:</strong> ${new Date().toLocaleString()}<br>
      <strong>Source:</strong> Pete Intercom App (Next.js) - OAuth
    </div>

    <div class="answers">
      <h2>Onboarding Answers</h2>
      ${Object.entries(answers)
        .map(
          ([key, value]) => `
        <div class="answer-item">
          <div class="answer-key">${key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</div>
          <div class="answer-value">${value}</div>
        </div>
      `
        )
        .join('')}
    </div>

    <div class="footer">
      Pete Intercom App · Next.js Migration · OAuth Email
    </div>
  </div>
</body>
</html>
    `.trim();

    const textBody = `
New Onboarding Form Submission
================================

Submitted at: ${new Date().toLocaleString()}

Answers:
--------
${formatAnswers(answers)}

================================
This email was sent automatically from Pete Intercom App (Next.js) using OAuth.
    `.trim();

    const message = createEmailMessage(
      OAUTH_CONFIG.recipients,
      'New Pete Intercom Onboarding Submission',
      textBody,
      htmlBody
    );

    // Encode message in base64url format
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    logInfo(`Onboarding email sent successfully (OAuth). Message ID: ${result.data.id}`);

    return {
      success: true,
      messageId: result.data.id || undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`Failed to send onboarding email (OAuth): ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Verify OAuth configuration is valid
 */
export function isOAuthConfigured(): boolean {
  return !!(OAUTH_CONFIG.clientId && OAUTH_CONFIG.clientSecret);
}

/**
 * Test OAuth connection and permissions
 */
export async function testOAuthConnection(
  refreshToken: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    if (!isOAuthConfigured()) {
      return {
        success: false,
        error: 'OAuth not configured: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required',
      };
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });

    logInfo(`OAuth connection test successful. Email: ${profile.data.emailAddress}`);

    return {
      success: true,
      email: profile.data.emailAddress || undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`OAuth connection test failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}