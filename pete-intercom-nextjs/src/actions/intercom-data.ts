/**
 * Intercom Data Fetching Actions
 *
 * Dynamically fetches Intercom data based on field configuration.
 * Uses centralized config to determine which fields to fetch and return.
 */

'use server';

import { logInfo, logError } from '@/services/logger';
import { env } from '@/lib/env';
import { getEnabledContactFields, extractFieldValue, type IntercomFieldConfig } from '@/config/intercom-fields';

/**
 * Get all contacts from Intercom with dynamically configured fields
 *
 * @returns All contacts with only the enabled fields from config
 */
export async function getAllIntercomContacts(): Promise<{
  success: boolean;
  contacts?: Record<string, any>[];
  error?: string;
  totalCount?: number;
  fieldsReturned?: string[];
}> {
  try {
    const enabledFields = getEnabledContactFields();
    logInfo(`[Intercom Data] Fetching all contacts with ${enabledFields.length} enabled fields`);

    const allContacts: Record<string, any>[] = [];
    let nextUrl: string | null = 'https://api.intercom.io/contacts';
    let page = 1;

    while (nextUrl) {
      logInfo(`[Intercom Data] Fetching page ${page}: ${nextUrl}`);

      const response = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
          'Intercom-Version': '2.13',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch contacts: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const contacts = data.data || data.contacts || [];

      logInfo(`[Intercom Data] Retrieved ${contacts.length} contacts from page ${page}`);

      // Extract only enabled fields from each contact
      contacts.forEach((contact: any) => {
        const filteredContact: Record<string, any> = {};

        enabledFields.forEach((field: IntercomFieldConfig) => {
          const value = extractFieldValue(contact, field);
          filteredContact[field.name] = value;
        });

        allContacts.push(filteredContact);
      });

      // Handle pagination
      if (data.pages && data.pages.next) {
        if (typeof data.pages.next === 'string') {
          nextUrl = data.pages.next;
        } else if (typeof data.pages.next === 'object' && data.pages.next.starting_after) {
          nextUrl = `https://api.intercom.io/contacts?page=${page + 1}&starting_after=${encodeURIComponent(data.pages.next.starting_after)}`;
        } else {
          nextUrl = null;
        }
      } else {
        nextUrl = null;
      }

      page++;
    }

    const fieldNames = enabledFields.map(f => f.name);
    logInfo(`[Intercom Data] Retrieved ${allContacts.length} contacts from ${page - 1} pages with fields: ${fieldNames.join(', ')}`);

    return {
      success: true,
      contacts: allContacts,
      totalCount: allContacts.length,
      fieldsReturned: fieldNames,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[Intercom Data] Error fetching contacts: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}