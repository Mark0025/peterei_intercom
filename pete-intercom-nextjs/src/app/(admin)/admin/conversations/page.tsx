import { getAllConversations, getConversationStats } from '@/actions/conversations';
import ConversationsPageClient from '@/components/conversations/ConversationsPageClient';
import ConversationInsightsChat from '@/components/conversations/ConversationInsightsChat';
import RefreshCacheButton from '@/components/conversations/RefreshCacheButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Next.js 15: Opt into dynamic rendering for this page
// This ensures we always fetch fresh data from the cache
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable static generation

export default async function ConversationsPage() {
  // Fetch conversations and stats from cache
  // Using Promise.all for parallel fetching (Next.js best practice)
  const [conversationsResult, statsResult] = await Promise.all([
    getAllConversations(false), // Use cache by default for performance
    getConversationStats(),
  ]);

  // Handle errors
  if (!conversationsResult.success || !statsResult.success) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Conversation Analytics</h1>
            <p className="text-muted-foreground mt-1">
              View and analyze all Intercom conversations
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {conversationsResult.error || statsResult.error || 'Failed to load conversation data'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const conversations = conversationsResult.data || [];
  const stats = statsResult.data!;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-6 pt-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conversation Analytics</h1>
          <p className="text-muted-foreground mt-1">
            View trends, filter conversations, and analyze ticket data
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshCacheButton />
          <Link href="/">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* AI Conversation Insights - Moved to top for immediate visibility */}
      <div className="px-6 pb-6">
        <ConversationInsightsChat totalConversations={stats.total} />
      </div>

      {/* Client Component with Global Filters */}
      <ConversationsPageClient conversations={conversations} stats={stats} />

      {/* Additional Info */}
      <div className="px-6 pb-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💡 Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • You have <strong className="text-foreground">{stats.open}</strong> open conversations requiring attention
            </p>
            {stats.priority > 0 && (
              <p>
                • <strong className="text-foreground">{stats.priority}</strong> priority conversations need immediate action
              </p>
            )}
            <p>
              • <strong className="text-foreground">{stats.closed}</strong> conversations have been successfully closed
            </p>
            {stats.snoozed > 0 && (
              <p>
                • <strong className="text-foreground">{stats.snoozed}</strong> conversations are currently snoozed
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}