/**
 * POST /api/conversations/[sessionId]/messages
 *
 * Add a message to a conversation session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveMessage } from '@/lib/conversation-history';
import type { AgentType, AIMessage } from '@/types/ai-conversations';

interface AddMessageRequest {
  userId: string;
  agentType: AgentType;
  role: 'user' | 'ai';
  content: string;
  hasMermaid?: boolean;
  toolsUsed?: string[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = (await request.json()) as AddMessageRequest;

    const { userId, agentType, role, content, hasMermaid, toolsUsed } = body;

    if (!userId || !agentType || !role || !content) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId, agentType, role, and content are required',
        },
        { status: 400 }
      );
    }

    const message: Omit<AIMessage, 'id'> = {
      role,
      content,
      timestamp: new Date().toISOString(),
      agentType,
      hasMermaid,
      toolsUsed,
    };

    const result = await saveMessage(sessionId, userId, message, agentType);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Add message error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
