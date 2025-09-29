import { NextRequest, NextResponse } from 'next/server';
import { searchCompanies } from '@/services/intercom';
import { logInfo, logError } from '@/services/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || undefined;
    const live = searchParams.get('live') === 'true';

    logInfo(`[COMPANIES_API] Search request: name=${name || ''}, live=${live}`, 'api.log');

    const companies = await searchCompanies(name, live);
    
    return NextResponse.json({
      companies,
      count: companies.length,
    });
  } catch (error) {
    logError(`[COMPANIES_API] Search error: ${error instanceof Error ? error.message : error}`, 'api.log');
    return NextResponse.json(
      { error: 'Failed to search companies' },
      { status: 500 }
    );
  }
}