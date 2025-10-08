/**
 * AI Settings Configuration
 *
 * Centralized configuration for AI agent conversation history and logging.
 * Settings are stored in JSON and can be modified through admin UI.
 */

import type { AgentType } from '@/types/ai-conversations';

export interface AISettingConfig {
  key: string;
  name: string;
  description: string;
  type: 'boolean' | 'number' | 'string';
  defaultValue: boolean | number | string;
  currentValue: boolean | number | string;
  category: 'conversation-history' | 'logging' | 'cleanup';
  agentType?: AgentType; // If setting is agent-specific
  min?: number; // For number types
  max?: number; // For number types
  unit?: string; // e.g., "days", "MB"
}

export interface AISettings {
  conversationHistory: {
    langraphEnabled: boolean;
    conversationEnabled: boolean;
    onboardingEnabled: boolean;
    retentionDays: number;
    maxSessionsPerUser: number;
  };
  logging: {
    enabled: boolean;
    logRetentionDays: number;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
  cleanup: {
    autoCleanupEnabled: boolean;
    cleanupIntervalDays: number;
  };
}

/**
 * Default AI settings
 */
export const DEFAULT_AI_SETTINGS: AISettings = {
  conversationHistory: {
    langraphEnabled: true, // Already implemented
    conversationEnabled: false, // To be implemented
    onboardingEnabled: false, // To be implemented
    retentionDays: 90,
    maxSessionsPerUser: 100,
  },
  logging: {
    enabled: true,
    logRetentionDays: 30,
    logLevel: 'info',
  },
  cleanup: {
    autoCleanupEnabled: true,
    cleanupIntervalDays: 7,
  },
};

/**
 * AI Settings configuration for UI display
 */
export const AI_SETTINGS_CONFIG: AISettingConfig[] = [
  // Conversation History Settings
  {
    key: 'conversationHistory.langraphEnabled',
    name: 'LangGraph Agent History',
    description:
      'Enable conversation history for the LangGraph (General Purpose) agent. Allows multi-turn conversations with context retention.',
    type: 'boolean',
    defaultValue: true,
    currentValue: true,
    category: 'conversation-history',
    agentType: 'langraph',
  },
  {
    key: 'conversationHistory.conversationEnabled',
    name: 'Conversation Agent History',
    description:
      'Enable conversation history for the Conversation Analysis agent. Tracks conversation pattern analysis sessions.',
    type: 'boolean',
    defaultValue: false,
    currentValue: false,
    category: 'conversation-history',
    agentType: 'conversation',
  },
  {
    key: 'conversationHistory.onboardingEnabled',
    name: 'Onboarding Agent History',
    description:
      'Enable conversation history for the Onboarding Discovery agent. Maintains context during questionnaire sessions.',
    type: 'boolean',
    defaultValue: false,
    currentValue: false,
    category: 'conversation-history',
    agentType: 'onboarding',
  },
  {
    key: 'conversationHistory.retentionDays',
    name: 'History Retention Period',
    description:
      'Number of days to keep conversation history before automatic cleanup. Applies to all agents.',
    type: 'number',
    defaultValue: 90,
    currentValue: 90,
    category: 'conversation-history',
    min: 7,
    max: 365,
    unit: 'days',
  },
  {
    key: 'conversationHistory.maxSessionsPerUser',
    name: 'Max Sessions Per User',
    description:
      'Maximum number of conversation sessions to keep per user. Oldest sessions are deleted when limit is reached.',
    type: 'number',
    defaultValue: 100,
    currentValue: 100,
    category: 'conversation-history',
    min: 10,
    max: 1000,
    unit: 'sessions',
  },

  // Logging Settings
  {
    key: 'logging.enabled',
    name: 'AI Logging Enabled',
    description:
      'Enable logging of all AI conversations for admin analytics and debugging. Logs include request/response, latency, and errors.',
    type: 'boolean',
    defaultValue: true,
    currentValue: true,
    category: 'logging',
  },
  {
    key: 'logging.logRetentionDays',
    name: 'Log Retention Period',
    description:
      'Number of days to keep AI conversation logs before automatic cleanup. Applies to all agents.',
    type: 'number',
    defaultValue: 30,
    currentValue: 30,
    category: 'logging',
    min: 7,
    max: 90,
    unit: 'days',
  },

  // Cleanup Settings
  {
    key: 'cleanup.autoCleanupEnabled',
    name: 'Auto Cleanup Enabled',
    description:
      'Automatically clean up old conversation history and logs based on retention policies. Runs on schedule.',
    type: 'boolean',
    defaultValue: true,
    currentValue: true,
    category: 'cleanup',
  },
  {
    key: 'cleanup.cleanupIntervalDays',
    name: 'Cleanup Interval',
    description:
      'How often to run automatic cleanup of old data (in days). Shorter intervals use more resources.',
    type: 'number',
    defaultValue: 7,
    currentValue: 7,
    category: 'cleanup',
    min: 1,
    max: 30,
    unit: 'days',
  },
];

/**
 * Get setting value by key path
 */
export function getSettingByKey(
  settings: AISettings,
  key: string
): boolean | number | string | undefined {
  const parts = key.split('.');
  let value: any = settings;

  for (const part of parts) {
    value = value[part];
    if (value === undefined) return undefined;
  }

  return value;
}

/**
 * Set setting value by key path
 */
export function setSettingByKey(
  settings: AISettings,
  key: string,
  value: boolean | number | string
): AISettings {
  const parts = key.split('.');
  const newSettings = JSON.parse(JSON.stringify(settings)); // Deep clone

  let current: any = newSettings;
  for (let i = 0; i < parts.length - 1; i++) {
    current = current[parts[i]];
  }

  current[parts[parts.length - 1]] = value;
  return newSettings;
}
