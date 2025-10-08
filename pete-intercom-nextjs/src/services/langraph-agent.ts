import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END, START, MemorySaver } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { smartSearchContacts, smartSearchCompanies, getSmartCacheStatus, getSmartCache } from './smart-cache';
import { logInfo, logError } from './logger';
import { fuzzySearchCompany, getCompanyTimeline, extractCompanyAttributes } from './company-tools';
import { PeteAIHelpLinks, HELP_PATHS } from '../utils/help-links';

// Define the agent state
interface AgentState {
  messages: BaseMessage[];
  next: string;
}

// System prompt - tells the LLM to USE tools
const SYSTEM_PROMPT = `You are PeteAI, an expert Intercom assistant with access to powerful tools.

🎯 CRITICAL: You MUST use tools when asked about companies, contacts, conversations, or help documentation.

📝 FORMATTING RULES:
- Use **bold** for emphasis and important terms
- Use numbered lists (1., 2., 3.) for step-by-step instructions
- Use bullet points (•) for feature lists or options
- Use > for quotes or important notes
- Keep paragraphs concise (2-3 sentences max)
- Add line breaks between sections for readability
- For email templates, use clear sections with headers
- Format code or technical terms in backticks when appropriate

Available Tools:
1. **search_conversation_content** - Search through actual conversation messages/content (use this for "porting", "twilio", etc.)
2. **fuzzy_search_company** - Find companies by name (handles typos like "strycam" → "Strycam")
3. **get_company_timeline** - Get full conversation history for a company
4. **extract_company_attributes** - Get all company metadata in JSON
5. **search_contacts** - Find contacts by email or name
6. **search_companies** - Search companies by name
7. **analyze_conversations** - Get conversation insights and stats
8. **get_cache_info** - Get cache status and sample data
8. **fetch_help_doc** - Fetch and analyze help documentation from Pete help center URL
9. **generate_process_map** - Generate Mermaid flowchart from step-by-step instructions
10. **recommend_help_doc** - Recommend relevant help documentation based on user's question
11. **generate_help_link** - Generate formatted HTML links to help documentation
12. **generate_multiple_help_links** - Generate multiple formatted HTML links to help documentation
13. **map_pete_app_route** - Map user actions to actual Pete app URLs (e.g., "upload data" → https://app.thepete.io/settings/general/import)

📋 Examples of REQUIRED tool usage:
- "how do we handle porting?" → MUST call search_conversation_content("porting")
- "what did we say about twilio?" → MUST call search_conversation_content("twilio")
- "find conversations about onboarding" → MUST call search_conversation_content("onboarding")
- "what company id is strycam?" → MUST call fuzzy_search_company("strycam")
- "show timeline for Stkcam" → MUST call get_company_timeline(company_id)
- "find john@example.com" → MUST call search_contacts(email="john@example.com")
- "get company attributes" → MUST call extract_company_attributes(company_id)
- "how do I upload data?" → MUST call recommend_help_doc("upload data") → fetch_help_doc(url) → generate_process_map(title, steps) → generate_help_link(path, text)
- "I need to upload data" → MUST call recommend_help_doc("upload data") then fetch and generate map
- "show me help links" → MUST call generate_help_link(path, text) or generate_multiple_help_links(links)
- "link to getting started" → MUST call generate_help_link("collections/10827028-getting-started", "Getting Started Guide")

🎨 Help Documentation Workflow:
**CRITICAL: When users ask HOW to do ANYTHING, you MUST use the help doc workflow:**
1. ALWAYS call recommend_help_doc with the user's question
2. Call fetch_help_doc with the recommended URL to read the actual documentation
   - This automatically extracts article links, collection links, and step-by-step instructions from <ol> tags
   - Use the extractedSteps array if available, or analyze the content to create your own steps
3. Analyze the fetched content and extract 3-5 simple, clear steps (use extractedSteps if provided)
4. **FOR STEPS WITH NAVIGATION - Build URL Array:**
   - For each navigation step (e.g., "Go to Settings → General → Import"):
   - Call map_pete_app_route to get the Pete app URL (e.g., "https://app.thepete.io/settings/general/import")
   - Build an array of URLs (one per step) - use empty string "" for steps without navigation
   - Example: ["", "https://app.thepete.io/settings/general/import", "https://app.thepete.io/properties", ""]
5. **MUST CALL generate_process_map tool** with title, steps array, stepUrls array, and sourceUrl:
   - This tool returns properly formatted Mermaid syntax with triple backticks and clickable nodes
   - Each step will be automatically assigned an icon (⚙️ for settings, 📤 for upload, 🎯 for select, ✅ for confirm)
   - DO NOT manually write Mermaid syntax - ALWAYS use the tool
   - Pass stepUrls array so each Mermaid node links to the corresponding Pete app page
6. **RESPONSE FORMAT (MUST FOLLOW EXACTLY):**
   - Start with: "Here's how to [action]:"
   - List 3-5 numbered steps with clickable navigation links formatted as: "**Step 1:** Go to <a href='URL'>Settings → General → Import</a>"
   - Include the Mermaid diagram from generate_process_map tool response (just paste it exactly)
   - End with: "**Reference**: This guide is based on [link]"
7. Call generate_help_link to create the reference link

**Questions that REQUIRE help doc workflow:**
- "how do I..." / "how to..." / "I need to..." / "I want to..." / "help me..." / "show me how..."
- ANY question about Pete features, setup, configuration, or usage

**Critical Formatting Rules:**
- Navigation paths MUST use breadcrumb arrows (→) and be clickable links
- Steps should be simple, action-oriented (3-5 steps max)
- Mermaid diagram should be clean and simple (not overly detailed)
- Always include a "Reference" section at the end linking to source documentation
- **URL Prefixes**:
  - Pete app navigation: https://app.thepete.io/ (e.g., https://app.thepete.io/settings/general/import)
  - Help documentation: https://help.thepete.io/en/ (e.g., https://help.thepete.io/en/collections/10827028-getting-started)
- Example: Settings → General → Import = https://app.thepete.io/settings/general/import

⚠️ DO NOT give generic responses about "94 companies" - USE THE TOOLS to get actual data!

Process:
1. Identify what the user is asking for
2. Select the appropriate tool
3. Call the tool with correct parameters
4. Use the tool's response to answer the question
5. Be specific with actual data from tools`;

