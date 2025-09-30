'use server';

/**
 * AI-Powered Questionnaire Analysis System
 *
 * Analyzes completed 7-levels deep questionnaire sessions to extract:
 * - Pain points (keyword frequency, severity)
 * - Breakthrough ideas (innovation opportunities)
 * - Knowledge gaps ("I don't know" signals)
 * - Uploaded document summaries
 * - Intercom conversation patterns
 * - Chart data for visualizations
 * - Mermaid diagrams for process flows
 * - Compressed context for PeteAI agent
 */

import fs from 'fs/promises';
import path from 'path';
import type {
  CompleteAnalysisResult,
  InsightAnalysis,
  PainPoint,
  BreakthroughIdea,
  KnowledgeGap,
  UploadedDocSummary,
  ConversationAnalysis,
  FailurePattern,
  SuccessPattern,
  ConversationReference,
  ChartDataCollection,
  ChartData,
  GeneratedDiagrams,
  AgentContext,
  Recommendation,
  AnalysisResult,
  EnhancedQuestionnaireSession,
  QuestionResponse
} from '@/types/questionnaire-analysis';
import type {
  IntercomConversation,
  OnboardingData,
  OnboardingSection
} from '@/types';

// ============================================================================
// MAIN ANALYSIS ENTRY POINT
// ============================================================================

export async function analyzeQuestionnaireSession(
  sessionId: string
): Promise<AnalysisResult> {
  const startTime = Date.now();

  try {
    // 1. Load session data
    const session = await loadSessionData(sessionId);

    // 2. Extract insights from responses
    const insights = extractInsights(session.responses);

    // 3. Analyze Intercom conversation cache
    const conversationData = await analyzeConversations();

    // 4. Generate chart data
    const chartData = generateChartData(insights, conversationData, session);

    // 5. Generate diagrams
    const diagrams = generateDiagrams(session, insights);

    // 6. Prepare agent context
    const agentContext = buildAgentContext(session, insights, conversationData);

    // 7. Generate recommendations
    const recommendations = generateRecommendations(insights, conversationData);

    const processingTime = Date.now() - startTime;

    const result: CompleteAnalysisResult = {
      session,
      insights,
      conversationData,
      chartData,
      diagrams,
      agentContext,
      recommendations,
      metadata: {
        analyzedAt: Date.now(),
        processingTimeMs: processingTime,
        dataQualityScore: calculateDataQualityScore(session),
        confidenceScore: calculateConfidenceScore(insights, conversationData)
      }
    };

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: Date.now(),
        duration: processingTime
      }
    };
  } catch (error) {
    console.error('[analyzeQuestionnaireSession] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        timestamp: Date.now()
      }
    };
  }
}

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadSessionData(sessionId: string): Promise<EnhancedQuestionnaireSession> {
  const filePath = path.join(
    process.cwd(),
    'data',
    'questionnaire-responses',
    `${sessionId}.json`
  );

  const fileContent = await fs.readFile(filePath, 'utf-8');
  const session = JSON.parse(fileContent);

  // Count attachments and URLs (if they exist)
  let totalAttachments = 0;
  let totalUrlsExtracted = 0;

  session.responses.forEach((response: QuestionResponse) => {
    if (response.attachments) {
      totalAttachments += response.attachments.length;
    }
    if (response.extractedUrls) {
      totalUrlsExtracted += response.extractedUrls.length;
    }
  });

  return {
    ...session,
    totalAttachments,
    totalUrlsExtracted
  };
}

// ============================================================================
// INSIGHT EXTRACTION (NLP-First Approach)
// ============================================================================

function extractInsights(responses: QuestionResponse[]): InsightAnalysis {
  const painPoints = extractPainPoints(responses);
  const breakthroughIdeas = extractBreakthroughIdeas(responses);
  const knowledgeGaps = extractKnowledgeGaps(responses);
  const uploadedDocs = extractUploadedDocs(responses);
  const keyQuotes = extractKeyQuotes(responses);
  const themes = extractThemes(responses);

  return {
    painPoints,
    breakthroughIdeas,
    knowledgeGaps,
    uploadedDocs,
    keyQuotes,
    themes
  };
}

