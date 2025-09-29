/**
 * User Training Management Actions
 *
 * TypeScript server actions for managing user training topics.
 * Migrated from bash scripts in intercomApp/src/scripts/
 *
 * @see Issue #5: Convert Admin Scripts to TypeScript (Part 1)
 */

'use server';

import { logInfo, logError } from '@/services/logger';
import { env } from '@/lib/env';

/**
 * Update user training topic
 *
 * @param identifier - Email address or Intercom Contact ID
 * @param newTopic - New training topic value
 * @returns Success status and updated user data
 *
 * @example
 * // Update by email
 * await updateUserTrainingTopic('user@example.com', 'Advanced Features')
 *
 * // Update by Intercom ID
 * await updateUserTrainingTopic('contact-id-123', 'Basic Setup')
 */
export async function updateUserTrainingTopic(
  identifier: string,
  newTopic: string
): Promise<{ success: boolean; userId?: string; error?: string; data?: any }> {
  try {
    logInfo(`[Training] Updating training topic for ${identifier} to: ${newTopic}`);

    let userId = identifier;

    // If identifier is an email, look up the Intercom Contact ID
    if (identifier.includes('@')) {
      const email = identifier;
      logInfo(`[Training] Looking up Contact ID for email: ${email}`);

      const lookupResponse = await fetch(
        `https://api.intercom.io/contacts?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
            Accept: 'application/json',
          },
        }
      );

      if (!lookupResponse.ok) {
        throw new Error(`Failed to lookup user by email: ${lookupResponse.statusText}`);
      }

      const lookupData = await lookupResponse.json();

      if (!lookupData.contacts || lookupData.contacts.length === 0) {
        logError(`[Training] No user found for email: ${email}`);
        return {
          success: false,
          error: `No Intercom user found for email: ${email}`,
        };
      }

      userId = lookupData.contacts[0].id;
      logInfo(`[Training] Found Contact ID: ${userId} for email: ${email}`);
    }

    // Update the user's training topic
    logInfo(`[Training] Updating Contact ${userId} with topic: ${newTopic}`);

    const updateResponse = await fetch(`https://api.intercom.io/contacts/${userId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        custom_attributes: {
          user_training_topic: newTopic,
        },
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update training topic: ${updateResponse.statusText} - ${errorText}`);
    }

    const userData = await updateResponse.json();

    logInfo(`[Training] Successfully updated training topic for user ${userId}`);

    return {
      success: true,
      userId,
      data: userData,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[Training] Error updating training topic: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get user training topic
 *
 * @param identifier - Email address or Intercom Contact ID
 * @returns User's current training topic
 */
export async function getUserTrainingTopic(
  identifier: string
): Promise<{ success: boolean; topic?: string; error?: string; user?: any }> {
  try {
    logInfo(`[Training] Getting training topic for ${identifier}`);

    let userId = identifier;

    // If identifier is an email, look up the Intercom Contact ID
    if (identifier.includes('@')) {
      const email = identifier;
      logInfo(`[Training] Looking up Contact ID for email: ${email}`);

      const lookupResponse = await fetch(
        `https://api.intercom.io/contacts?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
            Accept: 'application/json',
          },
        }
      );

      if (!lookupResponse.ok) {
        throw new Error(`Failed to lookup user by email: ${lookupResponse.statusText}`);
      }

      const lookupData = await lookupResponse.json();

      if (!lookupData.contacts || lookupData.contacts.length === 0) {
        logError(`[Training] No user found for email: ${email}`);
        return {
          success: false,
          error: `No Intercom user found for email: ${email}`,
        };
      }

      userId = lookupData.contacts[0].id;
    }

    // Get the user's data
    const userResponse = await fetch(`https://api.intercom.io/contacts/${userId}`, {
      headers: {
        Authorization: `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
        Accept: 'application/json',
      },
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to get user data: ${userResponse.statusText}`);
    }

    const userData = await userResponse.json();
    const topic = userData.custom_attributes?.user_training_topic || null;

    logInfo(`[Training] Retrieved training topic for user ${userId}: ${topic || '(not set)'}`)

;

    return {
      success: true,
      topic,
      user: userData,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[Training] Error getting training topic: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get ALL users' training topics from Intercom
 *
 * @returns List of all users with their training topics
 */
export async function getAllUserTrainingTopics(): Promise<{
  success: boolean;
  users?: Array<{
    id: string;
    email: string;
    name: string;
    topic: string | null;
    role: string;
    unsubscribed: boolean;
    spam: boolean;
    bounced: boolean;
  }>;
  error?: string;
  totalCount?: number;
}> {
  try {
    logInfo('[Training] Fetching all users with training topics');

    const allUsers: Array<{
      id: string;
      email: string;
      name: string;
      topic: string | null;
      role: string;
      unsubscribed: boolean;
      spam: boolean;
      bounced: boolean;
    }> = [];
    let nextUrl: string | null = 'https://api.intercom.io/contacts';
    let page = 1;

    while (nextUrl) {
      logInfo(`[Training] Fetching page ${page}: ${nextUrl}`);

      const response = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
          'Intercom-Version': '2.13',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch users: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      // Extract contacts array (could be 'data' or 'contacts')
      const contacts = data.data || data.contacts || [];

      logInfo(`[Training] Retrieved ${contacts.length} contacts from page ${page}`);

      contacts.forEach((user: any) => {
        allUsers.push({
          id: user.id,
          email: user.email || 'No email',
          name: user.name || 'No name',
          topic: user.custom_attributes?.user_training_topic || null,
          role: user.role || 'unknown',
          unsubscribed: user.unsubscribed_from_emails || false,
          spam: user.marked_email_as_spam || false,
          bounced: user.has_hard_bounced || false,
        });
      });

      // Handle pagination - Intercom uses cursor-based pagination
      if (data.pages && data.pages.next) {
        if (typeof data.pages.next === 'string') {
          // If it's a full URL, use it directly
          nextUrl = data.pages.next;
        } else if (typeof data.pages.next === 'object' && data.pages.next.starting_after) {
          // If it's an object with starting_after, build the URL
          nextUrl = `https://api.intercom.io/contacts?page=${page + 1}&starting_after=${encodeURIComponent(data.pages.next.starting_after)}`;
        } else {
          nextUrl = null;
        }
      } else {
        nextUrl = null;
      }

      page++;
    }

    logInfo(`[Training] Retrieved ${allUsers.length} total users with training topics from ${page - 1} pages`);

    return {
      success: true,
      users: allUsers,
      totalCount: allUsers.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[Training] Error fetching all users: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Bulk update training topics for multiple users
 *
 * @param updates - Array of {identifier, topic} pairs
 * @returns Array of results for each update
 */
export async function bulkUpdateTrainingTopics(
  updates: Array<{ identifier: string; topic: string }>
): Promise<Array<{ identifier: string; success: boolean; userId?: string; error?: string }>> {
  logInfo(`[Training] Bulk updating ${updates.length} users`);

  const results = await Promise.all(
    updates.map(async ({ identifier, topic }) => {
      const result = await updateUserTrainingTopic(identifier, topic);
      return {
        identifier,
        ...result,
      };
    })
  );

  const successCount = results.filter((r) => r.success).length;
  logInfo(`[Training] Bulk update complete: ${successCount}/${updates.length} succeeded`);

  return results;
}