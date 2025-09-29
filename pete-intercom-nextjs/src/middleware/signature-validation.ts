/**
 * HMAC Signature Validation Middleware for Intercom Canvas Kit
 *
 * Validates that incoming requests to Canvas Kit endpoints are genuinely from Intercom
 * by verifying the X-Body-Signature header using HMAC-SHA256.
 *
 * Security requirement from: https://developers.intercom.com/docs/canvas-kit#signing-notifications
 *
 * @see intercomApp/src/index.js:78-88 (Express implementation reference)
 */

import crypto from 'crypto';
import { logError, logInfo } from '@/services/logger';

/**
 * Validates the HMAC signature from Intercom
 *
 * @param body - The raw request body as a string
 * @param signature - The X-Body-Signature header value from Intercom
 * @param secret - Your Intercom app's client secret
 * @returns true if signature is valid, false otherwise
 */
export function validateIntercomSignature(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    logError('Signature validation failed: No X-Body-Signature header present');
    return false;
  }

  if (!secret) {
    logError('Signature validation failed: INTERCOM_CLIENT_SECRET not configured');
    return false;
  }

  try {
    // Create HMAC-SHA256 hash of the request body
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body, 'utf8');
    const digest = hmac.digest('hex');

    // Compare computed digest with provided signature
    const isValid = digest === signature;

    if (!isValid) {
      logError(`Signature validation failed: Expected ${digest}, got ${signature}`);
    } else {
      logInfo('Signature validation successful');
    }

    return isValid;
  } catch (error) {
    logError(`Signature validation error: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

/**
 * Validates signature using timing-safe comparison to prevent timing attacks
 *
 * @param body - The raw request body as a string
 * @param signature - The X-Body-Signature header value from Intercom
 * @param secret - Your Intercom app's client secret
 * @returns true if signature is valid, false otherwise
 */
export function validateIntercomSignatureSecure(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    logError('Signature validation failed: No X-Body-Signature header present');
    return false;
  }

  if (!secret) {
    logError('Signature validation failed: INTERCOM_CLIENT_SECRET not configured');
    return false;
  }

  try {
    // Create HMAC-SHA256 hash of the request body
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body, 'utf8');
    const digest = hmac.digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(digest, 'utf8'),
      Buffer.from(signature, 'utf8')
    );

    if (!isValid) {
      logError(`Signature validation failed (timing-safe): Signatures do not match`);
    } else {
      logInfo('Signature validation successful (timing-safe)');
    }

    return isValid;
  } catch (error) {
    logError(`Signature validation error: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

/**
 * Type guard to check if signature validation is enabled
 */
export function isSignatureValidationEnabled(): boolean {
  return !!process.env.INTERCOM_CLIENT_SECRET;
}

/**
 * Get the client secret from environment (with validation)
 */
export function getClientSecret(): string {
  const secret = process.env.INTERCOM_CLIENT_SECRET;

  if (!secret) {
    throw new Error(
      'INTERCOM_CLIENT_SECRET is not configured. ' +
      'Signature validation cannot proceed without this secret.'
    );
  }

  return secret;
}