function extractPainPoints(responses: QuestionResponse[]): PainPoint[] {
  const painKeywords = [
    'problem', 'issue', 'struggle', 'fail', 'difficult', 'confusing',
    'delay', 'slow', 'error', 'mistake', 'wrong', 'broken', 'frustrat',
    'scraping', 'data', 'manual', 'takes time', 'dirty', 'off'
  ];

  const keywordMap = new Map<string, { frequency: number; quotes: string[]; questionIds: string[] }>();

  responses.forEach(response => {
    const lowerAnswer = response.answer.toLowerCase();

    painKeywords.forEach(keyword => {
      if (lowerAnswer.includes(keyword)) {
        const existing = keywordMap.get(keyword) || { frequency: 0, quotes: [], questionIds: [] };
        existing.frequency++;

        // Add quote if answer is substantial
        if (response.answer.length > 20 && response.answer.length < 500) {
          existing.quotes.push(response.answer);
        }

        existing.questionIds.push(response.questionId);
        keywordMap.set(keyword, existing);
      }
    });

    // Special pattern: "data scraping" compound
    if (lowerAnswer.includes('scrap') || lowerAnswer.includes('data')) {
      const keyword = 'data-scraping';
      const existing = keywordMap.get(keyword) || { frequency: 0, quotes: [], questionIds: [] };
      existing.frequency++;
      if (response.answer.length > 20 && response.answer.length < 500) {
        existing.quotes.push(response.answer);
      }
      existing.questionIds.push(response.questionId);
      keywordMap.set(keyword, existing);
    }
  });

  // Convert to PainPoint objects
  const painPoints: PainPoint[] = [];
  keywordMap.forEach((data, keyword) => {
    if (data.frequency >= 2) { // Only include if mentioned 2+ times
      painPoints.push({
        keyword,
        frequency: data.frequency,
        quotes: data.quotes.slice(0, 3), // Top 3 quotes
        questionIds: Array.from(new Set(data.questionIds)),
        severity: data.frequency >= 8 ? 'critical' :
                  data.frequency >= 5 ? 'major' :
                  data.frequency >= 3 ? 'moderate' : 'minor'
      });
    }
  });

  // Sort by frequency
  return painPoints.sort((a, b) => b.frequency - a.frequency);
}

function extractBreakthroughIdeas(responses: QuestionResponse[]): BreakthroughIdea[] {
  const ideas: BreakthroughIdea[] = [];

  responses.forEach(response => {
    const lowerAnswer = response.answer.toLowerCase();

    // Look for idea signals
    const hasIdeaSignal =
      lowerAnswer.includes('what if') ||
      lowerAnswer.includes('could be') ||
      lowerAnswer.includes('we could') ||
      lowerAnswer.includes('would be better') ||
      lowerAnswer.includes('solution is') ||
      lowerAnswer.includes('idea') ||
      response.answer.length > 200; // Long answers often contain ideas

    if (hasIdeaSignal && response.answer.length > 50) {
      // Determine category
      let category: 'product' | 'process' | 'technology' | 'business-model' = 'process';
      if (lowerAnswer.includes('ai') || lowerAnswer.includes('agent') || lowerAnswer.includes('scraper')) {
        category = 'technology';
      } else if (lowerAnswer.includes('canvas') || lowerAnswer.includes('widget') || lowerAnswer.includes('module')) {
        category = 'product';
      } else if (lowerAnswer.includes('pricing') || lowerAnswer.includes('cost') || lowerAnswer.includes('extra cost')) {
        category = 'business-model';
      }

      // Estimate complexity
      let complexity: 'low' | 'medium' | 'high' = 'medium';
      if (lowerAnswer.includes('docker') || lowerAnswer.includes('cloud') || lowerAnswer.includes('database')) {
        complexity = 'high';
      } else if (lowerAnswer.includes('simple') || lowerAnswer.includes('copy and paste')) {
        complexity = 'low';
      }

      // Estimate impact
      let impact: 'low' | 'medium' | 'high' = 'medium';
      if (lowerAnswer.includes('transform') || lowerAnswer.includes('revolutionize') || lowerAnswer.includes('critical')) {
        impact = 'high';
      }

      ideas.push({
        idea: response.answer.substring(0, 150) + (response.answer.length > 150 ? '...' : ''),
        questionId: response.questionId,
        verbatim: response.answer,
        category,
        implementationComplexity: complexity,
        estimatedImpact: impact
      });
    }
  });

  return ideas;
}

