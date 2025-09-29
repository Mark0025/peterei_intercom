'use server';

/**
 * Server actions for fetching and managing Intercom conversations
 * Uses existing cache infrastructure from @/services/intercom
 */

import type { IntercomConversation, ActionResult } from '@/types';
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
      data: conversations,
      message: `Fetched ${conversations.length} conversations from ${forceRefresh ? 'live API' : 'cache'}`,
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
    priority: conversations.filter(c => c.priority === 'priority').length,
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