// Create the LLM with proper configuration for OpenRouter
const llm = new ChatOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  modelName: 'openai/gpt-4o-mini',
  temperature: 0.7,  // Higher for better tool reasoning
  maxTokens: 4000,   // Enough space for tool calls + reasoning
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
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
          external_id: c.external_id || null,  // Pete user ID
          name: c.name || 'No name',
          email: c.email || 'No email',
          role: c.role || 'user',
          companies: c.companies?.companies?.map(comp => comp.name) || [],
          location: c.location ? `${c.location.city || ''}, ${c.location.region || ''}, ${c.location.country || ''}`.trim() : null,
          browser: c.browser || null,
          os: c.os || null,
          last_seen: c.last_seen_at ? new Date(c.last_seen_at * 1000).toLocaleDateString() : 'Never',
          created: new Date(c.created_at * 1000).toLocaleDateString(),
          custom_attributes: c.custom_attributes || {},  // All custom attributes including user_training_topic, WebinarConfirmed
          tags: c.tags?.data?.map((t: any) => t.name || t.id) || [],  // User tags
          segments: c.segments?.data?.map((s: any) => s.name || s.id) || []  // User segments
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
          id: c.id,  // Intercom ID
          company_id: c.company_id || null,  // Pete company ID (external ID)
          name: c.name,
          user_count: c.user_count || 0,
          website: c.website || 'No website',
          created: new Date(c.created_at * 1000).toLocaleDateString(),
          updated: new Date(c.updated_at * 1000).toLocaleDateString(),
          monthly_spend: c.monthly_spend || 0,
          session_count: c.session_count || 0,
          plan: c.plan?.name || null,  // Silver/Gold/Platinum/etc
          custom_attributes: c.custom_attributes || {},  // All custom attributes including Petetraining
          tags: c.tags?.tags?.map((t: any) => t.name || t.id) || [],  // Company tags
          segments: c.segments?.segments?.map((s: any) => s.name || s.id) || []  // Company segments
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