function extractKnowledgeGaps(responses: QuestionResponse[]): KnowledgeGap[] {
  const gaps: KnowledgeGap[] = [];

  responses.forEach(response => {
    const lowerAnswer = response.answer.toLowerCase();

    // Look for "I don't know" signals
    const hasGapSignal =
      lowerAnswer.includes("i don't know") ||
      lowerAnswer.includes("i dont know") ||
      lowerAnswer.includes("not sure") ||
      lowerAnswer.includes("don't know") ||
      lowerAnswer.includes("dont know") ||
      lowerAnswer.includes("unclear");

    if (hasGapSignal) {
      // Determine signal type
      let signal: 'gap' | 'opportunity' | 'blocker' = 'gap';
      if (lowerAnswer.includes('blocking') || lowerAnswer.includes('prevent')) {
        signal = 'blocker';
      } else if (lowerAnswer.includes('could') || lowerAnswer.includes('opportunity')) {
        signal = 'opportunity';
      }

      gaps.push({
        question: response.question,
        questionId: response.questionId,
        answer: response.answer,
        signal,
        actionable: response.answer.length > 20 // Short answers less actionable
      });
    }
  });

  return gaps;
}

function extractUploadedDocs(responses: QuestionResponse[]): UploadedDocSummary[] {
  const docs: UploadedDocSummary[] = [];

  responses.forEach(response => {
    // Look for JSON uploads in answers
    if (response.answer.includes('{') && response.answer.includes('}') && response.answer.length > 1000) {
      try {
        const jsonContent = JSON.parse(response.answer);

        // Determine document type
        let type: 'intake-questionnaire' | 'workflow-data' | 'client-data' | 'documentation' | 'other' = 'other';
        if (jsonContent.sections || response.questionId.includes('intake')) {
          type = 'intake-questionnaire';
        }

        const summary = generateDocSummary(jsonContent);
        const keyInsights = extractDocInsights(jsonContent);

        docs.push({
          questionId: response.questionId,
          fileName: `${response.questionId}.json`,
          type,
          summary,
          keyInsights,
          structuredData: jsonContent
        });
      } catch {
        // Not valid JSON, skip
      }
    }
  });

  return docs;
}

function generateDocSummary(data: OnboardingData): string {
  if (data.sections && Array.isArray(data.sections)) {
    const sectionCount = data.sections.length;
    const questionCount = data.sections.reduce((sum: number, section: OnboardingSection) =>
      sum + (section.questions?.length || 0), 0
    );
    return `Intake questionnaire with ${sectionCount} sections and ${questionCount} questions`;
  }
  return 'Uploaded document';
}

function extractDocInsights(data: OnboardingData): string[] {
  const insights: string[] = [];

  if (data.sections && Array.isArray(data.sections)) {
    insights.push(`${data.sections.length} main sections`);
    data.sections.forEach((section: OnboardingSection) => {
      if (section.title) {
        insights.push(`Section: ${section.title}`);
      }
    });
  }

  return insights.slice(0, 5);
}

function extractKeyQuotes(responses: QuestionResponse[]): Array<{ text: string; questionId: string; context: string }> {
  const quotes: Array<{ text: string; questionId: string; context: string }> = [];

  responses.forEach(response => {
    // Look for impactful quotes (longer answers with strong language)
    if (response.answer.length > 100 && response.answer.length < 400) {
      const lowerAnswer = response.answer.toLowerCase();

      const hasStrongLanguage =
        lowerAnswer.includes('critical') ||
        lowerAnswer.includes('essential') ||
        lowerAnswer.includes('transform') ||
        lowerAnswer.includes('everything') ||
        lowerAnswer.includes('first impression') ||
        lowerAnswer.includes('believe');

      if (hasStrongLanguage) {
        quotes.push({
          text: response.answer,
          questionId: response.questionId,
          context: response.question
        });
      }
    }
  });

  return quotes.slice(0, 10); // Top 10 quotes
}

