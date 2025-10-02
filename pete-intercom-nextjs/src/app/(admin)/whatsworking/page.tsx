import { getWhatsWorkingData } from '@/actions/documentation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  FileText,
  Folder,
  CheckCircle2,
  Clock,
  FileCode,
  Calendar,
  TrendingUp,
  ExternalLink
} from 'lucide-react';

export default async function WhatsWorkingPage() {
  const data = await getWhatsWorkingData();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getIssueNumber = (filename: string) => {
    const match = filename.match(/^(\d{3})-/);
    return match ? `#${parseInt(match[1])}` : '';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-white">
            ✅ What's Working: Pete Intercom Next.js App
          </CardTitle>
          <CardDescription className="text-white/90 text-lg">
            Real-time status of our migration progress and documentation
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Migration Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Migration Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{data.migrationProgress}%</span>
              <Badge variant="default" className="text-sm">Express → Next.js 15</Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${data.migrationProgress}%` }}
              />
            </div>
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{data.completedIssues.length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{data.inProgressWork.length}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{data.architectureDocs.length}</div>
                <div className="text-sm text-muted-foreground">Architecture</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{data.planningDocs.length}</div>
                <div className="text-sm text-muted-foreground">Planning</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/docs">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Folder className="h-5 w-5 text-blue-500" />
                Browse All Docs
              </CardTitle>
              <CardDescription>
                Full DEV_MAN documentation browser with Mermaid diagrams
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/docs?path=completed">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Completed Work
              </CardTitle>
              <CardDescription>
                {data.completedIssues.length} documented completed issues
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/health">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                System Health
              </CardTitle>
              <CardDescription>
                Live monitoring and endpoint status
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Recently Completed Issues */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Recently Completed Issues
            </CardTitle>
            <Link href="/admin/docs?path=completed">
              <Button variant="outline" size="sm">
                View All <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <CardDescription>
            Latest completed work with full documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.completedIssues.slice(-5).reverse().map((doc) => (
              <Link
                key={doc.path}
                href={`/admin/docs?path=${encodeURIComponent(doc.path)}`}
                className="block"
              >
                <div className="flex items-start justify-between p-4 hover:bg-muted rounded-lg transition-colors border">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">
                          {doc.name.replace(/^\d{3}-/, '').replace(/\.md$/, '').replace(/-/g, ' ')}
                        </span>
                        {getIssueNumber(doc.name) && (
                          <Badge variant="secondary" className="text-xs">
                            {getIssueNumber(doc.name)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(doc.modified)}
                        </span>
                        <span>{formatSize(doc.size)}</span>
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Architecture Documentation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-purple-500" />
              Architecture & Design
            </CardTitle>
            <Link href="/admin/docs">
              <Button variant="outline" size="sm">
                Browse All <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <CardDescription>
            System architecture and technical design documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.architectureDocs.slice(0, 6).map((doc) => (
              <Link
                key={doc.path}
                href={`/admin/docs?path=${encodeURIComponent(doc.path)}`}
                className="block"
              >
                <div className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors border">
                  <FileCode className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {doc.name.replace(/\.md$/, '')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatSize(doc.size)}
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Planning & Future Work */}
      {data.planningDocs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Planning & Future Work
            </CardTitle>
            <CardDescription>
              Upcoming features and planned improvements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.planningDocs.slice(0, 5).map((doc) => (
                <Link
                  key={doc.path}
                  href={`/admin/docs?path=${encodeURIComponent(doc.path)}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors border">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="font-medium text-sm">
                        {doc.name.replace(/\.md$/, '').replace(/-/g, ' ')}
                      </span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer Stats */}
      <Card className="bg-muted">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Total Documentation Files: <strong>{data.totalFiles}</strong></span>
              <span>•</span>
              <span>Last Updated: {formatDate(data.lastUpdated)}</span>
            </div>
            <Link href="/admin/docs">
              <Button variant="link" size="sm">
                View Full Documentation Browser →
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
