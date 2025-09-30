'use client';

/**
 * Main Analysis Display Component
 *
 * Displays static NLP analysis results with:
 * - Mermaid diagrams
 * - Chart.js visualizations
 * - Pain points, ideas, gaps
 * - Recommendations
 * - Conversation patterns
 */

import { useState } from 'react';
import type { CompleteAnalysisResult } from '@/types/questionnaire-analysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, DoughnutChart, LineChart } from '@/components/charts/ChartWrapper';
import { OnboardingChat } from './OnboardingChat';
import { MermaidDiagram } from '@/components/mermaid-diagram';
import {
  AlertCircle,
  Lightbulb,
  HelpCircle,
  FileText,
  TrendingUp,
  MessageSquare,
  Zap
} from 'lucide-react';

interface AnalysisDisplayProps {
  analysis: CompleteAnalysisResult;
}

export function AnalysisDisplay({ analysis }: AnalysisDisplayProps) {
  const { insights, conversationData, chartData, diagrams, recommendations } = analysis;

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Executive Summary
          </CardTitle>
          <CardDescription>
            Key findings from {analysis.session.responses.length} questionnaire responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="text-sm text-muted-foreground">Pain Points</div>
              <div className="text-3xl font-bold">{insights.painPoints.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {insights.painPoints.filter(p => p.severity === 'critical').length} critical
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="text-sm text-muted-foreground">Breakthrough Ideas</div>
              <div className="text-3xl font-bold">{insights.breakthroughIdeas.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {insights.breakthroughIdeas.filter(i => i.estimatedImpact === 'high').length} high impact
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="text-sm text-muted-foreground">Knowledge Gaps</div>
              <div className="text-3xl font-bold">{insights.knowledgeGaps.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {insights.knowledgeGaps.filter(g => g.actionable).length} actionable
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="text-sm text-muted-foreground">Conversations</div>
              <div className="text-3xl font-bold">{conversationData.onboardingRelated}</div>
              <div className="text-xs text-muted-foreground mt-1">
                onboarding-related
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="chat">💬 Ask PeteAI</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="diagrams">Process Flow</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pain Point Frequency</CardTitle>
                <CardDescription>Most mentioned issues by severity</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={{
                    labels: chartData.painPointFrequency.labels,
                    datasets: chartData.painPointFrequency.datasets
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolution Breakdown</CardTitle>
                <CardDescription>Categories of improvements needed</CardDescription>
              </CardHeader>
              <CardContent>
                <DoughnutChart
                  data={{
                    labels: chartData.resolutionBreakdown.labels,
                    datasets: chartData.resolutionBreakdown.datasets
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversation Trends</CardTitle>
                <CardDescription>Onboarding-related tickets over time</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={{
                    labels: chartData.conversationTrends.labels,
                    datasets: chartData.conversationTrends.datasets
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common Issues</CardTitle>
                <CardDescription>Frequency of specific problems</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={{
                    labels: chartData.issueComparison.labels,
                    datasets: chartData.issueComparison.datasets
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Themes */}
          <Card>
            <CardHeader>
              <CardTitle>Key Themes</CardTitle>
              <CardDescription>Recurring topics across responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {insights.themes.map((theme) => (
                  <Badge key={theme.theme} variant="secondary" className="text-sm">
                    {theme.theme} ({theme.frequency})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {/* Pain Points */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Pain Points Identified
              </CardTitle>
              <CardDescription>Issues mentioned across responses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.painPoints.slice(0, 10).map((painPoint) => (
                <div
                  key={painPoint.keyword}
                  className="border-l-4 pl-4 py-2"
                  style={{
                    borderColor:
                      painPoint.severity === 'critical' ? '#dc2626' :
                      painPoint.severity === 'major' ? '#ea580c' :
                      painPoint.severity === 'moderate' ? '#f59e0b' : '#84cc16'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        {painPoint.keyword}
                        <Badge
                          variant={painPoint.severity === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {painPoint.severity}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Mentioned {painPoint.frequency} times across {painPoint.questionIds.length} questions
                      </div>
                      {painPoint.quotes[0] && (
                        <blockquote className="mt-2 text-sm italic border-l-2 pl-3 text-muted-foreground">
                          "{painPoint.quotes[0].substring(0, 200)}{painPoint.quotes[0].length > 200 ? '...' : ''}"
                        </blockquote>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Breakthrough Ideas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Breakthrough Ideas
              </CardTitle>
              <CardDescription>Innovation opportunities mentioned</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.breakthroughIdeas.map((idea, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{idea.idea}</div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{idea.category}</Badge>
                        <Badge variant={idea.implementationComplexity === 'high' ? 'destructive' : 'secondary'}>
                          Complexity: {idea.implementationComplexity}
                        </Badge>
                        <Badge variant={idea.estimatedImpact === 'high' ? 'default' : 'secondary'}>
                          Impact: {idea.estimatedImpact}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <details className="text-sm text-muted-foreground mt-2">
                    <summary className="cursor-pointer hover:text-primary">View full quote</summary>
                    <p className="mt-2 pl-4 border-l-2">{idea.verbatim}</p>
                  </details>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Knowledge Gaps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                Knowledge Gaps ("I Don't Know" Signals)
              </CardTitle>
              <CardDescription>Areas where information is unclear</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.knowledgeGaps.map((gap, idx) => (
                <div key={idx} className="border-l-2 border-blue-500 pl-4 py-2">
                  <div className="font-medium text-sm">{gap.question}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    "{gap.answer}"
                  </div>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {gap.signal} {gap.actionable && '• actionable'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Uploaded Documents */}
          {insights.uploadedDocs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Uploaded Documents
                </CardTitle>
                <CardDescription>Files provided during questionnaire</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.uploadedDocs.map((doc, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{doc.fileName}</div>
                        <div className="text-sm text-muted-foreground mt-1">{doc.summary}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {doc.keyInsights.map((insight, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {insight}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge variant="outline">{doc.type}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Diagrams Tab */}
        <TabsContent value="diagrams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Onboarding Process Flow</CardTitle>
              <CardDescription>Mermaid diagram showing current state</CardDescription>
            </CardHeader>
            <CardContent>
              <MermaidDiagram chart={diagrams.mermaid} className="bg-white dark:bg-slate-900 p-6 rounded-lg border" />
              <details className="mt-4">
                <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">
                  View Mermaid Source
                </summary>
                <pre className="text-xs overflow-auto bg-muted p-4 rounded-lg mt-2">
                  {diagrams.mermaid}
                </pre>
              </details>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Upload Decision Tree</CardTitle>
              <CardDescription>ASCII diagram of decision flow</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto font-mono bg-muted p-4 rounded-lg">
                {diagrams.ascii}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Strategic Recommendations
              </CardTitle>
              <CardDescription>Prioritized action items based on analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.priority}
                  className="border rounded-lg p-6 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="default" className="text-lg px-3 py-1">
                          #{rec.priority}
                        </Badge>
                        <h3 className="text-xl font-semibold">{rec.title}</h3>
                      </div>
                      <p className="text-muted-foreground mt-2">{rec.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-muted-foreground">Estimated Effort</div>
                      <div className="mt-1">{rec.estimatedEffort}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Estimated Impact</div>
                      <Badge variant={rec.estimatedImpact === 'critical' ? 'destructive' : 'default'}>
                        {rec.estimatedImpact}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium text-sm">Rationale:</div>
                    <p className="text-sm text-muted-foreground">{rec.rationale}</p>
                  </div>

                  {rec.dependencies.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-medium text-sm">Dependencies:</div>
                      <div className="flex flex-wrap gap-2">
                        {rec.dependencies.map((dep, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {rec.implementationNotes && (
                    <details className="text-sm">
                      <summary className="cursor-pointer hover:text-primary font-medium">
                        Implementation Notes
                      </summary>
                      <p className="mt-2 text-muted-foreground pl-4 border-l-2">
                        {rec.implementationNotes}
                      </p>
                    </details>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Conversation Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Failure Patterns from Conversations
              </CardTitle>
              <CardDescription>
                Analysis of {conversationData.onboardingRelated} onboarding conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {conversationData.failurePatterns.map((pattern, idx) => (
                <div key={idx} className="border-l-4 border-destructive pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{pattern.pattern}</div>
                    <Badge variant="destructive">{pattern.count} occurrences</Badge>
                  </div>
                  {pattern.recommendedFix && (
                    <div className="text-sm text-muted-foreground mt-2">
                      💡 {pattern.recommendedFix}
                    </div>
                  )}
                  {pattern.examples.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Example conversations: {pattern.examples.map(e => e.conversationId).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          <OnboardingChat sessionId={analysis.session.sessionId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}