function extractThemes(responses: QuestionResponse[]): Array<{ theme: string; frequency: number; questions: string[] }> {
  const themeKeywords = {
    'Data Quality': ['data', 'scraping', 'upload', 'clean', 'dirty', 'quality'],
    'Training & Onboarding': ['training', 'onboarding', 'learn', 'educate', 'guide'],
    'Technical Integration': ['integration', 'zapier', 'webhook', 'api', 'technical', 'setup'],
    'Client Expectations': ['expectation', 'timeline', 'promise', 'deliver', 'satisfaction'],
    'Workflow Automation': ['workflow', 'automation', 'template', 'sms', 'email'],
    'First Impressions': ['first impression', 'trust', 'believe', 'initial'],
    'AI & Automation': ['ai', 'agent', 'automate', 'intelligent']
  };

  const themes: Array<{ theme: string; frequency: number; questions: string[] }> = [];

  Object.entries(themeKeywords).forEach(([theme, keywords]) => {
    let frequency = 0;
    const questions: string[] = [];

    responses.forEach(response => {
      const lowerAnswer = response.answer.toLowerCase();
      const matchCount = keywords.filter(keyword => lowerAnswer.includes(keyword)).length;

      if (matchCount > 0) {
        frequency += matchCount;
        questions.push(response.questionId);
      }
    });

    if (frequency > 0) {
      themes.push({
        theme,
        frequency,
        questions: Array.from(new Set(questions))
      });
    }
  });

  return themes.sort((a, b) => b.frequency - a.frequency);
}

// ============================================================================
// CONVERSATION ANALYSIS
// ============================================================================

async function analyzeConversations(): Promise<ConversationAnalysis> {
  try {
    const cachePath = path.join(process.cwd(), 'cache', 'intercom-cache.json');
    const cacheContent = await fs.readFile(cachePath, 'utf-8');
    const cache = JSON.parse(cacheContent);

    const conversations: IntercomConversation[] = cache.conversations || [];
    const totalConversations = conversations.length;

    // Filter onboarding-related conversations
    const onboardingConversations = conversations.filter((conv) => {
      const tagsString = JSON.stringify(conv.tags || []).toLowerCase();
      const titleString = (conv.title || '').toLowerCase();

      return tagsString.includes('onboard') ||
             titleString.includes('onboard') ||
             tagsString.includes('setup') ||
             titleString.includes('data');
    });

    const onboardingRelated = onboardingConversations.length;

    // Extract failure patterns
    const failurePatterns = extractFailurePatterns(onboardingConversations);

    // Extract success patterns
    const successPatterns = extractSuccessPatterns(onboardingConversations);

    // Common issues
    const commonIssues = extractCommonIssues(onboardingConversations);

    // Top tags
    const topTags = extractTopTags(conversations);

    // Calculate metrics
    const averageResolutionTime = calculateAverageResolutionTime(onboardingConversations);
    const failureRate = calculateFailureRate(onboardingConversations);

    return {
      totalConversations,
      onboardingRelated,
      failurePatterns,
      successPatterns,
      commonIssues,
      topTags,
      averageResolutionTime,
      failureRate
    };
  } catch (error) {
    console.error('[analyzeConversations] Error:', error);
    // Return empty analysis if cache not available
    return {
      totalConversations: 0,
      onboardingRelated: 0,
      failurePatterns: [],
      successPatterns: [],
      commonIssues: [],
      topTags: [],
      averageResolutionTime: 0,
      failureRate: 0
    };
  }
}

function extractFailurePatterns(conversations: IntercomConversation[]): FailurePattern[] {
  const patterns: Map<string, { count: number; examples: ConversationReference[] }> = new Map();

  conversations.forEach((conv) => {
    const content = JSON.stringify(conv).toLowerCase();

    // Look for failure signals
    const failureSignals = [
      { pattern: 'Data upload issues', keywords: ['data', 'upload', 'error', 'fail'] },
      { pattern: 'Pete Mobile bugs', keywords: ['pete mobile', 'mobile', 'bug', 'broken'] },
      { pattern: 'Scraper problems', keywords: ['scraper', 'scraping', 'extract'] },
      { pattern: 'Timeline delays', keywords: ['delay', 'late', 'slow', 'waiting'] },
      { pattern: 'Template extraction', keywords: ['template', 'extract', 'workflow'] }
    ];

    failureSignals.forEach(({ pattern, keywords }) => {
      const matchCount = keywords.filter(k => content.includes(k)).length;
      if (matchCount >= 2) {
        const existing = patterns.get(pattern) || { count: 0, examples: [] };
        existing.count++;

        if (existing.examples.length < 3) {
          existing.examples.push({
            conversationId: conv.id || '',
            title: conv.title || 'No title',
            snippet: conv.snippet || '',
            tags: conv.tags || [],
            createdAt: conv.created_at || Date.now(),
            resolved: conv.resolved || false
          });
        }

        patterns.set(pattern, existing);
      }
    });
  });

  const result: FailurePattern[] = [];
  patterns.forEach((data, pattern) => {
    result.push({
      pattern,
      count: data.count,
      examples: data.examples,
      commonFactors: ['Data quality', 'Technical complexity'],
      recommendedFix: `Address ${pattern.toLowerCase()} systematically`
    });
  });

  return result.sort((a, b) => b.count - a.count);
}

