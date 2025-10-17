'use server';

/**
 * Server actions for fetching and managing Intercom conversations
 * Uses existing cache infrastructure from @/services/intercom
 */

import type { IntercomConversation, ConversationThread, ActionResult } from '@/types';
import { getIntercomCache, refreshIntercomCache } from '@/services/intercom';

interface ConversationFilters {
  state?: 'open' | 'closed' | 'snoozed' | 'all';
  priority?: 'priority' | 'not_priority' | 'all';
  assignedTo?: string;
  tag?: string;
  search?: string;
}

interface ConversationStats {
  total: number;
  open: number;
  closed: number;
  snoozed: number;
  priority: number;
  byDay: { date: string; count: number; }[];
  byState: { state: string; count: number; }[];
}

/**
 * Fetch all conversations from the cache (with optional live refresh)
 */
export async function getAllConversations(forceRefresh: boolean = false): Promise<ActionResult<IntercomConversation[]>> {
  try {
    // Optionally force refresh the cache
    if (forceRefresh) {
      await refreshIntercomCache();
    }

    // Get conversations from cache (this will wait if cache is initializing)
    const cache = await getIntercomCache();
    const conversations = cache.conversations as IntercomConversation[];

    return {
      success: true,
      data: conversations
    };
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate conversation statistics for charts
 */
export async function getConversationStats(): Promise<ActionResult<ConversationStats>> {
  const result = await getAllConversations();

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || 'Failed to fetch conversations',
    };
  }

  const conversations = result.data;

  // Calculate stats
  const stats: ConversationStats = {
    total: conversations.length,
    open: conversations.filter(c => c.state === 'open').length,
    closed: conversations.filter(c => c.state === 'closed').length,
    snoozed: conversations.filter(c => c.state === 'snoozed').length,
    priority: conversations.filter(c => 'priority' in c && c.priority === 'priority').length,
    byDay: [],
    byState: [
      { state: 'open', count: 0 },
      { state: 'closed', count: 0 },
      { state: 'snoozed', count: 0 },
    ],
  };

  // Group by day (last 30 days)
  const last30Days = new Map<string, number>();
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

  conversations.forEach(conv => {
    // Count by state
    const stateEntry = stats.byState.find(s => s.state === conv.state);
    if (stateEntry) stateEntry.count++;

    // Count by day (closed conversations in last 30 days)
    if (conv.state === 'closed' && conv.updated_at * 1000 > thirtyDaysAgo) {
      const date = new Date(conv.updated_at * 1000).toISOString().split('T')[0];
      last30Days.set(date, (last30Days.get(date) || 0) + 1);
    }
  });

  // Convert map to array and sort by date
  stats.byDay = Array.from(last30Days.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    success: true,
    data: stats,
  };
}

/**
 * Filter conversations based on criteria
 */
export async function filterConversations(
  filters: ConversationFilters
): Promise<ActionResult<IntercomConversation[]>> {
  const result = await getAllConversations();

  if (!result.success || !result.data) {
    return result;
  }

  let filtered = result.data;

  // Apply state filter
  if (filters.state && filters.state !== 'all') {
    filtered = filtered.filter(c => c.state === filters.state);
  }

  // Apply priority filter
  if (filters.priority && filters.priority !== 'all') {
    filtered = filtered.filter(c => c.priority === filters.priority);
  }

  // Apply search filter (search in title if available)
  if (filters.search && filters.search.trim()) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(c =>
      c.title?.toLowerCase().includes(searchTerm) ||
      c.id.toLowerCase().includes(searchTerm)
    );
  }

  // Apply assignee filter
  if (filters.assignedTo) {
    filtered = filtered.filter(c => c.admin_assignee_id === filters.assignedTo);
  }

  // Apply tag filter
  if (filters.tag) {
    filtered = filtered.filter(c =>
      c.tags?.tags.some(t => t.name === filters.tag)
    );
  }

  return {
    success: true,
    data: filtered,
    message: `Found ${filtered.length} conversations matching filters`,
  };
}

/**
 * ========================================
 * CONVERSATION THREAD ACTIONS (NEW)
 * ========================================
 *
 * Why: The cache now includes full conversation threads with notes, messages, and admin responses.
 * These actions provide access to the rich thread data without breaking existing UI that uses
 * basic conversation metadata.
 *
 * Strategy: Progressive enhancement - existing functions remain unchanged, new functions
 * provide access to detailed thread data only when needed (e.g., when user clicks a conversation).
 */

/**
 * Get full thread details for a single conversation
 *
 * Why: Frontend needs detailed thread data (notes, messages, responses) when user clicks
 * on a conversation row. Fetching on-demand keeps initial page load fast.
 *
 * @param conversationId - The Intercom conversation ID
 * @returns Full ConversationThread with notes, messages, and metadata
 */
