'use server';

/**
 * Daily Event Archival System
 *
 * Archives user activity data from Intercom to prevent data loss.
 *
 * Intercom Retention Policy:
 * - Visitor data (including events/page views) deleted after 9 months of inactivity
 * - Events API only returns events < 90 days old
 *
 * Solution:
 * - Run daily to capture all user events
 * - Store in persistent JSON files
 * - Indexed by date for easy retrieval
 */

import type { IntercomContact, ArchivedUserActivity, IntercomEvent } from '@/types';
import { searchContacts } from '@/services/intercom';
import { fetchAllUserEvents, extractPageViews, getUserEventSummaries } from '@/services/intercom-events';
import { logInfo, logError } from '@/services/logger';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const ARCHIVE_BASE_DIR = path.join(process.cwd(), 'data', 'event-archives');

/**
 * Ensure archive directory structure exists
 */
async function ensureArchiveDirectories(): Promise<void> {
  const dirs = [
    ARCHIVE_BASE_DIR,
    path.join(ARCHIVE_BASE_DIR, 'daily'),
    path.join(ARCHIVE_BASE_DIR, 'by-contact'),
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
      logInfo(`[Archive] Created directory: ${dir}`, 'api.log');
    }
  }
}

/**
 * Get archive filename for a specific date
 */
function getDailyArchiveFilename(date: Date): string {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(ARCHIVE_BASE_DIR, 'daily', `events-${dateStr}.json`);
}

/**
 * Get archive filename for a specific contact
 */
function getContactArchiveFilename(contactId: string): string {
  return path.join(ARCHIVE_BASE_DIR, 'by-contact', `${contactId}.json`);
}

/**
 * Archive events for all contacts (main daily job)
 *
 * This should be called by a cron job or scheduled task daily.
 */
export async function archiveAllUserEvents(): Promise<{
  success: boolean;
  contactsProcessed: number;
  totalEvents: number;
  archiveFile?: string;
  error?: string;
}> {
  const startTime = Date.now();
  const today = new Date();

  try {
    logInfo(`[Archive] Starting daily event archival for ${today.toISOString()}`, 'api.log');

    // 1. Ensure directories exist
    await ensureArchiveDirectories();

    // 2. Get all contacts (from cache)
    const contacts = await searchContacts(undefined, undefined, false);
    logInfo(`[Archive] Found ${contacts.length} contacts to process`, 'api.log');

    // 3. Fetch events for all contacts
    const eventsByContact = await fetchAllUserEvents(contacts);

    // 4. Build archive data
    const archives: ArchivedUserActivity[] = [];
    let totalEvents = 0;

    for (const [contactId, events] of eventsByContact.entries()) {
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) continue;

      const pageViews = extractPageViews(events);

      // Get event summaries if we have an identifier
      let eventSummaries = [];
      try {
        const identifier = contact.email || contact.id;
        const identifierType = contact.email ? 'email' : 'intercom_user_id';
        eventSummaries = await getUserEventSummaries(identifier, identifierType);
      } catch (err) {
        logError(`[Archive] Failed to get summaries for ${contactId}: ${err}`, 'api.log');
      }

      const archive: ArchivedUserActivity = {
        contact_id: contactId,
        email: contact.email,
        name: contact.name,
        archived_at: Date.now(),
        data_period_start: Date.now() - (90 * 24 * 60 * 60 * 1000), // 90 days ago
        data_period_end: Date.now(),
        events,
        page_views: pageViews,
        event_summaries: eventSummaries,
      };

      archives.push(archive);
      totalEvents += events.length;

      // Also save per-contact archive for easy lookup
      await saveContactArchive(contactId, archive);
    }

    // 5. Save daily archive
    const archiveFilename = getDailyArchiveFilename(today);
    await writeFile(
      archiveFilename,
      JSON.stringify({
        archived_at: today.toISOString(),
        total_contacts: archives.length,
        total_events: totalEvents,
        archives,
      }, null, 2)
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logInfo(`[Archive] Daily archival complete: ${archives.length} contacts, ${totalEvents} events in ${duration}s`, 'api.log');
    logInfo(`[Archive] Saved to: ${archiveFilename}`, 'api.log');

    return {
      success: true,
      contactsProcessed: archives.length,
      totalEvents,
      archiveFile: archiveFilename,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logError(`[Archive] Daily archival failed: ${errorMsg}`, 'api.log');

    return {
      success: false,
      contactsProcessed: 0,
      totalEvents: 0,
      error: errorMsg,
    };
  }
}

/**
 * Save archive for a specific contact
 */
async function saveContactArchive(
  contactId: string,
  archive: ArchivedUserActivity
): Promise<void> {
  const filename = getContactArchiveFilename(contactId);

  // Load existing archives if any
  let existingArchives: ArchivedUserActivity[] = [];
  if (existsSync(filename)) {
    try {
      const data = await readFile(filename, 'utf-8');
      existingArchives = JSON.parse(data);
    } catch (err) {
      logError(`[Archive] Failed to read existing archive for ${contactId}: ${err}`, 'api.log');
    }
  }

  // Append new archive
  existingArchives.push(archive);

  // Save updated archives
  await writeFile(filename, JSON.stringify(existingArchives, null, 2));
  logInfo(`[Archive] Updated contact archive: ${filename}`, 'api.log');
}

/**
 * Get archived events for a specific contact
 */
export async function getContactArchivedEvents(
  contactId: string
): Promise<ArchivedUserActivity[]> {
  const filename = getContactArchiveFilename(contactId);

  if (!existsSync(filename)) {
    return [];
  }

  try {
    const data = await readFile(filename, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    logError(`[Archive] Failed to read contact archive ${contactId}: ${err}`, 'api.log');
    return [];
  }
}

/**
 * Get archived events for a specific date
 */
export async function getDailyArchive(date: Date): Promise<{
  archived_at: string;
  total_contacts: number;
  total_events: number;
  archives: ArchivedUserActivity[];
} | null> {
  const filename = getDailyArchiveFilename(date);

  if (!existsSync(filename)) {
    return null;
  }

  try {
    const data = await readFile(filename, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    logError(`[Archive] Failed to read daily archive for ${date.toISOString()}: ${err}`, 'api.log');
    return null;
  }
}