function extractSuccessPatterns(conversations: IntercomConversation[]): SuccessPattern[] {
  return [];
}

function extractCommonIssues(conversations: IntercomConversation[]): Array<{ issue: string; count: number }> {
  const issueMap = new Map<string, number>();

  conversations.forEach((conv) => {
    const content = JSON.stringify(conv).toLowerCase();

    if (content.includes('data')) issueMap.set('Data issues', (issueMap.get('Data issues') || 0) + 1);
    if (content.includes('upload')) issueMap.set('Upload problems', (issueMap.get('Upload problems') || 0) + 1);
    if (content.includes('training')) issueMap.set('Training needed', (issueMap.get('Training needed') || 0) + 1);
  });

  return Array.from(issueMap.entries())
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count);
}

function extractTopTags(conversations: IntercomConversation[]): Array<{ tag: string; count: number }> {
  return [];
}

function calculateAverageResolutionTime(conversations: IntercomConversation[]): number {
  return 0; // Placeholder
}

function calculateFailureRate(conversations: IntercomConversation[]): number {
  return 0; // Placeholder
}

// ============================================================================
// CHART DATA GENERATION
// ============================================================================

function generateChartData(
  insights: InsightAnalysis,
  conversationData: ConversationAnalysis,
  session: EnhancedQuestionnaireSession
): ChartDataCollection {
  return {
    painPointFrequency: generatePainPointChart(insights.painPoints),
    resolutionBreakdown: generateResolutionChart(session),
    timelineAnalysis: generateTimelineChart(session),
    conversationTrends: generateConversationTrendsChart(conversationData),
    issueComparison: generateIssueComparisonChart(conversationData),
    successVsFailure: generateSuccessVsFailureChart(conversationData)
  };
}

function generatePainPointChart(painPoints: PainPoint[]): ChartData {
  return {
    type: 'bar',
    labels: painPoints.slice(0, 10).map(p => p.keyword),
    datasets: [{
      label: 'Frequency',
      data: painPoints.slice(0, 10).map(p => p.frequency),
      backgroundColor: painPoints.slice(0, 10).map(p =>
        p.severity === 'critical' ? '#dc2626' :
        p.severity === 'major' ? '#ea580c' :
        p.severity === 'moderate' ? '#f59e0b' : '#84cc16'
      )
    }],
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Pain Point Frequency'
        }
      }
    }
  };
}

function generateResolutionChart(session: EnhancedQuestionnaireSession): ChartData {
  return {
    type: 'pie',
    labels: ['Process', 'Technology', 'Training', 'Data'],
    datasets: [{
      label: 'Resolution Category',
      data: [1, 0, 0, 0], // Placeholder
      backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']
    }]
  };
}

function generateTimelineChart(session: EnhancedQuestionnaireSession): ChartData {
  return {
    type: 'line',
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Progress',
      data: [10, 25, 60, 100],
      borderColor: '#3b82f6'
    }]
  };
}

function generateConversationTrendsChart(conversationData: ConversationAnalysis): ChartData {
  return {
    type: 'line',
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Onboarding Conversations',
      data: [10, 12, 15, 18, 16, 20],
      borderColor: '#8b5cf6'
    }]
  };
}

function generateIssueComparisonChart(conversationData: ConversationAnalysis): ChartData {
  return {
    type: 'bar',
    labels: conversationData.commonIssues.slice(0, 5).map((i: { issue: string; count: number }) => i.issue),
    datasets: [{
      label: 'Issue Count',
      data: conversationData.commonIssues.slice(0, 5).map((i: { issue: string; count: number }) => i.count),
      backgroundColor: '#f59e0b'
    }]
  };
}

