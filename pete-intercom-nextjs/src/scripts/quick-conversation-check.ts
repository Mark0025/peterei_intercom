/**
 * Quick Conversation Structure Check
 * Directly fetch one conversation to inspect structure
 */

const INTERCOM_ACCESS_TOKEN = process.env.INTERCOM_ACCESS_TOKEN?.replace(/^"|"$/g, '');
const INTERCOM_API_BASE = 'https://api.intercom.io';

async function quickCheck() {
  if (!INTERCOM_ACCESS_TOKEN) {
    console.error('❌ INTERCOM_ACCESS_TOKEN not found');
    process.exit(1);
  }

  // Use a conversation ID from our analysis (first one)
  const conversationId = '1'; // From first-questions JSON

  console.log(`\n🔍 Fetching conversation: ${conversationId}\n`);

  try {
    const response = await fetch(`${INTERCOM_API_BASE}/conversations/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        'Intercom-Version': '2.13',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status}`);
      process.exit(1);
    }

    const conv = await response.json();

    console.log('='.repeat(80));
    console.log('\n✅ CONVERSATION FETCHED\n');
    console.log('='.repeat(80));

    // Check for notes
    console.log('\n🔍 NOTES CHECK:');
    if (conv.notes) {
      console.log('  ✅ Has "notes" property');
      console.log(`     ${JSON.stringify(conv.notes, null, 2)}`);
    } else {
      console.log('  ❌ No "notes" property');
    }

    // Check conversation parts
    console.log('\n📝 CONVERSATION PARTS:');
    if (conv.conversation_parts?.conversation_parts) {
      const parts = conv.conversation_parts.conversation_parts;
      console.log(`  ✅ ${parts.length} parts found\n`);

      // Check part types
      const partTypes = new Set(parts.map((p: any) => p.part_type));
      console.log('  Part types:', Array.from(partTypes).join(', '));

      // Check for notes in parts
      const noteParts = parts.filter((p: any) =>
        p.part_type === 'note' ||
        p.part_type === 'admin_note' ||
        p.type === 'note'
      );

      if (noteParts.length > 0) {
        console.log(`\n  ✅ FOUND ${noteParts.length} NOTE-TYPE PARTS!\n`);
        console.log('  First note:');
        console.log(JSON.stringify(noteParts[0], null, 2));
      } else {
        console.log('\n  ❌ No note-type parts');
      }

      // Show admin messages
      const adminMsgs = parts.filter((p: any) => p.author?.type === 'admin');
      console.log(`\n  📧 ${adminMsgs.length} admin messages`);
      if (adminMsgs.length > 0) {
        console.log(`\n  Sample admin message:`);
        console.log(`    Author: ${adminMsgs[0].author?.name} (${adminMsgs[0].author?.id})`);
        console.log(`    Part type: ${adminMsgs[0].part_type}`);
        console.log(`    Body preview: ${adminMsgs[0].body?.substring(0, 100)}...`);
      }
    } else {
      console.log('  ❌ No conversation_parts');
    }

    // All keys
    console.log('\n🔑 TOP-LEVEL KEYS:');
    console.log('  ', Object.keys(conv).join(', '));

    // Save to file
    const fs = await import('fs/promises');
    await fs.writeFile(
      'data/conversation-analysis/sample-conversation-full.json',
      JSON.stringify(conv, null, 2)
    );

    console.log('\n💾 Saved to: data/conversation-analysis/sample-conversation-full.json\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

quickCheck().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
