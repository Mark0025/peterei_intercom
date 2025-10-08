/**
 * AI Conversation Logging
 *
 * Admin logging system for AI conversations.
 * Logs are segmented by agent type and stored daily.
 *
 * Storage structure:
 * data/ai-logs/{agentType}/YYYY-MM-DD.json
 */

import fs from 'fs/promises';
import path from 'path';
import type { AIConversationLog, AgentType, AILogSummary } from '@/types/ai-conversations';

const LOGS_DIR = path.join(process.cwd(), 'data', 'ai-logs');

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
 * Get log file path for a date
 */
function getLogPath(agentType: AgentType, date: Date): string {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(LOGS_DIR, agentType, `${dateStr}.json`);
}

/**
 * Load logs for a specific date
 */
async function loadLogs(agentType: AgentType, date: Date): Promise<AIConversationLog[]> {
  try {
    const logPath = getLogPath(agentType, date);
    const data = await fs.readFile(logPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Save logs for a specific date
 */
async function saveLogs(
  agentType: AgentType,
  date: Date,
  logs: AIConversationLog[]
): Promise<void> {
  const agentDir = path.join(LOGS_DIR, agentType);
  await ensureDir(agentDir);

  const logPath = getLogPath(agentType, date);
  await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
}

/**
 * Log an AI conversation
 */
export async function logAIConversation(
  data: Omit<AIConversationLog, 'logId' | 'timestamp'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date();
    const log: AIConversationLog = {
      ...data,
      logId: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now.toISOString(),
    };

    // Load existing logs for today
    const logs = await loadLogs(data.agentType, now);

    // Add new log
    logs.push(log);

    // Save logs
    await saveLogs(data.agentType, now, logs);

    return { success: true };
  } catch (error) {
    console.error('[AIConversationLogs] Log error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get logs by agent type for a date range
 */
export async function getLogsByAgent(
  agentType: AgentType,
  startDate?: Date,
  endDate?: Date
): Promise<AIConversationLog[]> {
  try {
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days ago
    const end = endDate || new Date();

    const allLogs: AIConversationLog[] = [];

    // Iterate through each day in range
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const logs = await loadLogs(agentType, currentDate);
      allLogs.push(...logs);

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return allLogs;
  } catch (error) {
    console.error('[AIConversationLogs] Get logs by agent error:', error);
    return [];
  }
}

/**
 * Get logs by user ID
 */
export async function getLogsByUser(
  userId: string,
  agentType?: AgentType,
  days: number = 30
): Promise<AIConversationLog[]> {
  try {
    const agentTypes: AgentType[] = agentType
      ? [agentType]
      : ['langraph', 'conversation', 'onboarding'];

    const allLogs: AIConversationLog[] = [];
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    for (const type of agentTypes) {
      const logs = await getLogsByAgent(type, startDate, endDate);
      const userLogs = logs.filter((log) => log.userId === userId);
      allLogs.push(...userLogs);
    }

    // Sort by timestamp (most recent first)
    return allLogs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('[AIConversationLogs] Get logs by user error:', error);
    return [];
  }
}

/**
 * Get logs by session ID
 */
export async function getLogsBySession(
  sessionId: string,
  agentType: AgentType
): Promise<AIConversationLog[]> {
  try {
    // Search last 30 days
    const logs = await getLogsByAgent(agentType);
    return logs.filter((log) => log.sessionId === sessionId);
  } catch (error) {
    console.error('[AIConversationLogs] Get logs by session error:', error);
    return [];
  }
}

/**
 * Get log summary for an agent
 */
export async function getLogSummary(
  agentType: AgentType,
  days: number = 7
): Promise<AILogSummary> {
  try {
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await getLogsByAgent(agentType, startDate, endDate);

    // Calculate metrics
    const uniqueSessions = new Set(logs.map((log) => log.sessionId)).size;
    const totalMessages = logs.length;
    const errors = logs.filter((log) => log.error).length;
    const avgLatency =
      logs.reduce((sum, log) => sum + log.response.latencyMs, 0) / totalMessages || 0;

    return {
      agentType,
      totalConversations: uniqueSessions,
      totalMessages,
      averageLatencyMs: Math.round(avgLatency),
      errorCount: errors,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  } catch (error) {
    console.error('[AIConversationLogs] Get log summary error:', error);
    return {
      agentType,
      totalConversations: 0,
      totalMessages: 0,
      averageLatencyMs: 0,
      errorCount: 0,
      dateRange: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
    };
  }
}

/**
 * Clean up old logs (keep last N days)
 */
export async function cleanupOldLogs(
  agentType: AgentType,
  keepDays: number = 90
): Promise<{ success: boolean; deletedFiles: number; error?: string }> {
  try {
    const agentDir = path.join(LOGS_DIR, agentType);
    const files = await fs.readdir(agentDir);

    const cutoffDate = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const file of files) {
      if (file.endsWith('.json')) {
        // Extract date from filename (YYYY-MM-DD.json)
        const dateStr = file.replace('.json', '');
        const fileDate = new Date(dateStr);

        if (fileDate < cutoffDate) {
          await fs.unlink(path.join(agentDir, file));
          deletedCount++;
        }
      }
    }

    return { success: true, deletedFiles: deletedCount };
  } catch (error) {
    console.error('[AIConversationLogs] Cleanup error:', error);
    return {
      success: false,
      deletedFiles: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
