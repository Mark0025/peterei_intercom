/**
 * Conversation Analysis Types
 *
 * AI-powered analysis of Intercom conversations to identify patterns,
 * gaps, escalation triggers, and resolution strategies.
 */

import type { IntercomConversation } from './index';

// ============================================================================
// Core Analysis Types
// ============================================================================

export interface ConversationPattern {
  pattern: string;
  frequency: number;
  examples: string[];
  category?: string;
  tags: string[];
}

export interface EscalationTrigger {
  trigger: string;
  frequency: number;
  conversations: string[]; // conversation IDs
  avgTimeToEscalation?: number;
  commonTags: string[];
}

export interface ResolutionStrategy {
  strategy: string;
  successRate: number;
  avgResolutionTime: number;
  usedInConversations: number;
  tags: string[];
  examples: string[];
}

export interface ConversationIssue {
  issue: string;
  severity: 'low' | 'medium' | 'high';
  frequency: number;
  affectedTags: string[];
  resolutionSuggestions: string[];
}

export interface ConversationGap {
  gap: string;
  impact: 'low' | 'medium' | 'high';
  affectedCategories: string[];
  suggestedImprovement: string;
  relatedConversations: string[];
}

// ============================================================================
// Analysis Result Types
// ============================================================================

export interface ConversationAnalysisResult {
  totalAnalyzed: number;
  dateRange: {
    start: number;
    end: number;
  };
  successPatterns: ConversationPattern[];
  failurePatterns: ConversationPattern[];
  escalationTriggers: EscalationTrigger[];
  commonIssues: ConversationIssue[];
  gaps: ConversationGap[];
  resolutionStrategies: ResolutionStrategy[];
  tagAnalysis: {
    tag: string;
    count: number;
    avgResolutionTime: number;
    escalationRate: number;
  }[];
  mermaidDiagram?: string;
  metadata: {
    generatedAt: number;
    confidenceScore: number;
    filterApplied?: string;
  };
}

// ============================================================================
// Filter Types
// ============================================================================

export interface ConversationFilters {
  category?: string;
  tag?: string;
  state?: 'open' | 'closed' | 'snoozed';
  dateRange?: {
    start: Date;
    end: Date;
  };
  priority?: boolean;
  hasEscalation?: boolean;
}

// ============================================================================
// Mermaid Diagram Types
// ============================================================================

export interface MermaidNode {
  id: string;
  label: string;
  type: 'start' | 'process' | 'decision' | 'end';
  success?: boolean;
}

export interface MermaidEdge {
  from: string;
  to: string;
  label?: string;
  condition?: string;
}

export interface ConversationFlowDiagram {
  title: string;
  nodes: MermaidNode[];
  edges: MermaidEdge[];
  mermaidCode: string;
}

// ============================================================================
// Agent Context Types (for LangGraph)
// ============================================================================

export interface ConversationAgentContext {
  conversations: IntercomConversation[];
  filters: ConversationFilters;
  analysisResult?: ConversationAnalysisResult;
  userQuery: string;
}

export interface ConversationInsightPrompt {
  type: 'escalations' | 'patterns' | 'gaps' | 'resolution' | 'category' | 'custom';
  query: string;
  filters?: ConversationFilters;
}

// ============================================================================
// Chart Data Types
// ============================================================================

export interface ConversationChartData {
  type: 'bar' | 'line' | 'pie' | 'timeline';
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface ConversationMetrics {
  totalConversations: number;
  openConversations: number;
  closedConversations: number;
  avgResolutionTime: number;
  escalationRate: number;
  satisfactionScore?: number;
  byCategory: {
    category: string;
    count: number;
    avgResolutionTime: number;
  }[];
  byTag: {
    tag: string;
    count: number;
    escalationRate: number;
  }[];
  timeline: {
    date: string;
    opened: number;
    closed: number;
    escalated: number;
  }[];
}

// ============================================================================
// Action Result Type
// ============================================================================

export interface ConversationAnalysisAction {
  success: boolean;
  data?: ConversationAnalysisResult;
  error?: string;
  message?: string;
}
