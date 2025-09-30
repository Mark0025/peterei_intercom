import { NextRequest, NextResponse } from 'next/server';
import { sendMessageToPeteAIJson } from '@/actions/peteai';
import { addNoteToConversation } from '@/utils/intercom-notes';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Verify Intercom webhook signature
function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.INTERCOM_CLIENT_SECRET;
  if (!secret) {
    console.error('[Intercom Webhook] INTERCOM_CLIENT_SECRET not configured');
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const digest = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// Format PeteAI response for better readability in notes
function formatResponseForNote(content: string): string {
  // Convert HTML links to markdown-style links
  let formatted = content.replace(/<a href=['"]([^'"]+)['"]>([^<]+)<\/a>/g, '[$2]($1)');

  // Ensure proper line breaks between steps
  formatted = formatted.replace(/(\d+\.\s)/g, '\n$1');

  // Add line breaks before Mermaid code blocks
  formatted = formatted.replace(/(```mermaid)/g, '\n\n$1');

  // Add line breaks after code blocks
  formatted = formatted.replace(/(```\n)/g, '$1\n');

  // Clean up multiple consecutive line breaks
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  return formatted.trim();
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature');

    // Verify webhook signature
    if (signature && !verifySignature(body, signature)) {
      console.error('[Intercom Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const data = JSON.parse(body);

    console.log('[Intercom Webhook] Received:', data.topic);

    // Handle conversation.user.created or conversation.user.replied
    if (data.topic === 'conversation.user.created' || data.topic === 'conversation.user.replied') {
      const conversationId = data.data?.item?.id;
      const userMessage = data.data?.item?.conversation_parts?.conversation_parts?.[0]?.body
        || data.data?.item?.source?.body;

      if (!conversationId || !userMessage) {
        console.log('[Intercom Webhook] Missing conversation ID or message');
        return NextResponse.json({ status: 'ignored' });
      }

      console.log('[Intercom Webhook] Processing message:', userMessage.substring(0, 100));

      // Get PeteAI response
      const result = await sendMessageToPeteAIJson({ message: userMessage });

      if (result.success && result.data?.reply) {
        // Format the response for better readability
        const formattedResponse = formatResponseForNote(result.data.reply);

        // Add note to conversation
        const noteResult = await addNoteToConversation(
          conversationId,
          formattedResponse,
          'PeteAI'
        );

        if (noteResult.success) {
          console.log('[Intercom Webhook] Note added successfully');
          return NextResponse.json({ status: 'note_added' });
        } else {
          console.error('[Intercom Webhook] Failed to add note:', noteResult.error);
          return NextResponse.json(
            { error: 'Failed to add note' },
            { status: 500 }
          );
        }
      } else {
        console.error('[Intercom Webhook] PeteAI error:', result.error);
        return NextResponse.json(
          { error: 'PeteAI error' },
          { status: 500 }
        );
      }
    }

    // Acknowledge other webhook types
    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('[Intercom Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
