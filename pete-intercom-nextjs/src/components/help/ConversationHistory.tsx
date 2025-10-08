'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ConversationSession } from '@/types/ai-conversations';

interface ConversationHistoryProps {
  currentSessionId: string;
  onLoadSession?: (sessionId: string) => void;
}

export function ConversationHistory({ currentSessionId, onLoadSession }: ConversationHistoryProps) {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch sessions for the generic help user
      const userId = currentSessionId.startsWith('help-') ? 'help-user' : 'api-user';
      const response = await fetch(`/api/conversations/user/${userId}?agentType=langraph`);

      if (!response.ok) {
        throw new Error('Failed to load conversation history');
      }

      const data = await response.json();

      if (data.success && data.sessions) {
        // Sort by last activity (most recent first)
        const sortedSessions = data.sessions.sort(
          (a: ConversationSession, b: ConversationSession) =>
            new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        );
        setSessions(sortedSessions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
      console.error('[Conversation History] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getSessionPreview = (session: ConversationSession) => {
    // Get the first user message as preview
    const firstUserMessage = session.messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.substring(0, 60) + (firstUserMessage.content.length > 60 ? '...' : '');
    }
    return 'New conversation';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm">Conversation History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-4">
            Loading sessions...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm">Conversation History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600 text-center py-4">
            {error}
          </div>
          <Button variant="outline" size="sm" onClick={loadSessions} className="w-full mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm">Conversation History</CardTitle>
        <CardDescription className="text-xs">
          {sessions.length} saved session{sessions.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No saved conversations yet
          </div>
        )}

        {sessions.map((session) => {
          const isCurrentSession = session.sessionId === currentSessionId;

          return (
            <button
              key={session.sessionId}
              onClick={() => onLoadSession?.(session.sessionId)}
              disabled={isCurrentSession}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                isCurrentSession
                  ? 'bg-primary/10 border-primary cursor-default'
                  : 'bg-muted hover:bg-muted/80 border-border cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-xs font-medium truncate flex-1">
                  {getSessionPreview(session)}
                </span>
                {isCurrentSession && (
                  <Badge variant="default" className="text-xs">Current</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{session.messages.length} messages</span>
                <span>•</span>
                <span>{formatDate(session.lastActivity)}</span>
              </div>
              {session.messages.some(m => m.hasMermaid) && (
                <Badge variant="secondary" className="text-xs mt-1">
                  📊 Has Diagram
                </Badge>
              )}
            </button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={loadSessions}
          className="w-full mt-2"
        >
          ↻ Refresh
        </Button>
      </CardContent>
    </Card>
  );
}
