/**
 * GET /api/conversations/user/[userId]
 *
 * Get all conversation sessions for a user, optionally filtered by agent type.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserSessions } from '@/lib/conversation-history';
import type { AgentType } from '@/types/ai-conversations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const agentType = searchParams.get('agentType') as AgentType | undefined;

    const sessions = await getUserSessions(userId, agentType);

    return NextResponse.json({
      success: true,
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error('[API] Get user sessions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
