import type { ConversationThread } from '@/types';
import { proxyIntercomGet } from './intercom';
import { cleanConversationMessage } from '../utils/html-cleaner';
import { logInfo, logError } from './logger';

const JON_ADMIN_ID = '6614158';
const MARK_EMAIL = 'mark@peterei.com';

interface ConversationDetail {
  id: string;
  type: string;
  created_at: number;
  updated_at: number;
  state: 'open' | 'closed' | 'snoozed';
  conversation_parts?: {
    conversation_parts: Array<{
      type: string;
      id: string;
      part_type: string;
      body: string | null;
      created_at: number;
      author?: {
        type: string;
        id: string;
        name?: string;
        email?: string;
      };
    }>;
  };
  source?: {
    type: string;
    body?: string;
    author?: {
      type: string;
      id: string;
      name?: string;
      email?: string;
    };
  };
  contacts?: {
    contacts: Array<{
      id: string;
      name?: string;
      email?: string;
    }>;
  };
  admin_assignee_id?: number;
}

/**
 * Fetch full conversation details from Intercom API
 */
export async function fetchConversationDetails(conversationId: string): Promise<ConversationDetail | null> {
  try {
    const response = await proxyIntercomGet(`/conversations/${conversationId}`) as unknown;
    return response as ConversationDetail;
  } catch (error) {
    logError(`Failed to fetch conversation ${conversationId}: ${error instanceof Error ? error.message : error}`, 'api.log');
    return null;
  }
}

/**
 * Build a complete conversation thread from conversation details
 */
export function buildConversationThread(conversation: ConversationDetail): ConversationThread {
  // Extract user info from source or contacts
  const sourceAuthor = conversation.source?.author;
  const contact = conversation.contacts?.contacts?.[0];

  const user = {
    id: sourceAuthor?.id || contact?.id || 'unknown',
    name: sourceAuthor?.name || contact?.name,
    email: sourceAuthor?.email || contact?.email
  };

  // Process initial message
  const initial_message = {
    body_html: conversation.source?.body,
    body_clean: cleanConversationMessage(conversation.source?.body || ''),
    created_at: conversation.created_at,
    author: conversation.source?.author
  };

  // Process all conversation parts
  const parts = (conversation.conversation_parts?.conversation_parts || []).map(part => ({
    id: part.id,
    type: part.part_type,
    body_html: part.body || null,
    body_clean: part.body ? cleanConversationMessage(part.body) : null,
    created_at: part.created_at,
    author_type: part.author?.type,
    author_id: part.author?.id,
    author_name: part.author?.name,
    author_email: part.author?.email
  }));

  // Extract notes (part_type === 'note')
  const notes = (conversation.conversation_parts?.conversation_parts || [])
    .filter(p => p.part_type === 'note')
    .map(note => ({
      id: note.id,
      body_html: note.body || undefined,
      body_clean: cleanConversationMessage(note.body || ''),
      created_at: note.created_at,
      author_id: note.author?.id || '',
      author_name: note.author?.name || '',
      is_from_jon: note.author?.id === JON_ADMIN_ID,
      is_from_mark: note.author?.email === MARK_EMAIL
    }));

  // Extract admin responses (part_type === 'comment' && author.type === 'admin')
  const admin_responses = (conversation.conversation_parts?.conversation_parts || [])
    .filter(p => p.part_type === 'comment' && p.author?.type === 'admin')
    .map(msg => ({
      id: msg.id,
      body_html: msg.body || undefined,
      body_clean: cleanConversationMessage(msg.body || ''),
      created_at: msg.created_at,
      author_id: msg.author?.id || '',
      author_name: msg.author?.name || '',
      is_from_jon: msg.author?.id === JON_ADMIN_ID,
      is_from_mark: msg.author?.email === MARK_EMAIL
    }));

  // Extract user messages (part_type === 'comment' && author.type === 'user')
  const user_messages = (conversation.conversation_parts?.conversation_parts || [])
    .filter(p => p.part_type === 'comment' && p.author?.type === 'user')
    .map(msg => ({
      id: msg.id,
      body_html: msg.body || undefined,
      body_clean: cleanConversationMessage(msg.body || ''),
      created_at: msg.created_at,
      author_id: msg.author?.id,
      author_name: msg.author?.name
    }));

  // Count totals
  const allParts = conversation.conversation_parts?.conversation_parts || [];
  const total_comments = allParts.filter(p => p.part_type === 'comment').length;
  const total_notes = allParts.filter(p => p.part_type === 'note').length;

  return {
    conversation_id: conversation.id,
    state: conversation.state,
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,
    user,
    initial_message,
    parts,
    notes,
    admin_responses,
    user_messages,
    admin_assignee_id: conversation.admin_assignee_id,
    total_parts: allParts.length,
    total_comments,
    total_notes
  };
}

/**
 * Build threads for an array of conversation IDs
 * Processes in batches to avoid overwhelming the API
 */
export async function buildThreadsForConversations(
  conversationIds: string[],
  batchSize: number = 10,
  delayMs: number = 1000
): Promise<ConversationThread[]> {
  const threads: ConversationThread[] = [];
  const totalBatches = Math.ceil(conversationIds.length / batchSize);

  logInfo(`[THREADS] Building threads for ${conversationIds.length} conversations in ${totalBatches} batches...`, 'api.log');

  for (let i = 0; i < conversationIds.length; i += batchSize) {
    const batch = conversationIds.slice(i, i + batchSize);
    const currentBatch = Math.floor(i / batchSize) + 1;

    logInfo(`[THREADS] Processing batch ${currentBatch}/${totalBatches}...`, 'api.log');

    const results = await Promise.all(
      batch.map(id => fetchConversationDetails(id))
    );

    for (const detail of results) {
      if (!detail) continue;

      const thread = buildConversationThread(detail);
      threads.push(thread);
    }

    // Rate limit protection
    if (i + batchSize < conversationIds.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  logInfo(`[THREADS] Built ${threads.length} threads successfully`, 'api.log');
  return threads;
}
