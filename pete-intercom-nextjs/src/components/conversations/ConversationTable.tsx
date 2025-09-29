'use client';

/**
 * Conversation table - displays already filtered conversations
 */

import { useMemo } from 'react';
import type { IntercomConversation } from '@/types';
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

interface ConversationTableProps {
  conversations: IntercomConversation[];
}

export default function ConversationTable({ conversations }: ConversationTableProps) {
  // Sort conversations by date (most recent first)
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => b.updated_at - a.updated_at);
  }, [conversations]);

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
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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

                  return (
                    <TableRow key={`${conv.id}-${index}`} className="hover:bg-muted/50 cursor-pointer">
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