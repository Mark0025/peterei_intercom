import { useMemo } from 'react';
import type { IntercomConversation } from '@/types';

interface ConversationStats {
  total: number;
  open: number;
  closed: number;
  snoozed: number;
  priority: number;
  byDay: { date: string; count: number }[];
  byState: { state: string; count: number }[];
}

/**
 * Calculate conversation statistics from filtered conversations
 * Updates dynamically when filters change
 */
export function useFilteredStats(conversations: IntercomConversation[]): ConversationStats {
  return useMemo(() => {
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

    return stats;
  }, [conversations]);
}