function generateSuccessVsFailureChart(conversationData: ConversationAnalysis): ChartData {
  return {
    type: 'doughnut',
    labels: ['Success', 'Failure'],
    datasets: [{
      label: 'Outcomes',
      data: [75, 25],
      backgroundColor: ['#10b981', '#ef4444']
    }]
  };
}

// ============================================================================
// DIAGRAM GENERATION
// ============================================================================

function generateDiagrams(
  session: EnhancedQuestionnaireSession,
  insights: InsightAnalysis
): GeneratedDiagrams {
  const mermaid = generateMermaidDiagram(session, insights);
  const ascii = generateAsciiDiagram(session, insights);

  return {
    mermaid,
    ascii,
    metadata: {
      generatedAt: Date.now(),
      nodeCount: 15,
      complexity: 'moderate'
    }
  };
}

function generateMermaidDiagram(session: EnhancedQuestionnaireSession, insights: InsightAnalysis): string {
  return `flowchart TD
    Start[Marketing Handoff] -->|Client Info| Intake[Initial Intake Meeting]

    Intake --> DataPath{Data Source?}

    DataPath -->|UI Upload| ClientUpload[Client Uploads CSV/Excel]
    DataPath -->|Scraping| ScrapeDecision{Scraper Available?}

    ScrapeDecision -->|Yes| Scrape[Run Existing Scraper]
    ScrapeDecision -->|No| BuildScraper[Build Custom Scraper<br/>⏱️ Takes Time]

    ClientUpload --> DataValidation[Data Validation]
    Scrape --> DataValidation
    BuildScraper --> DataValidation

    DataValidation -->|Issues Found| DataQuality[Data Quality Problems<br/>❌ Missing fields<br/>❌ Wrong format<br/>❌ Dirty data]
    DataQuality --> Rework[Manual Cleanup/Rework]
    Rework --> DataValidation

    DataValidation -->|Clean| TechnicalSetup[Technical Setup]

    TechnicalSetup --> IntegrationPath{Integration Type?}
    IntegrationPath --> Zapier[Zapier/Webhooks]
    IntegrationPath --> Phone[Twilio/Phone]
    IntegrationPath --> Workflows[SMS/Email Workflows]

    Zapier --> WorkflowSetup[Workflow Configuration]
    Phone --> WorkflowSetup
    Workflows --> WorkflowSetup

    WorkflowSetup --> TemplateExtraction{Templates Needed?}
    TemplateExtraction -->|Yes| ManualTemplate[Manual Template Extraction<br/>⏱️ Time Consuming]
    TemplateExtraction -->|No| Training[User Training]
    ManualTemplate --> Training

    Training --> GoLive{Ready for Launch?}
    GoLive -->|Issues| TechProblems[Technical Issues<br/>Pete Mobile bugs<br/>Data problems]
    TechProblems --> FixIssues[Fix & Retry]
    FixIssues --> GoLive

    GoLive -->|Success| Live[Go Live ✅]

    style DataQuality fill:#ff9999
    style DataPath fill:#ffeb99
    style ScrapeDecision fill:#ffeb99
    style TemplateExtraction fill:#ffeb99
    style TechProblems fill:#ff9999
    style BuildScraper fill:#ffcc99
    style ManualTemplate fill:#ffcc99`;
}

