/**
 * Admin Management Actions
 *
 * TypeScript server actions for managing Intercom admins/team members.
 * Migrated from get_admins.sh, get_admin_by_id.sh, get_me.sh
 *
 * @see Issue #5: Convert Admin Scripts to TypeScript (Part 1)
 */

'use server';

import { logInfo, logError } from '@/services/logger';
import { env } from '@/lib/env';

interface Admin {
  id: string;
  name: string;
  email: string;
  avatar?: {
    type: string;
    image_url: string;
  };
  away_mode_enabled?: boolean;
  away_mode_reassign?: boolean;
  has_inbox_seat?: boolean;
  team_ids?: number[];
}

/**
 * Get list of all admins (team members)
 *
 * @returns List of all admins in the workspace
 *
 * @example
 * const result = await listAdmins();
 * if (result.success) {
 *   result.admins.forEach(admin => console.log(admin.name, admin.email));
 * }
 */
export async function listAdmins(): Promise<{
  success: boolean;
  admins?: Admin[];
  error?: string;
}> {
  try {
    logInfo('[Admin Management] Fetching all admins');

    const response = await fetch('https://api.intercom.io/admins', {
      headers: {
        Authorization: `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch admins: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    interface IntercomAdminResponse {
      id: string;
      name: string;
      email: string;
      avatar?: { type: string; image_url: string };
      away_mode_enabled?: boolean;
      away_mode_reassign?: boolean;
      has_inbox_seat?: boolean;
      team_ids?: number[];
    }

    const admins: Admin[] = (data.admins || []).map((admin: IntercomAdminResponse) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      avatar: admin.avatar,
      away_mode_enabled: admin.away_mode_enabled,
      away_mode_reassign: admin.away_mode_reassign,
      has_inbox_seat: admin.has_inbox_seat,
      team_ids: admin.team_ids,
    }));

    logInfo(`[Admin Management] Retrieved ${admins.length} admins`);

    return {
      success: true,
      admins,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[Admin Management] Error fetching admins: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get specific admin by ID
 *
 * @param adminId - Intercom admin ID
 * @returns Admin information
 */
export async function getAdminById(
  adminId: string
): Promise<{ success: boolean; admin?: Admin; error?: string }> {
  try {
    logInfo(`[Admin Management] Getting admin: ${adminId}`);

    const response = await fetch(`https://api.intercom.io/admins/${adminId}`, {
      headers: {
        Authorization: `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get admin: ${response.statusText}`);
    }

    const admin = await response.json();

    logInfo(`[Admin Management] Retrieved admin: ${adminId}`);

    return {
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        avatar: admin.avatar,
        away_mode_enabled: admin.away_mode_enabled,
        away_mode_reassign: admin.away_mode_reassign,
        has_inbox_seat: admin.has_inbox_seat,
        team_ids: admin.team_ids,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[Admin Management] Error getting admin: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get current authenticated admin (me)
 *
 * @returns Information about the current admin making the request
 *
 * @example
 * const result = await getCurrentAdmin();
 * if (result.success) {
 *   console.log('Logged in as:', result.admin.name);
 * }
 */
export async function getCurrentAdmin(): Promise<{
  success: boolean;
  admin?: Admin;
  error?: string;
}> {
  try {
    logInfo('[Admin Management] Getting current admin (me)');

    const response = await fetch('https://api.intercom.io/me', {
      headers: {
        Authorization: `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get current admin: ${response.statusText}`);
    }

    const admin = await response.json();

    logInfo(`[Admin Management] Retrieved current admin: ${admin.name}`);

    return {
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        avatar: admin.avatar,
        away_mode_enabled: admin.away_mode_enabled,
        away_mode_reassign: admin.away_mode_reassign,
        has_inbox_seat: admin.has_inbox_seat,
        team_ids: admin.team_ids,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[Admin Management] Error getting current admin: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Set admin away mode
 *
 * @param adminId - Intercom admin ID
 * @param awayMode - Enable or disable away mode
 * @param reassign - Whether to reassign conversations
 * @returns Updated admin information
 */
export async function setAdminAwayMode(
  adminId: string,
  awayMode: boolean,
  reassign: boolean = false
): Promise<{ success: boolean; admin?: Admin; error?: string }> {
  try {
    logInfo(`[Admin Management] Setting away mode for admin ${adminId}: ${awayMode}`);

    const response = await fetch(`https://api.intercom.io/admins/${adminId}/away`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        away_mode_enabled: awayMode,
        away_mode_reassign: reassign,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to set away mode: ${response.statusText} - ${errorText}`);
    }

    const admin = await response.json();

    logInfo(`[Admin Management] Successfully updated away mode for admin ${adminId}`);

    return {
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        avatar: admin.avatar,
        away_mode_enabled: admin.away_mode_enabled,
        away_mode_reassign: admin.away_mode_reassign,
        has_inbox_seat: admin.has_inbox_seat,
        team_ids: admin.team_ids,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[Admin Management] Error setting away mode: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}