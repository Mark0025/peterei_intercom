'use client';

/**
 * Cache Management Client Component
 *
 * Why: Interactive cache refresh button with loading states and progress feedback.
 * Must be client component for state management and user interaction.
 *
 * Features:
 * - Manual cache refresh button
 * - Loading state with progress indicator
 * - Success/error feedback
 * - Estimated time display
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CacheManagementClient() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  /**
   * Handle cache refresh
   * Why: Manually trigger full thread cache refresh from Intercom API
   * Strategy: Call server action, show progress, handle success/error states
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshStatus('idle');
    setMessage('');

    try {
      // Call server action to refresh conversation threads
      // Why: Server action handles API calls, rate limiting, and cache updates
      const response = await fetch('/api/cache/refresh', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        setRefreshStatus('success');
        setMessage(result.message || 'Cache refreshed successfully!');

        // Auto-hide success message and reload page after 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setRefreshStatus('error');
        setMessage(result.error || 'Failed to refresh cache');
      }
    } catch (error) {
      setRefreshStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Cache Management
        </CardTitle>
        <CardDescription>
          Manually refresh conversation thread data from Intercom
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Refresh Button */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="min-w-[200px]"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing Cache...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Thread Cache
              </>
            )}
          </Button>

          {isRefreshing && (
            <span className="text-sm text-muted-foreground">
              Estimated time: 2-3 minutes
            </span>
          )}
        </div>

        {/* Status Messages */}
        {refreshStatus === 'success' && (
          <Alert className="border-green-600 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {refreshStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Refresh Info */}
        <div className="p-4 bg-muted/30 rounded-lg text-sm space-y-2">
          <p className="font-medium">What happens during refresh:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Fetches full thread details for all conversations</li>
            <li>Includes notes, admin responses, and user messages</li>
            <li>Processes in batches with rate limiting</li>
            <li>Saves updated cache to disk automatically</li>
            <li>Page will reload when complete</li>
          </ul>
        </div>

        {/* Warning */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Note</AlertTitle>
          <AlertDescription>
            This operation makes many API calls to Intercom. Only refresh when needed
            (e.g., after bulk updates in Intercom).
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
