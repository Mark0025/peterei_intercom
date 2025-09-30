'use server';

/**
 * Contacts Server Actions
 *
 * Fetches and manages Intercom contacts from the smart cache
 */

import { getSmartCache, smartSearchContacts } from '@/services/smart-cache';
import type { ActionResult } from '@/types';
import { logInfo, logError } from '@/services/logger';

export interface Contact {
  id: string;
  external_id?: string;  // Pete user ID
  name?: string;
  email?: string;
  role?: string;
  phone?: string | null;
  avatar?: {
    type: string;
    image_url?: string;
  };
  owner_id?: number | null;
  social_profiles?: {
    type: string;
    name: string;
    url: string;
  }[];
  has_hard_bounced?: boolean;
  marked_email_as_spam?: boolean;
  unsubscribed_from_emails?: boolean;
  created_at: number;
  updated_at: number;
  signed_up_at?: number | null;
  last_seen_at?: number | null;
  last_replied_at?: number | null;
  last_contacted_at?: number | null;
  last_email_opened_at?: number | null;
  last_email_clicked_at?: number | null;
  language_override?: string | null;
  browser?: string | null;
  browser_version?: string | null;
  browser_language?: string | null;
  os?: string | null;
  location?: {
    type?: string;
    country?: string;
    region?: string;
    city?: string;
    country_code?: string;
    continent_code?: string;
  };
  android_app_name?: string | null;
  android_app_version?: string | null;
  android_device?: string | null;
  android_os_version?: string | null;
  android_sdk_version?: string | null;
  android_last_seen_at?: number | null;
  ios_app_name?: string | null;
  ios_app_version?: string | null;
  ios_device?: string | null;
  ios_os_version?: string | null;
  ios_sdk_version?: string | null;
  ios_last_seen_at?: number | null;
  custom_attributes?: Record<string, any>;
  tags?: {
    type: string;
    data: Array<{
      type: string;
      id: string;
      name?: string;
      url?: string;
    }>;
  };
  notes?: {
    type: string;
    data: any[];
  };
  companies?: {
    type: string;
    companies: Array<{
      type?: string;
      id: string;
      name?: string;
      url?: string;
    }>;
  };
  opted_out_subscription_types?: {
    type: string;
    data: any[];
  };
  opted_in_subscription_types?: {
    type: string;
    data: any[];
  };
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_medium?: string | null;
  utm_source?: string | null;
  utm_term?: string | null;
  referrer?: string | null;
  segments?: {
    type: string;
    data: Array<{
      type?: string;
      id: string;
      name?: string;
      url?: string;
    }>;
  };
}

/**
 * Get all contacts from cache
 */
export async function getAllContacts(live = false): Promise<ActionResult<Contact[]>> {
  try {
    logInfo('[CONTACTS] Fetching all contacts from cache');
    const cache = getSmartCache();

    return {
      success: true,
      data: cache.contacts as Contact[]
    };
  } catch (error) {
    logError(`[CONTACTS] Error fetching contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contacts'
    };
  }
}

/**
 * Search contacts by email or name
 */
export async function searchContacts(
  email?: string,
  name?: string,
  live = false
): Promise<ActionResult<Contact[]>> {
  try {
    logInfo(`[CONTACTS] Searching contacts: email=${email || 'none'}, name=${name || 'none'}, live=${live}`);
    const results = await smartSearchContacts(email, name, live);

    return {
      success: true,
      data: results as Contact[]
    };
  } catch (error) {
    logError(`[CONTACTS] Error searching contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search contacts'
    };
  }
}

/**
 * Get contact by ID
 */
export async function getContactById(contactId: string): Promise<ActionResult<Contact>> {
  try {
    logInfo(`[CONTACTS] Fetching contact by ID: ${contactId}`);
    const cache = getSmartCache();
    const contact = cache.contacts.find((c: any) => c.id === contactId);

    if (!contact) {
      return {
        success: false,
        error: 'Contact not found'
      };
    }

    return {
      success: true,
      data: contact as Contact
    };
  } catch (error) {
    logError(`[CONTACTS] Error fetching contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contact'
    };
  }
}

/**
 * Get contact statistics
 */
export async function getContactStats(): Promise<ActionResult<{
  total: number;
  withPeteId: number;
  withCompanies: number;
  withTags: number;
  withSegments: number;
  withCustomAttributes: number;
  recentlyActive: number;
}>> {
  try {
    logInfo('[CONTACTS] Calculating contact statistics');
    const cache = getSmartCache();

    const now = Date.now() / 1000;
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);

    const stats = {
      total: cache.contacts.length,
      withPeteId: cache.contacts.filter((c: any) => c.external_id).length,
      withCompanies: cache.contacts.filter((c: any) => c.companies?.companies?.length > 0).length,
      withTags: cache.contacts.filter((c: any) => c.tags?.data?.length > 0).length,
      withSegments: cache.contacts.filter((c: any) => c.segments?.data?.length > 0).length,
      withCustomAttributes: cache.contacts.filter((c: any) => c.custom_attributes && Object.keys(c.custom_attributes).length > 0).length,
      recentlyActive: cache.contacts.filter((c: any) => c.last_seen_at && c.last_seen_at > thirtyDaysAgo).length
    };

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    logError(`[CONTACTS] Error calculating stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate stats'
    };
  }
}
