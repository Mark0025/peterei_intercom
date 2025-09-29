import { NextRequest, NextResponse } from 'next/server';
import { sendMessageToPeteAIJson } from '@/actions/peteai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check API key availability
    const apiKey = process.env.OPENROUTER_API_KEY;
    console.log('[PeteAI API] API Key status:', apiKey ? `Present (length: ${apiKey.length})` : 'Missing');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Missing message in request body' },
        { status: 400 }
      );
    }

    const result = await sendMessageToPeteAIJson({ message });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Return in the format expected by the original frontend
    return NextResponse.json({
      reply: {
        content: result.data?.reply
      }
    });

  } catch (error) {
    console.error('[PeteAI API] Error:', error);
    return NextResponse.json(
      { error: 'AI agent error' },
      { status: 500 }
    );
  }
}