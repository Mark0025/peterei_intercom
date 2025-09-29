import type { IntercomContact, IntercomCompany, IntercomAdmin, IntercomConversation, IntercomCache } from '@/types';
import { logInfo, logError, logDebug } from './logger';
import { promises as fs } from 'fs';
import path from 'path';

const INTERCOM_API_BASE = 'https://api.intercom.io';
const CACHE_DIR = path.join(process.cwd(), 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'intercom-cache.json');
const METADATA_FILE = path.join(CACHE_DIR, 'cache-metadata.json');

// Clean access token (remove quotes if present)
const RAW_ACCESS_TOKEN = process.env.INTERCOM_ACCESS_TOKEN;
const ACCESS_TOKEN = RAW_ACCESS_TOKEN?.replace(/^"|"$/g, '');

const getAuthHeaders = (token: string): HeadersInit => ({
  'Authorization': `Bearer ${token}`,
  'Intercom-Version': '2.13',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
});

interface CacheMetadata {
  lastFullRefresh: string | null;
  lastActivity: {
    contacts: number;
    companies: number;
    conversations: number;
  };
  cacheCounts: {
    contacts: number;
    companies: number;
    admins: number;
    conversations: number;
  };
  version: string;
}

interface SmartCache extends IntercomCache {
  metadata: CacheMetadata;
}

// In-memory cache
let cache: SmartCache = {
  contacts: [],
  companies: [],
  admins: [],
  conversations: [],
  lastRefreshed: null,
  metadata: {
    lastFullRefresh: null,
    lastActivity: {
      contacts: 0,
      companies: 0,
      conversations: 0
    },
    cacheCounts: {
      contacts: 0,
      companies: 0,
      admins: 0,
      conversations: 0
    },
    version: '1.0'
  }
};

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    logError(`Failed to create cache directory: ${error instanceof Error ? error.message : error}`, 'cache.log');
  }
}

// Save cache to disk
async function saveCache() {
  try {
    await ensureCacheDir();
    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
    await fs.writeFile(METADATA_FILE, JSON.stringify(cache.metadata, null, 2));
    logDebug('[SMART_CACHE] Cache saved to disk', 'cache.log');
  } catch (error) {
    logError(`Failed to save cache: ${error instanceof Error ? error.message : error}`, 'cache.log');
  }
}

// Load cache from disk
async function loadCache() {
  try {
    const cacheData = await fs.readFile(CACHE_FILE, 'utf-8');
    const metadataData = await fs.readFile(METADATA_FILE, 'utf-8');
    
    const loadedCache = JSON.parse(cacheData);
    const metadata = JSON.parse(metadataData);
    
    cache = {
      ...loadedCache,
      metadata,
      lastRefreshed: loadedCache.lastRefreshed ? new Date(loadedCache.lastRefreshed) : null
    };
    
    logInfo(`[SMART_CACHE] Cache loaded from disk. Contacts: ${cache.contacts.length}, Companies: ${cache.companies.length}, Conversations: ${cache.conversations.length}`, 'cache.log');
    return true;
  } catch (error) {
    logInfo('[SMART_CACHE] No existing cache found, will create new cache', 'cache.log');
    return false;
  }
}

