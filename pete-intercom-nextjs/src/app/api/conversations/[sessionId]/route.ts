/**
 * GET /api/conversations/[sessionId]
 * DELETE /api/conversations/[sessionId]
 *
 * Get or delete a specific conversation session.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionHistory,
  clearSession,
} from '@/lib/conversation-history';
import type { AgentType } from '@/types/ai-conversations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const agentType = searchParams.get('agentType') as AgentType;

    if (!userId || !agentType) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId and agentType are required',
        },
        { status: 400 }
      );
    }

    const session = await getSessionHistory(sessionId, userId, agentType);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('[API] Get session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const agentType = searchParams.get('agentType') as AgentType;

    if (!userId || !agentType) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId and agentType are required',
        },
        { status: 400 }
      );
    }

    const result = await clearSession(sessionId, userId, agentType);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Delete session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
