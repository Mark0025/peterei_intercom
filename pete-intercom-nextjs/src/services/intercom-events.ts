/**
 * Intercom Events & Page Views Service
 *
 * Fetches user activity data (events, page views) from Intercom API
 * before it gets deleted after 9 months of inactivity (visitor retention policy).
 *
 * API Limitations:
 * - Can only fetch events less than 90 days old
 * - Events are sorted by created_at descending (most recent first)
 * - Paginated with 'next' URL in pages object
 */

import type {
  IntercomEvent,
  IntercomEventsResponse,
  IntercomEventSummary,
  IntercomContact
} from '@/types';
import { logInfo, logError, logDebug } from './logger';
import { env } from '@/lib/env';

const INTERCOM_API_BASE = 'https://api.intercom.io';

const getAuthHeaders = (): HeadersInit => ({
  'Authorization': `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
  'Intercom-Version': '2.13',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
});

/**
 * Fetch all events for a specific user
 *
 * @param identifier - User identifier (email, user_id, or intercom_user_id)
 * @param identifierType - Type of identifier ('email', 'user_id', 'intercom_user_id')
 * @returns All events for the user (max 90 days old)
 */
export async function getUserEvents(
  identifier: string,
  identifierType: 'email' | 'user_id' | 'intercom_user_id' = 'email'
): Promise<IntercomEvent[]> {
  const allEvents: IntercomEvent[] = [];
  let nextUrl: string | null = `${INTERCOM_API_BASE}/events?type=user&${identifierType}=${encodeURIComponent(identifier)}`;

  logInfo(`[Intercom Events] Fetching events for ${identifierType}=${identifier}`, 'api.log');

  while (nextUrl) {
    try {
      const response = await fetch(nextUrl, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data: IntercomEventsResponse = await response.json();

      if (data.events && data.events.length > 0) {
        allEvents.push(...data.events);
        logDebug(`[Intercom Events] Fetched ${data.events.length} events, total: ${allEvents.length}`, 'api.log');
      }

      // Handle pagination
      nextUrl = data.pages?.next || null;
    } catch (err) {
      logError(`[Intercom Events] Error fetching events: ${err instanceof Error ? err.message : err}`, 'api.log');
      throw err;
    }
  }

  logInfo(`[Intercom Events] Retrieved ${allEvents.length} total events for ${identifierType}=${identifier}`, 'api.log');
  return allEvents;
}

/**
 * Fetch event summaries for a user (counts only)
 *
 * @param identifier - User identifier
 * @param identifierType - Type of identifier
 * @returns Event summaries with counts
 */
export async function getUserEventSummaries(
  identifier: string,
  identifierType: 'email' | 'user_id' | 'intercom_user_id' = 'email'
): Promise<IntercomEventSummary[]> {
  const url = `${INTERCOM_API_BASE}/events?type=user&${identifierType}=${encodeURIComponent(identifier)}&summary=true`;

  logInfo(`[Intercom Events] Fetching event summaries for ${identifierType}=${identifier}`, 'api.log');

  try {
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Intercom returns summaries in a specific format
    const summaries: IntercomEventSummary[] = data.email || [];

    logInfo(`[Intercom Events] Retrieved ${summaries.length} event summaries`, 'api.log');
    return summaries;
  } catch (err) {
    logError(`[Intercom Events] Error fetching event summaries: ${err instanceof Error ? err.message : err}`, 'api.log');
    throw err;
  }
}

/**
 * Fetch events for all contacts in the system
 *
 * This is the core daily archival function that should run as a cron job.
 *
 * @param contacts - Array of contacts to fetch events for
 * @param maxAge - Maximum age in days to fetch (default 90, max supported by Intercom)
 * @returns Map of contact_id -> events
 */
export async function fetchAllUserEvents(
  contacts: IntercomContact[],
  maxAge: number = 90
): Promise<Map<string, IntercomEvent[]>> {
  const eventsByContact = new Map<string, IntercomEvent[]>();
  const startTime = Date.now();

  logInfo(`[Intercom Events] Starting bulk event fetch for ${contacts.length} contacts (max age: ${maxAge} days)`, 'api.log');

  for (const contact of contacts) {
    try {
      // Skip contacts without identifiers
      if (!contact.email && !contact.id) {
        logDebug(`[Intercom Events] Skipping contact with no email or ID`, 'api.log');
        continue;
      }

      // Prefer email, fallback to intercom_user_id
      const identifier = contact.email || contact.id;
      const identifierType = contact.email ? 'email' : 'intercom_user_id';

      const events = await getUserEvents(identifier, identifierType);

      if (events.length > 0) {
        eventsByContact.set(contact.id, events);
        logInfo(`[Intercom Events] Contact ${contact.email || contact.id}: ${events.length} events`, 'api.log');
      }

      // Rate limiting: small delay between requests to avoid hitting API limits
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      logError(`[Intercom Events] Failed to fetch events for contact ${contact.id}: ${err instanceof Error ? err.message : err}`, 'api.log');
      // Continue with next contact even if one fails
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalEvents = Array.from(eventsByContact.values()).reduce((sum, events) => sum + events.length, 0);

  logInfo(`[Intercom Events] Bulk fetch complete: ${eventsByContact.size} contacts with events, ${totalEvents} total events in ${duration}s`, 'api.log');

  return eventsByContact;
}

/**
 * Extract page view events from all events
 * Page views are typically tracked as events with specific names
 */
export function extractPageViews(events: IntercomEvent[]): IntercomEvent[] {
  return events.filter(event =>
    event.event_name === 'page_view' ||
    event.event_name === 'visited' ||
    event.event_name.toLowerCase().includes('page')
  );
}
