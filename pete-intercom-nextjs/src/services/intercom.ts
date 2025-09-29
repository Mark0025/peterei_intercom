import type { IntercomContact, IntercomCompany, IntercomAdmin, IntercomConversation, IntercomCache } from '@/types';
import { logInfo, logError, logDebug } from './logger';

const INTERCOM_API_BASE = 'https://api.intercom.io';

// Clean access token (remove quotes if present)
const RAW_ACCESS_TOKEN = process.env.INTERCOM_ACCESS_TOKEN;
const ACCESS_TOKEN = RAW_ACCESS_TOKEN?.replace(/^"|"$/g, '');

const getAuthHeaders = (token: string): HeadersInit => ({
  'Authorization': `Bearer ${token}`,
  'Intercom-Version': '2.13',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
});

// In-memory cache
const cache: IntercomCache = {
  contacts: [],
  companies: [],
  admins: [],
  conversations: [],
  lastRefreshed: null,
};

function extractArrayFromResponse(data: any, preferredKeys: string[] = []): any[] {
  // Try preferred keys first
  for (const key of preferredKeys) {
    if (Array.isArray(data[key])) return data[key];
  }
  // Otherwise, find the first array property
  for (const key in data) {
    if (Array.isArray(data[key])) return data[key];
  }
  // Fallback: Intercom sometimes uses 'data' for lists
  if (Array.isArray(data.data)) return data.data;
  logError(`[extractArrayFromResponse] No array found in response: ${JSON.stringify(data)}`, 'api.log');
  return [];
}

