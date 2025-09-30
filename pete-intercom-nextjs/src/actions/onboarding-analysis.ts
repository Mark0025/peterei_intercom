'use server';

/**
 * Onboarding Analysis Server Actions
 *
 * Analyzes all cached Intercom conversations to extract onboarding-related insights
 * for building the 7-levels deep questionnaire system
 */

import { getIntercomCache } from '@/services/intercom';
import type { IntercomConversation, ActionResult } from '@/types';

export interface OnboardingInsight {
  conversationId: string;
  title: string;
  matchedTerms: string[];
  excerpt?: string;
  topic?: string;
  created_at: number;
  updated_at: number;
  state: string;
  priority: string;
  admin_assignee_id?: string;
}

export interface OnboardingAnalysisResult {
  insights: OnboardingInsight[];
  totalAnalyzed: number;
  onboardingRelated: number;
  topicBreakdown: Record<string, number>;
  keywords: Record<string, number>;
  timelineData: Array<{ date: string; count: number }>;
}

const ONBOARDING_KEYWORDS = [
  // Core onboarding terms
  'onboarding', 'onboard', 'setup', 'getting started', 'welcome',

  // Data & Migration
  'data upload', 'import', 'migration', 'csv', 'spreadsheet', 'bulk upload',

  // Training & Education
  'training', 'tutorial', 'guide', 'help', 'learn', 'how to',

  // Integration & Technical
  'twilio', 'phone number', 'integration', 'api', 'webhook', 'connect',

  // Workflow & Process
  'workflow', 'template', 'process', 'automation', 'pipeline',

  // Timeline & Expectations
  'timeline', 'deadline', 'when', 'how long', 'schedule', 'launch',

  // Mobile & Scraping
  'mobile', 'app', 'ios', 'android', 'scraping', 'scrape', 'extract',

  // Handoff & Marketing
  'handoff', 'marketing', 'sales', 'intake', 'requirements'
];

const TOPIC_CATEGORIES: Record<string, string[]> = {
  'Data Upload': ['data upload', 'import', 'migration', 'csv', 'spreadsheet', 'bulk upload'],
  'Marketing Handoff': ['handoff', 'marketing', 'sales', 'intake', 'requirements'],
  'Intake Process': ['intake', 'requirements', 'questionnaire', 'form', 'onboarding form'],
  'Timeline & Expectations': ['timeline', 'deadline', 'when', 'how long', 'schedule', 'launch'],
  'Scraping & Extraction': ['scraping', 'scrape', 'extract', 'data extraction'],
  'Mobile Setup': ['mobile', 'app', 'ios', 'android'],
  'Workflow & Automation': ['workflow', 'template', 'process', 'automation', 'pipeline'],
  'Integration': ['twilio', 'phone number', 'integration', 'api', 'webhook', 'connect']
};

/**
 * Analyze all conversations in cache for onboarding-related content
 */
export async function analyzeOnboardingConversations(): Promise<ActionResult<OnboardingAnalysisResult>> {
  try {
    const cache = await getIntercomCache();
    const conversations = cache.conversations as IntercomConversation[];

    const insights: OnboardingInsight[] = [];
    const keywordCounts: Record<string, number> = {};
    const topicCounts: Record<string, number> = {};

    // Initialize topic counts
    Object.keys(TOPIC_CATEGORIES).forEach(topic => {
      topicCounts[topic] = 0;
    });

    // Analyze each conversation
    for (const conv of conversations) {
      const matchedTerms: string[] = [];
      const searchableText = [
        conv.title || '',
        conv.source?.body || '',
        JSON.stringify(conv.custom_attributes || {})
      ].join(' ').toLowerCase();

      // Check for keyword matches
      for (const keyword of ONBOARDING_KEYWORDS) {
        if (searchableText.includes(keyword.toLowerCase())) {
          matchedTerms.push(keyword);
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        }
      }

      // If matches found, create insight
      if (matchedTerms.length > 0) {
        // Determine primary topic
        let primaryTopic: string | undefined;
        let maxMatches = 0;

        for (const [topic, keywords] of Object.entries(TOPIC_CATEGORIES)) {
          const topicMatches = keywords.filter(kw =>
            matchedTerms.some(mt => mt.toLowerCase().includes(kw.toLowerCase()))
          ).length;

          if (topicMatches > maxMatches) {
            maxMatches = topicMatches;
            primaryTopic = topic;
          }
        }

        if (primaryTopic) {
          topicCounts[primaryTopic]++;
        }

        // Extract excerpt (first 200 chars of body)
        const body = conv.source?.body || '';
        const excerpt = body.length > 200 ? body.substring(0, 200) + '...' : body;

        insights.push({
          conversationId: conv.id,
          title: conv.title || 'Untitled Conversation',
          matchedTerms: [...new Set(matchedTerms)], // Remove duplicates
          excerpt: excerpt || undefined,
          topic: primaryTopic,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          state: conv.state,
          priority: conv.priority,
          admin_assignee_id: conv.admin_assignee_id
        });
      }
    }

    // Sort insights by date (newest first)
    insights.sort((a, b) => b.created_at - a.created_at);

    // Generate timeline data (conversations per day)
    const timelineMap = new Map<string, number>();
    insights.forEach(insight => {
      const date = new Date(insight.created_at * 1000).toISOString().split('T')[0];
      timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
    });

    const timelineData = Array.from(timelineMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      success: true,
      data: {
        insights,
        totalAnalyzed: conversations.length,
        onboardingRelated: insights.length,
        topicBreakdown: topicCounts,
        keywords: keywordCounts,
        timelineData
      }
    };
  } catch (error) {
    console.error('Error analyzing onboarding conversations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate Mermaid diagram based on onboarding analysis
 */
export async function generateOnboardingMermaid(): Promise<ActionResult<string>> {
  const analysisResult = await analyzeOnboardingConversations();

  if (!analysisResult.success || !analysisResult.data) {
    return {
      success: false,
      error: analysisResult.error || 'Failed to analyze conversations'
    };
  }

  const { topicBreakdown, onboardingRelated } = analysisResult.data;

  // Build Mermaid flowchart
  let mermaid = 'graph TD\n';
  mermaid += '    Start[Customer Starts Onboarding] --> Discovery[Discovery & Intake]\n';

  // Add topic nodes based on actual conversation data
  const sortedTopics = Object.entries(topicBreakdown)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  sortedTopics.forEach(([topic, count], index) => {
    const nodeId = topic.replace(/\s+/g, '');
    const percentage = ((count / onboardingRelated) * 100).toFixed(1);

    if (index === 0) {
      mermaid += `    Discovery --> ${nodeId}[${topic}<br/>${count} convos - ${percentage}%]\n`;
    } else {
      const prevNodeId = sortedTopics[index - 1][0].replace(/\s+/g, '');
      mermaid += `    ${prevNodeId} --> ${nodeId}[${topic}<br/>${count} convos - ${percentage}%]\n`;
    }
  });

  // Add completion node
  if (sortedTopics.length > 0) {
    const lastNodeId = sortedTopics[sortedTopics.length - 1][0].replace(/\s+/g, '');
    mermaid += `    ${lastNodeId} --> Complete[Onboarding Complete]\n`;
  }

  // Add styling
  mermaid += '\n    style Start fill:#e1f5e1\n';
  mermaid += '    style Complete fill:#e1f5e1\n';
  mermaid += '    style Discovery fill:#fff4e1\n';

  return {
    success: true,
    data: mermaid
  };
}