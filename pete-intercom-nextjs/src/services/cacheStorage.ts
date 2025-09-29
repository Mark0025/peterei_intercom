import { promises as fs } from 'fs';
import path from 'path';
import type { IntercomCache } from '@/types';
import { logInfo, logError } from './logger';

// Cache file path
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'intercom-cache.json');

/**
 * Load cache from disk if available
 */
export async function loadCacheFromDisk(): Promise<IntercomCache | null> {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    const diskCache = JSON.parse(data);

    const cache: IntercomCache = {
      contacts: diskCache.contacts || [],
      companies: diskCache.companies || [],
      admins: diskCache.admins || [],
      conversations: diskCache.conversations || [],
      lastRefreshed: diskCache.lastRefreshed ? new Date(diskCache.lastRefreshed) : null,
    };

    logInfo(`[CACHE] Loaded from disk. Contacts: ${cache.contacts.length}, Companies: ${cache.companies.length}, Admins: ${cache.admins.length}, Conversations: ${cache.conversations.length}`, 'api.log');
    return cache;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      logInfo('[CACHE] No cached data found on disk, will fetch fresh', 'api.log');
    } else {
      logError(`[CACHE] Error loading from disk: ${err instanceof Error ? err.message : err}`, 'api.log');
    }
    return null;
  }
}

/**
 * Save cache to disk for fast startup on next run
 */
export async function saveCacheToDisk(cache: IntercomCache): Promise<void> {
  try {
    // Ensure cache directory exists
    await fs.mkdir(CACHE_DIR, { recursive: true });

    const cacheData = {
      contacts: cache.contacts,
      companies: cache.companies,
      admins: cache.admins,
      conversations: cache.conversations,
      lastRefreshed: cache.lastRefreshed,
    };

    await fs.writeFile(CACHE_FILE, JSON.stringify(cacheData), 'utf-8');
    logInfo('[CACHE] Saved to disk successfully', 'api.log');
  } catch (err) {
    logError(`[CACHE] Error saving to disk: ${err instanceof Error ? err.message : err}`, 'api.log');
  }
}