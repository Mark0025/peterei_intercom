/**
 * Conversation Analysis Agent (LangGraph)
 *
 * AI agent specialized in analyzing Intercom conversations to identify
 * patterns, gaps, escalation triggers, and resolution strategies.
 */

import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END, START } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  analyzeConversations,
  identifySuccessPatterns,
  identifyFailurePatterns,
  identifyEscalationTriggers,
  identifyCommonIssues,
  identifyGaps,
  identifyResolutionStrategies
} from './conversation-tools';
import {
  generateConversationFlowDiagram,
  generateResolutionPathDiagram,
  generateEscalationFlowchart,
  generateCategoryPatternDiagram
} from '@/lib/conversation-mermaid';
import { getSmartCache } from './smart-cache';
import type { ConversationFilters } from '@/types/conversation-analysis';

// ============================================================================
// Agent State
// ============================================================================

interface ConversationAgentState {
  messages: BaseMessage[];
  category?: string;
  next: string;
}

// ============================================================================
// System Prompt
// ============================================================================

const SYSTEM_PROMPT = `You are PeteAI Conversation Analyst, an expert at analyzing Intercom support conversations.

🎯 YOUR MISSION
Analyze conversation patterns to help admins improve their support process by:
- Identifying what causes escalations
- Finding gaps in the support workflow
- Discovering successful resolution patterns
- Spotting common issues that slow down support

📊 AVAILABLE TOOLS

1. **analyze_all_conversations** - Get comprehensive analysis with all patterns, gaps, and metrics
2. **get_success_patterns** - Find what works well (quick resolutions, high satisfaction)
3. **get_failure_patterns** - Identify problematic patterns (slow/failed resolutions)
4. **get_escalation_triggers** - Find what causes conversations to escalate
5. **get_common_issues** - Identify recurring problems with severity levels
6. **get_process_gaps** - Find weaknesses in the support process
7. **get_resolution_strategies** - Discover effective resolution approaches
8. **generate_flow_diagram** - Create Mermaid visualizations (resolution paths, escalations, journeys)

🧠 ANALYSIS APPROACH

When users ask questions:
1. **Use tools to get actual data** - Never make up statistics or patterns
2. **Be specific with numbers** - "15 conversations escalated" not "some conversations"
3. **Reference actual tags/categories** - Use real tags from the data
4. **Provide actionable insights** - Not just what's wrong, but how to fix it
5. **Generate diagrams when helpful** - Visual flows help understand patterns

📋 EXAMPLE INTERACTIONS

User: "What's causing escalations?"
→ MUST call get_escalation_triggers
→ Respond with specific triggers, frequencies, and common tags
→ Suggest calling generate_flow_diagram for visualization

User: "Show me a resolution path diagram"
→ MUST call generate_flow_diagram with type='resolution'
→ Return the Mermaid code for rendering

User: "What issues take the longest to resolve?"
→ MUST call get_common_issues
→ Sort by avgResolutionTime
→ Provide specific examples and suggestions

🎨 RESPONSE STYLE
- Direct and data-driven
- Reference specific numbers and tags
- Suggest visualizations when appropriate
- Provide actionable recommendations
- Use HTML for formatting when helpful (bold, lists, links)

⚠️ CRITICAL RULES
- **ALWAYS use tools** - Don't guess or make up data
- **ALWAYS provide Mermaid code EXACTLY as returned by tools** - Don't modify it
- **ALWAYS be specific** - "23 escalations in onboarding" not "several escalations"
- **ALWAYS suggest improvements** - Don't just identify problems`;

// ============================================================================
// LLM Configuration
// ============================================================================

const llm = new ChatOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  modelName: 'openai/gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 4000,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.PUBLIC_URL || 'http://localhost:3000',
      'X-Title': 'PeteAI Conversation Analysis',
    }
  }
});

// ============================================================================
// Tools
// ============================================================================

