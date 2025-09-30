/**
 * Settings Management Actions
 *
 * Server actions for reading and updating Intercom field configuration.
 * Persists changes to the config file.
 */

'use server';

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { logInfo, logError } from '@/services/logger';
import { INTERCOM_FIELDS_CONFIG, type IntercomConfig } from '@/config/intercom-fields';

/**
 * Get current Intercom fields configuration
 */
export async function getIntercomFieldsConfig(): Promise<{
  success: boolean;
  config?: IntercomConfig;
  error?: string;
}> {
  try {
    logInfo('[Settings] Fetching current Intercom fields configuration');

    return {
      success: true,
      config: INTERCOM_FIELDS_CONFIG,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[Settings] Error fetching config: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update a specific field's enabled status
 */
export async function updateFieldEnabledStatus(
  fieldName: string,
  category: 'contacts' | 'companies',
  enabled: boolean
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    logInfo(`[Settings] Updating ${category}.${fieldName} enabled status to ${enabled}`);

    // Find the field in the config
    const fields = INTERCOM_FIELDS_CONFIG[category];
    const fieldIndex = fields.findIndex(f => f.name === fieldName);

    if (fieldIndex === -1) {
      throw new Error(`Field ${fieldName} not found in ${category}`);
    }

    // Update the field
    fields[fieldIndex].enabled = enabled;

    // Write updated config back to file
    const configFilePath = join(process.cwd(), 'src', 'config', 'intercom-fields.ts');
    const configFileContent = generateConfigFileContent(INTERCOM_FIELDS_CONFIG);

    await writeFile(configFilePath, configFileContent, 'utf-8');

    logInfo(`[Settings] Successfully updated ${category}.${fieldName} to enabled=${enabled}`);

    return {
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[Settings] Error updating field: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Generate the TypeScript config file content
 */
function generateConfigFileContent(config: IntercomConfig): string {
  return `/**
 * Intercom Fields Configuration
 *
 * Centralized configuration for which fields to fetch from Intercom API.
 * Used across all Intercom data fetching functions.
 */

export interface IntercomFieldConfig {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'timestamp' | 'object' | 'array';
  description: string;
  enabled: boolean;
  usedIn: string[];
  example?: string;
  path?: string; // For nested fields like custom_attributes.user_training_topic
}

export interface IntercomConfig {
  contacts: IntercomFieldConfig[];
  companies: IntercomFieldConfig[];
}

export const INTERCOM_FIELDS_CONFIG: IntercomConfig = ${JSON.stringify(config, null, 2)};

/**
 * Get enabled contact fields
 */
export function getEnabledContactFields(): IntercomFieldConfig[] {
  return INTERCOM_FIELDS_CONFIG.contacts.filter(f => f.enabled);
}

/**
 * Get enabled company fields
 */
export function getEnabledCompanyFields(): IntercomFieldConfig[] {
  return INTERCOM_FIELDS_CONFIG.companies.filter(f => f.enabled);
}

/**
 * Extract a field value from an object, supporting nested paths
 */
export function extractFieldValue(obj: Record<string, unknown>, field: IntercomFieldConfig): unknown {
  if (field.path) {
    // Handle nested paths like 'custom_attributes.user_training_topic'
    const parts = field.path.split('.');
    let value: unknown = obj;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        value = undefined;
        break;
      }
    }
    return value ?? null;
  }
  return obj[field.name] ?? null;
}
`;
}