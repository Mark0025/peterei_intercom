'use server';

import type { ActionResult } from '@/types';
import { logInfo, logError } from '@/services/logger';
import OpenAI from 'openai';
import { getSmartCacheStatus, getSmartCache, smartSearchContacts, smartSearchCompanies } from '@/services/smart-cache';

interface PeteAIResponse {
  reply: string;
  timestamp: string;
}

interface PeteAIRequest {
  message: string;
  sessionId?: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
    'X-Title': process.env.SITE_NAME || 'Pete Intercom App',
  },
});

// Get Intercom context for PeteAI
async function getIntercomContextString(): Promise<string> {
  try {
    const cacheStatus = getSmartCacheStatus();
    const cache = getSmartCache();
    
    let context = `\n\n=== INTERCOM DATA CONTEXT ===\n`;
    context += `Cache Status: ${cacheStatus.lastRefreshed ? `Last updated ${new Date(cacheStatus.lastRefreshed).toLocaleString()}` : 'Never updated'}\n`;
    context += `Data Counts: ${cacheStatus.counts.contacts} contacts, ${cacheStatus.counts.companies} companies, ${cacheStatus.counts.admins} admins, ${cacheStatus.counts.conversations} conversations\n`;
    
    // Add sample contact data if available
    if (cache.contacts.length > 0) {
      const sampleContacts = cache.contacts.slice(0, 3).map(contact => 
        `- ${contact.name || 'No name'} (${contact.email || 'No email'})${contact.companies?.companies?.length ? ` from ${contact.companies.companies[0].name}` : ''}`
      ).join('\n');
      context += `\nSample Contacts:\n${sampleContacts}\n`;
    }
    
    // Add sample company data if available
    if (cache.companies.length > 0) {
      const sampleCompanies = cache.companies.slice(0, 3).map(company => 
        `- ${company.name} (${company.user_count || 0} users)`
      ).join('\n');
      context += `\nSample Companies:\n${sampleCompanies}\n`;
    }
    
    context += `\nYou can help users search this data, analyze patterns, and answer questions about their Intercom workspace.\n`;
    context += `=== END INTERCOM CONTEXT ===\n\n`;
    
    return context;
  } catch (error) {
    logError(`Failed to get Intercom context: ${error instanceof Error ? error.message : error}`);
    return '\n\nNote: Intercom data is not currently available.\n\n';
  }
}

