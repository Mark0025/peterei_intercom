/**
 * Conversation Data Analysis Script
 * Extracts first questions and error resolution timelines from cached Intercom conversations
 *
 * Usage: bun src/scripts/analyze-conversations.ts
 */

import { getIntercomCache, proxyIntercomGet } from '../services/intercom';
import { logInfo, logError } from '../services/logger';
import fs from 'fs/promises';
import path from 'path';

interface ConversationDetail {
  id: string;
  type: string;
  created_at: number;
  updated_at: number;
  title?: string;
  state: 'open' | 'closed' | 'snoozed';
  conversation_parts?: {
    type: string;
    conversation_parts: Array<{
      type: string;
      id: string;
      part_type: string;
      body: string;
      created_at: number;
      updated_at: number;
      author?: {
        type: string;
        id: string;
        name?: string;
        email?: string;
      };
    }>;
  };
  source?: {
    type: string;
    body?: string;
    author?: {
      type: string;
      id: string;
      name?: string;
      email?: string;
    };
  };
}

interface FirstQuestion {
  conversation_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  question: string;
  timestamp: number;
  date: string;
  conversation_state: string;
}

interface ErrorResolution {
  conversation_id: string;
  error_type: string;
  reported_at: number;
  resolved_at?: number;
  resolution_time_hours?: number;
  user_id: string;
  user_name?: string;
  initial_message: string;
  resolution_message?: string;
  status: 'resolved' | 'unresolved' | 'in_progress';
}

/**
 * Fetch detailed conversation data including parts/messages
 */
async function fetchConversationDetails(conversationId: string): Promise<ConversationDetail | null> {
  try {
    const response = await proxyIntercomGet(`/conversations/${conversationId}`);
    return response as ConversationDetail;
  } catch (error) {
    logError(`Failed to fetch conversation ${conversationId}: ${error instanceof Error ? error.message : error}`, 'api.log');
    return null;
  }
}

/**
 * Extract the first user question from a conversation
 */
function extractFirstQuestion(conversation: ConversationDetail): FirstQuestion | null {
  try {
    // Check source (initial message)
    if (conversation.source?.body && conversation.source?.author?.type === 'user') {
      return {
        conversation_id: conversation.id,
        user_id: conversation.source.author.id,
        user_name: conversation.source.author.name,
        user_email: conversation.source.author.email,
        question: conversation.source.body,
        timestamp: conversation.created_at,
        date: new Date(conversation.created_at * 1000).toISOString(),
        conversation_state: conversation.state
      };
    }

    // Check conversation parts for first user message
    if (conversation.conversation_parts?.conversation_parts) {
      const firstUserMessage = conversation.conversation_parts.conversation_parts
        .filter(part => part.author?.type === 'user')
        .sort((a, b) => a.created_at - b.created_at)[0];

      if (firstUserMessage) {
        return {
          conversation_id: conversation.id,
          user_id: firstUserMessage.author?.id || 'unknown',
          user_name: firstUserMessage.author?.name,
          user_email: firstUserMessage.author?.email,
          question: firstUserMessage.body,
          timestamp: firstUserMessage.created_at,
          date: new Date(firstUserMessage.created_at * 1000).toISOString(),
          conversation_state: conversation.state
        };
      }
    }

    return null;
  } catch (error) {
    logError(`Error extracting first question from ${conversation.id}: ${error instanceof Error ? error.message : error}`, 'api.log');
    return null;
  }
}

/**
 * Detect if conversation is about an error and track resolution
 */
function analyzeErrorResolution(conversation: ConversationDetail): ErrorResolution | null {
  try {
    const errorKeywords = [
      'error', 'bug', 'issue', 'problem', 'broken', 'not working',
      'fail', 'crash', 'exception', 'wrong', 'incorrect', 'invalid'
    ];

    const resolutionKeywords = [
      'fixed', 'resolved', 'solved', 'working now', 'issue resolved',
      'problem solved', 'all set', 'good to go', 'thanks', 'perfect'
    ];

    // Check source message for error keywords
    const sourceBody = conversation.source?.body?.toLowerCase() || '';
    const hasError = errorKeywords.some(keyword => sourceBody.includes(keyword));

    if (!hasError) return null;

    // Determine error type from keywords
    let errorType = 'general';
    if (sourceBody.includes('upload') || sourceBody.includes('import')) errorType = 'upload_error';
    else if (sourceBody.includes('data') || sourceBody.includes('missing')) errorType = 'data_error';
    else if (sourceBody.includes('login') || sourceBody.includes('auth')) errorType = 'auth_error';
    else if (sourceBody.includes('porting') || sourceBody.includes('transfer')) errorType = 'porting_error';
    else if (sourceBody.includes('sync') || sourceBody.includes('integration')) errorType = 'sync_error';

    const errorResolution: ErrorResolution = {
      conversation_id: conversation.id,
      error_type: errorType,
      reported_at: conversation.created_at,
      user_id: conversation.source?.author?.id || 'unknown',
      user_name: conversation.source?.author?.name,
      initial_message: conversation.source?.body || '',
      status: 'unresolved'
    };

    // Check conversation parts for resolution
    if (conversation.conversation_parts?.conversation_parts) {
      const parts = conversation.conversation_parts.conversation_parts;

      // Look for resolution indicators
      const resolutionPart = parts.find(part => {
        const body = part.body?.toLowerCase() || '';
        return resolutionKeywords.some(keyword => body.includes(keyword));
      });

      if (resolutionPart) {
        errorResolution.resolved_at = resolutionPart.created_at;
        errorResolution.resolution_time_hours =
          (resolutionPart.created_at - conversation.created_at) / 3600;
        errorResolution.resolution_message = resolutionPart.body;
        errorResolution.status = 'resolved';
      } else if (conversation.state === 'open') {
        errorResolution.status = 'in_progress';
      }
    }

    return errorResolution;
  } catch (error) {
    logError(`Error analyzing error resolution for ${conversation.id}: ${error instanceof Error ? error.message : error}`, 'api.log');
    return null;
  }
}

