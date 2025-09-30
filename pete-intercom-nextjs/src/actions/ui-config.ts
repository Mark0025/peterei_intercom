'use server';

/**
 * UI Configuration Management
 *
 * Server actions for reading and writing UI configuration
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { UIConfig } from '@/types/ui-config';
import { DEFAULT_UI_CONFIG } from '@/types/ui-config';

const CONFIG_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(CONFIG_DIR, 'ui-config.json');

export async function getUIConfig(): Promise<{ success: boolean; data?: UIConfig; error?: string }> {
  try {
    // Ensure directory exists
    await fs.mkdir(CONFIG_DIR, { recursive: true });

    // Try to read existing config
    try {
      const content = await fs.readFile(CONFIG_FILE, 'utf-8');
      const config = JSON.parse(content);
      return { success: true, data: config };
    } catch (error) {
      // File doesn't exist, return default config
      return { success: true, data: DEFAULT_UI_CONFIG };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load UI config',
    };
  }
}

export async function saveUIConfig(config: UIConfig): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure directory exists
    await fs.mkdir(CONFIG_DIR, { recursive: true });

    // Write config file
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save UI config',
    };
  }
}

export async function resetUIConfig(): Promise<{ success: boolean; error?: string }> {
  return saveUIConfig(DEFAULT_UI_CONFIG);
}