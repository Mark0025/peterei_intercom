/**
 * Popout Form Submission Endpoint
 *
 * Handles full onboarding form submissions from the popout window.
 * Sends email notification to admins with all form answers.
 *
 * @see Issue #3: Email Integration (SMTP Implementation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendOnboardingEmail, isEmailConfigured } from '@/services/email';
import { logInfo, logError } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    logInfo('[API] Popout form submission received');

    // Parse form data
    const formData = await request.formData();
    const answers: Record<string, string> = {};

    // Convert FormData to plain object
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        answers[key] = value;
      }
    }

    logInfo(`[API] Form data parsed: ${Object.keys(answers).length} fields`);

    // Check if email is configured
    if (!isEmailConfigured()) {
      logError('[API] Email not configured - cannot send notification');

      return NextResponse.json(
        {
          success: false,
          error: 'Email notifications are not configured',
        },
        { status: 500 }
      );
    }

    // Send email notification
    const emailResult = await sendOnboardingEmail(answers);

    if (!emailResult.success) {
      logError(`[API] Failed to send email: ${emailResult.error}`);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send email notification',
          details: emailResult.error,
        },
        { status: 500 }
      );
    }

    logInfo(`[API] Email sent successfully. Message ID: ${emailResult.messageId}`);

    return NextResponse.json({
      success: true,
      message: 'Onboarding form submitted successfully',
      emailSent: true,
      messageId: emailResult.messageId,
    });
  } catch (error) {
    logError(`[API] Popout submit error: ${error instanceof Error ? error.message : error}`);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests to provide endpoint information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/popout-submit',
    method: 'POST',
    description: 'Submit onboarding form and send email notification (SMTP)',
    emailConfigured: isEmailConfigured(),
  });
}