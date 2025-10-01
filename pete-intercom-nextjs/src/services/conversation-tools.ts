/**
 * Conversation Analysis Tools for LangGraph Agent
 *
 * These tools analyze Intercom conversations to identify patterns, gaps,
 * escalation triggers, and resolution strategies.
 */

import { getSmartCache } from './smart-cache';
import type {
  ConversationAnalysisResult,
  ConversationPattern,
  EscalationTrigger,
  ResolutionStrategy,
  ConversationIssue,
  ConversationGap,
  ConversationFilters
} from '@/types/conversation-analysis';
import type { IntercomConversation } from '@/types';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Apply filters to conversation list
 */
function filterConversations(
  conversations: IntercomConversation[],
  filters?: ConversationFilters
): IntercomConversation[] {
  if (!filters) return conversations;

  let filtered = [...conversations];

  // Filter by state
  if (filters.state) {
    filtered = filtered.filter(c => c.state === filters.state);
  }

  // Filter by tag
  if (filters.tag) {
    filtered = filtered.filter(c =>
      c.tags?.tags?.some(t => t.name.toLowerCase().includes(filters.tag!.toLowerCase()))
    );
  }

  // Filter by priority
  if (filters.priority !== undefined) {
    const priorityState = filters.priority ? 'priority' : 'not_priority';
    filtered = filtered.filter(c => c.priority === priorityState);
  }

  // Filter by escalation tag
  if (filters.hasEscalation) {
    filtered = filtered.filter(c =>
      c.tags?.tags?.some(t => t.name.toLowerCase().includes('escalation'))
    );
  }

  // Filter by date range
  if (filters.dateRange) {
    const startTime = filters.dateRange.start.getTime() / 1000;
    const endTime = filters.dateRange.end.getTime() / 1000;
    filtered = filtered.filter(c =>
      c.created_at >= startTime && c.created_at <= endTime
    );
  }

  return filtered;
}

/**
 * Extract tags from conversations
 */
function extractTags(conversation: IntercomConversation): string[] {
  return conversation.tags?.tags?.map(t => t.name) || [];
}

/**
 * Calculate average resolution time
 */
function calculateAvgResolutionTime(conversations: IntercomConversation[]): number {
  const resolutionTimes = conversations
    .filter(c => c.statistics?.time_to_first_close)
    .map(c => c.statistics!.time_to_first_close!);

  if (resolutionTimes.length === 0) return 0;

  const total = resolutionTimes.reduce((acc, time) => acc + time, 0);
  return Math.round(total / resolutionTimes.length);
}

// ============================================================================
// Pattern Analysis
// ============================================================================

/**
 * Identify success patterns from closed conversations
 */
