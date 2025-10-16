/**
 * Complete Conversation Data Analysis
 * 1. Refreshes Intercom cache
 * 2. Fetches detailed conversation data
 * 3. Extracts first questions from each conversation
 * 4. Analyzes error resolution timelines
 * 5. Outputs downloadable JSON files
 *
 * Usage: bun src/scripts/full-conversation-analysis.ts
 */

import { getIntercomCache, refreshIntercomCache, proxyIntercomGet } from '../services/intercom';
import { logInfo, logError } from '../services/logger';
import { cleanConversationMessage, isValidMessage } from '../utils/html-cleaner';
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
  contacts?: {
    contacts: Array<{
      id: string;
      name?: string;
      email?: string;
    }>;
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
  word_count: number;
  contains_question_mark: boolean;
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
  error_keywords: string[];
}

interface ConversationThread {
  conversation_id: string;
  state: 'open' | 'closed' | 'snoozed';
  created_at: number;
  updated_at: number;

  // User info
  user: {
    id: string;
    name?: string;
    email?: string;
  };

  // Initial message
  initial_message: {
    body_html?: string;
    body_clean: string;
    created_at: number;
    author?: {
      type: string;
      id: string;
      name?: string;
      email?: string;
    };
  };

  // All conversation parts (messages, notes, system actions)
  parts: Array<{
    id: string;
    type: string; // comment, note, assignment, close, etc.
    body_html?: string | null;
    body_clean: string | null;
    created_at: number;
    author_type?: string;
    author_id?: string;
    author_name?: string;
    author_email?: string;
  }>;

  // Extracted notes (for easy access)
  notes: Array<{
    id: string;
    body_html?: string;
    body_clean: string;
    created_at: number;
    author_id: string;
    author_name: string;
    is_from_jon: boolean;
    is_from_mark: boolean;
  }>;

  // Extracted admin responses
  admin_responses: Array<{
    id: string;
    body_html?: string;
    body_clean: string;
    created_at: number;
    author_id: string;
    author_name: string;
    is_from_jon: boolean;
    is_from_mark: boolean;
  }>;

  // Extracted user messages
  user_messages: Array<{
    id: string;
    body_html?: string;
    body_clean: string;
    created_at: number;
    author_id?: string;
    author_name?: string;
  }>;

  // Metadata
  admin_assignee_id?: number;
  total_parts: number;
  total_comments: number;
  total_notes: number;
}

/**
 * Fetch detailed conversation data including parts/messages
 */
