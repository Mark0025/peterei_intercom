/**
 * Type-Safe Environment Variable Configuration
 *
 * Validates and exports all required environment variables with type safety.
 * Fails fast at startup if required variables are missing.
 *
 * @see Issue #4: Environment Configuration
 */

import { logError, logInfo } from '@/services/logger';

/**
 * Environment variable schema
 * Defines all required and optional environment variables
 */
interface EnvironmentVariables {
  // Node Environment
  NODE_ENV: 'development' | 'production' | 'test';

  // Intercom Configuration
  INTERCOM_CLIENT_ID: string;
  INTERCOM_CLIENT_SECRET: string;
  INTERCOM_ACCESS_TOKEN: string;
  WORKSPACE_ID: string;

  // Google OAuth (Optional - for email via OAuth)
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;

  // Email Configuration (Optional - for email via SMTP)
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
  EMAIL_RECIPIENTS?: string;

  // OpenRouter AI (Optional)
  OPENROUTER_API_KEY?: string;

  // Server Configuration
  PUBLIC_URL?: string;
  PORT?: string;

  // User Configuration
  UserId?: string;
  DEFAULT_AUDIENCE?: string;
}

/**
 * Required environment variables that must be set
 */
const REQUIRED_VARS = [
  'INTERCOM_CLIENT_ID',
  'INTERCOM_CLIENT_SECRET',
  'INTERCOM_ACCESS_TOKEN',
  'WORKSPACE_ID',
] as const;

/**
 * Optional environment variables with default values
 */
const OPTIONAL_VARS_WITH_DEFAULTS = {
  NODE_ENV: 'development' as const,
  EMAIL_RECIPIENTS: 'mark@peterei.com',
  PORT: '3000',
  PUBLIC_URL: 'http://localhost:3000',
} as const;

/**
 * Validate a single environment variable
 */
function validateEnvVar(key: string, value: string | undefined, required: boolean): string | undefined {
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  if (value && value.trim() === '') {
    throw new Error(`Environment variable ${key} is empty`);
  }

  return value;
}

/**
 * Validate all environment variables
 * Throws error if any required variables are missing
 */
export function validateEnvironment(): EnvironmentVariables {
  const errors: string[] = [];

  // Validate required variables
  for (const key of REQUIRED_VARS) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      errors.push(`❌ Missing required: ${key}`);
    }
  }

  // If there are errors, throw with all missing variables
  if (errors.length > 0) {
    const errorMessage = [
      '⚠️  Environment Configuration Error',
      '',
      'The following required environment variables are missing or empty:',
      ...errors,
      '',
      'Please check your .env file and ensure all required variables are set.',
      'See .env.example for reference.',
    ].join('\n');

    logError(errorMessage);
    throw new Error(errorMessage);
  }

  // Build validated environment object
  const env: EnvironmentVariables = {
    // Required variables (validated above)
    INTERCOM_CLIENT_ID: process.env.INTERCOM_CLIENT_ID!,
    INTERCOM_CLIENT_SECRET: process.env.INTERCOM_CLIENT_SECRET!,
    INTERCOM_ACCESS_TOKEN: process.env.INTERCOM_ACCESS_TOKEN!,
    WORKSPACE_ID: process.env.WORKSPACE_ID!,

    // Node environment with default
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',

    // Optional Google OAuth variables
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,

    // Optional email variables
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_RECIPIENTS: process.env.EMAIL_RECIPIENTS || OPTIONAL_VARS_WITH_DEFAULTS.EMAIL_RECIPIENTS,

    // Optional AI variable
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,

    // Optional server configuration
    PUBLIC_URL: process.env.PUBLIC_URL || OPTIONAL_VARS_WITH_DEFAULTS.PUBLIC_URL,
    PORT: process.env.PORT || OPTIONAL_VARS_WITH_DEFAULTS.PORT,

    // Optional user configuration
    UserId: process.env.UserId,
    DEFAULT_AUDIENCE: process.env.DEFAULT_AUDIENCE,
  };

  return env;
}

/**
 * Get validated environment variables
 * Caches the result after first validation
 */
let cachedEnv: EnvironmentVariables | null = null;

export function getEnv(): EnvironmentVariables {
  if (!cachedEnv) {
    cachedEnv = validateEnvironment();
    logInfo('Environment variables validated successfully');
  }
  return cachedEnv;
}

/**
 * Check if a specific feature is configured
 */
export function isFeatureConfigured(feature: 'email-smtp' | 'email-oauth' | 'ai'): boolean {
  const env = getEnv();

  switch (feature) {
    case 'email-smtp':
      return !!(env.EMAIL_USER && env.EMAIL_PASS);
    case 'email-oauth':
      return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN);
    case 'ai':
      return !!env.OPENROUTER_API_KEY;
    default:
      return false;
  }
}

/**
 * Get environment info for debugging
 */
export function getEnvironmentInfo(): Record<string, string> {
  const env = getEnv();

  return {
    NODE_ENV: env.NODE_ENV,
    WORKSPACE_ID: env.WORKSPACE_ID,
    PUBLIC_URL: env.PUBLIC_URL || 'not set',
    PORT: env.PORT || 'not set',
    'Email (SMTP)': isFeatureConfigured('email-smtp') ? 'configured' : 'not configured',
    'Email (OAuth)': isFeatureConfigured('email-oauth') ? 'configured' : 'not configured',
    'AI (OpenRouter)': isFeatureConfigured('ai') ? 'configured' : 'not configured',
  };
}

// Export individual environment accessors for convenience
export const env = getEnv();