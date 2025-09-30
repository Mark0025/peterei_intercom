/**
 * Intercom Notes Utility
 *
 * Functions for adding notes to Intercom conversations
 */

const INTERCOM_API_BASE = 'https://api.intercom.io';

// Clean access token (remove quotes if present)
const RAW_ACCESS_TOKEN = process.env.INTERCOM_ACCESS_TOKEN;
const ACCESS_TOKEN = RAW_ACCESS_TOKEN?.replace(/^"|"$/g, '');

// Admin ID for mark@peteri.com (hardcoded for now)
const PETE_ADMIN_ID = '7628027'; // You can find this from Intercom API /admins endpoint

interface AddNoteResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Add a note to an Intercom conversation
 *
 * @param conversationId - The Intercom conversation ID
 * @param body - The note content (supports markdown)
 * @param author - Note author identifier (default: 'PeteAI')
 * @returns Result object with success status
 */
export async function addNoteToConversation(
  conversationId: string,
  body: string,
  author: string = 'PeteAI'
): Promise<AddNoteResult> {
  try {
    if (!ACCESS_TOKEN) {
      return {
        success: false,
        error: 'INTERCOM_ACCESS_TOKEN not configured',
      };
    }

    console.log(`[Intercom Notes] Adding note to conversation ${conversationId}`);

    const response = await fetch(
      `${INTERCOM_API_BASE}/conversations/${conversationId}/notes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Intercom-Version': '2.11',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: `**${author}**\n\n${body}`,
          admin_id: PETE_ADMIN_ID,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Intercom Notes] API error ${response.status}:`, errorText);
      return {
        success: false,
        error: `Intercom API error: ${response.status}`,
      };
    }

    const data = await response.json();
    console.log('[Intercom Notes] Note added successfully');

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[Intercom Notes] Error adding note:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get the admin ID by email
 * Useful for dynamically finding the admin ID
 *
 * @param email - Admin email address
 * @returns Admin ID or null if not found
 */
export async function getAdminIdByEmail(email: string): Promise<string | null> {
  try {
    if (!ACCESS_TOKEN) {
      console.error('[Intercom Notes] INTERCOM_ACCESS_TOKEN not configured');
      return null;
    }

    const response = await fetch(`${INTERCOM_API_BASE}/admins`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Intercom-Version': '2.11',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[Intercom Notes] Failed to fetch admins: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const admins = data.admins || [];

    const admin = admins.find((a: { email: string }) => a.email === email);
    return admin?.id || null;
  } catch (error) {
    console.error('[Intercom Notes] Error fetching admin:', error);
    return null;
  }
}
