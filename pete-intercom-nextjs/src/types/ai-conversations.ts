/**
 * AI Conversation History Types
 *
 * Shared types for conversation history across all AI agents.
 * Used for JSON storage and future database migration.
 */

export type AgentType = 'langraph' | 'conversation' | 'onboarding';

export interface AIMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string; // ISO 8601 format
  agentType: AgentType;
  hasMermaid?: boolean;
  toolsUsed?: string[]; // For admin logging
}

export interface ConversationSession {
  sessionId: string;
  userId: string; // Clerk user ID
  agentType: AgentType;
  messages: AIMessage[];
  createdAt: string; // ISO 8601 format
  lastActivity: string; // ISO 8601 format
  metadata?: {
    intercomContactId?: string;
    context?: string;
    tags?: string[];
  };
}

export interface ConversationHistoryResponse {
  success: boolean;
  session?: ConversationSession;
  sessions?: ConversationSession[];
  error?: string;
}

// Admin logging types
export interface AIConversationLog {
  logId: string;
  sessionId: string;
  userId: string;
  agentType: AgentType;
  timestamp: string;
  request: {
    message: string;
    toolsUsed: string[];
  };
  response: {
    content: string;
    tokensUsed?: number;
    latencyMs: number;
  };
  error?: string;
}

export interface AILogSummary {
  agentType: AgentType;
  totalConversations: number;
  totalMessages: number;
  averageLatencyMs: number;
  errorCount: number;
  dateRange: {
    start: string;
    end: string;
  };
}
