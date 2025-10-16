/**
 * Discovery Script: Inspect Actual Conversation API Response
 *
 * Purpose: Check what data Intercom actually returns
 * - Do we get notes?
 * - What's in conversation_parts?
 * - Who are the admins?
 *
 * Usage: bun src/scripts/discover-conversation-structure.ts
 */

import { proxyIntercomGet, getIntercomCache } from '../services/intercom';

async function discoverConversationStructure() {
  console.log('🔍 DISCOVERY: Investigating Intercom API Response Structure\n');
  console.log('='.repeat(80));

  try {
    // Step 1: Get admin mapping
    console.log('\n📋 STEP 1: Map Admin IDs\n');
    const cache = await getIntercomCache();

    console.log(`Found ${cache.admins.length} admins:\n`);
    cache.admins.forEach(admin => {
      console.log(`  👤 ${admin.name || 'Unknown'}`);
      console.log(`     Email: ${admin.email}`);
      console.log(`     ID: ${admin.id}\n`);
    });

    // Step 2: Fetch a sample conversation with details
    console.log('='.repeat(80));
    console.log('\n📋 STEP 2: Fetch Sample Conversation Details\n');

    // Use first conversation from cache
    if (cache.conversations.length === 0) {
      console.log('❌ No conversations in cache');
      return;
    }

    const sampleConvId = cache.conversations[0]?.id;
    console.log(`Fetching conversation: ${sampleConvId}\n`);

    const conv = await proxyIntercomGet(`/conversations/${sampleConvId}`) as any;

    console.log('='.repeat(80));
    console.log('\n📊 CONVERSATION STRUCTURE ANALYSIS\n');

    // Check top-level properties
    console.log('Top-level properties:');
    console.log(`  - id: ${conv.id}`);
    console.log(`  - type: ${conv.type}`);
    console.log(`  - state: ${conv.state}`);
    console.log(`  - created_at: ${conv.created_at}`);
    console.log(`  - updated_at: ${conv.updated_at}`);
    console.log(`  - title: ${conv.title || '(none)'}`);

    // Check for notes
    console.log('\n🔍 Checking for NOTES:');
    if (conv.notes) {
      console.log('  ✅ HAS "notes" property!');
      console.log(`     Type: ${typeof conv.notes}`);
      console.log(`     Content: ${JSON.stringify(conv.notes, null, 2)}`);
    } else {
      console.log('  ❌ NO "notes" property');
    }

    // Check conversation parts
    console.log('\n📝 Checking CONVERSATION PARTS:');
    if (conv.conversation_parts && conv.conversation_parts.conversation_parts) {
      const parts = conv.conversation_parts.conversation_parts;
      console.log(`  ✅ Found ${parts.length} conversation parts\n`);

      // Group by type
      const byType: Record<string, number> = {};
      const byPartType: Record<string, number> = {};
      const byAuthorType: Record<string, number> = {};

      parts.forEach((part: any) => {
        byType[part.type] = (byType[part.type] || 0) + 1;
        byPartType[part.part_type] = (byPartType[part.part_type] || 0) + 1;
        if (part.author?.type) {
          byAuthorType[part.author.type] = (byAuthorType[part.author.type] || 0) + 1;
        }
      });

      console.log('  Part types:');
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`    - ${type}: ${count}`);
      });

      console.log('\n  Part sub-types (part_type):');
      Object.entries(byPartType).forEach(([type, count]) => {
        console.log(`    - ${type}: ${count}`);
      });

      console.log('\n  Author types:');
      Object.entries(byAuthorType).forEach(([type, count]) => {
        console.log(`    - ${type}: ${count}`);
      });

      // Check for note-type parts
      const noteParts = parts.filter((p: any) =>
        p.part_type === 'note' ||
        p.type === 'note' ||
        p.part_type === 'admin_note'
      );

      if (noteParts.length > 0) {
        console.log(`\n  ✅ Found ${noteParts.length} NOTE parts!`);
        console.log('\n  Sample note part structure:');
        console.log(JSON.stringify(noteParts[0], null, 2));
      } else {
        console.log('\n  ❌ No note-type parts found');
      }

      // Show first admin message as example
      const adminParts = parts.filter((p: any) => p.author?.type === 'admin');
      if (adminParts.length > 0) {
        console.log(`\n  📧 Sample ADMIN message:`);
        const adminMsg = adminParts[0];
        console.log(`     Author: ${adminMsg.author?.name || 'Unknown'} (ID: ${adminMsg.author?.id})`);
        console.log(`     Part Type: ${adminMsg.part_type}`);
        console.log(`     Body (first 100 chars): ${adminMsg.body?.substring(0, 100) || '(empty)'}...`);
      }

      // Show first user message as example
      const userParts = parts.filter((p: any) => p.author?.type === 'user');
      if (userParts.length > 0) {
        console.log(`\n  👤 Sample USER message:`);
        const userMsg = userParts[0];
        console.log(`     Author: ${userMsg.author?.name || 'Unknown'} (ID: ${userMsg.author?.id})`);
        console.log(`     Part Type: ${userMsg.part_type}`);
        console.log(`     Body (first 100 chars): ${userMsg.body?.substring(0, 100) || '(empty)'}...`);
      }
    } else {
      console.log('  ❌ NO conversation_parts found');
    }

    // Check source
    console.log('\n🎯 Checking SOURCE (initial message):');
    if (conv.source) {
      console.log('  ✅ Has source property');
      console.log(`     Type: ${conv.source.type}`);
      console.log(`     Author type: ${conv.source.author?.type || '(none)'}`);
      console.log(`     Author name: ${conv.source.author?.name || '(none)'}`);
      console.log(`     Body (first 100 chars): ${conv.source.body?.substring(0, 100) || '(empty)'}...`);
    } else {
      console.log('  ❌ NO source property');
    }

    // Check contacts
    console.log('\n👥 Checking CONTACTS:');
    if (conv.contacts && conv.contacts.contacts) {
      console.log(`  ✅ Found ${conv.contacts.contacts.length} contact(s)`);
      conv.contacts.contacts.forEach((contact: any) => {
        console.log(`     - ${contact.name || 'Unknown'} (${contact.email || 'no email'})`);
      });
    } else {
      console.log('  ❌ NO contacts property');
    }

    // Full object keys
    console.log('\n🔑 All TOP-LEVEL KEYS in conversation object:');
    Object.keys(conv).forEach(key => {
      console.log(`  - ${key}`);
    });

    console.log('\n='.repeat(80));
    console.log('\n💾 Full conversation object saved to: discovery-sample-conversation.json\n');

    // Save full object for inspection
    const fs = await import('fs/promises');
    const path = await import('path');
    const outputPath = path.join(process.cwd(), 'data', 'conversation-analysis', 'discovery-sample-conversation.json');
    await fs.writeFile(outputPath, JSON.stringify(conv, null, 2));

    console.log('✅ Discovery complete!\n');

  } catch (error) {
    console.error('\n❌ Discovery failed:', error);
    console.error(error instanceof Error ? error.stack : error);
  }
}

// Run if called directly
if (require.main === module) {
  discoverConversationStructure()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

export { discoverConversationStructure };
