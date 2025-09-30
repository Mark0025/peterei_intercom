import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END, START } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { smartSearchContacts, smartSearchCompanies, getSmartCacheStatus, getSmartCache } from './smart-cache';
import { logInfo, logError } from './logger';
import { fuzzySearchCompany, getCompanyTimeline, extractCompanyAttributes } from './company-tools';

// Define the agent state
interface AgentState {
  messages: BaseMessage[];
  next: string;
}

// System prompt - tells the LLM to USE tools
const SYSTEM_PROMPT = `You are PeteAI, an expert Intercom assistant with access to powerful tools.

🎯 CRITICAL: You MUST use tools when asked about companies, contacts, or conversations.

Available Tools:
1. **fuzzy_search_company** - Find companies by name (handles typos like "strycam" → "Strycam")
2. **get_company_timeline** - Get full conversation history for a company
3. **extract_company_attributes** - Get all company metadata in JSON
4. **search_contacts** - Find contacts by email or name
5. **search_companies** - Search companies by name
6. **analyze_conversations** - Get conversation insights and stats
7. **get_cache_info** - Get cache status and sample data

📋 Examples of REQUIRED tool usage:
- "what company id is strycam?" → MUST call fuzzy_search_company("strycam")
- "show timeline for Stkcam" → MUST call get_company_timeline(company_id)
- "find john@example.com" → MUST call search_contacts(email="john@example.com")
- "get company attributes" → MUST call extract_company_attributes(company_id)

⚠️ DO NOT give generic responses about "94 companies" - USE THE TOOLS to get actual data!

Process:
1. Identify what the user is asking for
2. Select the appropriate tool
3. Call the tool with correct parameters
4. Use the tool's response to answer the question
5. Be specific with actual data from tools`;

// Create the LLM with proper configuration for OpenRouter
const llm = new ChatOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  modelName: 'openai/gpt-4o-mini',
  temperature: 0.7,  // Higher for better tool reasoning
  maxTokens: 4000,   // Enough space for tool calls + reasoning
  configuration: {
    defaultHeaders: {
      'HTTP-Referer': process.env.PUBLIC_URL || 'http://localhost:3000',
      'X-Title': 'PeteAI Intercom Assistant',
    }
  }
});