async function fetchConversationDetails(conversationId: string): Promise<ConversationDetail | null> {
  try {
    const response = await proxyIntercomGet(`/conversations/${conversationId}`) as unknown;
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
    let firstMessage: { body: string; author: any; timestamp: number } | null = null;

    // Check source (initial message) - this is usually the first message
    if (conversation.source?.body && conversation.source?.author?.type === 'user') {
      const cleanedBody = cleanConversationMessage(conversation.source.body);
      if (isValidMessage(cleanedBody)) {
        firstMessage = {
          body: cleanedBody,
          author: conversation.source.author,
          timestamp: conversation.created_at
        };
      }
    }

    // If no source, check conversation parts for first user message
    if (!firstMessage && conversation.conversation_parts?.conversation_parts) {
      const firstUserPart = conversation.conversation_parts.conversation_parts
        .filter(part => part.author?.type === 'user')
        .sort((a, b) => a.created_at - b.created_at)[0];

      if (firstUserPart) {
        const cleanedBody = cleanConversationMessage(firstUserPart.body);
        if (isValidMessage(cleanedBody)) {
          firstMessage = {
            body: cleanedBody,
            author: firstUserPart.author,
            timestamp: firstUserPart.created_at
          };
        }
      }
    }

    if (!firstMessage) return null;

    // Extract contact info if available
    const contact = conversation.contacts?.contacts?.[0];

    return {
      conversation_id: conversation.id,
      user_id: firstMessage.author?.id || contact?.id || 'unknown',
      user_name: firstMessage.author?.name || contact?.name,
      user_email: firstMessage.author?.email || contact?.email,
      question: firstMessage.body,
      timestamp: firstMessage.timestamp,
      date: new Date(firstMessage.timestamp * 1000).toISOString(),
      conversation_state: conversation.state,
      word_count: firstMessage.body.split(/\s+/).length,
      contains_question_mark: firstMessage.body.includes('?')
    };
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
      'fail', 'crash', 'exception', 'wrong', 'incorrect', 'invalid',
      'missing', 'unable', 'cannot', "can't", "won't", "doesn't work"
    ];

    const resolutionKeywords = [
      'fixed', 'resolved', 'solved', 'working now', 'issue resolved',
      'problem solved', 'all set', 'good to go', 'thank', 'perfect',
      'great', 'awesome', 'sorted', 'done', 'complete'
    ];

    // Check source message for error keywords
    const sourceBody = conversation.source?.body?.toLowerCase() || '';
    const matchedErrorKeywords = errorKeywords.filter(keyword => sourceBody.includes(keyword));

    if (matchedErrorKeywords.length === 0) return null;

    // Determine error type from keywords and context
    let errorType = 'general';
    if (sourceBody.includes('upload') || sourceBody.includes('import') || sourceBody.includes('csv')) {
      errorType = 'upload_error';
    } else if (sourceBody.includes('data') || sourceBody.includes('missing') || sourceBody.includes('property')) {
      errorType = 'data_error';
    } else if (sourceBody.includes('login') || sourceBody.includes('auth') || sourceBody.includes('password')) {
      errorType = 'auth_error';
    } else if (sourceBody.includes('port') || sourceBody.includes('transfer') || sourceBody.includes('twilio')) {
      errorType = 'porting_error';
    } else if (sourceBody.includes('sync') || sourceBody.includes('integration') || sourceBody.includes('webhook')) {
      errorType = 'sync_error';
    } else if (sourceBody.includes('performance') || sourceBody.includes('slow') || sourceBody.includes('timeout')) {
      errorType = 'performance_error';
    } else if (sourceBody.includes('ui') || sourceBody.includes('display') || sourceBody.includes('showing')) {
      errorType = 'ui_error';
    }

    const contact = conversation.contacts?.contacts?.[0];

    const errorResolution: ErrorResolution = {
      conversation_id: conversation.id,
      error_type: errorType,
      reported_at: conversation.created_at,
      user_id: conversation.source?.author?.id || contact?.id || 'unknown',
      user_name: conversation.source?.author?.name || contact?.name,
      initial_message: cleanConversationMessage(conversation.source?.body || ''),
      status: conversation.state === 'closed' ? 'unresolved' : 'in_progress',
      error_keywords: matchedErrorKeywords
    };

    // Check conversation parts for resolution
    if (conversation.conversation_parts?.conversation_parts) {
      const parts = conversation.conversation_parts.conversation_parts;

      // Look for resolution indicators from user
      const userResolutionPart = parts
        .filter(part => part.author?.type === 'user')
        .find(part => {
          const body = part.body?.toLowerCase() || '';
          return resolutionKeywords.some(keyword => body.includes(keyword));
        });

      // Or check if admin marked as resolved and conversation closed
      if (userResolutionPart) {
        errorResolution.resolved_at = userResolutionPart.created_at;
        errorResolution.resolution_time_hours =
          (userResolutionPart.created_at - conversation.created_at) / 3600;
        errorResolution.resolution_message = cleanConversationMessage(userResolutionPart.body);
        errorResolution.status = 'resolved';
      } else if (conversation.state === 'closed' && parts.length > 0) {
        // Assume resolved if closed with messages
        const lastPart = parts[parts.length - 1];
        errorResolution.resolved_at = lastPart.created_at;
        errorResolution.resolution_time_hours =
          (lastPart.created_at - conversation.created_at) / 3600;
        errorResolution.status = 'resolved';
      }
    }

    return errorResolution;
  } catch (error) {
    logError(`Error analyzing error resolution for ${conversation.id}: ${error instanceof Error ? error.message : error}`, 'api.log');
    return null;
  }
}

/**
 * Save complete conversation thread with all parts, notes, and messages
 */
