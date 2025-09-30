'use server';

/**
 * Questionnaire Server Actions
 *
 * Handles submission and storage of 7-levels deep onboarding questionnaire responses
 */

import { logInfo, logError } from '@/services/logger';
import type { ActionResult } from '@/types';
import fs from 'fs/promises';
import path from 'path';

export interface QuestionnaireResponse {
  questionId: string;
  sectionId: string;
  level: number;
  question: string;
  answer: string;
  timestamp: number;
  respondent: string;
}

export interface QuestionnaireSession {
  sessionId: string;
  respondent: string;
  startedAt: number;
  completedAt?: number;
  responses: QuestionnaireResponse[];
  resolutionCategory?: 'Education' | 'Coding' | 'Expectations' | 'Process' | 'Data Validation';
  notes?: string;
}

const STORAGE_DIR = path.join(process.cwd(), 'data', 'questionnaire-responses');

/**
 * Ensure storage directory exists
 */
async function ensureStorageDir(): Promise<void> {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    logError(`Failed to create storage directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save questionnaire response
 */
export async function saveQuestionnaireResponse(
  sessionId: string,
  respondent: string,
  response: Omit<QuestionnaireResponse, 'timestamp' | 'respondent'>
): Promise<ActionResult<QuestionnaireResponse>> {
  try {
    await ensureStorageDir();

    const fullResponse: QuestionnaireResponse = {
      ...response,
      respondent,
      timestamp: Date.now()
    };

    // Load existing session or create new one
    const sessionPath = path.join(STORAGE_DIR, `${sessionId}.json`);
    let session: QuestionnaireSession;

    try {
      const sessionData = await fs.readFile(sessionPath, 'utf-8');
      session = JSON.parse(sessionData);

      // Update or add response
      const existingIndex = session.responses.findIndex(r => r.questionId === response.questionId);
      if (existingIndex >= 0) {
        session.responses[existingIndex] = fullResponse;
      } else {
        session.responses.push(fullResponse);
      }
    } catch {
      // Create new session
      session = {
        sessionId,
        respondent,
        startedAt: Date.now(),
        responses: [fullResponse]
      };
    }

    // Save session
    await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));

    logInfo(`Saved questionnaire response: ${sessionId} - ${response.questionId}`);

    return {
      success: true,
      data: fullResponse
    };
  } catch (error) {
    logError(`Failed to save questionnaire response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save response'
    };
  }
}

/**
 * Complete questionnaire session
 */
export async function completeQuestionnaireSession(
  sessionId: string,
  resolutionCategory?: string,
  notes?: string
): Promise<ActionResult<QuestionnaireSession>> {
  try {
    await ensureStorageDir();

    const sessionPath = path.join(STORAGE_DIR, `${sessionId}.json`);
    const sessionData = await fs.readFile(sessionPath, 'utf-8');
    const session: QuestionnaireSession = JSON.parse(sessionData);

    session.completedAt = Date.now();
    if (resolutionCategory) {
      session.resolutionCategory = resolutionCategory as QuestionnaireSession['resolutionCategory'];
    }
    if (notes) {
      session.notes = notes;
    }

    await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));

    logInfo(`Completed questionnaire session: ${sessionId}`);

    return {
      success: true,
      data: session
    };
  } catch (error) {
    logError(`Failed to complete session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete session'
    };
  }
}

/**
 * Get questionnaire session
 */
export async function getQuestionnaireSession(
  sessionId: string
): Promise<ActionResult<QuestionnaireSession>> {
  try {
    await ensureStorageDir();

    const sessionPath = path.join(STORAGE_DIR, `${sessionId}.json`);
    const sessionData = await fs.readFile(sessionPath, 'utf-8');
    const session: QuestionnaireSession = JSON.parse(sessionData);

    return {
      success: true,
      data: session
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    logError(`Failed to get session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get session'
    };
  }
}

/**
 * List all questionnaire sessions
 */
export async function listQuestionnaireSessions(): Promise<ActionResult<QuestionnaireSession[]>> {
  try {
    await ensureStorageDir();

    const files = await fs.readdir(STORAGE_DIR);
    const sessions: QuestionnaireSession[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(STORAGE_DIR, file);
        const sessionData = await fs.readFile(filePath, 'utf-8');
        sessions.push(JSON.parse(sessionData));
      }
    }

    // Sort by start date (newest first)
    sessions.sort((a, b) => b.startedAt - a.startedAt);

    return {
      success: true,
      data: sessions
    };
  } catch (error) {
    logError(`Failed to list sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list sessions'
    };
  }
}

/**
 * Export session to markdown format for documentation
 */
export async function exportSessionToMarkdown(
  sessionId: string
): Promise<ActionResult<string>> {
  try {
    const result = await getQuestionnaireSession(sessionId);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Session not found'
      };
    }

    const session = result.data;

    let markdown = `# 7-Levels Deep Onboarding Discovery\n\n`;
    markdown += `**Respondent:** ${session.respondent}\n`;
    markdown += `**Session ID:** ${session.sessionId}\n`;
    markdown += `**Started:** ${new Date(session.startedAt).toLocaleString()}\n`;
    if (session.completedAt) {
      markdown += `**Completed:** ${new Date(session.completedAt).toLocaleString()}\n`;
    }
    if (session.resolutionCategory) {
      markdown += `**Resolution Category:** ${session.resolutionCategory}\n`;
    }
    markdown += `\n---\n\n`;

    // Group responses by section
    const bySectionMap = new Map<string, QuestionnaireResponse[]>();
    session.responses.forEach(r => {
      if (!bySectionMap.has(r.sectionId)) {
        bySectionMap.set(r.sectionId, []);
      }
      bySectionMap.get(r.sectionId)!.push(r);
    });

    // Sort responses within each section by level
    bySectionMap.forEach(responses => {
      responses.sort((a, b) => a.level - b.level);
    });

    // Output each section
    for (const [sectionId, responses] of bySectionMap.entries()) {
      markdown += `## ${sectionId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}\n\n`;

      responses.forEach(response => {
        markdown += `### Level ${response.level}\n\n`;
        markdown += `**Q:** ${response.question}\n\n`;
        markdown += `**A:** ${response.answer}\n\n`;
        markdown += `---\n\n`;
      });
    }

    if (session.notes) {
      markdown += `## Notes\n\n${session.notes}\n\n`;
    }

    return {
      success: true,
      data: markdown
    };
  } catch (error) {
    logError(`Failed to export session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export session'
    };
  }
}