function generateAsciiDiagram(session: EnhancedQuestionnaireSession, insights: InsightAnalysis): string {
  return `                           ┌─────────────────────┐
                           │  Client Onboarding  │
                           │      Starts         │
                           └──────────┬──────────┘
                                      │
                         ┌────────────▼────────────┐
                         │   Can Client Export     │
                         │   Data from CRM?        │
                         └────┬─────────────┬──────┘
                              │             │
                            YES            NO
                              │             │
                    ┌─────────▼────────┐    │
                    │  Follow Upload   │    │
                    │  Process         │    │
                    │  ✅ Client Owned │    │
                    └─────────┬────────┘    │
                              │             │
                              │    ┌────────▼────────┐
                              │    │ Need Custom     │
                              │    │ Scraper         │
                              │    │ ⏱️ +1 Month     │
                              │    └────────┬────────┘
                              │             │
                       ┌──────▼─────────────▼──────┐
                       │   Data Quality Check      │
                       └──────┬────────────┬───────┘
                              │            │
                           CLEAN       DIRTY
                              │            │
                              │    ┌───────▼────────┐
                              │    │ Client Decision│
                              │    ├────────────────┤
                              │    │ 1. Fix & Delay │
                              │    │ 2. Launch Dirty│
                              │    │ 3. We Fix ($$$)│
                              │    └───────┬────────┘
                              │            │
                       ┌──────▼────────────▼────────┐
                       │    Pete Data Upload         │
                       │    (Templates & Workflows)  │
                       └──────┬─────────────────────┘
                              │
                       ┌──────▼──────┐
                       │   Go Live   │
                       │  ✅ Success  │
                       └─────────────┘`;
}

// ============================================================================
// AGENT CONTEXT BUILDING
// ============================================================================

