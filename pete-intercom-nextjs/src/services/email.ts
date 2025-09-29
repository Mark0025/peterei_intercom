/**
 * Email Service for Onboarding Notifications
 *
 * Sends email notifications when users complete the onboarding form.
 * Uses nodemailer with Gmail SMTP.
 *
 * @see Issue #3: Email Integration
 */

import nodemailer from 'nodemailer';
import { logInfo, logError } from './logger';

/**
 * Email configuration from environment variables
 */
const EMAIL_CONFIG = {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
  recipients: process.env.EMAIL_RECIPIENTS || 'mark@peterei.com',
} as const;

/**
 * Create nodemailer transporter
 * Uses Gmail SMTP server
 */
function createTransporter() {
  if (!EMAIL_CONFIG.user || !EMAIL_CONFIG.pass) {
    throw new Error(
      'Email configuration missing: EMAIL_USER and EMAIL_PASS must be set in .env'
    );
  }

  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: EMAIL_CONFIG.user,
      pass: EMAIL_CONFIG.pass,
    },
  });
}

/**
 * Format onboarding answers as readable email text
 */
function formatAnswers(answers: Record<string, string>): string {
  const formatted = Object.entries(answers)
    .map(([key, value]) => {
      // Make keys more readable
      const readableKey = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

      return `${readableKey}: ${value}`;
    })
    .join('\n');

  return formatted;
}

/**
 * Send onboarding completion email
 *
 * @param answers - Key-value pairs of onboarding questions and answers
 * @returns Promise that resolves when email is sent
 */
export async function sendOnboardingEmail(
  answers: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    logInfo(`Attempting to send onboarding email with ${Object.keys(answers).length} answers`);

    const transporter = createTransporter();

    const mailOptions = {
      from: EMAIL_CONFIG.user,
      to: EMAIL_CONFIG.recipients,
      subject: 'New Pete Intercom Onboarding Submission',
      text: `
New Onboarding Form Submission
================================

Submitted at: ${new Date().toLocaleString()}

Answers:
--------
${formatAnswers(answers)}

================================
This email was sent automatically from Pete Intercom App (Next.js).
      `.trim(),
      html: `
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
      <strong>Source:</strong> Pete Intercom App (Next.js)
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
      Pete Intercom App · Next.js Migration · Automated Email
    </div>
  </div>
</body>
</html>
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);

    logInfo(`Onboarding email sent successfully. Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`Failed to send onboarding email: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Verify email configuration is valid
 *
 * @returns true if configuration is valid, false otherwise
 */
export function isEmailConfigured(): boolean {
  return !!(EMAIL_CONFIG.user && EMAIL_CONFIG.pass);
}

/**
 * Test email connection
 * Useful for health checks and debugging
 *
 * @returns Promise that resolves when connection test completes
 */
export async function testEmailConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isEmailConfigured()) {
      return {
        success: false,
        error: 'Email not configured: EMAIL_USER and EMAIL_PASS required',
      };
    }

    const transporter = createTransporter();
    await transporter.verify();

    logInfo('Email connection test successful');

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`Email connection test failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}