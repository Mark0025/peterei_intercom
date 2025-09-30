/**
 * TypeScript Types for Intelligent Questionnaire Analysis System
 *
 * This system processes questionnaire responses, uploaded files, and Intercom data
 * to provide AI-powered insights and recommendations via PeteAI agent.
 */

import type { ParsedData } from '@/utils/file-parser';
import type { DataStructureAnalysis } from './nlp-analysis';

// ============================================================================
// QUESTIONNAIRE RESPONSE TYPES (Enhanced with File Attachments)
// ============================================================================

/**
 * Enhanced question response with optional file attachments
 */
export interface QuestionResponse {
  questionId: string;
  sectionId: string;
  level: number;
  question: string;
  answer: string;
  respondent: string;
  timestamp: number;

  // File attachments (from uploaded files at question level)
  attachments?: AttachmentMetadata[];

  // Extracted URLs from answer text
  extractedUrls?: ExtractedUrl[];
}

/**
 * Metadata for files attached to specific questions
 */
export interface AttachmentMetadata {
  fileName: string;
  fileType: 'csv' | 'xlsx' | 'xls' | 'json' | 'pdf' | 'image' | 'other';
  fileSize: number;
  uploadedAt: number;

  // Parsed data (if CSV/Excel)
  parsedData?: ParsedData;

  // NLP analysis (if data file)
  analysis?: DataStructureAnalysis;

  // Summary/preview
  summary: string;
  rowCount?: number;
  columnCount?: number;

  // Reference to stored file
  storagePath?: string;
}

/**
 * URL extracted from answer text
 */
export interface ExtractedUrl {
  url: string;
  questionId: string;
  context: string; // Surrounding text
  fetchedContent?: string; // If URL was fetched
  fetchedAt?: number;
}

/**
 * Complete questionnaire session with enhanced metadata
 */
export interface EnhancedQuestionnaireSession {
  sessionId: string;
  respondent: string;
  startedAt: number;
  completedAt?: number;
  responses: QuestionResponse[];
  resolutionCategory?: string;
  notes?: string;

  // Aggregated file data
  totalAttachments: number;
  totalUrlsExtracted: number;
}

// ============================================================================
// ANALYSIS INSIGHT TYPES
// ============================================================================

/**
 * Pain point identified from responses
 */
export interface PainPoint {
  keyword: string;
  frequency: number;
  quotes: string[];
  questionIds: string[];
  severity: 'critical' | 'major' | 'moderate' | 'minor';
  relatedAttachments?: string[]; // File names that relate to this pain point
}

/**
 * Breakthrough idea extracted from responses
 */
export interface BreakthroughIdea {
  idea: string;
  questionId: string;
  verbatim: string; // Exact quote
  category: 'product' | 'process' | 'technology' | 'business-model';
  implementationComplexity: 'low' | 'medium' | 'high';
  estimatedImpact: 'low' | 'medium' | 'high';
}

/**
 * Knowledge gap ("I don't know" signal)
 */
export interface KnowledgeGap {
  question: string;
  questionId: string;
  answer: string;
  signal: 'gap' | 'opportunity' | 'blocker';
  actionable: boolean;
}

/**
 * Uploaded document summary
 */
export interface UploadedDocSummary {
  questionId: string;
  fileName: string;
  type: 'intake-questionnaire' | 'workflow-data' | 'client-data' | 'documentation' | 'other';
  summary: string;
  keyInsights: string[];
  structuredData?: Record<string, unknown>; // Parsed JSON/data
}

/**
 * Complete insight analysis
 */
export interface InsightAnalysis {
  painPoints: PainPoint[];
  breakthroughIdeas: BreakthroughIdea[];
  knowledgeGaps: KnowledgeGap[];
  uploadedDocs: UploadedDocSummary[];
  keyQuotes: Array<{ text: string; questionId: string; context: string }>;
  themes: Array<{ theme: string; frequency: number; questions: string[] }>;
}

// ============================================================================
// CONVERSATION DATA TYPES (from Intercom Cache)
// ============================================================================

/**
 * Failure pattern detected in conversations
 */
export interface FailurePattern {
  pattern: string;
  count: number;
  examples: ConversationReference[];
  commonFactors: string[];
  recommendedFix?: string;
}

/**
 * Success pattern detected in conversations
 */
export interface SuccessPattern {
  pattern: string;
  count: number;
  examples: ConversationReference[];
  differentiators: string[];
}

/**
 * Reference to specific Intercom conversation
 */
export interface ConversationReference {
  conversationId: string;
  title: string;
  snippet: string;
  tags: string[];
  createdAt: number;
  resolved: boolean;
}

/**
 * Aggregated conversation analysis
 */
export interface ConversationAnalysis {
  totalConversations: number;
  onboardingRelated: number;
  failurePatterns: FailurePattern[];
  successPatterns: SuccessPattern[];
  commonIssues: Array<{ issue: string; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
  averageResolutionTime: number;
  failureRate: number;
}

// ============================================================================
// CHART DATA TYPES (for Chart.js visualizations)
// ============================================================================

/**
 * Generic chart configuration
 */
export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'scatter';
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
  options?: Record<string, unknown>;
}

/**
 * Chart data collection
 */
