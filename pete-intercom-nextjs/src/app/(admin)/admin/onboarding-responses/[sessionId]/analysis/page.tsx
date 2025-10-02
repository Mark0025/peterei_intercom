import { analyzeQuestionnaireSession } from '@/actions/questionnaire-analysis';
import { AnalysisDisplay } from '@/components/onboarding/AnalysisDisplay';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface AnalysisPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const { sessionId } = await params;

  // Run analysis
  const result = await analyzeQuestionnaireSession(sessionId);

  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto p-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Analysis Failed</CardTitle>
            <CardDescription>
              Could not analyze session: {result.error || 'Unknown error'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/onboarding-responses"
              className="text-primary hover:underline inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sessions
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { session, metadata } = result.data;

  return (
    <div className="container mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Link
          href="/admin/onboarding-responses"
          className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sessions
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Onboarding Analysis
            </h1>
            <p className="text-muted-foreground mt-2">
              Session {session.sessionId} • {session.responses.length} responses
            </p>
          </div>

          <div className="flex gap-2">
            <Badge variant="outline" className="text-sm">
              {session.resolutionCategory}
            </Badge>
            <Badge
              variant={metadata.dataQualityScore >= 80 ? 'default' : 'secondary'}
              className="text-sm"
            >
              Quality: {metadata.dataQualityScore}%
            </Badge>
            <Badge
              variant={metadata.confidenceScore >= 70 ? 'default' : 'secondary'}
              className="text-sm"
            >
              Confidence: {metadata.confidenceScore}%
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Analysis Display */}
      <AnalysisDisplay analysis={result.data} />
    </div>
  );
}