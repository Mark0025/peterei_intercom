import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END, START } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { analyzeQuestionnaireSession } from "@/actions/questionnaire-analysis";
import type { CompleteAnalysisResult, ChartData } from "@/types/questionnaire-analysis";

/**
 * Onboarding Discovery Agent (LangGraph)
 *
 * This agent sits ON TOP of the NLP analysis layer and provides conversational intelligence.
 *
 * Architecture:
 * 1. NLP Layer (questionnaire-analysis.ts) - Extracts structured insights, prevents hallucinations
 * 2. Agent Layer (this file) - Reads NLP analysis as tool, provides conversational interface
 *
 * The agent has access to tools that call the NLP analysis, ensuring all responses are
 * grounded in actual data from the questionnaire and Intercom cache.
 */

// Agent state interface
interface OnboardingAgentState {
  messages: BaseMessage[];
  sessionId: string;
  analysis: CompleteAnalysisResult | null;
  next: string;
}

// Create LLM with OpenRouter - exact same config as working langraph-agent.ts
const llm = new ChatOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  modelName: 'openai/gpt-4o-mini',
  temperature: 0.1,
  maxTokens: 1000,
});

// ============================================================================
// TOOLS - NLP Analysis Layer Access
// ============================================================================

/**
 * Tool: Get Analysis Overview
 * Returns high-level summary of the NLP analysis
 */