// Define tools for Intercom operations
const searchContactsTool = tool(
  async ({ email, name, live = false }) => {
    try {
      logInfo(`[LANGGRAPH] Searching contacts: email=${email || ''}, name=${name || ''}, live=${live}`);
      const contacts = await smartSearchContacts(email, name, live);
      return {
        success: true,
        count: contacts.length,
        contacts: contacts.slice(0, 10).map(c => ({
          id: c.id,
          name: c.name || 'No name',
          email: c.email || 'No email',
          companies: c.companies?.companies?.map(comp => comp.name) || [],
          last_seen: c.last_seen_at ? new Date(c.last_seen_at * 1000).toLocaleDateString() : 'Never',
          created: new Date(c.created_at * 1000).toLocaleDateString()
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
    name: "search_contacts",
    description: "Search for contacts in the Intercom workspace by email or name",
    schema: z.object({
      email: z.string().optional().describe("Email address to search for (partial matches allowed)"),
      name: z.string().optional().describe("Name to search for (partial matches allowed)"),
      live: z.boolean().optional().default(false).describe("Whether to search live data instead of cache")
    }),
  }
);

const searchCompaniesTool = tool(
  async ({ name, live = false }) => {
    try {
      logInfo(`[LANGGRAPH] Searching companies: name=${name || ''}, live=${live}`);
      const companies = await smartSearchCompanies(name, live);
      return {
        success: true,
        count: companies.length,
        companies: companies.slice(0, 10).map(c => ({
          id: c.id,
          name: c.name,
          user_count: c.user_count || 0,
          website: c.website || 'No website',
          created: new Date(c.created_at * 1000).toLocaleDateString(),
          monthly_spend: c.monthly_spend || 0
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
    name: "search_companies",
    description: "Search for companies in the Intercom workspace by name",
    schema: z.object({
      name: z.string().optional().describe("Company name to search for (partial matches allowed)"),
      live: z.boolean().optional().default(false).describe("Whether to search live data instead of cache")
    }),
  }
);

const getCacheInfoTool = tool(
  async () => {
    try {
      const status = getSmartCacheStatus();
      const cache = getSmartCache();
      
      // Get some sample data for context
      const recentContacts = cache.contacts.slice(0, 5).map(c => ({
        name: c.name || 'Unnamed',
        email: c.email || 'No email',
        company: c.companies?.companies?.[0]?.name || 'No company'
      }));

      const recentCompanies = cache.companies.slice(0, 5).map(c => ({
        name: c.name,
        users: c.user_count || 0
      }));

      return {
        success: true,
        lastRefreshed: status.lastRefreshed ? new Date(status.lastRefreshed).toLocaleString() : 'Never',
        counts: status.counts,
        metadata: status.metadata,
        cacheAge: status.cacheAge,
        isStale: status.isStale,
        sampleContacts: recentContacts,
        sampleCompanies: recentCompanies,
        totalConversations: cache.conversations.length,
        openConversations: cache.conversations.filter(c => c.open).length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "get_cache_info",
    description: "Get information about the Intercom data cache including counts and sample data",
    schema: z.object({}),
  }
);

const analyzeConversationsTool = tool(
  async ({ status, timeframe = "all" }: { status?: string; timeframe?: string }) => {
    try {
      const cache = getSmartCache();
      let conversations = cache.conversations;

      // Filter by status if provided
      if (status) {
        conversations = conversations.filter(c => c.state === status);
      }

      // Basic analysis
      const analysis = {
        total: conversations.length,
        byState: {
          open: conversations.filter(c => c.state === 'open').length,
          closed: conversations.filter(c => c.state === 'closed').length,
          snoozed: conversations.filter(c => c.state === 'snoozed').length
        },
        withRatings: conversations.filter(c => c.conversation_rating).length,
        averageRating: conversations.filter(c => c.conversation_rating)
          .reduce((acc, c) => acc + (c.conversation_rating?.rating || 0), 0) / 
          Math.max(conversations.filter(c => c.conversation_rating).length, 1),
        topTags: {} as Record<string, number>,
        recentActivity: conversations
          .sort((a, b) => b.updated_at - a.updated_at)
          .slice(0, 5)
          .map(c => ({
            id: c.id,
            state: c.state,
            updated: new Date(c.updated_at * 1000).toLocaleDateString(),
            priority: c.priority
          }))
      };

      // Count tags
      conversations.forEach(c => {
        c.tags?.tags?.forEach(tag => {
          analysis.topTags[tag.name] = (analysis.topTags[tag.name] || 0) + 1;
        });
      });

      return {
        success: true,
        analysis
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "analyze_conversations",
    description: "Analyze conversations by status, tags, ratings, and other metrics",
    schema: z.object({
      status: z.string().optional().describe("Filter by conversation status: open, closed, snoozed"),
      timeframe: z.string().optional().default("all").describe("Time frame to analyze: all, recent, week, month")
    }),
  }
);

// Company-specific tools for timeline analysis
const fuzzySearchCompanyTool = tool(
  async ({ searchTerm }: { searchTerm: string }) => {
    try {
      logInfo(`[LANGGRAPH] Fuzzy searching company: ${searchTerm}`);
      const result = await fuzzySearchCompany(searchTerm);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "fuzzy_search_company",
    description: "Search for companies using fuzzy matching (handles typos and partial names like 'stkcam' -> 'Stkcam')",
    schema: z.object({
      searchTerm: z.string().describe("Company name or partial name to search for")
    }),
  }
);

const getCompanyTimelineTool = tool(
  async ({ companyId }: { companyId: string }) => {
    try {
      logInfo(`[LANGGRAPH] Getting company timeline: ${companyId}`);
      const result = await getCompanyTimeline(companyId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "get_company_timeline",
    description: "Get complete conversation timeline for a specific company including all contacts and topics",
    schema: z.object({
      companyId: z.string().describe("The Intercom company ID")
    }),
  }
);

const extractCompanyAttributesTool = tool(
  async ({ companyId }: { companyId: string }) => {
    try {
      logInfo(`[LANGGRAPH] Extracting company attributes: ${companyId}`);
      const result = await extractCompanyAttributes(companyId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "extract_company_attributes",
    description: "Get all company attributes and metadata in JSON format",
    schema: z.object({
      companyId: z.string().describe("The Intercom company ID")
    }),
  }
);

// Bind tools to the LLM with auto tool selection
const tools = [
  searchContactsTool,
  searchCompaniesTool,
  getCacheInfoTool,
  analyzeConversationsTool,
  fuzzySearchCompanyTool,
  getCompanyTimelineTool,
  extractCompanyAttributesTool
];

// Enable automatic tool selection
const llmWithTools = llm.bindTools(tools, {
  tool_choice: "auto"  // Let LLM decide when to use tools intelligently
});

// Define the agent node
async function callModel(state: AgentState): Promise<Partial<AgentState>> {
  const messages = state.messages;
  
  // Add system context about Intercom data
  const systemMessage = new AIMessage({
    content: `You are PeteAI, an intelligent assistant for the Pete Intercom application. You have access to real Intercom data and can help with:

1. **Contact Management**: Search, analyze, and manage contacts
2. **Company Insights**: Find and analyze company data
3. **Conversation Analysis**: Analyze support tickets, ratings, and trends
4. **Cache Management**: Check data freshness and cache status

You can use the available tools to:
- search_contacts: Find specific contacts by email or name
- search_companies: Find companies by name
- get_cache_info: Get current data cache status and sample data
- analyze_conversations: Analyze conversation patterns and metrics

Be helpful, specific, and data-driven in your responses. When users ask about their Intercom data, always use the tools to provide accurate, real-time information.`
  });

  const response = await llmWithTools.invoke([systemMessage, ...messages]);
  return { messages: [response] };
}

// Define the tools node
async function callTools(state: AgentState): Promise<Partial<AgentState>> {
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

// Define the routing logic
function shouldContinue(state: AgentState): string {
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

// Create the graph
const workflow = new StateGraph<AgentState>({
  channels: {
    messages: {
      value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      default: () => [],
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

// Compile the graph
const app = workflow.compile();

// Main function to process messages
export async function processWithLangGraph(message: string): Promise<string> {
  try {
    logInfo(`[LANGGRAPH] Processing message: ${message.substring(0, 100)}...`);
    
    // Check if we have access to OpenRouter API
    if (!process.env.OPENROUTER_API_KEY) {
      logError('[LANGGRAPH] No OpenRouter API key found, cannot use LangGraph');
      throw new Error('OpenRouter API key not configured');
    }
    
    const finalState = await app.invoke({
      messages: [new HumanMessage({ content: message })],
      next: ""
    });
    
    const lastMessage = finalState.messages[finalState.messages.length - 1];
    const response = lastMessage && lastMessage._getType() === 'ai' 
      ? (lastMessage as AIMessage).content as string 
      : "I'm sorry, I couldn't process that request.";
    
    logInfo(`[LANGGRAPH] Response generated: ${response.substring(0, 100)}...`);
    return response;
    
  } catch (error) {
    logError(`[LANGGRAPH] Error processing message: ${error instanceof Error ? error.message : error}`);
    throw error; // Re-throw so the fallback can handle it
  }
}
