import { NextResponse } from 'next/server';
import { refreshIntercomCache, getIntercomCache, getCacheStatus } from '@/services/intercom';
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
    await refreshIntercomCache();
    const status = getCacheStatus();
    
    return NextResponse.json({
      message: 'Cache refreshed successfully',
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