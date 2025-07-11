// @intercom-api.mdc
// Always use the correct Intercom API version header, Bearer token from env, log all requests/responses, handle pagination, use unified helpers, and validate input. Never hardcode tokens or ignore errors.

const axios = require('axios');
const logger = require('../utils/logger');

const INTERCOM_API_BASE = 'https://api.intercom.io';
const AUTH_HEADER = token => ({
  Authorization: `Bearer ${token}`,
  'Intercom-Version': '2.13',
  'Accept': 'application/json',
});
const RAW_ACCESS_TOKEN = process.env.INTERCOM_ACCESS_TOKEN;
const ACCESS_TOKEN = RAW_ACCESS_TOKEN?.replace(/^"|"$/g, '');

const cache = {
  contacts: [],
  companies: [],
  admins: [],
  conversations: [],
  lastRefreshed: null,
};

function extractArrayFromResponse(data, preferredKeys = []) {
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
  logger.logError(`[extractArrayFromResponse] No array found in response: ${JSON.stringify(data)}`, 'api.log');
  return [];
}

async function getAllFromIntercom(path, preferredKeys) {
  let results = [];
  let nextUrl = `${INTERCOM_API_BASE}${path}`;
  const axiosConfig = { headers: AUTH_HEADER(ACCESS_TOKEN) };
  let originalPath = path;
  let originalBase = `${INTERCOM_API_BASE}`;
  while (nextUrl) {
    logger.logInfo(`[CACHE] Fetching: ${nextUrl}`, 'api.log');
    logger.logInfo(`[CACHE] Axios config: ${JSON.stringify(axiosConfig)}`, 'api.log');
    try {
      const resp = await axios.get(nextUrl, axiosConfig);
      logger.logInfo(`[CACHE] Raw response: ${JSON.stringify(resp.data)}`, 'api.log');
      const arr = extractArrayFromResponse(resp.data, preferredKeys);
      results = results.concat(arr);
      logger.logInfo(`[CACHE] Pagination: current nextUrl: ${nextUrl}, resp.data.pages: ${JSON.stringify(resp.data.pages)}`, 'api.log');
      // Updated pagination logic
      if (resp.data.pages && resp.data.pages.next) {
        if (typeof resp.data.pages.next === 'string') {
          nextUrl = resp.data.pages.next;
        } else if (typeof resp.data.pages.next === 'object' && resp.data.pages.next !== null) {
          // Build next URL for object-based pagination (e.g., conversations)
          const params = [];
          for (const [key, value] of Object.entries(resp.data.pages.next)) {
            params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
          }
          // Remove any existing query params from originalPath
          const cleanPath = originalPath.split('?')[0];
          nextUrl = `${originalBase}${cleanPath}?${params.join('&')}`;
        } else {
          nextUrl = null;
        }
      } else {
        nextUrl = null;
      }
      logger.logInfo(`[CACHE] Pagination: new nextUrl: ${nextUrl}`, 'api.log');
    } catch (err) {
      logger.logError(`[CACHE] Axios error for URL ${nextUrl}: ${err && err.stack ? err.stack : err}`,'api.log');
      break;
    }
  }
  return results;
}

async function refreshCache() {
  logger.logInfo('[CACHE] Refreshing Intercom data cache...', 'api.log');
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
    logger.logInfo(`[CACHE] Cache refresh complete. Contacts: ${contacts.length}, Companies: ${companies.length}, Admins: ${admins.length}, Conversations: ${conversations.length}`, 'api.log');
  } catch (err) {
    logger.logError(`[CACHE] Error refreshing cache: ${err.message}`, 'api.log');
    throw err;
  }
}

function getCache() {
  return cache;
}

function getCacheStatus() {
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

module.exports = {
  cache,
  refreshCache,
  getCache,
  getCacheStatus,
}; 