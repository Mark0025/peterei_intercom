import { NextResponse } from 'next/server';
import { refreshIntercomCache, getIntercomCache, getCacheStatus, refreshConversationThreads } from '@/services/intercom';
import { logInfo, logError } from '@/services/logger';

export async function GET() {
  try {
    const status = getCacheStatus();
    return NextResponse.json(status);
  } catch (error) {
    logError(`[INTERCOM_CACHE_API] GET error: ${error instanceof Error ? error.message : error}`, 'api.log');
    return NextResponse.json(
      { error: 'Failed to get cache status' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    logInfo('[INTERCOM_CACHE_API] Manual cache refresh requested', 'api.log');

    // Why: Refresh basic conversation data AND full thread details
    // Strategy: Run basic refresh first, then populate threads (takes ~2-3 minutes)
    await refreshIntercomCache();
    logInfo('[INTERCOM_CACHE_API] Basic cache refreshed, now refreshing conversation threads...', 'api.log');

    await refreshConversationThreads();
    logInfo('[INTERCOM_CACHE_API] Conversation threads refreshed successfully', 'api.log');

    const status = getCacheStatus();

    return NextResponse.json({
      message: `Cache refreshed successfully with ${status.counts.conversationThreads} threads`,
      ...status
    });
  } catch (error) {
    logError(`[INTERCOM_CACHE_API] POST error: ${error instanceof Error ? error.message : error}`, 'api.log');
    return NextResponse.json(
      { error: 'Failed to refresh cache' },
      { status: 500 }
    );
  }
}