const getAnalysisOverviewTool = tool(
  async ({ sessionId }: { sessionId: string }) => {
    try {
      const result = await analyzeQuestionnaireSession(sessionId);

      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Analysis failed' };
      }

      const { session, insights, conversationData, metadata } = result.data;

      return {
        success: true,
        overview: {
          sessionId: session.sessionId,
          totalResponses: session.responses.length,
          resolutionCategory: session.resolutionCategory,
          painPointsFound: insights.painPoints.length,
          breakthroughIdeasFound: insights.breakthroughIdeas.length,
          knowledgeGapsFound: insights.knowledgeGaps.length,
          uploadedDocsFound: insights.uploadedDocs.length,
          onboardingConversations: conversationData.onboardingRelated,
          dataQualityScore: metadata.dataQualityScore,
          confidenceScore: metadata.confidenceScore,
          topThemes: insights.themes.slice(0, 3).map(t => ({ theme: t.theme, frequency: t.frequency }))
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "get_analysis_overview",
    description: "Get high-level overview of the onboarding analysis including counts and quality scores",
    schema: z.object({
      sessionId: z.string().describe("The questionnaire session ID to analyze")
    })
  }
);

/**
 * Tool: Get Pain Points
 * Returns detailed pain points from NLP analysis
 */
const getPainPointsTool = tool(
  async ({ sessionId, minFrequency = 2 }: { sessionId: string; minFrequency?: number }) => {
    try {
      const result = await analyzeQuestionnaireSession(sessionId);

      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Analysis failed' };
      }

      const painPoints = result.data.insights.painPoints
        .filter(p => p.frequency >= minFrequency)
        .map(p => ({
          keyword: p.keyword,
          frequency: p.frequency,
          severity: p.severity,
          sampleQuotes: p.quotes.slice(0, 2),
          questionIds: p.questionIds
        }));

      return {
        success: true,
        painPoints,
        topPainPoint: painPoints[0] || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "get_pain_points",
    description: "Get detailed pain points identified in the questionnaire with quotes and severity",
    schema: z.object({
      sessionId: z.string().describe("The questionnaire session ID"),
      minFrequency: z.number().optional().describe("Minimum frequency to include (default: 2)")
    })
  }
);

/**
 * Tool: Get Breakthrough Ideas
 * Returns innovation opportunities from responses
 */
const getBreakthroughIdeasTool = tool(
  async ({ sessionId, category }: { sessionId: string; category?: string }) => {
    try {
      const result = await analyzeQuestionnaireSession(sessionId);

      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Analysis failed' };
      }

      let ideas = result.data.insights.breakthroughIdeas;

      // Filter by category if provided
      if (category) {
        ideas = ideas.filter(i => i.category === category);
      }

      return {
        success: true,
        ideas: ideas.map(i => ({
          idea: i.idea,
          questionId: i.questionId,
          verbatim: i.verbatim,
          category: i.category,
          complexity: i.implementationComplexity,
          impact: i.estimatedImpact
        })),
        categories: ['product', 'process', 'technology', 'business-model']
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "get_breakthrough_ideas",
    description: "Get breakthrough ideas and innovation opportunities mentioned in responses",
    schema: z.object({
      sessionId: z.string().describe("The questionnaire session ID"),
      category: z.enum(['product', 'process', 'technology', 'business-model']).optional()
        .describe("Filter by category")
    })
  }
);

/**
 * Tool: Get Recommendations
 * Returns prioritized strategic recommendations
 */
const getRecommendationsTool = tool(
  async ({ sessionId, maxPriority = 5 }: { sessionId: string; maxPriority?: number }) => {
    try {
      const result = await analyzeQuestionnaireSession(sessionId);

      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Analysis failed' };
      }

      const recommendations = result.data.recommendations
        .filter(r => r.priority <= maxPriority)
        .map(r => ({
          priority: r.priority,
          title: r.title,
          description: r.description,
          rationale: r.rationale,
          effort: r.estimatedEffort,
          impact: r.estimatedImpact,
          dependencies: r.dependencies,
          notes: r.implementationNotes
        }));

      return {
        success: true,
        recommendations,
        topRecommendation: recommendations[0] || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "get_recommendations",
    description: "Get prioritized strategic recommendations based on the analysis",
    schema: z.object({
      sessionId: z.string().describe("The questionnaire session ID"),
      maxPriority: z.number().optional().describe("Maximum priority level to include (1-5, default: 5)")
    })
  }
);

/**
 * Tool: Find Conversations
 * Searches Intercom conversations related to a keyword
 */
const findConversationsTool = tool(
  async ({ sessionId, keyword }: { sessionId: string; keyword: string }) => {
    try {
      const result = await analyzeQuestionnaireSession(sessionId);

      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Analysis failed' };
      }

      const conversationData = result.data.conversationData;

      // Find failure patterns matching keyword
      const matchingFailures = conversationData.failurePatterns
        .filter(p => p.pattern.toLowerCase().includes(keyword.toLowerCase()))
        .map(p => ({
          pattern: p.pattern,
          count: p.count,
          examples: p.examples.slice(0, 2),
          fix: p.recommendedFix
        }));

      // Find common issues matching keyword
      const matchingIssues = conversationData.commonIssues
        .filter(i => i.issue.toLowerCase().includes(keyword.toLowerCase()));

      return {
        success: true,
        keyword,
        failurePatterns: matchingFailures,
        commonIssues: matchingIssues,
        totalOnboardingConversations: conversationData.onboardingRelated
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "find_conversations",
    description: "Search Intercom conversations cache for patterns related to a keyword",
    schema: z.object({
      sessionId: z.string().describe("The questionnaire session ID"),
      keyword: z.string().describe("Keyword to search for in conversation patterns")
    })
  }
);

/**
 * Tool: Generate Chart Data
 * Returns data for specific chart type
 */
const generateChartTool = tool(
  async ({ sessionId, chartType }: { sessionId: string; chartType: string }) => {
    try {
      const result = await analyzeQuestionnaireSession(sessionId);

      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Analysis failed' };
      }

      const charts = result.data.chartData;
      let chartData: ChartData | null = null;

      switch (chartType.toLowerCase()) {
        case 'pain_points':
        case 'painpoints':
          chartData = charts.painPointFrequency;
          break;
        case 'resolution':
          chartData = charts.resolutionBreakdown;
          break;
        case 'timeline':
          chartData = charts.timelineAnalysis;
          break;
        case 'conversations':
          chartData = charts.conversationTrends;
          break;
        case 'issues':
          chartData = charts.issueComparison;
          break;
        case 'success_failure':
          chartData = charts.successVsFailure;
          break;
        default:
          return {
            success: false,
            error: `Unknown chart type: ${chartType}. Available: pain_points, resolution, timeline, conversations, issues, success_failure`
          };
      }

      return {
        success: true,
        chartType,
        chartData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "generate_chart",
    description: "Generate chart data for visualization. Available types: pain_points, resolution, timeline, conversations, issues, success_failure",
    schema: z.object({
      sessionId: z.string().describe("The questionnaire session ID"),
      chartType: z.string().describe("Type of chart to generate")
    })
  }
);

/**
 * Tool: Estimate Effort
 * Provides effort estimation for implementing a feature/recommendation
 */
const estimateEffortTool = tool(
  async ({ sessionId, featureTitle }: { sessionId: string; featureTitle: string }) => {
    try {
      const result = await analyzeQuestionnaireSession(sessionId);

      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Analysis failed' };
      }

      // Find matching recommendation
      const recommendation = result.data.recommendations.find(r =>
        r.title.toLowerCase().includes(featureTitle.toLowerCase())
      );

      if (!recommendation) {
        return {
          success: false,
          error: `No recommendation found matching: ${featureTitle}`
        };
      }

      return {
        success: true,
        feature: recommendation.title,
        estimatedEffort: recommendation.estimatedEffort,
        estimatedImpact: recommendation.estimatedImpact,
        dependencies: recommendation.dependencies,
        rationale: recommendation.rationale
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "estimate_effort",
    description: "Get effort and impact estimation for implementing a specific feature or recommendation",
    schema: z.object({
      sessionId: z.string().describe("The questionnaire session ID"),
      featureTitle: z.string().describe("Title or keyword of the feature to estimate")
    })
  }
);

// Bind all tools
const tools = [
  getAnalysisOverviewTool,
  getPainPointsTool,
  getBreakthroughIdeasTool,
  getRecommendationsTool,
  findConversationsTool,
  generateChartTool,
  estimateEffortTool
];

const llmWithTools = llm.bindTools(tools);

// ============================================================================
// AGENT NODES
// ============================================================================

/**
 * System prompt builder - includes full context from NLP analysis
 */
function buildSystemPrompt(analysis: CompleteAnalysisResult | null): string {
  if (!analysis) {
    return `You are PeteAI, an intelligent onboarding analyst for PeteIRE.

You help analyze questionnaire responses to improve the onboarding process.

Use the available tools to access the NLP analysis of the questionnaire data.`;
  }

  const { agentContext, insights, conversationData, recommendations } = analysis;

  return `You are PeteAI, an intelligent onboarding analyst for PeteIRE.

You have access to a complete analysis of a 7-levels deep onboarding questionnaire with ${analysis.session.responses.length} responses.

# CONTEXT FROM NLP ANALYSIS

${agentContext.fullContext}

# YOUR CAPABILITIES

You have access to these tools to provide data-driven insights:

1. **get_analysis_overview** - Get high-level stats and quality scores
2. **get_pain_points** - Detailed pain points with severity and quotes
3. **get_breakthrough_ideas** - Innovation opportunities by category
4. **get_recommendations** - Prioritized strategic recommendations
5. **find_conversations** - Search Intercom conversation patterns
6. **generate_chart** - Create chart data for visualizations
7. **estimate_effort** - Effort/impact estimation for features

# YOUR ROLE

- Answer questions about the onboarding process based on ACTUAL DATA from the questionnaire
- Reference specific quotes, questions, and patterns when making points
- Use the tools to access detailed information - DO NOT make up data
- Be conversational but data-driven
- When asked "what should we build first", use get_recommendations and explain rationale with data
- When discussing pain points, reference the actual frequency and severity
- Connect questionnaire insights to Intercom conversation patterns

# RESPONSE STYLE

- Like talking to an expert consultant who has deep context
- Direct and actionable, not verbose
- Back claims with data: "mentioned X times", "found in Y questions"
- Reference breakthrough ideas from specific questions by questionId
- When uncertain, use tools to get accurate data

Remember: You're having a conversation about improving their onboarding based on real discovery data.`;
}

/**
 * Agent node - calls LLM with context and tools
 */
async function callModel(state: OnboardingAgentState): Promise<Partial<OnboardingAgentState>> {
  const messages = state.messages;
  const systemPrompt = buildSystemPrompt(state.analysis);

  const systemMessage = new SystemMessage({ content: systemPrompt });
  const response = await llmWithTools.invoke([systemMessage, ...messages]);

  return { messages: [response] };
}

/**
 * Tools node - executes tool calls
 */
async function callTools(state: OnboardingAgentState): Promise<Partial<OnboardingAgentState>> {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage || lastMessage._getType() !== 'ai') {
    return { messages: [] };
  }

  const aiMessage = lastMessage as AIMessage;
  if (!aiMessage.tool_calls || aiMessage.tool_calls.length === 0) {
    return { messages: [] };
  }

  const toolMessages = [];

  for (const toolCall of aiMessage.tool_calls) {
    const tool = tools.find(t => t.name === toolCall.name);
    if (tool) {
      try {
        // Inject sessionId if not provided
        const args = {
          sessionId: state.sessionId,
          ...toolCall.args
        };

        const result = await tool.invoke(args);
        toolMessages.push(new ToolMessage({
          content: JSON.stringify(result),
          tool_call_id: toolCall.id!,
        }));
      } catch (error) {
        toolMessages.push(new ToolMessage({
          content: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }),
          tool_call_id: toolCall.id!,
        }));
      }
    }
  }

  return { messages: toolMessages };
}

/**
 * Router - determines if we should continue to tools or end
 */
function shouldContinue(state: OnboardingAgentState): string {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  if (lastMessage && lastMessage._getType() === 'ai') {
    const aiMessage = lastMessage as AIMessage;
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      return "tools";
    }
  }

  return END;
}

// ============================================================================
// GRAPH CONSTRUCTION
// ============================================================================

/**
 * Build the LangGraph workflow
 */
function createOnboardingAgentGraph() {
  const workflow = new StateGraph<OnboardingAgentState>({
    channels: {
      messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
        default: () => [],
      },
      sessionId: {
        value: (x: string, y: string) => y ?? x,
        default: () => "",
      },
      analysis: {
        value: (x: CompleteAnalysisResult | null, y: CompleteAnalysisResult | null) => y ?? x,
        default: () => null,
      },
      next: {
        value: (x: string, y: string) => y ?? x,
        default: () => "",
      },
    },
  });

  // Add nodes
  workflow.addNode("agent", callModel);
  workflow.addNode("tools", callTools);

  // Add edges
  workflow.addEdge(START, "agent");
  workflow.addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    [END]: END,
  });
  workflow.addEdge("tools", "agent");

  return workflow.compile();
}

// Compile once at module load
const agentApp = createOnboardingAgentGraph();

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Main function - Process a message with the onboarding agent
 */
export async function chatWithOnboardingAgent(
  sessionId: string,
  message: string,
  conversationHistory: BaseMessage[] = []
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Check for API key with detailed error
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('[OnboardingAgent] OPENROUTER_API_KEY not found in environment');
      console.error('[OnboardingAgent] Available env vars:', Object.keys(process.env).filter(k => k.includes('OPEN')));
      throw new Error('OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your .env file and restart the dev server.');
    }

    console.log('[OnboardingAgent] API key found, length:', process.env.OPENROUTER_API_KEY.length);

    // Load analysis once for context (optional pre-load for better performance)
    let analysis: CompleteAnalysisResult | null = null;
    try {
      const result = await analyzeQuestionnaireSession(sessionId);
      if (result.success && result.data) {
        analysis = result.data;
      }
    } catch (error) {
      console.warn('[OnboardingAgent] Could not pre-load analysis:', error);
      // Continue without pre-loaded analysis - tools will fetch as needed
    }

    // Invoke the agent
    const finalState = await agentApp.invoke({
      messages: [...conversationHistory, new HumanMessage({ content: message })],
      sessionId,
      analysis,
      next: ""
    });

    // Extract response
    const lastMessage = finalState.messages[finalState.messages.length - 1];
    const response = lastMessage && lastMessage._getType() === 'ai'
      ? (lastMessage as AIMessage).content as string
      : "I'm sorry, I couldn't process that request.";

    return {
      success: true,
      message: response
    };
  } catch (error) {
    console.error('[OnboardingAgent] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Initialize conversation with suggested questions
 */
export function getOnboardingSuggestedQuestions(analysis: CompleteAnalysisResult | null): string[] {
  if (!analysis) {
    return [
      "What should we build first?",
      "Show me the top pain points",
      "What breakthrough ideas were mentioned?",
      "Give me strategic recommendations"
    ];
  }

  const suggestions = [
    "What should we build first?",
    "Show me failed onboarding examples",
    `Tell me about the "${analysis.insights.painPoints[0]?.keyword}" pain point`,
    "Which CRM causes the most issues?",
    "Estimate ROI for Canvas Kit widget"
  ];

  // Add dynamic suggestions based on analysis
  if (analysis.insights.breakthroughIdeas.length > 0) {
    suggestions.push("What are the breakthrough ideas?");
  }

  if (analysis.conversationData.failurePatterns.length > 0) {
    suggestions.push("What are the common failure patterns?");
  }

  return suggestions.slice(0, 6);
}