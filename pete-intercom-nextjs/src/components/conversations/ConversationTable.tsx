'use client';

/**
 * Conversation Table Component
 *
 * Why: Displays Intercom conversations in a sortable, filterable table.
 * Now enhanced with expandable rows to show full thread details on click.
 *
 * Strategy: Non-breaking enhancement
 * - Existing: Basic table with conversation metadata
 * - New: Click row → fetch thread details → show in expanded panel
 * - Performance: Thread data fetched on-demand, not all at once
 */

import React, { useMemo, useState } from 'react';
import type { IntercomConversation, ConversationThread } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import ThreadDetailsPanel from './ThreadDetailsPanel';
import { getConversationThread } from '@/actions/conversations';

interface ConversationTableProps {
  conversations: IntercomConversation[];
}

export default function ConversationTable({ conversations }: ConversationTableProps) {
  // ========================================
  // STATE: Expandable Row Functionality
  // ========================================
  // Why: Track which rows are expanded and their thread data
  // Strategy: Allow multiple rows to be expanded at once
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  const [threadDataMap, setThreadDataMap] = useState<Map<string, ConversationThread>>(new Map());
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);

  // Sort conversations by date (most recent first)
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => b.updated_at - a.updated_at);
  }, [conversations]);

  /**
   * Handle row click - toggle expansion and fetch thread data
   *
   * Why: On-demand loading keeps initial page fast. Only fetch thread
   * details when user explicitly asks for them by clicking a row.
   * Now supports multiple rows expanded at once.
   */
  const handleRowClick = async (conversationId: string) => {
    // If clicking an already-expanded row, collapse it
    if (expandedRowIds.has(conversationId)) {
      setExpandedRowIds(prev => {
        const next = new Set(prev);
        next.delete(conversationId);
        return next;
      });
      setThreadDataMap(prev => {
        const next = new Map(prev);
        next.delete(conversationId);
        return next;
      });
      return;
    }

    // Expand new row and fetch its thread data
    setExpandedRowIds(prev => new Set(prev).add(conversationId));
    setLoadingThreadId(conversationId);

    try {
      const result = await getConversationThread(conversationId);

      if (result.success && result.data) {
        setThreadDataMap(prev => new Map(prev).set(conversationId, result.data));
      } else {
        console.error('Failed to load thread:', result.error);
        // Keep row expanded but show error state
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
    } finally {
      setLoadingThreadId(null);
    }
  };

  // Format timestamp
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = Date.now();
    const diff = now - date.getTime();

    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      if (hours === 0) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m ago`;
      }
      return `${hours}h ago`;
    }

    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }

    // Otherwise show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get state badge variant
  const getStateBadge = (state: string) => {
    switch (state) {
      case 'open':
        return <Badge variant="default" className="bg-yellow-500">{state}</Badge>;
      case 'closed':
        return <Badge variant="default" className="bg-green-600">{state}</Badge>;
      case 'snoozed':
        return <Badge variant="secondary">{state}</Badge>;
      default:
        return <Badge variant="outline">{state}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          💬 Conversation Details
        </CardTitle>
        <CardDescription>
          {sortedConversations.length} conversations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedConversations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No conversations found
                  </TableCell>
                </TableRow>
              ) : (
                sortedConversations.map((conv, index) => {
                  const topic = conv.custom_attributes?.topic || conv.custom_attributes?.Topic;

                  // Get user name from contacts or source author
                  const userName = conv.contacts?.contacts?.[0]?.name ||
                                  conv.contacts?.contacts?.[0]?.email ||
                                  conv.source?.author?.name ||
                                  conv.source?.author?.email;

                  const isExpanded = expandedRowIds.has(conv.id);
                  const isLoading = loadingThreadId === conv.id;

                  return (
                    <React.Fragment key={`${conv.id}-${index}`}>
                      {/* Main conversation row - Why: Existing data unchanged, just adding click handler */}
                      <TableRow
                        onClick={() => handleRowClick(conv.id)}
                        className="hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        {/* Expand/Collapse Icon - Why: Visual indicator that row is clickable/expandable */}
                        <TableCell className="w-8">
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>

                        <TableCell className="font-mono text-xs">{conv.id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {conv.title || conv.source?.subject || 'Untitled Conversation'}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {userName ? (
                          <span className="text-sm">{userName}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {topic ? (
                          <Badge variant="outline" className="bg-purple-50">{topic}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">No topic</span>
                        )}
                      </TableCell>
                      <TableCell>{getStateBadge(conv.state)}</TableCell>
                      <TableCell>
                        {conv.priority === 'priority' ? (
                          <Badge variant="destructive">Priority</Badge>
                        ) : (
                          <Badge variant="outline">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap max-w-xs">
                          {conv.tags?.tags.slice(0, 2).map((tag, tagIndex) => (
                            <Badge key={`${conv.id}-${tag.id}-${tagIndex}`} variant="secondary" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                          {conv.tags && conv.tags.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{conv.tags.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(conv.updated_at)}
                      </TableCell>
                    </TableRow>

                    {/* Expanded thread details row - Why: Progressive disclosure keeps UI clean */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={9} className="p-0 border-t-0">
                          {loadingThreadId === conv.id ? (
                            <div className="flex items-center justify-center p-8 bg-muted/30">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              <span className="ml-2 text-muted-foreground">Loading thread details...</span>
                            </div>
                          ) : threadDataMap.get(conv.id) ? (
                            <ThreadDetailsPanel thread={threadDataMap.get(conv.id)!} />
                          ) : (
                            <div className="p-4 text-center text-muted-foreground bg-muted/30">
                              Failed to load thread details. Please try again.
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}