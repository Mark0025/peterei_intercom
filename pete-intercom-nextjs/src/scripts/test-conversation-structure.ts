/**
 * Quick test to inspect actual conversation data structure
 * Run: bun src/scripts/test-conversation-structure.ts
 */

import { getIntercomCache, proxyIntercomGet } from '../services/intercom';
import fs from 'fs/promises';
import path from 'path';

async function testConversationStructure() {
  console.log('🔍 Inspecting conversation data structure...\n');

  try {
    // Get cached conversations
    const cache = await getIntercomCache();
    const conversations = cache.conversations;

    console.log(`📊 Total cached conversations: ${conversations.length}\n`);

    if (conversations.length === 0) {
      console.log('⚠️  No conversations in cache. Try refreshing the cache first.');
      return;
    }

    // Get first conversation from cache (lightweight)
    const firstCachedConv = conversations[0];
    console.log('📝 Sample cached conversation (lightweight):');
    console.log(JSON.stringify(firstCachedConv, null, 2));
    console.log('\n---\n');

    // Fetch detailed conversation from API
    console.log('🌐 Fetching detailed conversation from API...\n');
    const detailedConv = await proxyIntercomGet(`/conversations/${firstCachedConv.id}`);

    console.log('📝 Detailed conversation (with parts/messages):');
    console.log(JSON.stringify(detailedConv, null, 2));

    // Save sample to file
    const outputDir = path.join(process.cwd(), 'data', 'conversation-analysis');
    await fs.mkdir(outputDir, { recursive: true });

    const sampleFile = path.join(outputDir, 'conversation-sample.json');
    await fs.writeFile(sampleFile, JSON.stringify({
      cached: firstCachedConv,
      detailed: detailedConv
    }, null, 2));

    console.log(`\n✅ Sample saved to: ${sampleFile}`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testConversationStructure()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