function saveConversationThread(conversation: ConversationDetail): ConversationThread {
  const JON_ADMIN_ID = '6614158';
  const MARK_EMAIL = 'mark@peterei.com';

  // Extract user info from source or contacts
  const sourceAuthor = conversation.source?.author;
  const contact = conversation.contacts?.contacts?.[0];

  const user = {
    id: sourceAuthor?.id || contact?.id || 'unknown',
    name: sourceAuthor?.name || contact?.name,
    email: sourceAuthor?.email || contact?.email
  };

  // Process initial message
  const initial_message = {
    body_html: conversation.source?.body,
    body_clean: cleanConversationMessage(conversation.source?.body || ''),
    created_at: conversation.created_at,
    author: conversation.source?.author
  };

  // Process all conversation parts
  const parts = (conversation.conversation_parts?.conversation_parts || []).map(part => ({
    id: part.id,
    type: part.part_type,
    body_html: part.body || null,
    body_clean: part.body ? cleanConversationMessage(part.body) : null,
    created_at: part.created_at,
    author_type: part.author?.type,
    author_id: part.author?.id,
    author_name: part.author?.name,
    author_email: part.author?.email
  }));

  // Extract notes (part_type === 'note')
  const notes = (conversation.conversation_parts?.conversation_parts || [])
    .filter(p => p.part_type === 'note')
    .map(note => ({
      id: note.id,
      body_html: note.body,
      body_clean: cleanConversationMessage(note.body || ''),
      created_at: note.created_at,
      author_id: note.author?.id || '',
      author_name: note.author?.name || '',
      is_from_jon: note.author?.id === JON_ADMIN_ID,
      is_from_mark: note.author?.email === MARK_EMAIL
    }));

  // Extract admin responses (part_type === 'comment' && author.type === 'admin')
  const admin_responses = (conversation.conversation_parts?.conversation_parts || [])
    .filter(p => p.part_type === 'comment' && p.author?.type === 'admin')
    .map(msg => ({
      id: msg.id,
      body_html: msg.body,
      body_clean: cleanConversationMessage(msg.body || ''),
      created_at: msg.created_at,
      author_id: msg.author?.id || '',
      author_name: msg.author?.name || '',
      is_from_jon: msg.author?.id === JON_ADMIN_ID,
      is_from_mark: msg.author?.email === MARK_EMAIL
    }));

  // Extract user messages (part_type === 'comment' && author.type === 'user')
  const user_messages = (conversation.conversation_parts?.conversation_parts || [])
    .filter(p => p.part_type === 'comment' && p.author?.type === 'user')
    .map(msg => ({
      id: msg.id,
      body_html: msg.body,
      body_clean: cleanConversationMessage(msg.body || ''),
      created_at: msg.created_at,
      author_id: msg.author?.id,
      author_name: msg.author?.name
    }));

  // Count totals
  const allParts = conversation.conversation_parts?.conversation_parts || [];
  const total_comments = allParts.filter(p => p.part_type === 'comment').length;
  const total_notes = allParts.filter(p => p.part_type === 'note').length;

  return {
    conversation_id: conversation.id,
    state: conversation.state,
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,
    user,
    initial_message,
    parts,
    notes,
    admin_responses,
    user_messages,
    admin_assignee_id: (conversation as any).admin_assignee_id,
    total_parts: allParts.length,
    total_comments,
    total_notes
  };
}

/**
 * Main analysis function
 */
