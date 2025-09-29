import { NextRequest, NextResponse } from 'next/server';
import { proxyIntercomGet } from '@/services/intercom';
import { logInfo, logError } from '@/services/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    
    if (!path) {
      return NextResponse.json(
        { error: 'Missing path parameter' },
        { status: 400 }
      );
    }

    logInfo(`[INTERCOM_PROXY_API] Proxy request for path: ${path}`, 'api.log');

    // Convert remaining searchParams to a plain object for forwarding
    const forwardParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'path') { // Don't forward the path param
        forwardParams[key] = value;
      }
    });

    const data = await proxyIntercomGet(path, Object.keys(forwardParams).length > 0 ? forwardParams : undefined);
    
    return NextResponse.json(data);
  } catch (error) {
    logError(`[INTERCOM_PROXY_API] Proxy error: ${error instanceof Error ? error.message : error}`, 'api.log');
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { status: 500 }
    );
  }
}