export async function sendMessageToPeteAI(
  formData: FormData
): Promise<ActionResult<PeteAIResponse>> {
  try {
    const message = formData.get('message') as string;
    
    if (!message || !message.trim()) {
      return {
        success: false,
        error: 'Message is required'
      };
    }

    if (!process.env.OPENROUTER_API_KEY) {
      logError('OPENROUTER_API_KEY is not configured');
      return {
        success: false,
        error: 'PeteAI is not configured. Please check environment variables.'
      };
    }

    logInfo(`PeteAI request: ${message.substring(0, 100)}...`);

    // Get live Intercom context
    const intercomContext = await getIntercomContextString();
    
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are PeteAI, a helpful assistant for the Pete Intercom application. You help with Intercom integrations, Canvas Kit development, and general business automation questions. Be concise and helpful.
          
You have access to live Intercom data from the user's workspace:${intercomContext}
          
When users ask about their Intercom data, refer to the actual data shown above. You can help them understand their contact counts, company information, and provide insights based on their real data.
          
If users ask specific questions about contacts or companies (like "find contact with email X" or "show me companies with name Y"), you should use the provided functions to search the live data.`
        },
        {
          role: 'user',
          content: message.trim()
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "search_contacts",
            description: "Search for contacts in the Intercom workspace by email or name",
            parameters: {
              type: "object",
              properties: {
                email: {
                  type: "string",
                  description: "Email address to search for (partial matches allowed)"
                },
                name: {
                  type: "string",
                  description: "Name to search for (partial matches allowed)"
                }
              }
            }
          }
        },
        {
          type: "function",
          function: {
            name: "search_companies",
            description: "Search for companies in the Intercom workspace by name",
            parameters: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Company name to search for (partial matches allowed)"
                }
              }
            }
          }
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const responseMessage = completion.choices[0]?.message;
    let reply: string;

    // Handle function calls
    if (responseMessage?.tool_calls) {
      const toolCall = responseMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      logInfo(`PeteAI function call: ${functionName} with args: ${JSON.stringify(args)}`);

      interface FunctionResult {
        count: number;
        contacts?: Array<{
          name: string;
          email: string;
          id: string;
          companies: string[];
        }>;
        companies?: Array<{
          name: string;
          id: string;
          user_count: number;
          website?: string;
        }>;
      }

      let functionResult: FunctionResult;
      
      try {
        if (functionName === 'search_contacts') {
          const contacts = await smartSearchContacts(args.email, args.name, false);
          functionResult = {
            count: contacts.length,
            contacts: contacts.slice(0, 5).map(c => ({
              name: c.name,
              email: c.email,
              id: c.id,
              companies: c.companies?.companies?.map(comp => comp.name) || []
            }))
          };
        } else if (functionName === 'search_companies') {
          const companies = await smartSearchCompanies(args.name, false);
          functionResult = {
            count: companies.length,
            companies: companies.slice(0, 5).map(c => ({
              name: c.name,
              id: c.id,
              user_count: c.user_count,
              website: c.website
            }))
          };
        }
        
        // Make a follow-up call with the function result
        const followupCompletion = await openai.chat.completions.create({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are PeteAI. You called a function and got results. Present the results in a helpful, formatted way.`
            },
            {
              role: 'user',
              content: responseMessage.content || ''
            },
            {
              role: 'assistant',
              content: null,
              tool_calls: [toolCall]
            },
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(functionResult)
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        });
        
        reply = followupCompletion.choices[0]?.message?.content || 'No response received';
        
      } catch (error) {
        reply = `I encountered an error while searching your Intercom data: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    } else {
      reply = responseMessage?.content || 'No response received';
    }
    
    logInfo(`PeteAI response: ${reply.substring(0, 100)}...`);

    return {
      success: true,
      data: {
        reply,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
    logError(`PeteAI error: ${errorMsg}`);
    
    return {
      success: false,
      error: `PeteAI error: ${errorMsg}`
    };
  }
}

export async function sendMessageToPeteAIJson(
  request: PeteAIRequest
): Promise<ActionResult<PeteAIResponse>> {
  try {
    const { message, sessionId = `session-${Date.now()}` } = request;

    if (!message || !message.trim()) {
      return {
        success: false,
        error: 'Message is required'
      };
    }

    logInfo(`[PeteAI] Request (session: ${sessionId}): ${message.substring(0, 100)}...`);

    // Check API key first - fail fast with clear error
    if (!process.env.OPENROUTER_API_KEY) {
      logError('[PeteAI] OPENROUTER_API_KEY not configured');
      return {
        success: false,
        error: 'AI service not configured. Please contact support.'
      };
    }

    // Use LangGraph agent with session support - NO fallback
    logInfo(`[PeteAI] Using LangGraph agent with session: ${sessionId}`);

    try {
      // Import conversation history and logging functions
      const { saveMessage } = await import('@/lib/conversation-history');
      const { logAIConversation } = await import('@/lib/ai-conversation-logs');
      const { processWithLangGraph } = await import('@/services/langraph-agent');

      // TODO: Future Clerk Auth Integration
      // For admin users: const userId = user?.id || `guest-${sessionId}`
      // For now, use unique guest IDs based on sessionId
      // This allows us to track conversations per-session without requiring auth
      const userId = `guest-${sessionId}`;

      const startTime = Date.now();

      // Save user message to persistent storage
      await saveMessage(
        sessionId,
        userId,
        {
          role: 'user',
          content: message.trim(),
          timestamp: new Date().toISOString(),
          agentType: 'langraph'
        },
        'langraph'
      );

      // Process with LangGraph agent
      const reply = await processWithLangGraph(message.trim(), sessionId);

      const responseTime = Date.now() - startTime;

      // Check if response contains Mermaid diagram
      const hasMermaid = reply.includes('```mermaid');

      // Save AI response to persistent storage
      await saveMessage(
        sessionId,
        userId,
        {
          role: 'ai',
          content: reply,
          timestamp: new Date().toISOString(),
          agentType: 'langraph',
          hasMermaid
        },
        'langraph'
      );

      // Log to admin analytics (async, non-blocking)
      logAIConversation({
        sessionId,
        userId,
        agentType: 'langraph',
        request: {
          message: message.trim(),
          toolsUsed: [], // TODO: Extract from LangGraph response
        },
        response: {
          content: reply,
          latencyMs: responseTime,
        },
      }).catch(err => {
        logError(`[PeteAI] Failed to log conversation: ${err.message}`);
      });

      logInfo(`[PeteAI] Success (session: ${sessionId}) - ${reply.length} chars`);
      logInfo(`[PeteAI] Contains Mermaid: ${hasMermaid}`);
      logInfo(`[PeteAI] Response time: ${responseTime}ms`);
      logInfo(`[PeteAI] Response preview: ${reply.substring(0, 150)}...`);
      logInfo(`[PeteAI] ✅ Saved to conversation history: ${sessionId}`);

      return {
        success: true,
        data: {
          reply,
          timestamp: new Date().toISOString()
        }
      };

    } catch (langGraphError) {
      // Log full error details for debugging
      logError(`[PeteAI] LangGraph error (session: ${sessionId}): ${langGraphError instanceof Error ? langGraphError.message : langGraphError}`);
      if (langGraphError instanceof Error && langGraphError.stack) {
        logError(`[PeteAI] Stack trace: ${langGraphError.stack}`);
      }

      // Log error to admin analytics
      const { logAIConversation } = await import('@/lib/ai-conversation-logs');
      // TODO: Future Clerk Auth Integration - same as above
      const userId = `guest-${sessionId}`;

      logAIConversation({
        sessionId,
        userId,
        agentType: 'langraph',
        request: {
          message: message.trim(),
          toolsUsed: [],
        },
        response: {
          content: '',
          latencyMs: 0,
        },
        error: langGraphError instanceof Error ? langGraphError.message : 'Unknown error',
      }).catch(err => {
        logError(`[PeteAI] Failed to log error: ${err.message}`);
      });

      // Return clean error to frontend
      return {
        success: false,
        error: 'AI service temporarily unavailable. Please try again.'
      };
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
    logError(`[PeteAI] Unexpected error: ${errorMsg}`);

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

// Helper function to generate Intercom URLs
function getIntercomUrl(type: 'conversation' | 'contact' | 'company', id: string): string {
  const baseUrl = 'https://app.intercom.com';
  switch (type) {
    case 'conversation':
      return `${baseUrl}/a/apps/ql8el0gn/inbox/all/conversations/${id}`;
    case 'contact':
      return `${baseUrl}/a/apps/ql8el0gn/users/${id}`;
    case 'company':
      return `${baseUrl}/a/apps/ql8el0gn/companies/${id}`;
    default:
      return baseUrl;
  }
}

// Cache-only response function
async function getCacheOnlyResponse(message: string): Promise<string> {
  try {
    const cacheStatus = getSmartCacheStatus();
    const cache = getSmartCache();
    
    const lowerMessage = message.toLowerCase();
    
    // Analyze conversations for specific queries
    if (lowerMessage.includes('last') && (lowerMessage.includes('ticket') || lowerMessage.includes('conversation') || lowerMessage.includes('solved') || lowerMessage.includes('closed'))) {
      // Find the most recently closed/solved conversation
      const closedConversations = cache.conversations
        .filter(c => c.state === 'closed')
        .sort((a, b) => b.updated_at - a.updated_at);
      
      if (closedConversations.length > 0) {
        const lastSolved = closedConversations[0];
        const contact = cache.contacts.find(c => c.id === lastSolved.contacts?.contacts?.[0]?.id);
        const solvedDate = new Date(lastSolved.updated_at * 1000);
        const tags = lastSolved.tags?.tags?.map(t => t.name).join(', ') || 'No tags';
        const conversationUrl = getIntercomUrl('conversation', lastSolved.id);
        const contactUrl = contact ? getIntercomUrl('contact', contact.id) : null;
        
        return `The last ticket solved was **[Conversation #${lastSolved.id}](${conversationUrl})** from **${contactUrl ? `[${contact?.name || 'Unknown contact'}](${contactUrl})` : contact?.name || 'Unknown contact'}** (${contact?.email || 'No email'}).\n\n` +
          `📋 **Details:**\n` +
          `• Solved: ${solvedDate.toLocaleDateString()} at ${solvedDate.toLocaleTimeString()}\n` +
          `• Subject: ${lastSolved.title || 'No subject'}\n` +
          `• Tags: ${tags}\n` +
          `• Parts: ${lastSolved.statistics?.count_conversation_parts || 0} messages\n` +
          `• Priority: ${lastSolved.priority || 'Normal'}\n\n` +
          `🔗 **[View in Intercom](${conversationUrl})**`;
      } else {
        return `I couldn't find any solved tickets in your conversation history.`;
      }
    }
    
    // Recent activity analysis
    if (lowerMessage.includes('recent') && (lowerMessage.includes('ticket') || lowerMessage.includes('conversation') || lowerMessage.includes('activity'))) {
      const recentConversations = cache.conversations
        .sort((a, b) => b.updated_at - a.updated_at)
        .slice(0, 5);
        
      let response = `**Recent Conversation Activity:**\n\n`;
      recentConversations.forEach((conv, idx) => {
        const contact = cache.contacts.find(c => c.id === conv.contacts?.contacts?.[0]?.id);
        const updatedDate = new Date(conv.updated_at * 1000);
        const conversationUrl = getIntercomUrl('conversation', conv.id);
        const contactUrl = contact ? getIntercomUrl('contact', contact.id) : null;
        const contactName = contactUrl ? `[${contact?.name || 'Unknown'}](${contactUrl})` : (contact?.name || 'Unknown');
        
        response += `${idx + 1}. **${contactName}** - [${conv.state}](${conversationUrl}) (${updatedDate.toLocaleDateString()})\n`;
      });
      
      return response;
    }
    
    // Open tickets analysis
    if (lowerMessage.includes('open') && (lowerMessage.includes('ticket') || lowerMessage.includes('conversation'))) {
      const openConversations = cache.conversations.filter(c => c.state === 'open');
      
      if (openConversations.length === 0) {
        return `🎉 Great news! You have **no open tickets** right now. All conversations are resolved!`;
      }
      
      let response = `You have **${openConversations.length} open tickets:**\n\n`;
      openConversations.slice(0, 5).forEach((conv, idx) => {
        const contact = cache.contacts.find(c => c.id === conv.contacts?.contacts?.[0]?.id);
        const createdDate = new Date(conv.created_at * 1000);
        const priority = conv.priority === 'priority' ? '🔥 High' : '📝 Normal';
        response += `${idx + 1}. **${contact?.name || 'Unknown'}** - ${conv.title || 'No subject'} (${priority}, ${createdDate.toLocaleDateString()})\n`;
      });
      
      if (openConversations.length > 5) {
        response += `\n...and ${openConversations.length - 5} more open tickets.`;
      }
      
      return response;
    }
    
    // Contact search
    if (lowerMessage.includes('contact') || lowerMessage.includes('email')) {
      if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
        // Extract potential email or name from message
        const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        if (emailMatch) {
          const contacts = await smartSearchContacts(emailMatch[0]);
          if (contacts.length > 0) {
            const contact = contacts[0];
            return `I found a contact with email ${contact.email}: **${contact.name || 'Unnamed'}**. They were created on ${new Date(contact.created_at * 1000).toLocaleDateString()} and ${contact.companies?.companies?.length ? `work at ${contact.companies.companies.map(c => c.name).join(', ')}` : 'have no associated company'}.`;
          } else {
            return `I couldn't find any contacts with the email "${emailMatch[0]}" in your Intercom data.`;
          }
        }
      }
      return `You have **${cache.contacts.length} contacts** in your Intercom workspace. ${cache.contacts.slice(0, 3).map(c => `**${c.name || 'Unnamed'}** (${c.email || 'No email'})`).join(', ')}${cache.contacts.length > 3 ? '...' : ''}.`;
    }
    
    if (lowerMessage.includes('company') || lowerMessage.includes('companies')) {
      return `You have **${cache.companies.length} companies** in your Intercom workspace. ${cache.companies.slice(0, 3).map(c => `**${c.name}** (${c.user_count || 0} users)`).join(', ')}${cache.companies.length > 3 ? '...' : ''}.`;
    }
    
    // General conversation stats
    if (lowerMessage.includes('conversation') || lowerMessage.includes('ticket')) {
      const openConversations = cache.conversations.filter(c => c.state === 'open').length;
      const closedConversations = cache.conversations.filter(c => c.state === 'closed').length;
      const snoozedConversations = cache.conversations.filter(c => c.state === 'snoozed').length;
      
      let response = `**Conversation Overview:**\n\n`;
      response += `📊 **${cache.conversations.length} total conversations**\n`;
      response += `• ${openConversations} open\n`;
      response += `• ${closedConversations} closed\n`;
      if (snoozedConversations > 0) response += `• ${snoozedConversations} snoozed\n`;
      
      // Add priority breakdown
      const priorityConversations = cache.conversations.filter(c => c.priority === 'priority').length;
      if (priorityConversations > 0) {
        response += `• ${priorityConversations} high priority\n`;
      }
      
      return response;
    }
    
    // Support ticket trends and analysis
    if (lowerMessage.includes('trend') || lowerMessage.includes('pattern') || lowerMessage.includes('analyz')) {
      const last7Days = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const recentConversations = cache.conversations.filter(c => (c.created_at * 1000) > last7Days);
      const recentClosed = recentConversations.filter(c => c.state === 'closed').length;
      const recentOpen = recentConversations.filter(c => c.state === 'open').length;
      
      // Tag analysis
      const tagCount: Record<string, number> = {};
      cache.conversations.forEach(c => {
        c.tags?.tags?.forEach(tag => {
          tagCount[tag.name] = (tagCount[tag.name] || 0) + 1;
        });
      });
      
      const topTags = Object.entries(tagCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([tag, count]) => `${tag} (${count})`)
        .join(', ');
      
      return `**Support Ticket Analysis:**\n\n` +
        `📈 **Last 7 days:** ${recentConversations.length} new tickets (${recentClosed} solved, ${recentOpen} still open)\n\n` +
        `🏷️ **Most common tags:** ${topTags || 'No tags found'}\n\n` +
        `⚡ **Response rate:** ${Math.round((recentClosed / Math.max(recentConversations.length, 1)) * 100)}% tickets solved`;
    }
    
    // Team performance insights
    if (lowerMessage.includes('team') || lowerMessage.includes('admin') || lowerMessage.includes('performance')) {
      const admins = cache.admins;
      const conversationsWithAdmins = cache.conversations.filter(c => c.teammates?.admins?.length > 0);
      
      let response = `**Team Performance:**\n\n`;
      response += `👥 **${admins.length} team members** handling support\n`;
      response += `🎯 **${conversationsWithAdmins.length} conversations** have admin involvement\n`;
      
      // Find most active admin (if data available)
      const adminActivity: Record<string, number> = {};
      conversationsWithAdmins.forEach(c => {
        c.teammates?.admins?.forEach(admin => {
          adminActivity[admin.name] = (adminActivity[admin.name] || 0) + 1;
        });
      });
      
      if (Object.keys(adminActivity).length > 0) {
        const mostActive = Object.entries(adminActivity)
          .sort(([,a], [,b]) => b - a)[0];
        response += `🌟 **Most active:** ${mostActive[0]} (${mostActive[1]} conversations)`;
      }
      
      return response;
    }
    
    if (lowerMessage.includes('data') || lowerMessage.includes('cache') || lowerMessage.includes('status')) {
      const lastRefreshed = cacheStatus.lastRefreshed ? new Date(cacheStatus.lastRefreshed).toLocaleString() : 'Never';
      return `Your Intercom data cache contains:\n\n` +
        `• **${cache.contacts.length} contacts**\n` +
        `• **${cache.companies.length} companies**\n` +
        `• **${cache.admins.length} admins**\n` +
        `• **${cache.conversations.length} conversations**\n\n` +
        `Last refreshed: **${lastRefreshed}**\n` +
        `Cache age: **${cacheStatus.cacheAge || 0} minutes**`;
    }
    
    // Default response with overview
    const lastRefreshed = cacheStatus.lastRefreshed ? new Date(cacheStatus.lastRefreshed).toLocaleString() : 'Never';
    return `Hi! I'm PeteAI, and I have access to your Intercom data. Here's what I can see:\n\n` +
      `• **${cache.contacts.length} contacts**\n` +
      `• **${cache.companies.length} companies**\n` +
      `• **${cache.conversations.length} conversations**\n\n` +
      `I can help you search contacts, analyze conversations, and explore your Intercom data. Just ask me about specific contacts, companies, or conversation trends!\n\n` +
      `Data last updated: ${lastRefreshed}`;
    
  } catch (error) {
    return `I encountered an error accessing your Intercom cache: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure the cache is properly initialized.`;
  }
}
