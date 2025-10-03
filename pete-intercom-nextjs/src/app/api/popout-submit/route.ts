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
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const SUBMISSIONS_DIR = path.join(process.cwd(), 'data', 'form-submissions');

/**
 * Save form submission to JSON file
 */
async function saveSubmission(answers: Record<string, string>): Promise<string> {
  // Ensure directory exists
  if (!existsSync(SUBMISSIONS_DIR)) {
    await mkdir(SUBMISSIONS_DIR, { recursive: true });
  }

  // Create submission object
  const submission = {
    id: `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    submittedAt: new Date().toISOString(),
    timestamp: Date.now(),
    answers,
  };

  // Save to file
  const filename = path.join(SUBMISSIONS_DIR, `${submission.id}.json`);
  await writeFile(filename, JSON.stringify(submission, null, 2));

  logInfo(`[API] Submission saved: ${filename}`);

  return submission.id;
}

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

    // ALWAYS save submission to disk (whether email works or not)
    const submissionId = await saveSubmission(answers);

    // Try to send email if configured (optional)
    let emailSent = false;
    let messageId: string | undefined;

    if (isEmailConfigured()) {
      const emailResult = await sendOnboardingEmail(answers);

      if (emailResult.success) {
        emailSent = true;
        messageId = emailResult.messageId;
        logInfo(`[API] Email sent successfully. Message ID: ${emailResult.messageId}`);
      } else {
        logError(`[API] Email sending failed: ${emailResult.error}`);
        // Don't fail the whole submission - just log it
      }
    } else {
      logInfo('[API] Email not configured - skipping email notification');
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding form submitted successfully',
      submissionId,
      emailSent,
      messageId,
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