#!/usr/bin/env bun
/**
 * Populate Cache with Conversation Threads
 *
 * This script fetches full conversation details for all conversations
 * and caches them for fast frontend queries.
 *
 * Run: bun src/scripts/populate-thread-cache.ts
 */

import { refreshConversationThreads, getCacheStatus, getIntercomCache } from '../services/intercom';
import { logInfo } from '../services/logger';

async function main() {
  console.log('🚀 Starting conversation thread cache population...\n');

  // Wait for cache to initialize (loads from disk on startup)
  console.log('⏳ Waiting for cache to initialize...');
  await getIntercomCache();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Give it 2 seconds

  // Show initial cache status
  const initialStatus = getCacheStatus();
  console.log('📊 Initial Cache Status:');
  console.log(`   Conversations: ${initialStatus.counts.conversations}`);
  console.log(`   Threads: ${initialStatus.counts.conversationThreads}`);
  console.log('');

  if (initialStatus.counts.conversations === 0) {
    console.log('⚠️  No conversations in cache. The cache may not have loaded yet.');
    console.log('   Try running the dev server first or wait a moment.');
    process.exit(1);
  }

  console.log(`📥 Fetching full details for ${initialStatus.counts.conversations} conversations...`);
  console.log('   (This will take ~2-3 minutes with rate limiting)');
  console.log('');

  try {
    await refreshConversationThreads();

    // Show final cache status
    const finalStatus = getCacheStatus();
    console.log('\n✅ Thread cache population complete!\n');
    console.log('📊 Final Cache Status:');
    console.log(`   Conversations: ${finalStatus.counts.conversations}`);
    console.log(`   Threads: ${finalStatus.counts.conversationThreads}`);
    console.log('');

    logInfo(`[CACHE] Successfully populated ${finalStatus.counts.conversationThreads} threads`, 'api.log');
  } catch (err) {
    console.error('❌ Error populating thread cache:', err);
    process.exit(1);
  }
}

main();