export function identifySuccessPatterns(
  conversations: IntercomConversation[],
  filters?: ConversationFilters
): ConversationPattern[] {
  const filtered = filterConversations(conversations, filters);
  const successfulConvos = filtered.filter(c =>
    c.state === 'closed' &&
    c.statistics?.time_to_first_close &&
    c.statistics.time_to_first_close < 86400 // Closed within 24 hours
  );

  // Group by common tags
  const tagGroups = new Map<string, IntercomConversation[]>();

  successfulConvos.forEach(convo => {
    const tags = extractTags(convo);
    tags.forEach(tag => {
      if (!tagGroups.has(tag)) {
        tagGroups.set(tag, []);
      }
      tagGroups.get(tag)!.push(convo);
    });
  });

  // Build patterns
  const patterns: ConversationPattern[] = [];

  tagGroups.forEach((convos, tag) => {
    if (convos.length >= 2) { // At least 2 occurrences to be a pattern
      patterns.push({
        pattern: `Quick resolution for ${tag} conversations`,
        frequency: convos.length,
        examples: convos.slice(0, 3).map(c => c.id),
        category: tag,
        tags: [tag]
      });
    }
  });

  // Sort by frequency
  return patterns.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Identify failure patterns from open/escalated conversations
 */
export function identifyFailurePatterns(
  conversations: IntercomConversation[],
  filters?: ConversationFilters
): ConversationPattern[] {
  const filtered = filterConversations(conversations, filters);
  const failedConvos = filtered.filter(c =>
    c.state === 'open' ||
    c.tags?.tags?.some(t => t.name.toLowerCase().includes('escalation')) ||
    (c.statistics?.time_to_first_close && c.statistics.time_to_first_close > 172800) // > 48 hours
  );

  // Group by common tags
  const tagGroups = new Map<string, IntercomConversation[]>();

  failedConvos.forEach(convo => {
    const tags = extractTags(convo);
    tags.forEach(tag => {
      if (!tagGroups.has(tag)) {
        tagGroups.set(tag, []);
      }
      tagGroups.get(tag)!.push(convo);
    });
  });

  // Build patterns
  const patterns: ConversationPattern[] = [];

  tagGroups.forEach((convos, tag) => {
    if (convos.length >= 2) {
      patterns.push({
        pattern: `Slow or failed resolution for ${tag} conversations`,
        frequency: convos.length,
        examples: convos.slice(0, 3).map(c => c.id),
        category: tag,
        tags: [tag]
      });
    }
  });

  return patterns.sort((a, b) => b.frequency - a.frequency);
}

// ============================================================================
// Escalation Analysis
// ============================================================================

/**
 * Identify escalation triggers
 */
export function identifyEscalationTriggers(
  conversations: IntercomConversation[],
  filters?: ConversationFilters
): EscalationTrigger[] {
  const filtered = filterConversations(conversations, filters);
  const escalatedConvos = filtered.filter(c =>
    c.tags?.tags?.some(t => t.name.toLowerCase().includes('escalation'))
  );

  // Group by tags present when escalated
  const triggerMap = new Map<string, {
    convos: string[];
    times: number[];
    tags: Set<string>;
  }>();

  escalatedConvos.forEach(convo => {
    const tags = extractTags(convo);
    const escalationTime = convo.statistics?.time_to_first_close || 0;

    tags.forEach(tag => {
      if (!tag.toLowerCase().includes('escalation')) {
        if (!triggerMap.has(tag)) {
          triggerMap.set(tag, { convos: [], times: [], tags: new Set() });
        }
        const trigger = triggerMap.get(tag)!;
        trigger.convos.push(convo.id);
        trigger.times.push(escalationTime);
        tags.forEach(t => trigger.tags.add(t));
      }
    });
  });

  // Build triggers
  const triggers: EscalationTrigger[] = [];

  triggerMap.forEach((data, tag) => {
    if (data.convos.length >= 2) {
      const avgTime = data.times.length > 0
        ? Math.round(data.times.reduce((acc, t) => acc + t, 0) / data.times.length)
        : 0;

      triggers.push({
        trigger: `${tag} issues frequently escalate`,
        frequency: data.convos.length,
        conversations: data.convos,
        avgTimeToEscalation: avgTime,
        commonTags: Array.from(data.tags)
      });
    }
  });

  return triggers.sort((a, b) => b.frequency - a.frequency);
}

// ============================================================================
// Resolution Analysis
// ============================================================================

/**
 * Identify resolution strategies that work
 */
export function identifyResolutionStrategies(
  conversations: IntercomConversation[],
  filters?: ConversationFilters
): ResolutionStrategy[] {
  const filtered = filterConversations(conversations, filters);
  const closedConvos = filtered.filter(c => c.state === 'closed');

  // Group by tags (representing different resolution approaches)
  const strategyMap = new Map<string, {
    successful: number;
    total: number;
    times: number[];
    examples: string[];
  }>();

  closedConvos.forEach(convo => {
    const tags = extractTags(convo);
    const resolutionTime = convo.statistics?.time_to_first_close || 0;
    const wasSuccessful = resolutionTime < 86400; // < 24 hours = success

    tags.forEach(tag => {
      if (!strategyMap.has(tag)) {
        strategyMap.set(tag, { successful: 0, total: 0, times: [], examples: [] });
      }
      const strategy = strategyMap.get(tag)!;
      strategy.total++;
      if (wasSuccessful) strategy.successful++;
      strategy.times.push(resolutionTime);
      if (strategy.examples.length < 3) {
        strategy.examples.push(convo.id);
      }
    });
  });

  // Build strategies
  const strategies: ResolutionStrategy[] = [];

  strategyMap.forEach((data, tag) => {
    if (data.total >= 2) {
      const successRate = Math.round((data.successful / data.total) * 100);
      const avgTime = Math.round(
        data.times.reduce((acc, t) => acc + t, 0) / data.times.length
      );

      strategies.push({
        strategy: `Resolve ${tag} conversations quickly`,
        successRate,
        avgResolutionTime: avgTime,
        usedInConversations: data.total,
        tags: [tag],
        examples: data.examples
      });
    }
  });

  // Sort by success rate
  return strategies.sort((a, b) => b.successRate - a.successRate);
}

// ============================================================================
// Issue & Gap Analysis
// ============================================================================

/**
 * Identify common issues from conversations
 */
export function identifyCommonIssues(
  conversations: IntercomConversation[],
  filters?: ConversationFilters
): ConversationIssue[] {
  const filtered = filterConversations(conversations, filters);

  // Analyze tags for problem indicators
  const issueMap = new Map<string, {
    count: number;
    tags: Set<string>;
    avgResolutionTime: number;
    times: number[];
  }>();

  filtered.forEach(convo => {
    const tags = extractTags(convo);
    const resolutionTime = convo.statistics?.time_to_first_close || 0;

    tags.forEach(tag => {
      if (!issueMap.has(tag)) {
        issueMap.set(tag, { count: 0, tags: new Set(), avgResolutionTime: 0, times: [] });
      }
      const issue = issueMap.get(tag)!;
      issue.count++;
      tags.forEach(t => issue.tags.add(t));
      issue.times.push(resolutionTime);
    });
  });

  // Build issues
  const issues: ConversationIssue[] = [];

  issueMap.forEach((data, tag) => {
    if (data.count >= 3) { // At least 3 occurrences
      const avgTime = Math.round(
        data.times.reduce((acc, t) => acc + t, 0) / data.times.length
      );

      // Determine severity based on frequency and resolution time
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (data.count > 10 || avgTime > 172800) severity = 'high';
      else if (data.count > 5 || avgTime > 86400) severity = 'medium';

      issues.push({
        issue: `Recurring ${tag} issues`,
        severity,
        frequency: data.count,
        affectedTags: Array.from(data.tags),
        resolutionSuggestions: [
          `Create documentation for ${tag}`,
          `Add automation for ${tag} responses`,
          `Training for support team on ${tag}`
        ]
      });
    }
  });

  return issues.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Identify gaps in the support process
 */
export function identifyGaps(
  conversations: IntercomConversation[],
  filters?: ConversationFilters
): ConversationGap[] {
  const filtered = filterConversations(conversations, filters);
  const gaps: ConversationGap[] = [];

  // Gap 1: Long resolution times without escalation
  const longResolutionNoEscalation = filtered.filter(c =>
    c.statistics?.time_to_first_close &&
    c.statistics.time_to_first_close > 172800 && // > 48 hours
    !c.tags?.tags?.some(t => t.name.toLowerCase().includes('escalation'))
  );

  if (longResolutionNoEscalation.length > 0) {
    gaps.push({
      gap: 'Conversations taking >48 hours without escalation',
      impact: 'high',
      affectedCategories: Array.from(
        new Set(longResolutionNoEscalation.flatMap(extractTags))
      ),
      suggestedImprovement: 'Add automatic escalation trigger after 48 hours',
      relatedConversations: longResolutionNoEscalation.slice(0, 5).map(c => c.id)
    });
  }

  // Gap 2: High reopen rate
  const reopenedConvos = filtered.filter(c =>
    c.statistics?.count_reopens && c.statistics.count_reopens > 1
  );

  if (reopenedConvos.length > 0) {
    gaps.push({
      gap: `${reopenedConvos.length} conversations reopened multiple times`,
      impact: 'medium',
      affectedCategories: Array.from(
        new Set(reopenedConvos.flatMap(extractTags))
      ),
      suggestedImprovement: 'Improve initial resolution quality',
      relatedConversations: reopenedConvos.slice(0, 5).map(c => c.id)
    });
  }

  // Gap 3: Conversations with no admin reply
  const noAdminReply = filtered.filter(c =>
    c.state === 'open' && !c.statistics?.first_admin_reply_at
  );

  if (noAdminReply.length > 0) {
    gaps.push({
      gap: `${noAdminReply.length} open conversations with no admin reply`,
      impact: 'high',
      affectedCategories: Array.from(
        new Set(noAdminReply.flatMap(extractTags))
      ),
      suggestedImprovement: 'Improve response time SLA monitoring',
      relatedConversations: noAdminReply.slice(0, 5).map(c => c.id)
    });
  }

  return gaps;
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Analyze conversations comprehensively
 */
export async function analyzeConversations(
  filters?: ConversationFilters
): Promise<ConversationAnalysisResult> {
  const cache = getSmartCache();
  const conversations = cache.conversations;

  const filtered = filterConversations(conversations, filters);

  // Get date range
  const timestamps = filtered.map(c => c.created_at);
  const dateRange = {
    start: timestamps.length > 0 ? Math.min(...timestamps) : 0,
    end: timestamps.length > 0 ? Math.max(...timestamps) : 0
  };

  // Run all analyses
  const [
    successPatterns,
    failurePatterns,
    escalationTriggers,
    commonIssues,
    gaps,
    resolutionStrategies
  ] = await Promise.all([
    Promise.resolve(identifySuccessPatterns(conversations, filters)),
    Promise.resolve(identifyFailurePatterns(conversations, filters)),
    Promise.resolve(identifyEscalationTriggers(conversations, filters)),
    Promise.resolve(identifyCommonIssues(conversations, filters)),
    Promise.resolve(identifyGaps(conversations, filters)),
    Promise.resolve(identifyResolutionStrategies(conversations, filters))
  ]);

  // Tag analysis
  const tagMap = new Map<string, {
    count: number;
    resolutionTimes: number[];
    escalations: number;
  }>();

  filtered.forEach(convo => {
    const tags = extractTags(convo);
    const isEscalated = tags.some(t => t.toLowerCase().includes('escalation'));
    const resolutionTime = convo.statistics?.time_to_first_close || 0;

    tags.forEach(tag => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, { count: 0, resolutionTimes: [], escalations: 0 });
      }
      const tagData = tagMap.get(tag)!;
      tagData.count++;
      tagData.resolutionTimes.push(resolutionTime);
      if (isEscalated) tagData.escalations++;
    });
  });

  const tagAnalysis = Array.from(tagMap.entries()).map(([tag, data]) => ({
    tag,
    count: data.count,
    avgResolutionTime: Math.round(
      data.resolutionTimes.reduce((acc, t) => acc + t, 0) / data.resolutionTimes.length
    ),
    escalationRate: Math.round((data.escalations / data.count) * 100)
  })).sort((a, b) => b.count - a.count);

  // Calculate confidence score
  const confidenceScore = Math.min(
    100,
    Math.round((filtered.length / 10) * 10) // 10 conversations = 10% confidence, max 100%
  );

  return {
    totalAnalyzed: filtered.length,
    dateRange,
    successPatterns,
    failurePatterns,
    escalationTriggers,
    commonIssues,
    gaps,
    resolutionStrategies,
    tagAnalysis,
    metadata: {
      generatedAt: Date.now(),
      confidenceScore,
      filterApplied: filters?.tag || filters?.state || 'none'
    }
  };
}
