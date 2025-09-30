'use client';

/**
 * Onboarding Insights Dashboard
 *
 * Analyzes all cached conversations to extract onboarding patterns
 * and generate visual insights for building the 7-levels deep questionnaire
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, MessageSquare, Filter } from 'lucide-react';
import { analyzeOnboardingConversations, generateOnboardingMermaid } from '@/actions/onboarding-analysis';
import type { OnboardingAnalysisResult, OnboardingInsight } from '@/actions/onboarding-analysis';
import { MermaidDiagram } from '@/components/mermaid-diagram';

export default function OnboardingInsightsPage() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<OnboardingAnalysisResult | null>(null);
  const [mermaidDiagram, setMermaidDiagram] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [generatingDiagram, setGeneratingDiagram] = useState(false);

  useEffect(() => {
    loadAnalysis();
  }, []);

  async function loadAnalysis() {
    setLoading(true);
    try {
      const [analysisResult, mermaidResult] = await Promise.all([
        analyzeOnboardingConversations(),
        generateOnboardingMermaid()
      ]);

      if (analysisResult.success && analysisResult.data) {
        setAnalysis(analysisResult.data);
      }

      if (mermaidResult.success && mermaidResult.data) {
        setMermaidDiagram(mermaidResult.data);
      }
    } finally {
      setLoading(false);
    }
  }

  // Generate topic-specific diagram when topic changes
  useEffect(() => {
    if (analysis && selectedTopic !== 'all') {
      generateTopicDiagram(selectedTopic);
    } else if (mermaidDiagram && selectedTopic === 'all') {
      // Keep original diagram for 'all'
    }
  }, [selectedTopic]);

  async function generateTopicDiagram(topic: string) {
    if (!analysis) return;

    setGeneratingDiagram(true);
    try {
      // Get insights for this topic
      const topicInsights = analysis.insights.filter(i => i.topic === topic);
      const topicCount = topicInsights.length;

      // Generate focused diagram for this topic
      let diagram = 'graph TD\n';
      diagram += `    Start[Customer Starts Onboarding] --> Topic[${topic}<br/>${topicCount} conversations]\n`;

      // Extract common keywords for this topic
      const keywordCounts: Record<string, number> = {};
      topicInsights.forEach(insight => {
        insight.matchedTerms.forEach(term => {
          keywordCounts[term] = (keywordCounts[term] || 0) + 1;
        });
      });

      // Add top keywords as sub-nodes
      const topKeywords = Object.entries(keywordCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      topKeywords.forEach(([keyword, count], index) => {
        const nodeId = `KW${index}`;
        diagram += `    Topic --> ${nodeId}[${keyword}<br/>${count} mentions]\n`;
      });

      diagram += `    Topic --> Complete[Complete Onboarding]\n`;

      setMermaidDiagram(diagram);
    } finally {
      setGeneratingDiagram(false);
    }
  }

  const filteredInsights = analysis?.insights.filter(insight => {
    if (selectedTopic === 'all') return true;
    return insight.topic === selectedTopic;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Onboarding Insights
        </h1>
        <p className="text-muted-foreground">
          Analysis of {analysis?.totalAnalyzed || 0} conversations to discover onboarding patterns
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis?.totalAnalyzed || 0}</div>
            <p className="text-xs text-muted-foreground">Analyzed from cache</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboarding Related</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis?.onboardingRelated || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analysis?.totalAnalyzed
                ? ((analysis.onboardingRelated / analysis.totalAnalyzed) * 100).toFixed(1)
                : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Topics Identified</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysis ? Object.keys(analysis.topicBreakdown).filter(k => analysis.topicBreakdown[k] > 0).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">Distinct categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Mermaid Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>Current Onboarding Process Flow</CardTitle>
          <CardDescription>
            Visual representation based on conversation analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generatingDiagram ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Generating diagram...</span>
            </div>
          ) : mermaidDiagram ? (
            <>
              <div className="mb-2">
                {selectedTopic !== 'all' && (
                  <Badge variant="secondary">Filtered: {selectedTopic}</Badge>
                )}
              </div>
              <MermaidDiagram chart={mermaidDiagram} className="bg-white dark:bg-slate-900 p-6 rounded-lg border" />
              <details className="mt-4">
                <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">
                  View Mermaid Source
                </summary>
                <pre className="text-xs overflow-auto bg-muted p-4 rounded-lg mt-2">
                  {mermaidDiagram}
                </pre>
              </details>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No diagram data available</p>
          )}
        </CardContent>
      </Card>

      {/* Topic Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Topic Breakdown</CardTitle>
          <CardDescription>
            Distribution of onboarding conversations by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button
              variant={selectedTopic === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTopic('all')}
              className="mr-2"
            >
              All Topics ({analysis?.onboardingRelated || 0})
            </Button>
            {analysis && Object.entries(analysis.topicBreakdown)
              .filter(([, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([topic, count]) => (
                <Button
                  key={topic}
                  variant={selectedTopic === topic ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTopic(topic)}
                  className="mr-2 mb-2"
                >
                  {topic} ({count})
                </Button>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation Insights</CardTitle>
          <CardDescription>
            {filteredInsights.length} conversations {selectedTopic !== 'all' && `in ${selectedTopic}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInsights.slice(0, 50).map((insight) => (
              <div
                key={insight.conversationId}
                className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{insight.title}</h3>
                  <Badge variant={insight.state === 'open' ? 'default' : 'secondary'}>
                    {insight.state}
                  </Badge>
                </div>

                {insight.excerpt && (
                  <p className="text-sm text-muted-foreground mb-2">{insight.excerpt}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-2">
                  {insight.topic && (
                    <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20">
                      {insight.topic}
                    </Badge>
                  )}
                  {insight.matchedTerms.slice(0, 5).map((term) => (
                    <Badge key={term} variant="outline">
                      {term}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>ID: {insight.conversationId}</span>
                  <span>
                    Created: {new Date(insight.created_at * 1000).toLocaleDateString()}
                  </span>
                  {insight.priority === 'priority' && (
                    <Badge variant="destructive" className="text-xs">
                      Priority
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredInsights.length > 50 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing first 50 of {filteredInsights.length} results
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top Keywords */}
      <Card>
        <CardHeader>
          <CardTitle>Most Common Keywords</CardTitle>
          <CardDescription>
            Terms frequently appearing in onboarding conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis && Object.entries(analysis.keywords)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 20)
              .map(([keyword, count]) => (
                <Badge key={keyword} variant="outline" className="text-sm">
                  {keyword} ({count})
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={loadAnalysis}>
          Refresh Analysis
        </Button>
        <Button onClick={() => window.location.href = '/admin/onboarding-questionnaire'}>
          Build Questionnaire →
        </Button>
      </div>
    </div>
  );
}