'use client';

import { useState } from 'react';
import type { IntercomConversation } from '@/types';
import { useFilteredStats } from '@/hooks/useFilteredStats';
import GlobalFilterBar from './GlobalFilterBar';
import KPIScoreCards from './KPIScoreCards';
import ConversationCharts from './ConversationCharts';
import ConversationTable from './ConversationTable';

interface ConversationStats {
  total: number;
  open: number;
  closed: number;
  snoozed: number;
  priority: number;
  byDay: { date: string; count: number }[];
  byState: { state: string; count: number }[];
}

interface ConversationsPageClientProps {
  conversations: IntercomConversation[];
  stats: ConversationStats;
}

export default function ConversationsPageClient({ conversations, stats }: ConversationsPageClientProps) {
  const [filteredConversations, setFilteredConversations] = useState<IntercomConversation[]>(conversations);

  // Calculate stats dynamically from filtered conversations
  const filteredStats = useFilteredStats(filteredConversations);

  return (
    <>
      {/* Global Filter Bar - Cascades to all sections below */}
      <GlobalFilterBar
        conversations={conversations}
        onFilterChange={setFilteredConversations}
      />

      <div className="space-y-6 px-6">
        {/* KPI Scorecards - Use filtered data */}
        <KPIScoreCards conversations={filteredConversations} />

        {/* Charts Section - Use dynamically calculated filtered stats */}
        <ConversationCharts stats={filteredStats} />

        {/* Table Section - Use filtered data */}
        <ConversationTable conversations={filteredConversations} />
      </div>
    </>
  );
}