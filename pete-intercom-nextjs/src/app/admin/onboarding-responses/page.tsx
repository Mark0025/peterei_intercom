'use client';

/**
 * Onboarding Questionnaire Responses Viewer
 *
 * View all completed questionnaire sessions and their responses
 * Stored in: data/questionnaire-responses/*.json
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Eye, Calendar, User } from 'lucide-react';
import { listQuestionnaireSessions, exportSessionToMarkdown } from '@/actions/questionnaire';
import type { QuestionnaireSession } from '@/actions/questionnaire';

export default function OnboardingResponsesPage() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<QuestionnaireSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<QuestionnaireSession | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
    try {
      const result = await listQuestionnaireSessions();
      if (result.success && result.data) {
        setSessions(result.data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(sessionId: string) {
    const result = await exportSessionToMarkdown(sessionId);
    if (result.success && result.data) {
      const session = sessions.find(s => s.sessionId === sessionId);
      const blob = new Blob([result.data], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onboarding-discovery-${session?.respondent || 'unknown'}-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedSession) {
    // Detail view
    const groupedResponses = selectedSession.responses.reduce((acc, response) => {
      if (!acc[response.sectionId]) {
        acc[response.sectionId] = [];
      }
      acc[response.sectionId].push(response);
      return acc;
    }, {} as Record<string, typeof selectedSession.responses>);

    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Session Details
            </h1>
            <p className="text-muted-foreground mt-2">
              {selectedSession.respondent} • {new Date(selectedSession.startedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedSession(null)}>
              ← Back
            </Button>
            <Button onClick={() => handleExport(selectedSession.sessionId)}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {selectedSession.resolutionCategory && (
          <Card>
            <CardHeader>
              <CardTitle>Resolution Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-base px-4 py-2">
                {selectedSession.resolutionCategory}
              </Badge>
              {selectedSession.notes && (
                <p className="mt-4 text-sm text-muted-foreground">{selectedSession.notes}</p>
              )}
            </CardContent>
          </Card>
        )}

        {Object.entries(groupedResponses).map(([sectionId, responses]) => {
          const sortedResponses = [...responses].sort((a, b) => a.level - b.level);
          return (
            <Card key={sectionId}>
              <CardHeader>
                <CardTitle className="capitalize">
                  {sectionId.split('-').join(' ')}
                </CardTitle>
                <CardDescription>
                  {responses.length} questions answered
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sortedResponses.map((response) => (
                  <div key={response.questionId} className="border-l-4 border-purple-600 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Level {response.level}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(response.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-semibold mb-2">{response.question}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {response.answer}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // List view
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Questionnaire Responses
        </h1>
        <p className="text-muted-foreground">
          {sessions.length} sessions • Stored in data/questionnaire-responses/
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Responses Yet</CardTitle>
            <CardDescription>
              Complete the questionnaire to see responses here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/admin/onboarding-questionnaire">Start Questionnaire</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.sessionId} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {session.respondent}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(session.startedAt).toLocaleString()}
                      {session.completedAt && (
                        <Badge variant="secondary" className="ml-2">
                          Completed
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  {session.resolutionCategory && (
                    <Badge variant="outline">{session.resolutionCategory}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {session.responses.length} questions answered
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSession(session)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(session.sessionId)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-slate-50 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-sm">Storage Location</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-xs bg-white dark:bg-black px-2 py-1 rounded">
            {process.cwd()}/data/questionnaire-responses/*.json
          </code>
          <p className="text-xs text-muted-foreground mt-2">
            Responses are stored as JSON files and can be version controlled with Git
          </p>
        </CardContent>
      </Card>
    </div>
  );
}