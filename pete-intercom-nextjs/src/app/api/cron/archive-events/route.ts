/**
 * Cron Job API Route - Daily Event Archival
 *
 * This endpoint should be called daily by a cron service (e.g., Render Cron Jobs, Vercel Cron, GitHub Actions)
 *
 * Setup options:
 * 1. Render.com Cron Jobs: https://render.com/docs/cronjobs
 * 2. Vercel Cron: https://vercel.com/docs/cron-jobs
 * 3. GitHub Actions: Schedule workflow to hit this endpoint
 * 4. Node-cron: Use node-cron package for self-hosted
 *
 * Security: Requires CRON_SECRET environment variable to prevent unauthorized access
 */

import { NextRequest, NextResponse } from 'next/server';
import { archiveAllUserEvents } from '@/actions/archive-events';
import { logInfo, logError } from '@/services/logger';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Security: Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = env.CRON_SECRET || process.env.CRON_SECRET;

    if (!cronSecret) {
      logError('[Cron] CRON_SECRET not configured - cron job is insecure!', 'api.log');
    } else if (authHeader !== `Bearer ${cronSecret}`) {
      logError('[Cron] Unauthorized cron job attempt', 'api.log');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logInfo('[Cron] Starting daily event archive job', 'api.log');

    // Run the archival
    const result = await archiveAllUserEvents();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (result.success) {
      logInfo(
        `[Cron] Archive job completed successfully in ${duration}s: ${result.contactsProcessed} contacts, ${result.totalEvents} events`,
        'api.log'
      );

      return NextResponse.json({
        success: true,
        message: 'Event archival completed',
        stats: {
          contactsProcessed: result.contactsProcessed,
          totalEvents: result.totalEvents,
          duration: `${duration}s`,
          archiveFile: result.archiveFile,
        },
      });
    } else {
      logError(`[Cron] Archive job failed: ${result.error}`, 'api.log');

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          duration: `${duration}s`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logError(`[Cron] Archive job exception: ${errorMsg}`, 'api.log');

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        duration: `${duration}s`,
      },
      { status: 500 }
    );
  }
}

// Allow POST as well for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
