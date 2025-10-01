import { NextRequest, NextResponse } from 'next/server';
import { chatWithConversationAgent } from '@/services/conversation-agent';
import { HumanMessage, AIMessage } from "@langchain/core/messages";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ConversationChatRequest {
  message: string;
  category?: string;
  conversationHistory?: Array<{
    role: 'user' | 'ai';
    content: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConversationChatRequest = await request.json();
    const { message, category, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Convert conversation history to LangChain messages
    const history = conversationHistory.map((msg) =>
      msg.role === 'user'
        ? new HumanMessage({ content: msg.content })
        : new AIMessage({ content: msg.content })
    );

    // Call the conversation agent
    const result = await chatWithConversationAgent(message, category, history);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to process message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: result.message,
      mermaidDiagram: result.mermaidDiagram,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[API] Conversation chat error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
