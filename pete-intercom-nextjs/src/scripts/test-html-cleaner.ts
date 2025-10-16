/**
 * Test HTML cleaner functionality
 * Run: bun src/scripts/test-html-cleaner.ts
 */

import { testHtmlCleaner, cleanConversationMessage, htmlToPlainText } from '../utils/html-cleaner';

console.log('🧪 Testing HTML Cleaner\n');
console.log('=' .repeat(50));
console.log('\n');

// Run automated tests
const results = testHtmlCleaner();

console.log('\n');
console.log('=' .repeat(50));
console.log('\n📝 Real-world Examples:\n');

// Test with real Intercom-style messages
const realWorldExamples = [
  {
    name: 'Simple question with HTML',
    input: '<p>How do I upload my data?</p>',
  },
  {
    name: 'Question with formatting',
    input: '<p>I\'m having trouble with <strong>data import</strong>. Can you help?</p>',
  },
  {
    name: 'Multi-paragraph message',
    input: '<p>Hi there,</p><p>I tried uploading my CSV file but it failed.</p><p>Error: Invalid format</p>',
  },
  {
    name: 'Message with line breaks',
    input: 'Line 1<br>Line 2<br/>Line 3',
  },
  {
    name: 'Message with entities',
    input: '<p>The error says &quot;File not found&quot; &amp; I don&apos;t know what to do.</p>',
  },
  {
    name: 'Complex HTML with nested tags',
    input: '<div><p>Hello,</p><ul><li>First issue</li><li>Second issue</li></ul><p>Thanks!</p></div>',
  },
  {
    name: 'Message with links (should strip HTML but keep text)',
    input: '<p>Check out <a href="https://example.com">this link</a> for more info.</p>',
  },
];

realWorldExamples.forEach((example, index) => {
  console.log(`${index + 1}. ${example.name}`);
  console.log(`   Input:  "${example.input}"`);
  console.log(`   Output: "${cleanConversationMessage(example.input)}"`);
  console.log('');
});

console.log('=' .repeat(50));
console.log('\n✅ HTML cleaner test complete!\n');
