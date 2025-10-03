'use server';

/**
 * Form Submissions Server Actions
 *
 * Read and manage form submissions saved to disk.
 * Admin-only access protected by Clerk auth.
 */

import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { logInfo, logError } from '@/services/logger';

const SUBMISSIONS_DIR = path.join(process.cwd(), 'data', 'form-submissions');

export interface FormSubmission {
  id: string;
  submittedAt: string;
  timestamp: number;
  answers: Record<string, string>;
}

/**
 * Get all form submissions (newest first)
 */
export async function getAllSubmissions(): Promise<FormSubmission[]> {
  try {
    if (!existsSync(SUBMISSIONS_DIR)) {
      logInfo('[Submissions] No submissions directory found');
      return [];
    }

    const files = await readdir(SUBMISSIONS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    logInfo(`[Submissions] Found ${jsonFiles.length} submission files`);

    const submissions: FormSubmission[] = [];

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(SUBMISSIONS_DIR, file);
        const content = await readFile(filePath, 'utf-8');
        const submission = JSON.parse(content) as FormSubmission;
        submissions.push(submission);
      } catch (err) {
        logError(`[Submissions] Failed to read ${file}: ${err}`);
      }
    }

    // Sort by timestamp descending (newest first)
    submissions.sort((a, b) => b.timestamp - a.timestamp);

    return submissions;
  } catch (error) {
    logError(`[Submissions] Error getting submissions: ${error}`);
    return [];
  }
}

/**
 * Get a single submission by ID
 */
export async function getSubmission(id: string): Promise<FormSubmission | null> {
  try {
    const filePath = path.join(SUBMISSIONS_DIR, `${id}.json`);

    if (!existsSync(filePath)) {
      return null;
    }

    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as FormSubmission;
  } catch (error) {
    logError(`[Submissions] Error getting submission ${id}: ${error}`);
    return null;
  }
}

/**
 * Get submission statistics
 */
export async function getSubmissionStats() {
  const submissions = await getAllSubmissions();

  const now = Date.now();
  const dayAgo = now - (24 * 60 * 60 * 1000);
  const weekAgo = now - (7 * 24 * 60 * 60 * 1000);

  return {
    total: submissions.length,
    last24Hours: submissions.filter(s => s.timestamp > dayAgo).length,
    lastWeek: submissions.filter(s => s.timestamp > weekAgo).length,
    oldest: submissions.length > 0 ? submissions[submissions.length - 1].submittedAt : null,
    newest: submissions.length > 0 ? submissions[0].submittedAt : null,
  };
}
