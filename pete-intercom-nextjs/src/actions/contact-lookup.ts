/**
 * Contact Lookup Actions
 *
 * TypeScript server actions for looking up Intercom contacts.
 * Migrated from get_contact_id_by_email.sh
 *
 * @see Issue #5: Convert Admin Scripts to TypeScript (Part 1)
 */

'use server';

import { logInfo, logError } from '@/services/logger';
import { env } from '@/lib/env';

interface Contact {
  id: string;
  email: string;
  name?: string;
  role?: string;
  phone?: string;
  created_at?: number;
  updated_at?: number;
  custom_attributes?: Record<string, string | number | boolean | null>;
}

/**
 * Search for contacts by email address
 *
 * @param email - Email address to search for
 * @returns Contact information including ID
 *
 * @example
 * const result = await searchContactByEmail('user@example.com');
 * if (result.success) {
 *   console.log('Contact ID:', result.contacts[0].id);
 * }
 */
export async function searchContactByEmail(
  email: string
): Promise<{ success: boolean; contacts?: Contact[]; error?: string }> {
  try {
    logInfo(`[Contact Lookup] Searching for email: ${email}`);

    const response = await fetch('https://api.intercom.io/contacts/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          field: 'email',
          operator: '=',
          value: email,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to search contacts: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      logInfo(`[Contact Lookup] No contacts found for email: ${email}`);
      return {
        success: true,
        contacts: [],
      };
    }

    interface IntercomContactResponse {
      id: string;
      email: string;
      name?: string;
      role?: string;
      phone?: string;
      created_at?: number;
      updated_at?: number;
      custom_attributes?: Record<string, string | number | boolean | null>;
    }

    const contacts: Contact[] = data.data.map((contact: IntercomContactResponse) => ({
      id: contact.id,
      email: contact.email,
      name: contact.name,
      role: contact.role,
      phone: contact.phone,
      created_at: contact.created_at,
      updated_at: contact.updated_at,
      custom_attributes: contact.custom_attributes,
    }));

    logInfo(`[Contact Lookup] Found ${contacts.length} contact(s) for ${email}`);

    return {
      success: true,
      contacts,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[Contact Lookup] Error searching contacts: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get contact by ID
 *
 * @param contactId - Intercom contact ID
 * @returns Full contact information
 */
export async function getContactById(
  contactId: string
): Promise<{ success: boolean; contact?: Contact; error?: string }> {
  try {
    logInfo(`[Contact Lookup] Getting contact: ${contactId}`);

    const response = await fetch(`https://api.intercom.io/contacts/${contactId}`, {
      headers: {
        Authorization: `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get contact: ${response.statusText}`);
    }

    const contact = await response.json();

    logInfo(`[Contact Lookup] Retrieved contact: ${contactId}`);

    return {
      success: true,
      contact: {
        id: contact.id,
        email: contact.email,
        name: contact.name,
        role: contact.role,
        phone: contact.phone,
        created_at: contact.created_at,
        updated_at: contact.updated_at,
        custom_attributes: contact.custom_attributes,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[Contact Lookup] Error getting contact: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Search contacts by name
 *
 * @param name - Name to search for
 * @returns List of matching contacts
 */
export async function searchContactByName(
  name: string
): Promise<{ success: boolean; contacts?: Contact[]; error?: string }> {
  try {
    logInfo(`[Contact Lookup] Searching for name: ${name}`);

    const response = await fetch('https://api.intercom.io/contacts/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          field: 'name',
          operator: '=',
          value: name,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to search contacts: ${response.statusText}`);
    }

    const data = await response.json();

    interface IntercomContactResponse {
      id: string;
      email: string;
      name?: string;
      role?: string;
      phone?: string;
      created_at?: number;
      updated_at?: number;
      custom_attributes?: Record<string, string | number | boolean | null>;
    }

    const contacts: Contact[] = (data.data || []).map((contact: IntercomContactResponse) => ({
      id: contact.id,
      email: contact.email,
      name: contact.name,
      role: contact.role,
      phone: contact.phone,
      created_at: contact.created_at,
      updated_at: contact.updated_at,
      custom_attributes: contact.custom_attributes,
    }));

    logInfo(`[Contact Lookup] Found ${contacts.length} contact(s) for name: ${name}`);

    return {
      success: true,
      contacts,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[Contact Lookup] Error searching contacts: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}