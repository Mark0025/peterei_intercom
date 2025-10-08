import { NextRequest, NextResponse } from 'next/server';
import { sendMessageToPeteAIJson } from '@/actions/peteai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId } = body;

    // Validate request
    if (!message || typeof message !== 'string') {
      console.error('[PeteAI API] Invalid message in request');
      return NextResponse.json(
        { error: 'Invalid request: message is required' },
        { status: 400 }
      );
    }

    console.log(`[PeteAI API] Request received (session: ${sessionId || 'none'})`);

    // Call action with session support
    const result = await sendMessageToPeteAIJson({
      message,
      sessionId: sessionId || `api-${Date.now()}`
    });

    if (!result.success) {
      // Log error details on server
      console.error('[PeteAI API] Action failed:', result.error);

      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Log success
    console.log(`[PeteAI API] Success - ${result.data?.reply?.length || 0} chars`);
    console.log(`[PeteAI API] Contains Mermaid: ${result.data?.reply?.includes('```mermaid') || false}`);

    // Return data directly
    return NextResponse.json(result.data);

  } catch (error) {
    console.error('[PeteAI API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}