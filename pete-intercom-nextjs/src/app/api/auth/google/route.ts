/**
 * Google OAuth Initialization Route
 *
 * Redirects user to Google consent screen to authorize Gmail access.
 * This is step 1 of the OAuth flow.
 */

import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/services/email-oauth';
import { logInfo } from '@/services/logger';

export async function GET() {
  try {
    logInfo('[OAuth] Generating authorization URL');

    const authUrl = getAuthUrl();

    logInfo(`[OAuth] Redirecting to Google consent screen`);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logInfo(`[OAuth] Error generating auth URL: ${errorMessage}`);

    return NextResponse.json(
      { error: 'Failed to initialize OAuth flow', details: errorMessage },
      { status: 500 }
    );
  }
}