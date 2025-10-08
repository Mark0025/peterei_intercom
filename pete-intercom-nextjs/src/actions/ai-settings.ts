/**
 * AI Settings Server Actions
 *
 * Server actions for managing AI configuration settings.
 * Settings are stored in JSON file: data/ai-settings.json
 */

'use server';

import fs from 'fs/promises';
import path from 'path';
import {
  DEFAULT_AI_SETTINGS,
  AI_SETTINGS_CONFIG,
  getSettingByKey,
  setSettingByKey,
  type AISettings,
  type AISettingConfig,
} from '@/config/ai-settings';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'ai-settings.json');

/**
 * Ensure settings file exists
 */
async function ensureSettingsFile(): Promise<void> {
  try {
    await fs.access(SETTINGS_FILE);
  } catch {
    // File doesn't exist, create with defaults
    const dataDir = path.dirname(SETTINGS_FILE);
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(DEFAULT_AI_SETTINGS, null, 2));
  }
}

/**
 * Load AI settings from file
 */
async function loadSettings(): Promise<AISettings> {
  try {
    await ensureSettingsFile();
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data);

    // Merge with defaults to ensure all keys exist
    return {
      ...DEFAULT_AI_SETTINGS,
      ...settings,
      conversationHistory: {
        ...DEFAULT_AI_SETTINGS.conversationHistory,
        ...settings.conversationHistory,
      },
      logging: {
        ...DEFAULT_AI_SETTINGS.logging,
        ...settings.logging,
      },
      cleanup: {
        ...DEFAULT_AI_SETTINGS.cleanup,
        ...settings.cleanup,
      },
    };
  } catch (error) {
    console.error('[AISettings] Load error:', error);
    return DEFAULT_AI_SETTINGS;
  }
}

/**
 * Save AI settings to file
 */
async function saveSettings(settings: AISettings): Promise<void> {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

/**
 * Get all AI settings with current values
 */
export async function getAISettings(): Promise<{
  success: boolean;
  settings?: AISettings;
  config?: AISettingConfig[];
  error?: string;
}> {
  try {
    const settings = await loadSettings();

    // Update config with current values
    const config = AI_SETTINGS_CONFIG.map((setting) => ({
      ...setting,
      currentValue: getSettingByKey(settings, setting.key) ?? setting.defaultValue,
    }));

    return {
      success: true,
      settings,
      config,
    };
  } catch (error) {
    console.error('[AISettings] Get settings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update a single AI setting
 */
export async function updateAISetting(
  key: string,
  value: boolean | number | string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const settings = await loadSettings();
    const newSettings = setSettingByKey(settings, key, value);
    await saveSettings(newSettings);

    console.log(`[AISettings] Updated ${key} = ${value}`);

    return { success: true };
  } catch (error) {
    console.error('[AISettings] Update setting error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reset all settings to defaults
 */
export async function resetAISettings(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await saveSettings(DEFAULT_AI_SETTINGS);
    console.log('[AISettings] Reset to defaults');

    return { success: true };
  } catch (error) {
    console.error('[AISettings] Reset error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get conversation history usage statistics
 */
export async function getConversationHistoryStats(): Promise<{
  success: boolean;
  stats?: {
    totalSessions: number;
    totalMessages: number;
    sessionsByAgent: Record<string, number>;
    oldestSession: string | null;
    newestSession: string | null;
    storageSize: string;
  };
  error?: string;
}> {
  try {
    const conversationsDir = path.join(process.cwd(), 'data', 'conversations');

    // Count sessions and messages
    let totalSessions = 0;
    let totalMessages = 0;
    const sessionsByAgent: Record<string, number> = {
      langraph: 0,
      conversation: 0,
      onboarding: 0,
    };
    let oldestDate: Date | null = null;
    let newestDate: Date | null = null;

    // Read each agent directory
    for (const agentType of ['langraph', 'conversation', 'onboarding']) {
      const agentDir = path.join(conversationsDir, agentType);

      try {
        // Read all user directories
        const userDirs = await fs.readdir(agentDir);

        for (const userId of userDirs) {
          const userDir = path.join(agentDir, userId);
          const stat = await fs.stat(userDir);

          if (stat.isDirectory()) {
            const sessionFiles = await fs.readdir(userDir);

            for (const file of sessionFiles) {
              if (file.endsWith('.json')) {
                totalSessions++;
                sessionsByAgent[agentType]++;

                // Read session file
                const sessionPath = path.join(userDir, file);
                const data = await fs.readFile(sessionPath, 'utf-8');
                const session = JSON.parse(data);

                totalMessages += session.messages?.length || 0;

                // Track dates
                const sessionDate = new Date(session.createdAt);
                if (!oldestDate || sessionDate < oldestDate) {
                  oldestDate = sessionDate;
                }
                if (!newestDate || sessionDate > newestDate) {
                  newestDate = sessionDate;
                }
              }
            }
          }
        }
      } catch {
        // Directory doesn't exist or is empty
        continue;
      }
    }

    // Calculate storage size (approximate)
    let storageBytes = 0;
    try {
      const getDirectorySize = async (dir: string): Promise<number> => {
        let size = 0;
        try {
          const files = await fs.readdir(dir, { withFileTypes: true });

          for (const file of files) {
            const filePath = path.join(dir, file.name);

            if (file.isDirectory()) {
              size += await getDirectorySize(filePath);
            } else {
              const stat = await fs.stat(filePath);
              size += stat.size;
            }
          }
        } catch {
          // Ignore errors
        }

        return size;
      };

      storageBytes = await getDirectorySize(conversationsDir);
    } catch {
      // Ignore errors
    }

    // Format storage size
    const formatBytes = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return {
      success: true,
      stats: {
        totalSessions,
        totalMessages,
        sessionsByAgent,
        oldestSession: oldestDate ? oldestDate.toISOString() : null,
        newestSession: newestDate ? newestDate.toISOString() : null,
        storageSize: formatBytes(storageBytes),
      },
    };
  } catch (error) {
    console.error('[AISettings] Get stats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clear all conversation history
 */
export async function clearAllConversationHistory(): Promise<{
  success: boolean;
  deletedSessions?: number;
  error?: string;
}> {
  try {
    const conversationsDir = path.join(process.cwd(), 'data', 'conversations');
    let deletedCount = 0;

    // Delete all session files
    for (const agentType of ['langraph', 'conversation', 'onboarding']) {
      const agentDir = path.join(conversationsDir, agentType);

      try {
        const userDirs = await fs.readdir(agentDir);

        for (const userId of userDirs) {
          const userDir = path.join(agentDir, userId);
          const stat = await fs.stat(userDir);

          if (stat.isDirectory()) {
            const sessionFiles = await fs.readdir(userDir);

            for (const file of sessionFiles) {
              if (file.endsWith('.json')) {
                await fs.unlink(path.join(userDir, file));
                deletedCount++;
              }
            }
          }
        }
      } catch {
        // Directory doesn't exist or is empty
        continue;
      }
    }

    console.log(`[AISettings] Cleared ${deletedCount} conversation sessions`);

    return {
      success: true,
      deletedSessions: deletedCount,
    };
  } catch (error) {
    console.error('[AISettings] Clear history error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
