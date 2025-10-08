/**
 * Conversation History Storage
 *
 * JSON-based storage for AI conversation history.
 * Will be migrated to database in future.
 *
 * Storage structure:
 * data/conversations/{agentType}/{userId}/{sessionId}.json
 */

import fs from 'fs/promises';
import path from 'path';
import type {
  AIMessage,
  ConversationSession,
  AgentType,
} from '@/types/ai-conversations';

const DATA_DIR = path.join(process.cwd(), 'data', 'conversations');

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Get session file path
 */
function getSessionPath(
  agentType: AgentType,
  userId: string,
  sessionId: string
): string {
  return path.join(DATA_DIR, agentType, userId, `${sessionId}.json`);
}

/**
 * Save a message to a session
 */
export async function saveMessage(
  sessionId: string,
  userId: string,
  message: Omit<AIMessage, 'id'>,
  agentType: AgentType
): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionDir = path.join(DATA_DIR, agentType, userId);
    await ensureDir(sessionDir);

    const sessionPath = getSessionPath(agentType, userId, sessionId);

    // Load existing session or create new
    let session: ConversationSession;
    try {
      const data = await fs.readFile(sessionPath, 'utf-8');
      session = JSON.parse(data);
    } catch {
      // New session
      session = {
        sessionId,
        userId,
        agentType,
        messages: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };
    }

    // Add message with generated ID
    const newMessage: AIMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    session.messages.push(newMessage);
    session.lastActivity = new Date().toISOString();

    // Save session
    await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));

    return { success: true };
  } catch (error) {
    console.error('[ConversationHistory] Save message error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get session history
 */
export async function getSessionHistory(
  sessionId: string,
  userId: string,
  agentType: AgentType
): Promise<ConversationSession | null> {
  try {
    const sessionPath = getSessionPath(agentType, userId, sessionId);
    const data = await fs.readFile(sessionPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Get all sessions for a user (optionally filtered by agent type)
 */
export async function getUserSessions(
  userId: string,
  agentType?: AgentType
): Promise<ConversationSession[]> {
  try {
    const sessions: ConversationSession[] = [];
    const agentTypes: AgentType[] = agentType
      ? [agentType]
      : ['langraph', 'conversation', 'onboarding'];

    for (const type of agentTypes) {
      const userDir = path.join(DATA_DIR, type, userId);

      try {
        await fs.access(userDir);
        const files = await fs.readdir(userDir);

        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(userDir, file);
            const data = await fs.readFile(filePath, 'utf-8');
            sessions.push(JSON.parse(data));
          }
        }
      } catch {
        // Directory doesn't exist or is empty
        continue;
      }
    }

    // Sort by last activity (most recent first)
    return sessions.sort(
      (a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
  } catch (error) {
    console.error('[ConversationHistory] Get user sessions error:', error);
    return [];
  }
}

/**
 * Clear a session
 */
export async function clearSession(
  sessionId: string,
  userId: string,
  agentType: AgentType
): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionPath = getSessionPath(agentType, userId, sessionId);
    await fs.unlink(sessionPath);
    return { success: true };
  } catch (error) {
    console.error('[ConversationHistory] Clear session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get session count for a user
 */
export async function getSessionCount(
  userId: string,
  agentType?: AgentType
): Promise<number> {
  const sessions = await getUserSessions(userId, agentType);
  return sessions.length;
}

/**
 * Get recent messages from a session
 */
export async function getRecentMessages(
  sessionId: string,
  userId: string,
  agentType: AgentType,
  limit: number = 10
): Promise<AIMessage[]> {
  const session = await getSessionHistory(sessionId, userId, agentType);
  if (!session) return [];

  return session.messages.slice(-limit);
}
