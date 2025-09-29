'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RefreshCacheButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Call the cache refresh API endpoint
      const response = await fetch('/api/intercom/cache', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh cache');
      }

      // Refresh the page to show new data
      router.refresh();
    } catch (error) {
      console.error('Error refreshing cache:', error);
      alert('Failed to refresh cache. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      onClick={handleRefresh}
      disabled={isRefreshing}
      variant="secondary"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : 'Refresh Cache'}
    </Button>
  );
}