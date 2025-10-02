'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ExternalLink, Calendar } from 'lucide-react';

interface DocSummary {
  name: string;
  path: string;
  size: number;
  modified: string;
  category: string;
}

export function RecentCompletionsWidget() {
  const [completions, setCompletions] = useState<DocSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompletions() {
      try {
        const response = await fetch('/api/docs/recent');
        if (response.ok) {
          const data = await response.json();
          setCompletions(data.completions || []);
        }
      } catch (error) {
        console.error('Failed to load recent completions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCompletions();
  }, []);

  const getIssueNumber = (filename: string) => {
    const match = filename.match(/^(\d{3})-/);
    return match ? `#${parseInt(match[1])}` : '';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Recent Completions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Recent Completions
          </CardTitle>
          <Link href="/whatsworking">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              View All →
            </Badge>
          </Link>
        </div>
        <CardDescription>
          Latest completed issues with full documentation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {completions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent completions found
          </p>
        ) : (
          <div className="space-y-2">
            {completions.map((doc) => (
              <Link
                key={doc.path}
                href={`/admin/docs?path=${encodeURIComponent(doc.path)}`}
                className="block"
              >
                <div className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">
                          {doc.name.replace(/^\d{3}-/, '').replace(/\.md$/, '').replace(/-/g, ' ')}
                        </span>
                        {getIssueNumber(doc.name) && (
                          <Badge variant="secondary" className="text-xs">
                            {getIssueNumber(doc.name)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {formatDate(doc.modified)}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