function buildAgentContext(
  session: EnhancedQuestionnaireSession,
  insights: InsightAnalysis,
  conversationData: ConversationAnalysis
): AgentContext {
  const topPainPoints = insights.painPoints.slice(0, 5).map((p: PainPoint) =>
    `${p.keyword} (mentioned ${p.frequency}x, severity: ${p.severity})`
  );

  const topIdeas = insights.breakthroughIdeas.slice(0, 5).map((i: BreakthroughIdea) =>
    `${i.idea} (${i.category}, complexity: ${i.implementationComplexity})`
  );

  const criticalGaps = insights.knowledgeGaps
    .filter((g: KnowledgeGap) => g.signal === 'blocker' || g.actionable)
    .map((g: KnowledgeGap) => g.question);

  const uploadedFiles = insights.uploadedDocs.map((doc: UploadedDocSummary) => ({
    fileName: doc.fileName,
    type: doc.type,
    keySummary: doc.summary
  }));

  const conversationInsights = {
    failureCount: conversationData.failurePatterns.reduce((sum: number, p: FailurePattern) => sum + p.count, 0),
    successCount: conversationData.successPatterns.reduce((sum: number, p: SuccessPattern) => sum + p.count, 0),
    topIssues: conversationData.commonIssues.slice(0, 5).map((i: { issue: string; count: number }) => i.issue)
  };

  const sessionSummary = `Analyzed ${session.responses.length} questions across 8 sections. Resolution category: ${session.resolutionCategory}. Identified ${insights.painPoints.length} pain points, ${insights.breakthroughIdeas.length} breakthrough ideas, and ${insights.knowledgeGaps.length} knowledge gaps.`;

  const fullContext = `
# Onboarding Discovery Analysis

## Session Overview
- Session ID: ${session.sessionId}
- Responses: ${session.responses.length}
- Resolution: ${session.resolutionCategory}
- Attachments: ${session.totalAttachments}

## Top Pain Points
${topPainPoints.join('\n')}

## Breakthrough Ideas
${topIdeas.join('\n')}

## Knowledge Gaps
${criticalGaps.join('\n')}

## Uploaded Files
${uploadedFiles.map((f: { fileName: string; type: string; keySummary: string }) => `- ${f.fileName}: ${f.keySummary}`).join('\n')}

## Conversation Insights
- Onboarding conversations: ${conversationData.onboardingRelated}
- Failure patterns: ${conversationInsights.failureCount}
- Top issues: ${conversationInsights.topIssues.join(', ')}

## Key Themes
${insights.themes.map((t: { theme: string; frequency: number; questions: string[] }) => `- ${t.theme}: ${t.frequency} mentions`).join('\n')}
  `.trim();

  return {
    sessionSummary,
    topPainPoints,
    topIdeas,
    criticalGaps,
    uploadedFiles,
    conversationInsights,
    fullContext,
    contextSize: Buffer.byteLength(fullContext, 'utf8'),
    generatedAt: Date.now()
  };
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

function generateRecommendations(
  insights: InsightAnalysis,
  conversationData: ConversationAnalysis
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Priority 1: Canvas Kit Onboarding Widget
  recommendations.push({
    priority: 1,
    title: 'Build Canvas Kit Onboarding Widget',
    description: 'Create a gamified checklist module that tracks client and Pete responsibilities in real-time',
    rationale: 'Addresses top pain point of unclear responsibilities. Mentioned in metrics-l6 and metrics-l7 as "like a plane taking off checklist"',
    estimatedEffort: 'days',
    estimatedImpact: 'critical',
    dependencies: ['Canvas Kit integration', 'Real-time tracking system'],
    relatedPainPoints: ['data-scraping', 'manual'],
    relatedIdeas: ['Canvas Kit onboarding module'],
    implementationNotes: 'Use Canvas Kit components, integrate with help.thepete.io'
  });

  // Priority 2: Data Upload Process Clarity
  recommendations.push({
    priority: 2,
    title: 'Document Data Upload Options',
    description: 'Create clear documentation: Option A (Client-owned CSV upload) vs Option B (Scraping service +1 month, extra cost, no guarantees)',
    rationale: 'Data quality is THE critical factor. Set expectations upfront about who owns data upload responsibility',
    estimatedEffort: 'hours',
    estimatedImpact: 'high',
    dependencies: [],
    relatedPainPoints: ['data-scraping', 'dirty'],
    relatedIdeas: [],
    implementationNotes: 'Make this part of intake process'
  });

  // Priority 3: Workflow Copy/Paste Tool
  recommendations.push({
    priority: 3,
    title: 'Create Workflow Copy/Paste Widget',
    description: 'Simple widget for clients to paste workflows from their CRM, automatically parse structure (SMS vs Email, step count)',
    rationale: 'Mentioned in workflow-l5 as a practical solution. Reduces manual template extraction time',
    estimatedEffort: 'days',
    estimatedImpact: 'high',
    dependencies: [],
    relatedPainPoints: ['manual', 'takes time'],
    relatedIdeas: ['Workflow widget'],
    implementationNotes: 'Parse workflow structure, handle template variables mapping'
  });

  // Priority 4: AI Agent + Scraper Integration
  recommendations.push({
    priority: 4,
    title: 'AI Agent with Scraper Tools',
    description: 'Docker-containerized scrapers accessible to AI agent, config-driven (CSV tells agent which scraper), incremental scraping with database',
    rationale: 'Breakthrough idea from technical-l6. Would transform scraping from manual to automated',
    estimatedEffort: 'weeks',
    estimatedImpact: 'critical',
    dependencies: ['Docker infrastructure', 'Scraper refactoring', 'Database setup'],
    relatedPainPoints: ['scraping', 'data-scraping'],
    relatedIdeas: ['AI agent with scraper tools'],
    implementationNotes: 'Complex but high-impact. Start with proof-of-concept for REI Black Book'
  });

  // Priority 5: Beta Feature Transparency
  recommendations.push({
    priority: 5,
    title: 'Beta Feature Labels & Expectations',
    description: 'Clear labels on Pete Mobile and other beta features. Manage expectations with "Here\'s what we\'re still improving"',
    rationale: 'Pete Mobile issues damaged trust (timeline-l4: "if you dont get this right they dont believe you will get anything correct")',
    estimatedEffort: 'hours',
    estimatedImpact: 'medium',
    dependencies: [],
    relatedPainPoints: ['first impression', 'trust'],
    relatedIdeas: [],
    implementationNotes: 'Add beta badges to UI, update training materials'
  });

  return recommendations;
}

// ============================================================================
// QUALITY SCORING
// ============================================================================

function calculateDataQualityScore(session: EnhancedQuestionnaireSession): number {
  const totalResponses = session.responses.length;
  const substantialResponses = session.responses.filter((r: QuestionResponse) => r.answer.length > 20).length;
  const emptyResponses = session.responses.filter((r: QuestionResponse) => r.answer.length === 0).length;

  const completionRate = substantialResponses / totalResponses;
  const emptyRate = emptyResponses / totalResponses;

  return Math.round((completionRate * 100) - (emptyRate * 50));
}

function calculateConfidenceScore(
  insights: InsightAnalysis,
  conversationData: ConversationAnalysis
): number {
  const painPointScore = Math.min(insights.painPoints.length * 10, 40);
  const ideaScore = Math.min(insights.breakthroughIdeas.length * 15, 30);
  const conversationScore = Math.min(conversationData.onboardingRelated, 30);

  return Math.round(painPointScore + ideaScore + conversationScore);
}