/**
 * Main analysis function
 */
async function analyzeConversations() {
  console.log('🔍 Starting conversation data analysis...\n');

  try {
    // Get cached conversations
    const cache = await getIntercomCache();
    const conversations = cache.conversations;

    console.log(`📊 Found ${conversations.length} conversations in cache\n`);

    const firstQuestions: FirstQuestion[] = [];
    const errorResolutions: ErrorResolution[] = [];

    // Process conversations in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < conversations.length; i += batchSize) {
      const batch = conversations.slice(i, i + batchSize);

      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(conversations.length / batchSize)}...`);

      const results = await Promise.all(
        batch.map(conv => fetchConversationDetails(conv.id))
      );

      for (const detail of results) {
        if (!detail) continue;

        // Extract first question
        const firstQ = extractFirstQuestion(detail);
        if (firstQ) {
          firstQuestions.push(firstQ);
        }

        // Analyze for error resolution
        const errorRes = analyzeErrorResolution(detail);
        if (errorRes) {
          errorResolutions.push(errorRes);
        }
      }

      // Rate limit protection
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Sort data
    firstQuestions.sort((a, b) => a.timestamp - b.timestamp);
    errorResolutions.sort((a, b) => a.reported_at - b.reported_at);

    // Generate statistics
    const stats = {
      total_conversations: conversations.length,
      first_questions_extracted: firstQuestions.length,
      error_conversations: errorResolutions.length,
      errors_resolved: errorResolutions.filter(e => e.status === 'resolved').length,
      errors_in_progress: errorResolutions.filter(e => e.status === 'in_progress').length,
      errors_unresolved: errorResolutions.filter(e => e.status === 'unresolved').length,
      average_resolution_time_hours: errorResolutions
        .filter(e => e.resolution_time_hours)
        .reduce((sum, e) => sum + (e.resolution_time_hours || 0), 0) /
        errorResolutions.filter(e => e.resolution_time_hours).length || 0,
      error_types: errorResolutions.reduce((acc, e) => {
        acc[e.error_type] = (acc[e.error_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      generated_at: new Date().toISOString()
    };

    // Create output directory
    const outputDir = path.join(process.cwd(), 'data', 'conversation-analysis');
    await fs.mkdir(outputDir, { recursive: true });

    // Write JSON files
    const firstQuestionsFile = path.join(outputDir, 'first-questions.json');
    const errorResolutionsFile = path.join(outputDir, 'error-resolutions.json');
    const statsFile = path.join(outputDir, 'analysis-stats.json');

    await fs.writeFile(firstQuestionsFile, JSON.stringify(firstQuestions, null, 2));
    await fs.writeFile(errorResolutionsFile, JSON.stringify(errorResolutions, null, 2));
    await fs.writeFile(statsFile, JSON.stringify(stats, null, 2));

    console.log('\n✅ Analysis complete!\n');
    console.log('📄 Files generated:');
    console.log(`   - ${firstQuestionsFile}`);
    console.log(`   - ${errorResolutionsFile}`);
    console.log(`   - ${statsFile}\n`);

    console.log('📊 Statistics:');
    console.log(`   Total conversations: ${stats.total_conversations}`);
    console.log(`   First questions extracted: ${stats.first_questions_extracted}`);
    console.log(`   Error conversations: ${stats.error_conversations}`);
    console.log(`   Resolved: ${stats.errors_resolved}`);
    console.log(`   In progress: ${stats.errors_in_progress}`);
    console.log(`   Unresolved: ${stats.errors_unresolved}`);
    console.log(`   Avg resolution time: ${stats.average_resolution_time_hours.toFixed(2)} hours\n`);

    console.log('🎯 Error types:');
    Object.entries(stats.error_types).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    logInfo(`Conversation analysis complete. Generated ${firstQuestions.length} first questions and ${errorResolutions.length} error resolutions`, 'api.log');
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    logError(`Conversation analysis failed: ${error instanceof Error ? error.message : error}`, 'api.log');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  analyzeConversations()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { analyzeConversations, fetchConversationDetails, extractFirstQuestion, analyzeErrorResolution };