const analyzeAllConversationsTool = tool(
  async ({ category, tag }: { category?: string; tag?: string }) => {
    try {
      const filters: ConversationFilters = {};
      if (category) filters.category = category;
      if (tag) filters.tag = tag;

      const analysis = await analyzeConversations(filters);

      return {
        success: true,
        analysis: {
          total: analysis.totalAnalyzed,
          successPatterns: analysis.successPatterns.slice(0, 5),
          failurePatterns: analysis.failurePatterns.slice(0, 5),
          escalationTriggers: analysis.escalationTriggers.slice(0, 3),
          topIssues: analysis.commonIssues.slice(0, 3),
          gaps: analysis.gaps,
          topResolutionStrategies: analysis.resolutionStrategies.slice(0, 3),
          topTags: analysis.tagAnalysis.slice(0, 5),
          confidenceScore: analysis.metadata.confidenceScore
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
    name: "analyze_all_conversations",
    description: "Get comprehensive conversation analysis including patterns, gaps, and metrics",
    schema: z.object({
      category: z.string().optional().describe("Filter by category/tag"),
      tag: z.string().optional().describe("Filter by specific tag")
    })
  }
);

const getSuccessPatternsTool = tool(
  async ({ tag }: { tag?: string }) => {
    try {
      const cache = getSmartCache();
      const filters: ConversationFilters = tag ? { tag } : undefined;
      const patterns = identifySuccessPatterns(cache.conversations, filters);

      return {
        success: true,
        patterns: patterns.slice(0, 5).map(p => ({
          pattern: p.pattern,
          frequency: p.frequency,
          category: p.category,
          exampleIds: p.examples
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "get_success_patterns",
    description: "Identify patterns from successful/quick resolutions",
    schema: z.object({
      tag: z.string().optional().describe("Filter by tag")
    })
  }
);

const getFailurePatternsTool = tool(
  async ({ tag }: { tag?: string }) => {
    try {
      const cache = getSmartCache();
      const filters: ConversationFilters = tag ? { tag } : undefined;
      const patterns = identifyFailurePatterns(cache.conversations, filters);

      return {
        success: true,
        patterns: patterns.slice(0, 5).map(p => ({
          pattern: p.pattern,
          frequency: p.frequency,
          category: p.category
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "get_failure_patterns",
    description: "Identify patterns from slow/failed resolutions",
    schema: z.object({
      tag: z.string().optional().describe("Filter by tag")
    })
  }
);

const getEscalationTriggersTool = tool(
  async ({ tag }: { tag?: string }) => {
    try {
      const cache = getSmartCache();
      const filters: ConversationFilters = tag ? { tag } : undefined;
      const triggers = identifyEscalationTriggers(cache.conversations, filters);

      return {
        success: true,
        triggers: triggers.map(t => ({
          trigger: t.trigger,
          frequency: t.frequency,
          avgTimeToEscalation: Math.round(t.avgTimeToEscalation! / 3600) + ' hours',
          commonTags: t.commonTags
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "get_escalation_triggers",
    description: "Find what causes conversations to escalate to dev team",
    schema: z.object({
      tag: z.string().optional().describe("Filter by tag")
    })
  }
);

const getCommonIssuesTool = tool(
  async ({ tag }: { tag?: string }) => {
    try {
      const cache = getSmartCache();
      const filters: ConversationFilters = tag ? { tag } : undefined;
      const issues = identifyCommonIssues(cache.conversations, filters);

      return {
        success: true,
        issues: issues.map(i => ({
          issue: i.issue,
          severity: i.severity,
          frequency: i.frequency,
          affectedTags: i.affectedTags.slice(0, 3),
          suggestions: i.resolutionSuggestions
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "get_common_issues",
    description: "Identify recurring issues with severity levels",
    schema: z.object({
      tag: z.string().optional().describe("Filter by tag")
    })
  }
);

const getProcessGapsTool = tool(
  async ({ tag }: { tag?: string }) => {
    try {
      const cache = getSmartCache();
      const filters: ConversationFilters = tag ? { tag } : undefined;
      const gaps = identifyGaps(cache.conversations, filters);

      return {
        success: true,
        gaps: gaps.map(g => ({
          gap: g.gap,
          impact: g.impact,
          affectedCategories: g.affectedCategories,
          suggestedImprovement: g.suggestedImprovement,
          exampleConversations: g.relatedConversations.slice(0, 3)
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "get_process_gaps",
    description: "Find weaknesses and gaps in the support process",
    schema: z.object({
      tag: z.string().optional().describe("Filter by tag")
    })
  }
);

const getResolutionStrategiesTool = tool(
  async ({ tag }: { tag?: string }) => {
    try {
      const cache = getSmartCache();
      const filters: ConversationFilters = tag ? { tag } : undefined;
      const strategies = identifyResolutionStrategies(cache.conversations, filters);

      return {
        success: true,
        strategies: strategies.slice(0, 5).map(s => ({
          strategy: s.strategy,
          successRate: s.successRate + '%',
          avgResolutionTime: Math.round(s.avgResolutionTime / 3600) + ' hours',
          usedInConversations: s.usedInConversations,
          tags: s.tags
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "get_resolution_strategies",
    description: "Discover effective resolution approaches with success rates",
    schema: z.object({
      tag: z.string().optional().describe("Filter by tag")
    })
  }
);

const generateFlowDiagramTool = tool(
  async ({ type, category }: { type: 'resolution' | 'escalation' | 'journey' | 'category'; category?: string }) => {
    try {
      const cache = getSmartCache();
      const mermaidCode = generateConversationFlowDiagram(
        cache.conversations,
        type,
        category
      );

      return {
        success: true,
        mermaidCode,
        type,
        message: `CRITICAL: Include the following Mermaid diagram EXACTLY as provided:\n\n${mermaidCode}\n\nDo NOT modify this code.`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "generate_flow_diagram",
    description: "Generate Mermaid visualization of conversation flows. Types: 'resolution' (success vs failure paths), 'escalation' (what causes escalations), 'journey' (customer journey map), 'category' (category-specific patterns)",
    schema: z.object({
      type: z.enum(['resolution', 'escalation', 'journey', 'category']).describe("Type of diagram to generate"),
      category: z.string().optional().describe("Filter by category/tag")
    })
  }
);

// ============================================================================
// Bind Tools
// ============================================================================

const tools = [
  analyzeAllConversationsTool,
  getSuccessPatternsTool,
  getFailurePatternsTool,
  getEscalationTriggersTool,
  getCommonIssuesTool,
  getProcessGapsTool,
  getResolutionStrategiesTool,
  generateFlowDiagramTool
];

const llmWithTools = llm.bindTools(tools, {
  tool_choice: "auto"
});

// ============================================================================
// Agent Nodes
// ============================================================================

async function callModel(state: ConversationAgentState): Promise<Partial<ConversationAgentState>> {
  const messages = state.messages;
  const systemMessage = new SystemMessage({ content: SYSTEM_PROMPT });
  const response = await llmWithTools.invoke([systemMessage, ...messages]);
  return { messages: [response] };
}

async function callTools(state: ConversationAgentState): Promise<Partial<ConversationAgentState>> {
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
        const result = await tool.invoke(toolCall.args);
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

function shouldContinue(state: ConversationAgentState): string {
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
// Build Graph
// ============================================================================

const workflow = new StateGraph<ConversationAgentState>({
  channels: {
    messages: {
      value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      default: () => [],
    },
    category: {
      value: (x: string | undefined, y: string | undefined) => y ?? x,
      default: () => undefined,
    },
    next: {
      value: (x: string, y: string) => y ?? x,
      default: () => "",
    },
  },
});

workflow.addNode("agent", callModel);
workflow.addNode("tools", callTools);

workflow.addEdge(START, "agent");
workflow.addConditionalEdges("agent", shouldContinue, {
  tools: "tools",
  [END]: END,
});
workflow.addEdge("tools", "agent");

const agentApp = workflow.compile();

// ============================================================================
// Public API
// ============================================================================

export async function chatWithConversationAgent(
  message: string,
  category?: string,
  conversationHistory: BaseMessage[] = []
): Promise<{ success: boolean; message?: string; mermaidDiagram?: string; error?: string }> {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    const finalState = await agentApp.invoke({
      messages: [...conversationHistory, new HumanMessage({ content: message })],
      category,
      next: ""
    });

    const lastMessage = finalState.messages[finalState.messages.length - 1];
    const response = lastMessage && lastMessage._getType() === 'ai'
      ? (lastMessage as AIMessage).content as string
      : "I'm sorry, I couldn't process that request.";

    // Extract Mermaid diagram if present
    const mermaidMatch = response.match(/```mermaid\n([\s\S]*?)\n```/);
    const mermaidDiagram = mermaidMatch ? mermaidMatch[0] : undefined;

    return {
      success: true,
      message: response,
      mermaidDiagram
    };
  } catch (error) {
    console.error('[ConversationAgent] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