export async function getConversationThread(
  conversationId: string
): Promise<ActionResult<ConversationThread>> {
  try {
    const cache = await getIntercomCache();

    // Find thread by conversation ID
    const thread = cache.conversationThreads.find(
      t => t.conversation_id === conversationId
    );

    if (!thread) {
      return {
        success: false,
        error: `Thread not found for conversation ${conversationId}`,
      };
    }

    return {
      success: true,
      data: thread,
    };
  } catch (error) {
    console.error('[getConversationThread] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Search threads by content (notes, admin responses, user messages)
 *
 * Why: Users need to find conversations based on what was discussed, not just IDs or states.
 * This searches the actual content of notes and messages.
 *
 * @param query - Search term to find in thread content
 * @returns Array of threads matching the query
 */
export async function searchThreadsByContent(
  query: string
): Promise<ActionResult<ConversationThread[]>> {
  try {
    if (!query || query.trim().length < 2) {
      return {
        success: false,
        error: 'Search query must be at least 2 characters',
      };
    }

    const cache = await getIntercomCache();
    const searchTerm = query.toLowerCase().trim();

    // Search in notes, admin responses, and user messages
    // Why: Notes contain internal context, responses are customer-facing,
    // user messages are the questions - all are valuable for search
    const matchingThreads = cache.conversationThreads.filter(thread => {
      // Search in notes
      const hasNoteMatch = thread.notes.some(note =>
        note.body_clean.toLowerCase().includes(searchTerm)
      );

      // Search in admin responses
      const hasResponseMatch = thread.admin_responses.some(response =>
        response.body_clean.toLowerCase().includes(searchTerm)
      );

      // Search in user messages
      const hasMessageMatch = thread.user_messages.some(message =>
        message.body_clean.toLowerCase().includes(searchTerm)
      );

      return hasNoteMatch || hasResponseMatch || hasMessageMatch;
    });

    return {
      success: true,
      data: matchingThreads,
      message: `Found ${matchingThreads.length} threads containing "${query}"`,
    };
  } catch (error) {
    console.error('[searchThreadsByContent] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get threads with notes from priority admins (Jon and Mark)
 *
 * Why: Jon and Mark's notes often contain critical context and decisions.
 * This provides quick access to conversations they've reviewed.
 *
 * @returns Threads that have notes from Jon or Mark
 */
export async function getThreadsWithPriorityNotes(): Promise<ActionResult<ConversationThread[]>> {
  try {
    const cache = await getIntercomCache();

    // Filter threads that have notes from Jon or Mark
    // Why: These admins provide strategic insight, so their notes are high priority
    const priorityThreads = cache.conversationThreads.filter(thread =>
      thread.notes.some(note => note.is_from_jon || note.is_from_mark)
    );

    // Sort by most recent first (based on thread updated_at)
    priorityThreads.sort((a, b) => b.updated_at - a.updated_at);

    return {
      success: true,
      data: priorityThreads,
      message: `Found ${priorityThreads.length} threads with priority notes`,
    };
  } catch (error) {
    console.error('[getThreadsWithPriorityNotes] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get threads that have any notes at all
 *
 * Why: Notes indicate conversations that have been reviewed by the team.
 * This helps find conversations that have internal context vs. just customer messages.
 *
 * @returns Threads with at least one note
 */
export async function getThreadsWithNotes(): Promise<ActionResult<ConversationThread[]>> {
  try {
    const cache = await getIntercomCache();

    const threadsWithNotes = cache.conversationThreads.filter(
      thread => thread.notes.length > 0
    );

    // Sort by most notes first (indicates more team involvement)
    threadsWithNotes.sort((a, b) => b.notes.length - a.notes.length);

    return {
      success: true,
      data: threadsWithNotes,
      message: `Found ${threadsWithNotes.length} threads with notes`,
    };
  } catch (error) {
    console.error('[getThreadsWithNotes] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get note metadata for all conversations (for client-side filtering)
 *
 * Why: Frontend needs to know which conversations have notes without fetching full thread data.
 * This provides a lightweight map for fast client-side filtering by note presence.
 *
 * @returns Map of conversation_id to note metadata (hasNotes, hasJonNotes, hasMarkNotes)
 */
export async function getConversationNoteMetadata(): Promise<ActionResult<Record<string, {
  hasNotes: boolean;
  hasJonNotes: boolean;
  hasMarkNotes: boolean;
}>>> {
  try {
    const cache = await getIntercomCache();

    // Build metadata map from all threads
    // Why: Client-side filtering needs quick lookup without fetching full thread data
    const metadata: Record<string, {
      hasNotes: boolean;
      hasJonNotes: boolean;
      hasMarkNotes: boolean;
    }> = {};

    cache.conversationThreads.forEach(thread => {
      metadata[thread.conversation_id] = {
        hasNotes: thread.notes.length > 0,
        hasJonNotes: thread.notes.some(note => note.is_from_jon),
        hasMarkNotes: thread.notes.some(note => note.is_from_mark),
      };
    });

    return {
      success: true,
      data: metadata,
    };
  } catch (error) {
    console.error('[getConversationNoteMetadata] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}