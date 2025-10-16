/**
 * HTML to Plain Text Converter
 * Strips HTML formatting from conversation messages to get clean text
 * Same format as AI agents would receive in Intercom
 */

/**
 * Convert HTML to plain text, preserving line breaks and readability
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';

  let text = html;

  // Replace <br> and <br/> with newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Replace </p> and </div> with double newlines (paragraph breaks)
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');

  // Replace </li> with newlines
  text = text.replace(/<\/li>/gi, '\n');

  // Replace <hr> with a line separator
  text = text.replace(/<hr\s*\/?>/gi, '\n---\n');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  text = decodeHtmlEntities(text);

  // Clean up whitespace while preserving intentional line breaks
  text = text
    // Trim whitespace from each line first
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)  // Remove empty lines
    .join('\n')
    // Replace multiple newlines with maximum 2 newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim overall
    .trim();

  return text;
}

/**
 * Decode common HTML entities to their text equivalents
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&mdash;': '—',
    '&ndash;': '–',
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&rdquo;': '"',
    '&ldquo;': '"',
    '&hellip;': '...',
    '&bull;': '•',
    '&middot;': '·',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
  };

  let decoded = text;

  // Replace named entities
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  // Replace numeric entities (&#123; or &#xAB;)
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });

  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return decoded;
}

/**
 * Extract plain text from conversation body with intelligent formatting
 * Handles Intercom-specific HTML patterns
 */
export function cleanConversationMessage(message: string): string {
  if (!message) return '';

  // First pass: convert HTML to plain text
  let cleaned = htmlToPlainText(message);

  // Remove Intercom tracking pixels and empty content
  cleaned = cleaned.replace(/\[image\]/gi, '');
  cleaned = cleaned.replace(/\[Image\]/g, '');

  // Clean up any remaining artifacts
  cleaned = cleaned
    .replace(/\s+/g, ' ')  // Multiple spaces to single
    .replace(/\n\s+\n/g, '\n\n')  // Clean empty lines
    .trim();

  return cleaned;
}

/**
 * Validate that text is meaningful (not just whitespace or artifacts)
 */
export function isValidMessage(text: string): boolean {
  if (!text || text.trim().length === 0) return false;

  // Must have at least 2 characters
  if (text.trim().length < 2) return false;

  // Must contain at least one letter or number
  if (!/[a-zA-Z0-9]/.test(text)) return false;

  return true;
}

/**
 * Extract the most important part of a message (first sentence or paragraph)
 * Useful for summarization
 */
export function extractMessageSummary(text: string, maxLength: number = 100): string {
  if (!text) return '';

  const cleaned = cleanConversationMessage(text);

  // Try to get first sentence
  const firstSentence = cleaned.split(/[.!?]\s+/)[0];

  if (firstSentence && firstSentence.length <= maxLength) {
    return firstSentence;
  }

  // If first sentence too long, truncate intelligently
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // Find last space before maxLength
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Example usage and tests
 */
export function testHtmlCleaner() {
  const testCases = [
    {
      input: '<p>Hello world!</p>',
      expected: 'Hello world!'
    },
    {
      input: 'I need help with <strong>data upload</strong>.',
      expected: 'I need help with data upload.'
    },
    {
      input: '<p>First paragraph</p><p>Second paragraph</p>',
      expected: 'First paragraph\n\nSecond paragraph'
    },
    {
      input: 'Item 1<br>Item 2<br/>Item 3',
      expected: 'Item 1\nItem 2\nItem 3'
    },
    {
      input: 'Hello &amp; goodbye &quot;friend&quot;',
      expected: 'Hello & goodbye "friend"'
    },
    {
      input: '<div>Error: File not found</div><div>Please try again</div>',
      expected: 'Error: File not found\nPlease try again'
    }
  ];

  console.log('Running HTML cleaner tests...\n');

  let passed = 0;
  let failed = 0;

  testCases.forEach((test, index) => {
    const result = cleanConversationMessage(test.input);
    const success = result === test.expected;

    if (success) {
      passed++;
      console.log(`✓ Test ${index + 1} passed`);
    } else {
      failed++;
      console.log(`✗ Test ${index + 1} failed`);
      console.log(`  Input:    "${test.input}"`);
      console.log(`  Expected: "${test.expected}"`);
      console.log(`  Got:      "${result}"`);
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  return { passed, failed };
}
