import { NextRequest, NextResponse } from 'next/server';
import { searchContacts } from '@/services/intercom';
import { logInfo, logError } from '@/services/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || undefined;
    const name = searchParams.get('name') || undefined;
    const live = searchParams.get('live') === 'true';

    logInfo(`[CONTACTS_API] Search request: email=${email || ''}, name=${name || ''}, live=${live}`, 'api.log');

    const contacts = await searchContacts(email, name, live);
    
    return NextResponse.json({
      contacts,
      count: contacts.length,
    });
  } catch (error) {
    logError(`[CONTACTS_API] Search error: ${error instanceof Error ? error.message : error}`, 'api.log');
    return NextResponse.json(
      { error: 'Failed to search contacts' },
      { status: 500 }
    );
  }
}