async function fetchFromIntercom(url: string): Promise<any> {
  if (!ACCESS_TOKEN) {
    throw new Error('INTERCOM_ACCESS_TOKEN is not configured');
  }

  const response = await fetch(url, {
    headers: getAuthHeaders(ACCESS_TOKEN),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Check for new activity in Intercom
async function checkForNewActivity(): Promise<{ hasNewActivity: boolean; activityCounts: any }> {
  try {
    logInfo('[SMART_CACHE] Checking for new activity...', 'cache.log');
    
    // Get latest activity counts from Intercom
    const [contactsResponse, companiesResponse, conversationsResponse] = await Promise.all([
      fetchFromIntercom(`${INTERCOM_API_BASE}/contacts?per_page=1`),
      fetchFromIntercom(`${INTERCOM_API_BASE}/companies?per_page=1`),
      fetchFromIntercom(`${INTERCOM_API_BASE}/conversations?per_page=1&order=desc`)
    ]);

    const currentActivity = {
      contacts: contactsResponse.total_count || contactsResponse.pages?.total_pages || 0,
      companies: companiesResponse.total_count || companiesResponse.pages?.total_pages || 0,
      conversations: conversationsResponse.total_count || conversationsResponse.pages?.total_pages || 0
    };

    const hasNewActivity = 
      currentActivity.contacts > cache.metadata.lastActivity.contacts ||
      currentActivity.companies > cache.metadata.lastActivity.companies ||
      currentActivity.conversations > cache.metadata.lastActivity.conversations;

    logInfo(`[SMART_CACHE] Activity check - Contacts: ${currentActivity.contacts} (was ${cache.metadata.lastActivity.contacts}), Companies: ${currentActivity.companies} (was ${cache.metadata.lastActivity.companies}), Conversations: ${currentActivity.conversations} (was ${cache.metadata.lastActivity.conversations})`, 'cache.log');

    return {
      hasNewActivity,
      activityCounts: currentActivity
    };
  } catch (error) {
    logError(`[SMART_CACHE] Error checking activity: ${error instanceof Error ? error.message : error}`, 'cache.log');
    return { hasNewActivity: true, activityCounts: cache.metadata.lastActivity }; // Force refresh on error
  }
}

// Fetch all data from a paginated endpoint
async function getAllFromIntercom(path: string, preferredKeys: string[] = []): Promise<any[]> {
  let results: any[] = [];
  let nextUrl: string | null = `${INTERCOM_API_BASE}${path}`;
  const originalPath = path;
  const originalBase = INTERCOM_API_BASE;

  while (nextUrl) {
    logDebug(`[SMART_CACHE] Fetching: ${nextUrl}`, 'cache.log');
    
    const data = await fetchFromIntercom(nextUrl);
    
    // Extract array from response
    let arr: any[] = [];
    for (const key of preferredKeys) {
      if (Array.isArray(data[key])) {
        arr = data[key];
        break;
      }
    }
    if (arr.length === 0 && Array.isArray(data.data)) {
      arr = data.data;
    }
    
    results = results.concat(arr);
    
    // Handle pagination
    if (data.pages && data.pages.next) {
      if (typeof data.pages.next === 'string') {
        nextUrl = data.pages.next;
      } else if (typeof data.pages.next === 'object' && data.pages.next !== null) {
        const params: string[] = [];
        for (const [key, value] of Object.entries(data.pages.next)) {
          params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
        const cleanPath = originalPath.split('?')[0];
        nextUrl = `${originalBase}${cleanPath}?${params.join('&')}`;
      } else {
        nextUrl = null;
      }
    } else {
      nextUrl = null;
    }
  }

  return results;
}

// Perform incremental update - only fetch new/updated items
async function performIncrementalUpdate(activityCounts: any) {
  try {
    logInfo('[SMART_CACHE] Performing incremental update...', 'cache.log');
    
    // For simplicity, we'll fetch recent items and merge them
    // In a more sophisticated system, we'd use timestamps and filters
    
    const lastWeek = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    
    const [recentContacts, recentCompanies, recentConversations] = await Promise.all([
      // Fetch contacts updated in the last week (if API supports it)
      getAllFromIntercom('/contacts?per_page=50', ['contacts', 'data']),
      getAllFromIntercom('/companies?per_page=50', ['companies', 'data']), 
      getAllFromIntercom(`/conversations?per_page=50&order=desc`, ['conversations', 'data'])
    ]);

    // Merge new data with existing cache
    // Remove duplicates and add new items
    const existingContactIds = new Set(cache.contacts.map(c => c.id));
    const existingCompanyIds = new Set(cache.companies.map(c => c.id));
    const existingConversationIds = new Set(cache.conversations.map(c => c.id));

    const newContacts = recentContacts.filter(c => !existingContactIds.has(c.id));
    const newCompanies = recentCompanies.filter(c => !existingCompanyIds.has(c.id));
    const newConversations = recentConversations.filter(c => !existingConversationIds.has(c.id));

    // Update cache with new items
    cache.contacts = [...cache.contacts, ...newContacts];
    cache.companies = [...cache.companies, ...newCompanies];
    cache.conversations = [...cache.conversations, ...newConversations];

    // Update metadata
    cache.metadata.lastActivity = activityCounts;
    cache.lastRefreshed = new Date();

    logInfo(`[SMART_CACHE] Incremental update complete. Added: ${newContacts.length} contacts, ${newCompanies.length} companies, ${newConversations.length} conversations`, 'cache.log');
    
    await saveCache();
  } catch (error) {
    logError(`[SMART_CACHE] Error in incremental update: ${error instanceof Error ? error.message : error}`, 'cache.log');
    // Fall back to full refresh on error
    await performFullRefresh();
  }
}

// Perform full refresh of all data
async function performFullRefresh() {
  try {
    logInfo('[SMART_CACHE] Performing full refresh...', 'cache.log');
    
    const [contacts, companies, admins, conversations] = await Promise.all([
      getAllFromIntercom('/contacts', ['contacts', 'data']),
      getAllFromIntercom('/companies', ['companies', 'data']),
      getAllFromIntercom('/admins', ['admins', 'data']),
      getAllFromIntercom('/conversations', ['conversations', 'data'])
    ]);

    cache.contacts = contacts;
    cache.companies = companies;
    cache.admins = admins;
    cache.conversations = conversations;
    cache.lastRefreshed = new Date();
    
    // Update metadata
    cache.metadata.lastFullRefresh = new Date().toISOString();
    cache.metadata.lastActivity = {
      contacts: contacts.length,
      companies: companies.length,
      conversations: conversations.length
    };
    cache.metadata.cacheCounts = {
      contacts: contacts.length,
      companies: companies.length,
      admins: admins.length,
      conversations: conversations.length
    };

    logInfo(`[SMART_CACHE] Full refresh complete. Contacts: ${contacts.length}, Companies: ${companies.length}, Admins: ${admins.length}, Conversations: ${conversations.length}`, 'cache.log');
    
    await saveCache();
  } catch (error) {
    logError(`[SMART_CACHE] Error in full refresh: ${error instanceof Error ? error.message : error}`, 'cache.log');
    throw error;
  }
}

// Main function to refresh cache intelligently
export async function smartRefreshIntercomCache(): Promise<void> {
  try {
    // Load existing cache from disk
    await loadCache();
    
    // If no cache exists or cache is very old (> 24 hours), do full refresh
    const cacheAge = cache.lastRefreshed ? Date.now() - cache.lastRefreshed.getTime() : Infinity;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    
    if (!cache.lastRefreshed || cacheAge > TWENTY_FOUR_HOURS) {
      logInfo('[SMART_CACHE] Cache is empty or stale, performing full refresh', 'cache.log');
      await performFullRefresh();
      return;
    }
    
    // Check for new activity
    const { hasNewActivity, activityCounts } = await checkForNewActivity();
    
    if (hasNewActivity) {
      logInfo('[SMART_CACHE] New activity detected, performing incremental update', 'cache.log');
      await performIncrementalUpdate(activityCounts);
    } else {
      logInfo('[SMART_CACHE] No new activity detected, using existing cache', 'cache.log');
    }
    
  } catch (error) {
    logError(`[SMART_CACHE] Error in smart refresh: ${error instanceof Error ? error.message : error}`, 'cache.log');
    throw error;
  }
}

// Force full refresh (for manual cache refresh)
export async function forceFullRefresh(): Promise<void> {
  await performFullRefresh();
}

// Get current cache
export function getSmartCache(): IntercomCache {
  return {
    contacts: cache.contacts,
    companies: cache.companies,
    admins: cache.admins,
    conversations: cache.conversations,
    lastRefreshed: cache.lastRefreshed
  };
}

// Get cache status with metadata
export function getSmartCacheStatus() {
  return {
    lastRefreshed: cache.lastRefreshed,
    counts: {
      contacts: cache.contacts.length,
      companies: cache.companies.length,
      admins: cache.admins.length,
      conversations: cache.conversations.length,
    },
    metadata: cache.metadata,
    cacheAge: cache.lastRefreshed ? Math.floor((Date.now() - cache.lastRefreshed.getTime()) / 1000 / 60) : null, // in minutes
    isStale: cache.lastRefreshed ? (Date.now() - cache.lastRefreshed.getTime()) > (60 * 60 * 1000) : true // > 1 hour
  };
}

// Search functions that use the smart cache
export async function smartSearchContacts(email?: string, name?: string, forceLive: boolean = false): Promise<IntercomContact[]> {
  // Ensure cache is up to date
  if (!forceLive) {
    await smartRefreshIntercomCache();
  }
  
  let contacts = cache.contacts;
  
  if (forceLive) {
    // Force live search
    contacts = await getAllFromIntercom('/contacts', ['contacts', 'data']);
  }

  let results = contacts;
  if (email) {
    results = results.filter(c => c.email && c.email.toLowerCase().includes(email.toLowerCase()));
  }
  if (name) {
    results = results.filter(c => c.name && c.name.toLowerCase().includes(name.toLowerCase()));
  }

  logInfo(`[SMART_CACHE] Search found ${results.length} contacts`, 'cache.log');
  return results;
}

export async function smartSearchCompanies(name?: string, forceLive: boolean = false): Promise<IntercomCompany[]> {
  // Ensure cache is up to date
  if (!forceLive) {
    await smartRefreshIntercomCache();
  }
  
  let companies = cache.companies;
  
  if (forceLive) {
    // Force live search
    companies = await getAllFromIntercom('/companies', ['companies', 'data']);
  }

  let results = companies;
  if (name) {
    results = results.filter(c => c.name && c.name.toLowerCase().includes(name.toLowerCase()));
  }

  logInfo(`[SMART_CACHE] Search found ${results.length} companies`, 'cache.log');
  return results;
}

// Initialize smart cache on module load
if (ACCESS_TOKEN) {
  smartRefreshIntercomCache().catch(err => {
    logError(`[SMART_CACHE] Failed to initialize cache: ${err instanceof Error ? err.message : err}`, 'cache.log');
  });
} else {
  logError('[SMART_CACHE] INTERCOM_ACCESS_TOKEN not found in environment', 'cache.log');
}