async function runFullAnalysis() {
  console.log('🚀 Starting full conversation data analysis...\n');

  try {
    // Step 1: Refresh cache
    console.log('📥 Step 1/4: Refreshing Intercom cache...');
    await refreshIntercomCache();
    console.log('✅ Cache refreshed\n');

    // Step 2: Get cached conversations
    console.log('📊 Step 2/4: Loading conversations from cache...');
    const cache = await getIntercomCache();
    const conversations = cache.conversations;
    console.log(`✅ Loaded ${conversations.length} conversations\n`);

    if (conversations.length === 0) {
      console.log('⚠️  No conversations found. Exiting.');
      return;
    }

    const firstQuestions: FirstQuestion[] = [];
    const errorResolutions: ErrorResolution[] = [];
    const conversationThreads: ConversationThread[] = [];

    // Step 3: Process conversations
    console.log('🔍 Step 3/4: Analyzing conversations...');
    console.log('   (This may take a while for large datasets)\n');

    // Process in batches to avoid rate limits
    const batchSize = 10;
    const totalBatches = Math.ceil(conversations.length / batchSize);

    for (let i = 0; i < conversations.length; i += batchSize) {
      const batch = conversations.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;

      process.stdout.write(`   Processing batch ${currentBatch}/${totalBatches}... `);

      const results = await Promise.all(
        batch.map(conv => fetchConversationDetails(conv.id))
      );

      for (const detail of results) {
        if (!detail) continue;

        // Save complete conversation thread
        const thread = saveConversationThread(detail);
        conversationThreads.push(thread);

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

      console.log('✓');

      // Rate limit protection (1 second between batches)
      if (i + batchSize < conversations.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n✅ Analysis complete\n`);

    // Sort data chronologically
    firstQuestions.sort((a, b) => a.timestamp - b.timestamp);
    errorResolutions.sort((a, b) => a.reported_at - b.reported_at);

    // Generate statistics
    const resolvedErrors = errorResolutions.filter(e => e.status === 'resolved');
    const avgResolutionTime = resolvedErrors.length > 0
      ? resolvedErrors.reduce((sum, e) => sum + (e.resolution_time_hours || 0), 0) / resolvedErrors.length
      : 0;

    // Calculate thread statistics
    const threadsWithNotes = conversationThreads.filter(t => t.total_notes > 0);
    const jonsNotes = conversationThreads.reduce((sum, t) => sum + t.notes.filter(n => n.is_from_jon).length, 0);
    const marksNotes = conversationThreads.reduce((sum, t) => sum + t.notes.filter(n => n.is_from_mark).length, 0);
    const jonsResponses = conversationThreads.reduce((sum, t) => sum + t.admin_responses.filter(r => r.is_from_jon).length, 0);
    const marksResponses = conversationThreads.reduce((sum, t) => sum + t.admin_responses.filter(r => r.is_from_mark).length, 0);

    const stats = {
      analysis_metadata: {
        generated_at: new Date().toISOString(),
        total_conversations_analyzed: conversations.length,
        api_version: '2.13'
      },
      conversation_threads: {
        total_saved: conversationThreads.length,
        with_notes: threadsWithNotes.length,
        total_notes: conversationThreads.reduce((sum, t) => sum + t.total_notes, 0),
        jons_notes: jonsNotes,
        marks_notes: marksNotes,
        total_admin_responses: conversationThreads.reduce((sum, t) => sum + t.admin_responses.length, 0),
        jons_responses: jonsResponses,
        marks_responses: marksResponses,
        total_user_messages: conversationThreads.reduce((sum, t) => sum + t.user_messages.length, 0),
        average_parts_per_thread: conversationThreads.reduce((sum, t) => sum + t.total_parts, 0) / conversationThreads.length || 0
      },
      first_questions: {
        total_extracted: firstQuestions.length,
        with_question_mark: firstQuestions.filter(q => q.contains_question_mark).length,
        average_word_count: firstQuestions.reduce((sum, q) => sum + q.word_count, 0) / firstQuestions.length || 0,
        by_month: {} as Record<string, number>
      },
      errors: {
        total_conversations: errorResolutions.length,
        resolved: errorResolutions.filter(e => e.status === 'resolved').length,
        in_progress: errorResolutions.filter(e => e.status === 'in_progress').length,
        unresolved: errorResolutions.filter(e => e.status === 'unresolved').length,
        average_resolution_time_hours: avgResolutionTime,
        median_resolution_time_hours: calculateMedian(resolvedErrors.map(e => e.resolution_time_hours || 0)),
        by_type: errorResolutions.reduce((acc, e) => {
          acc[e.error_type] = (acc[e.error_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_month: {} as Record<string, number>
      }
    };

    // Calculate monthly distributions
    firstQuestions.forEach(q => {
      const month = q.date.substring(0, 7); // YYYY-MM
      stats.first_questions.by_month[month] = (stats.first_questions.by_month[month] || 0) + 1;
    });

    errorResolutions.forEach(e => {
      const month = new Date(e.reported_at * 1000).toISOString().substring(0, 7);
      stats.errors.by_month[month] = (stats.errors.by_month[month] || 0) + 1;
    });

    // Step 4: Write output files
    console.log('💾 Step 4/4: Writing output files...\n');

    const outputDir = path.join(process.cwd(), 'data', 'conversation-analysis');
    await fs.mkdir(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const files = {
      threads: path.join(outputDir, `threads-${timestamp}.json`),
      firstQuestions: path.join(outputDir, `first-questions-${timestamp}.json`),
      errorResolutions: path.join(outputDir, `error-resolutions-${timestamp}.json`),
      stats: path.join(outputDir, `analysis-stats-${timestamp}.json`)
    };

    await fs.writeFile(files.threads, JSON.stringify(conversationThreads, null, 2));
    await fs.writeFile(files.firstQuestions, JSON.stringify(firstQuestions, null, 2));
    await fs.writeFile(files.errorResolutions, JSON.stringify(errorResolutions, null, 2));
    await fs.writeFile(files.stats, JSON.stringify(stats, null, 2));

    console.log('✅ All files generated successfully!\n');
    console.log('📄 Output files:');
    console.log(`   1. ${files.threads}`);
    console.log(`   2. ${files.firstQuestions}`);
    console.log(`   3. ${files.errorResolutions}`);
    console.log(`   4. ${files.stats}\n`);

    console.log('📊 Summary Statistics:\n');
    console.log('   Conversation Threads:');
    console.log(`      Total saved: ${stats.conversation_threads.total_saved}`);
    console.log(`      Threads with notes: ${stats.conversation_threads.with_notes}`);
    console.log(`      Jon's notes: ${stats.conversation_threads.jons_notes}`);
    console.log(`      Mark's notes: ${stats.conversation_threads.marks_notes}`);
    console.log(`      Jon's responses: ${stats.conversation_threads.jons_responses}`);
    console.log(`      Mark's responses: ${stats.conversation_threads.marks_responses}`);
    console.log(`      Avg parts per thread: ${stats.conversation_threads.average_parts_per_thread.toFixed(1)}\n`);

    console.log('   First Questions:');
    console.log(`      Total: ${stats.first_questions.total_extracted}`);
    console.log(`      With "?": ${stats.first_questions.with_question_mark}`);
    console.log(`      Avg words: ${stats.first_questions.average_word_count.toFixed(1)}\n`);

    console.log('   Error Resolutions:');
    console.log(`      Total: ${stats.errors.total_conversations}`);
    console.log(`      Resolved: ${stats.errors.resolved}`);
    console.log(`      In Progress: ${stats.errors.in_progress}`);
    console.log(`      Unresolved: ${stats.errors.unresolved}`);
    console.log(`      Avg Resolution: ${stats.errors.average_resolution_time_hours.toFixed(2)} hours`);
    console.log(`      Median Resolution: ${stats.errors.median_resolution_time_hours.toFixed(2)} hours\n`);

    console.log('   Error Types:');
    Object.entries(stats.errors.by_type)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`      ${type}: ${count}`);
      });

    console.log('\n🎯 Files are ready for download!');

    logInfo(`Conversation analysis complete. Generated ${conversationThreads.length} threads, ${firstQuestions.length} first questions, and ${errorResolutions.length} error resolutions`, 'api.log');
  } catch (error) {
    console.error('\n❌ Analysis failed:', error);
    logError(`Conversation analysis failed: ${error instanceof Error ? error.stack || error.message : error}`, 'api.log');
    process.exit(1);
  }
}

function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = numbers.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// Run if called directly
if (require.main === module) {
  runFullAnalysis()
    .then(() => {
      console.log('\n✨ Analysis complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

export { runFullAnalysis, fetchConversationDetails, extractFirstQuestion, analyzeErrorResolution };