export interface ChartDataCollection {
  painPointFrequency: ChartData;
  resolutionBreakdown: ChartData;
  timelineAnalysis: ChartData;
  conversationTrends: ChartData;
  issueComparison: ChartData;
  successVsFailure: ChartData;
}

// ============================================================================
// DIAGRAM TYPES
// ============================================================================

/**
 * Generated diagrams
 */
export interface GeneratedDiagrams {
  mermaid: string; // Mermaid diagram syntax
  ascii: string;   // ASCII art diagram
  metadata: {
    generatedAt: number;
    nodeCount: number;
    complexity: 'simple' | 'moderate' | 'complex';
  };
}

// ============================================================================
// PETEAI AGENT TYPES
// ============================================================================

/**
 * Context prepared for PeteAI agent
 */
export interface AgentContext {
  // Compressed session summary
  sessionSummary: string;

  // Key data points
  topPainPoints: string[];
  topIdeas: string[];
  criticalGaps: string[];

  // Uploaded file summaries
  uploadedFiles: Array<{
    fileName: string;
    type: string;
    keySummary: string;
  }>;

  // Conversation insights
  conversationInsights: {
    failureCount: number;
    successCount: number;
    topIssues: string[];
  };

  // Full context (for agent system prompt)
  fullContext: string;

  // Metadata
  contextSize: number; // bytes
  generatedAt: number;
}

/**
 * Message in agent conversation
 */
export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    chartGenerated?: boolean;
    conversationsReferenced?: string[];
    filesReferenced?: string[];
  };
}

/**
 * Tool call made by agent
 */
export interface AgentToolCall {
  tool: 'generate_chart' | 'find_conversation' | 'estimate_effort' | 'recommend_priority' | 'analyze_file';
  parameters: Record<string, unknown>;
  result?: unknown;
}

/**
 * Agent conversation state
 */
export interface AgentConversation {
  sessionId: string;
  messages: AgentMessage[];
  tools: AgentToolCall[];
  startedAt: number;
  lastMessageAt: number;
}

// ============================================================================
// COMPLETE ANALYSIS RESULT
// ============================================================================

/**
 * Complete analysis result returned by analyzeQuestionnaireSession
 */
export interface CompleteAnalysisResult {
  // Session data
  session: EnhancedQuestionnaireSession;

  // Insight analysis
  insights: InsightAnalysis;

  // Conversation data
  conversationData: ConversationAnalysis;

  // Chart data
  chartData: ChartDataCollection;

  // Diagrams
  diagrams: GeneratedDiagrams;

  // Agent context
  agentContext: AgentContext;

  // Recommendations
  recommendations: Recommendation[];

  // Metadata
  metadata: {
    analyzedAt: number;
    processingTimeMs: number;
    dataQualityScore: number; // 0-100
    confidenceScore: number;  // 0-100
  };
}

/**
 * Strategic recommendation
 */
export interface Recommendation {
  priority: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  rationale: string;
  estimatedEffort: 'hours' | 'days' | 'weeks' | 'months';
  estimatedImpact: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  relatedPainPoints: string[];
  relatedIdeas: string[];
  implementationNotes?: string;
}

// ============================================================================
// SERVER ACTION RETURN TYPES
// ============================================================================

/**
 * Standard server action result wrapper
 */
export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: number;
    duration?: number;
  };
}

/**
 * Analysis result
 */
export type AnalysisResult = ActionResult<CompleteAnalysisResult>;

/**
 * Agent chat result
 */
export type AgentChatResult = ActionResult<{
  message: string;
  toolCalls?: AgentToolCall[];
  chartData?: ChartData;
  conversationReferences?: ConversationReference[];
}>;

// ============================================================================
// UI COMPONENT PROPS
// ============================================================================

/**
 * Props for Analysis Page component
 */
export interface AnalysisPageProps {
  sessionId: string;
  initialAnalysis?: CompleteAnalysisResult;
}

/**
 * Props for Chat Interface component
 */
export interface ChatInterfaceProps {
  sessionId: string;
  agentContext: AgentContext;
  onSendMessage: (message: string) => Promise<void>;
  messages: AgentMessage[];
  loading?: boolean;
  suggestedQuestions?: string[];
}

/**
 * Props for Insight Card component
 */
export interface InsightCardProps {
  insight: PainPoint | BreakthroughIdea | KnowledgeGap;
  type: 'pain-point' | 'idea' | 'gap';
  onViewDetails?: () => void;
}

/**
 * Props for Uploaded File Display component
 */
export interface UploadedFileDisplayProps {
  files: UploadedDocSummary[];
  onSelectFile?: (file: UploadedDocSummary) => void;
  onAddToContext?: (file: UploadedDocSummary) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Processing status
 */
export type ProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

/**
 * Analysis stage
 */
export type AnalysisStage =
  | 'loading-session'
  | 'extracting-insights'
  | 'analyzing-conversations'
  | 'generating-charts'
  | 'creating-diagrams'
  | 'preparing-agent-context'
  | 'complete';

/**
 * Processing progress
 */
export interface ProcessingProgress {
  stage: AnalysisStage;
  progress: number; // 0-100
  message: string;
  startedAt: number;
  estimatedCompletion?: number;
}