/**
 * ThreadDetailsPanel Component
 *
 * Why: Displays full conversation thread details (notes, messages, responses)
 * when user clicks on a conversation row.
 *
 * Strategy: Progressive disclosure - user sees basic conversation list first,
 * then can drill down into threads on demand. This keeps the UI clean and
 * performance high (not rendering 1,068 threads at once).
 *
 * Features:
 * - Collapsible sections for notes, admin responses, user messages
 * - Priority badges for Jon/Mark notes
 * - Chronological timeline of conversation flow
 * - HTML-cleaned text for readability
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ConversationThread } from '@/types';
import { ChevronDown, MessageCircle, StickyNote, User } from 'lucide-react';
import { useState } from 'react';

interface ThreadDetailsPanelProps {
  thread: ConversationThread;
}

/**
 * Format timestamp to readable date
 * Why: Intercom uses Unix timestamps (seconds), we need human-readable dates
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get priority badge for note authors
 * Why: Jon and Mark's notes are high priority - make them visually distinct
 */
function getPriorityBadge(isFromJon: boolean, isFromMark: boolean) {
  if (isFromJon) {
    return <Badge variant="default" className="bg-purple-600">Jon (Priority)</Badge>;
  }
  if (isFromMark) {
    return <Badge variant="default" className="bg-blue-600">Mark (Priority)</Badge>;
  }
  return null;
}

export default function ThreadDetailsPanel({ thread }: ThreadDetailsPanelProps) {
  // Track which sections are open
  // Why: User may only care about notes, so let them collapse other sections
  const [openSections, setOpenSections] = useState({
    notes: true, // Open by default - usually most valuable
    adminResponses: false,
    userMessages: false,
  });

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      {/* Thread Overview Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Conversation ID: <span className="font-mono">{thread.conversation_id}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            User: <strong>{thread.user.name || thread.user.email || 'Unknown'}</strong>
          </p>
        </div>
        <div className="text-right">
          <Badge variant="outline">{thread.state}</Badge>
          <p className="text-xs text-muted-foreground mt-1">
            {thread.total_parts} total parts
          </p>
        </div>
      </div>

      {/* Initial Message */}
      {thread.initial_message.body_clean && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Initial Message
            </CardTitle>
            <CardDescription>
              {formatDate(thread.initial_message.created_at)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{thread.initial_message.body_clean}</p>
          </CardContent>
        </Card>
      )}

      {/* Notes Section - Why: Internal team context, most valuable for support analysis */}
      {thread.notes.length > 0 && (
        <Collapsible
          open={openSections.notes}
          onOpenChange={(open) => setOpenSections({ ...openSections, notes: open })}
        >
          <Card>
            <CardHeader className="pb-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-muted/50 rounded-md transition-colors">
                <CardTitle className="text-base flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Internal Notes ({thread.notes.length})
                </CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.notes ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CardDescription>
                Team notes and context (not visible to customers)
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-3">
                    {thread.notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 bg-background rounded-md border space-y-2"
                      >
                        {/* Author with priority badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <strong className="text-sm">{note.author_name}</strong>
                            {getPriorityBadge(note.is_from_jon, note.is_from_mark)}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(note.created_at)}
                          </span>
                        </div>

                        {/* Note content - Why: HTML cleaned for readability */}
                        <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                          {note.body_clean}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Admin Responses - Why: Customer-facing responses from support team */}
      {thread.admin_responses.length > 0 && (
        <Collapsible
          open={openSections.adminResponses}
          onOpenChange={(open) => setOpenSections({ ...openSections, adminResponses: open })}
        >
          <Card>
            <CardHeader className="pb-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-muted/50 rounded-md transition-colors">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Admin Responses ({thread.admin_responses.length})
                </CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.adminResponses ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CardDescription>
                Responses sent to the customer
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-3">
                    {thread.admin_responses.map((response) => (
                      <div
                        key={response.id}
                        className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-900 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <strong className="text-sm">{response.author_name}</strong>
                            {getPriorityBadge(response.is_from_jon, response.is_from_mark)}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(response.created_at)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {response.body_clean}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* User Messages - Why: Customer's questions and follow-ups */}
      {thread.user_messages.length > 0 && (
        <Collapsible
          open={openSections.userMessages}
          onOpenChange={(open) => setOpenSections({ ...openSections, userMessages: open })}
        >
          <Card>
            <CardHeader className="pb-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-muted/50 rounded-md transition-colors">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  User Messages ({thread.user_messages.length})
                </CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.userMessages ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CardDescription>
                Messages from the customer
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-3">
                    {thread.user_messages.map((message) => (
                      <div
                        key={message.id}
                        className="p-3 bg-background rounded-md border space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-sm">
                            {message.author_name || 'Customer'}
                          </strong>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                          {message.body_clean}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Summary Stats - Why: Quick overview of conversation activity */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-muted-foreground">Notes</p>
              <p className="text-2xl font-bold">{thread.total_notes}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Comments</p>
              <p className="text-2xl font-bold">{thread.total_comments}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Parts</p>
              <p className="text-2xl font-bold">{thread.total_parts}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