// Semantic conversation content search tool
const searchConversationContentTool = tool(
  async ({ searchTerm, limit = 10 }: { searchTerm: string; limit?: number }) => {
    try {
      logInfo(`[LANGGRAPH] Searching conversation content for: ${searchTerm}`);
      const cache = getSmartCache();
      const searchLower = searchTerm.toLowerCase();

      // Search through conversation parts (messages) for the search term
      const matches: Array<{
        conversationId: string;
        snippet: string;
        tags: string[];
        created: string;
        state: string;
      }> = [];

      cache.conversations.forEach(conv => {
        // Search in conversation parts if available
        const parts = (conv as any).conversation_parts?.conversation_parts || [];

        parts.forEach((part: any) => {
          const body = part.body || '';
          if (body.toLowerCase().includes(searchLower)) {
            // Extract snippet around the match
            const index = body.toLowerCase().indexOf(searchLower);
            const start = Math.max(0, index - 100);
            const end = Math.min(body.length, index + 150);
            const snippet = body.substring(start, end);

            matches.push({
              conversationId: conv.id,
              snippet: `...${snippet}...`,
              tags: conv.tags?.tags?.map((t: any) => t.name) || [],
              created: new Date(conv.created_at * 1000).toLocaleDateString(),
              state: conv.state
            });
          }
        });

        // Also search in title/subject if available
        const title = (conv as any).title || (conv as any).source?.subject || '';
        if (title.toLowerCase().includes(searchLower)) {
          matches.push({
            conversationId: conv.id,
            snippet: title,
            tags: conv.tags?.tags?.map((t: any) => t.name) || [],
            created: new Date(conv.created_at * 1000).toLocaleDateString(),
            state: conv.state
          });
        }
      });

      return {
        success: true,
        totalMatches: matches.length,
        conversations: matches.slice(0, limit),
        message: matches.length > 0
          ? `Found ${matches.length} conversations mentioning "${searchTerm}"`
          : `No conversations found mentioning "${searchTerm}"`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "search_conversation_content",
    description: "Search through actual conversation messages/content for specific terms or topics. Use this for semantic search when users ask about specific topics like 'porting', 'twilio', 'onboarding', etc. Searches through message bodies, not just tags.",
    schema: z.object({
      searchTerm: z.string().describe("The term or phrase to search for in conversation content"),
      limit: z.number().optional().default(10).describe("Maximum number of results to return (default: 10)")
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

// Fetch and analyze help documentation tool
const fetchHelpDocTool = tool(
  async ({ url }: { url: string }) => {
    try {
      logInfo(`[LANGGRAPH] Fetching help doc from: ${url}`);

      // Use Node.js fetch to get the help doc content
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Extract article links from the page
      const articleLinks: Array<{ title: string; url: string }> = [];
      const articleRegex = /<a[^>]+href="(\/en\/articles\/[^"]+)"[^>]*>([^<]+)<\/a>/gi;
      let articleMatch;
      while ((articleMatch = articleRegex.exec(html)) !== null) {
        articleLinks.push({
          title: articleMatch[2].trim(),
          url: `https://help.thepete.io${articleMatch[1]}`
        });
      }

      // Extract collection links
      const collectionLinks: Array<{ title: string; url: string }> = [];
      const collectionRegex = /<a[^>]+href="(\/en\/collections\/[^"]+)"[^>]*>([^<]+)<\/a>/gi;
      let collectionMatch;
      while ((collectionMatch = collectionRegex.exec(html)) !== null) {
        collectionLinks.push({
          title: collectionMatch[2].trim(),
          url: `https://help.thepete.io${collectionMatch[1]}`
        });
      }

      // Simple HTML parsing - extract text content
      // Remove script and style tags
      let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

      // Extract ordered list items (steps) more precisely
      const orderedListRegex = /<ol[^>]*>([\s\S]*?)<\/ol>/gi;
      const listMatches = content.match(orderedListRegex);
      const extractedSteps: string[] = [];

      if (listMatches) {
        listMatches.forEach(olBlock => {
          const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
          let liMatch;
          while ((liMatch = liRegex.exec(olBlock)) !== null) {
            const stepText = liMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            if (stepText.length > 5) {
              extractedSteps.push(stepText);
            }
          }
        });
      }

      // Extract text between tags (simplified)
      content = content.replace(/<[^>]+>/g, ' ');

      // Clean up whitespace
      content = content.replace(/\s+/g, ' ').trim();

      // Limit to first 2000 characters for token efficiency
      const summary = content.substring(0, 2000);

      return {
        success: true,
        url,
        content: summary,
        fullLength: content.length,
        articleLinks: articleLinks.slice(0, 5), // Top 5 article links
        collectionLinks: collectionLinks.slice(0, 3), // Top 3 collection links
        extractedSteps, // Automatically extracted steps from <ol> tags
        message: "Help doc fetched successfully. Analyze this content to create a process map with contextual links."
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: "Failed to fetch help documentation. Please try a different URL."
      };
    }
  },
  {
    name: "fetch_help_doc",
    description: "Fetch and analyze help documentation from Pete help center URL to extract step-by-step instructions and related article links",
    schema: z.object({
      url: z.string().describe("The full URL to the help documentation article to fetch")
    }),
  }
);

// Generate Mermaid process map tool
const generateProcessMapTool = tool(
  async ({ title, steps, stepUrls, sourceUrl }: { title: string; steps: string[]; stepUrls?: string[]; sourceUrl?: string }) => {
    try {
      logInfo(`[LANGGRAPH] Generating process map: ${title}`);

      if (!steps || steps.length === 0) {
        return {
          success: false,
          error: "No steps provided for process map"
        };
      }

      // Generate Mermaid flowchart syntax
      let mermaid = `graph TD\n`;

      // Escape title for Mermaid
      const safeTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 30);
      mermaid += `    Start([${safeTitle}])\n`;

      // Add steps with sequential connections
      steps.forEach((step, index) => {
        const stepId = `Step${index + 1}`;
        const nextStepId = index < steps.length - 1 ? `Step${index + 2}` : 'End';

        // Add icon based on step content
        let icon = '📝'; // Default
        if (step.toLowerCase().includes('settings') || step.toLowerCase().includes('general')) icon = '⚙️';
        if (step.toLowerCase().includes('import') || step.toLowerCase().includes('upload')) icon = '📤';
        if (step.toLowerCase().includes('select') || step.toLowerCase().includes('choose')) icon = '🎯';
        if (step.toLowerCase().includes('confirm') || step.toLowerCase().includes('review')) icon = '✅';

        // Properly escape special characters for Mermaid
        const stepText = step
          .replace(/[\[\](){}]/g, '') // Remove brackets and parentheses
          .replace(/["']/g, '') // Remove quotes
          .replace(/[^\w\s-]/g, ' ') // Replace special chars with spaces
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
          .substring(0, 45); // Shorter to make room for icon

        const stepLabel = `${icon} ${stepText}`;

        if (index === 0) {
          mermaid += `    Start --> ${stepId}["${stepLabel}"]\n`;
        }

        if (index < steps.length - 1) {
          mermaid += `    ${stepId}["${stepLabel}"] --> ${nextStepId}\n`;
        } else {
          mermaid += `    ${stepId}["${stepLabel}"] --> End([Complete])\n`;
        }
      });

      // Add click events - show clean paths in diagram, but link to full URLs
      if (stepUrls && stepUrls.length > 0) {
        mermaid += `\n    %% Click steps to navigate to Pete app\n`;
        steps.forEach((_, index) => {
          if (stepUrls[index]) {
            const stepId = `Step${index + 1}`;
            // Extract clean path from URL (e.g., "settings/general" from "https://app.thepete.io/settings/general")
            const cleanPath = stepUrls[index].replace('https://app.thepete.io/', '').replace(/^\//, '');
            // Still link to full URL for navigation, but show clean path in node label
            mermaid += `    click ${stepId} "${stepUrls[index]}" "Go to ${cleanPath}"\n`;
          }
        });
      } else if (sourceUrl) {
        mermaid += `\n    %% Click any step to view full documentation\n`;
        steps.forEach((_, index) => {
          const stepId = `Step${index + 1}`;
          mermaid += `    click ${stepId} "${sourceUrl}" "View full guide"\n`;
        });
      }

      // Wrap Mermaid code in triple backticks for proper markdown rendering
      const formattedMermaid = `\`\`\`mermaid\n${mermaid}\n\`\`\``;

      return {
        success: true,
        mermaid: formattedMermaid,
        title,
        stepCount: steps.length,
        sourceUrl: sourceUrl || null,
        message: `CRITICAL: You MUST copy the 'mermaid' field EXACTLY as provided below into your response. Do NOT modify, reformat, or regenerate it:\n\n${formattedMermaid}\n\nJust paste this entire block into your response after the numbered steps.`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "generate_process_map",
    description: "Generate a Mermaid flowchart/process map from a list of step-by-step instructions with optional clickable links to Pete app pages",
    schema: z.object({
      title: z.string().describe("The title/name of the process"),
      steps: z.array(z.string()).describe("Array of step-by-step instructions in order"),
      stepUrls: z.array(z.string()).optional().describe("Optional array of URLs (one per step) to make each step clickable and navigate to Pete app pages. Use map_pete_app_route tool to get these URLs."),
      sourceUrl: z.string().optional().describe("Optional fallback URL if stepUrls not provided")
    }),
  }
);

// Help documentation recommendation tool
const recommendHelpDocTool = tool(
  async ({ query }: { query: string }) => {
    try {
      logInfo(`[LANGGRAPH] Recommending help docs for query: ${query}`);

      // Help doc categories with relevant topics
      const helpDocs = [
        {
          category: "Getting Started",
          url: "https://help.thepete.io/en/collections/10827028-getting-started",
          keywords: ["start", "begin", "setup", "initial", "first", "onboard", "intro", "basic", "upload", "import", "data", "csv", "file", "add", "create", "new"],
          description: "Everything you need to get started with Pete - includes uploading data, importing contacts, and initial setup"
        },
        {
          category: "Workflows & Automation",
          url: "https://help.thepete.io/en/collections/11235880-workflows-automation",
          keywords: ["workflow", "automat", "task", "process", "trigger", "action", "flow", "schedule", "recurring"],
          description: "Automate your Pete and streamline tasks"
        },
        {
          category: "Tasks",
          url: "https://help.thepete.io/en/collections/10826939-tasks",
          keywords: ["task", "to-do", "todo", "checklist", "assignment", "work", "job"],
          description: "Set up and manage tasks in Pete"
        },
        {
          category: "Communication",
          url: "https://help.thepete.io/en/collections/10827385-communication",
          keywords: ["message", "email", "notify", "alert", "communicate", "send", "contact", "sms", "text"],
          description: "Configure your communication settings"
        },
        {
          category: "Properties",
          url: "https://help.thepete.io/en/collections/10827549-properties",
          keywords: ["property", "field", "attribute", "custom", "metadata", "column", "value"],
          description: "Navigate properties with ease"
        },
        {
          category: "Integrations",
          url: "https://help.thepete.io/en/collections/11235874-integrations",
          keywords: ["integration", "connect", "sync", "api", "webhook", "zapier", "third-party"],
          description: "Set up integrations with other tools"
        }
      ];

      const lowerQuery = query.toLowerCase();

      // Find matching docs based on keywords
      const matches = helpDocs.filter(doc =>
        doc.keywords.some(keyword => lowerQuery.includes(keyword))
      );

      if (matches.length === 0) {
        return {
          success: true,
          recommendation: "General Help Center",
          url: "https://help.thepete.io/en/",
          description: "Browse all Pete documentation",
          matches: helpDocs.slice(0, 3)  // Show first 3 categories as suggestions
        };
      }

      return {
        success: true,
        recommendation: matches[0].category,
        url: matches[0].url,
        description: matches[0].description,
        matches: matches.slice(0, 3)  // Return top 3 matches
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "recommend_help_doc",
    description: "Recommend relevant help documentation based on user's question or topic",
    schema: z.object({
      query: z.string().describe("The user's question or topic to find relevant help documentation for")
    }),
  }
);

// Map Pete App Routes - converts common actions to actual app URLs
const mapPeteAppRouteTool = tool(
  async ({ action }: { action: string }) => {
    try {
      logInfo(`[LANGGRAPH] Mapping Pete app route for action: ${action}`);

      // Common Pete app routes based on user actions
      const routeMap: Record<string, { url: string; description: string }> = {
        // Settings routes
        'settings': { url: 'https://app.thepete.io/settings', description: 'General settings' },
        'import': { url: 'https://app.thepete.io/settings/general/import', description: 'Import data' },
        'import data': { url: 'https://app.thepete.io/settings/general/import', description: 'Import data' },
        'upload': { url: 'https://app.thepete.io/settings/general/import', description: 'Upload data' },
        'upload data': { url: 'https://app.thepete.io/settings/general/import', description: 'Upload data' },
        'upload properties': { url: 'https://app.thepete.io/settings/general/import', description: 'Upload property data' },

        // Properties routes
        'properties': { url: 'https://app.thepete.io/properties', description: 'View properties' },
        'property list': { url: 'https://app.thepete.io/properties', description: 'Property list' },
        'add property': { url: 'https://app.thepete.io/properties/new', description: 'Add new property' },

        // Dashboard
        'dashboard': { url: 'https://app.thepete.io/dashboard', description: 'Main dashboard' },
        'home': { url: 'https://app.thepete.io', description: 'Pete home' },

        // Workflows
        'workflows': { url: 'https://app.thepete.io/workflows', description: 'Workflows' },
        'automation': { url: 'https://app.thepete.io/workflows', description: 'Automation settings' },

        // Tasks
        'tasks': { url: 'https://app.thepete.io/tasks', description: 'Task management' },

        // Communications
        'messages': { url: 'https://app.thepete.io/messages', description: 'Messages' },
        'communication': { url: 'https://app.thepete.io/messages', description: 'Communication center' },
      };

      const lowerAction = action.toLowerCase();

      // Find matching route
      for (const [key, value] of Object.entries(routeMap)) {
        if (lowerAction.includes(key)) {
          return {
            success: true,
            url: value.url,
            description: value.description,
            action: key,
            message: `Found Pete app route for "${action}": ${value.url}`
          };
        }
      }

      return {
        success: false,
        message: `No specific Pete app route found for "${action}". Use general help link.`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "map_pete_app_route",
    description: "Map a user action or navigation step to an actual Pete app URL (e.g., 'upload data' -> 'https://app.thepete.io/settings/general/import')",
    schema: z.object({
      action: z.string().describe("The action or navigation step to map (e.g., 'upload data', 'go to settings', 'view properties')")
    }),
  }
);

// Generate help documentation links tool
const generateHelpLinkTool = tool(
  async ({ path, text, context = 'chat' }: { path: string; text: string; context?: 'chat' | 'admin' | 'navigation' }) => {
    try {
      logInfo(`[LANGGRAPH] Generating help link: ${path} - ${text} (${context})`);

      let linkHtml: string;

      switch (context) {
        case 'admin':
          linkHtml = PeteAIHelpLinks.generateLink(path, text);
          break;
        case 'navigation':
          linkHtml = PeteAIHelpLinks.generateLink(path, text);
          break;
        case 'chat':
        default:
          linkHtml = PeteAIHelpLinks.generateLink(path, text);
          break;
      }

      return {
        success: true,
        linkHtml,
        path,
        text,
        context,
        message: "Help link generated successfully. Include this HTML in your response."
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "generate_help_link",
    description: "Generate formatted HTML links to help documentation for use in responses",
    schema: z.object({
      path: z.string().describe("The help documentation path (e.g., 'collections/10827028-getting-started')"),
      text: z.string().describe("The display text for the link"),
      context: z.enum(['chat', 'admin', 'navigation']).optional().describe("The context where the link will be used (default: 'chat')")
    }),
  }
);

// Generate multiple help links tool
const generateMultipleHelpLinksTool = tool(
  async ({ links, context = 'chat' }: { links: Array<{ path: string; text: string }>; context?: 'chat' | 'admin' | 'navigation' }) => {
    try {
      logInfo(`[LANGGRAPH] Generating multiple help links: ${links.length} links (${context})`);

      const linkHtmls = links.map(({ path, text }) => {
        switch (context) {
          case 'admin':
            return PeteAIHelpLinks.generateLink(path, text);
          case 'navigation':
            return PeteAIHelpLinks.generateLink(path, text);
          case 'chat':
          default:
            return PeteAIHelpLinks.generateLink(path, text);
        }
      });

      const combinedHtml = linkHtmls.join(' • ');

      return {
        success: true,
        linkHtml: combinedHtml,
        individualLinks: linkHtmls,
        linkCount: links.length,
        context,
        message: "Multiple help links generated successfully. Include this HTML in your response."
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "generate_multiple_help_links",
    description: "Generate multiple formatted HTML links to help documentation",
    schema: z.object({
      links: z.array(z.object({
        path: z.string().describe("The help documentation path"),
        text: z.string().describe("The display text for the link")
      })).describe("Array of link objects with path and text"),
      context: z.enum(['chat', 'admin', 'navigation']).optional().describe("The context where the links will be used (default: 'chat')")
    }),
  }
);

// Bind tools to the LLM with auto tool selection
const tools = [
  searchContactsTool,
  searchCompaniesTool,
  getCacheInfoTool,
  analyzeConversationsTool,
  searchConversationContentTool, // NEW: Semantic search through conversation messages
  fuzzySearchCompanyTool,
  getCompanyTimelineTool,
  extractCompanyAttributesTool,
  fetchHelpDocTool,
  generateProcessMapTool,
  recommendHelpDocTool,
  generateHelpLinkTool,
  generateMultipleHelpLinksTool,
  mapPeteAppRouteTool
];

// Enable automatic tool selection
const llmWithTools = llm.bindTools(tools, {
  tool_choice: "auto"  // Let LLM decide when to use tools intelligently
});

// Define the agent node
async function callModel(state: AgentState): Promise<Partial<AgentState>> {
  const messages = state.messages;
  
  // Add system context about Intercom data - use the comprehensive SYSTEM_PROMPT
  const systemMessage = new SystemMessage({
    content: SYSTEM_PROMPT
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

// Create checkpointer for conversation history (in-memory)
const checkpointer = new MemorySaver();

// Compile the graph with checkpointer for session management
const app = workflow.compile({ checkpointer });

// Main function to process messages with session support
export async function processWithLangGraph(
  message: string,
  threadId: string = `default-${Date.now()}`
): Promise<string> {
  try {
    logInfo(`[LANGGRAPH] Processing message (thread: ${threadId}): ${message.substring(0, 100)}...`);

    // Check if we have access to OpenRouter API
    if (!process.env.OPENROUTER_API_KEY) {
      logError('[LANGGRAPH] No OpenRouter API key found, cannot use LangGraph');
      throw new Error('OpenRouter API key not configured');
    }

    // Invoke with thread ID for conversation history
    const finalState = await app.invoke(
      {
        messages: [new HumanMessage({ content: message })],
        next: ""
      },
      {
        configurable: { thread_id: threadId }  // Enables conversation history!
      }
    );

    const lastMessage = finalState.messages[finalState.messages.length - 1];
    const response = lastMessage && lastMessage._getType() === 'ai'
      ? (lastMessage as AIMessage).content as string
      : "I'm sorry, I couldn't process that request.";

    logInfo(`[LANGGRAPH] Response generated (${response.length} chars, thread: ${threadId})`);
    logInfo(`[LANGGRAPH] Total messages in thread: ${finalState.messages.length}`);
    return response;

  } catch (error) {
    logError(`[LANGGRAPH] Error processing message (thread: ${threadId}): ${error instanceof Error ? error.message : error}`);
    throw error; // Re-throw for proper error handling upstream
  }
}