async function getAllFromIntercom(path: string, preferredKeys: string[] = []): Promise<any[]> {
  if (!ACCESS_TOKEN) {
    throw new Error('INTERCOM_ACCESS_TOKEN is not configured');
  }

  let results: any[] = [];
  let nextUrl: string | null = `${INTERCOM_API_BASE}${path}`;
  const originalPath = path;
  const originalBase = INTERCOM_API_BASE;

  while (nextUrl) {
    logInfo(`[INTERCOM] Fetching: ${nextUrl}`, 'api.log');
    
    try {
      const response = await fetch(nextUrl, {
        headers: getAuthHeaders(ACCESS_TOKEN),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logDebug(`[INTERCOM] Raw response: ${JSON.stringify(data)}`, 'api.log');
      
      const arr = extractArrayFromResponse(data, preferredKeys);
      results = results.concat(arr);
      
      // Handle pagination
      if (data.pages && data.pages.next) {
        if (typeof data.pages.next === 'string') {
          nextUrl = data.pages.next;
        } else if (typeof data.pages.next === 'object' && data.pages.next !== null) {
          // Build next URL for object-based pagination (e.g., conversations)
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
    } catch (err) {
      logError(`[INTERCOM] Fetch error for URL ${nextUrl}: ${err instanceof Error ? err.stack || err.message : err}`, 'api.log');
      throw err;
    }
  }

  return results;
}

export async function refreshIntercomCache(): Promise<void> {
  logInfo('[INTERCOM] Refreshing Intercom data cache...', 'api.log');
  
  try {
    const [contacts, companies, admins, conversations] = await Promise.all([
      getAllFromIntercom('/contacts', ['contacts', 'data']),
      getAllFromIntercom('/companies', ['companies', 'data']),
      getAllFromIntercom('/admins', ['admins', 'data']),
      getAllFromIntercom('/conversations', ['conversations', 'data']),
    ]);

    cache.contacts = contacts;
    cache.companies = companies;
    cache.admins = admins;
    cache.conversations = conversations;
    cache.lastRefreshed = new Date();

    logInfo(`[INTERCOM] Cache refresh complete. Contacts: ${contacts.length}, Companies: ${companies.length}, Admins: ${admins.length}, Conversations: ${conversations.length}`, 'api.log');
  } catch (err) {
    logError(`[INTERCOM] Error refreshing cache: ${err instanceof Error ? err.message : err}`, 'api.log');
    throw err;
  }
}

export function getIntercomCache(): IntercomCache {
  return cache;
}

export function getCacheStatus() {
  return {
    lastRefreshed: cache.lastRefreshed,
    counts: {
      contacts: cache.contacts.length,
      companies: cache.companies.length,
      admins: cache.admins.length,
      conversations: cache.conversations.length,
    }
  };
}

export async function proxyIntercomGet(path: string, params?: Record<string, string>): Promise<any> {
  if (!ACCESS_TOKEN) {
    throw new Error('INTERCOM_ACCESS_TOKEN is not configured');
  }

  let url = `${INTERCOM_API_BASE}${path}`;
  
  // Add query parameters if provided
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  logInfo(`[INTERCOM] Proxying GET request: ${url}`, 'api.log');

  try {
    const response = await fetch(url, {
      headers: getAuthHeaders(ACCESS_TOKEN),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    logDebug(`[INTERCOM] Proxy response for ${path}: ${JSON.stringify(data)}`, 'api.log');
    return data;
  } catch (err) {
    logError(`[INTERCOM] Proxy error for ${url}: ${err instanceof Error ? err.message : err}`, 'api.log');
    throw err;
  }
}

export async function searchContacts(email?: string, name?: string, live: boolean = false): Promise<IntercomContact[]> {
  logInfo(`[INTERCOM] Search contacts: email=${email || ''}, name=${name || ''}, live=${live}`, 'api.log');

  let contacts: IntercomContact[];
  
  if (live) {
    contacts = await getAllFromIntercom('/contacts', ['contacts', 'data']);
  } else {
    contacts = cache.contacts;
  }

  let results = contacts;
  if (email) {
    results = results.filter(c => c.email && c.email.toLowerCase().includes(email.toLowerCase()));
  }
  if (name) {
    results = results.filter(c => c.name && c.name.toLowerCase().includes(name.toLowerCase()));
  }

  logInfo(`[INTERCOM] Search found ${results.length} contacts`, 'api.log');
  return results;
}

export async function searchCompanies(name?: string, live: boolean = false): Promise<IntercomCompany[]> {
  logInfo(`[INTERCOM] Search companies: name=${name || ''}, live=${live}`, 'api.log');

  let companies: IntercomCompany[];
  
  if (live) {
    companies = await getAllFromIntercom('/companies', ['companies', 'data']);
  } else {
    companies = cache.companies;
  }

  let results = companies;
  if (name) {
    results = results.filter(c => c.name && c.name.toLowerCase().includes(name.toLowerCase()));
  }

  logInfo(`[INTERCOM] Search found ${results.length} companies`, 'api.log');
  return results;
}

export async function updateUserTrainingTopic(userId: string, topic: string): Promise<IntercomContact> {
  if (!ACCESS_TOKEN) {
    throw new Error('INTERCOM_ACCESS_TOKEN is not configured');
  }

  const url = `${INTERCOM_API_BASE}/contacts/${userId}`;
  const payload = {
    custom_attributes: {
      user_training_topic: topic
    }
  };

  logInfo(`[INTERCOM] Updating training topic for user ${userId}: ${topic}`, 'api.log');

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(ACCESS_TOKEN),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    logInfo(`[INTERCOM] Training topic update successful for user ${userId}`, 'api.log');
    return data;
  } catch (err) {
    logError(`[INTERCOM] Training topic update failed for user ${userId}: ${err instanceof Error ? err.message : err}`, 'api.log');
    throw err;
  }
}

// Initialize cache on module load
if (ACCESS_TOKEN) {
  refreshIntercomCache().catch(err => {
    logError(`[INTERCOM] Failed to initialize cache: ${err instanceof Error ? err.message : err}`, 'api.log');
  });
} else {
  logError('[INTERCOM] INTERCOM_ACCESS_TOKEN not found in environment', 'api.log');
}