/**
 * Intercom API Router (AI Content & Core GET Endpoints)
 *
 * Exposes GET endpoints for Intercom REST API resources:
 * - Admins, Conversations, Contacts, Companies, Me
 *
 * See: https://developers.intercom.com/docs/references/rest-api/api.intercom.io/
 *
 * Usage:
 *   Mount this router at /api/intercom in your main app.
 *   Example: GET /api/intercom/admins
 *
 * Requires INTERCOM_ACCESS_TOKEN in environment.
 */

// @intercom-api.mdc
// Always use the correct Intercom API version header, Bearer token from env, log all requests/responses, handle pagination, use unified helpers, and validate input. Never hardcode tokens or ignore errors.

import express from 'express';
import axios from 'axios';
const router = express.Router();
import { INTERCOM_API_BASE } from './intercomConfig';
import { AUTH_HEADER } from './intercomUtils';
import { ACCESS_TOKEN } from './intercomConfig';
import logger from '../utils/logger.js';
import intercomCache from './intercomCache.js';

function extractArrayFromResponse(data, preferredKeys = []) {
  for (const key of preferredKeys) {
    if (Array.isArray(data[key])) return data[key];
  }
  for (const key in data) {
    if (Array.isArray(data[key])) return data[key];
  }
  if (Array.isArray(data.data)) return data.data;
  logger.logError(`[extractArrayFromResponse] No array found in response: ${JSON.stringify(data)}`, 'api.log');
  return [];
}

async function getAllFromIntercom(path, preferredKeys = []) {
  let results = [];
  let nextUrl = `${INTERCOM_API_BASE}${path}`;
  const axiosConfig = { headers: AUTH_HEADER(ACCESS_TOKEN) };
  while (nextUrl) {
    logger.logInfo(`[API] Fetching: ${nextUrl}`, 'api.log');
    logger.logInfo(`[API] Axios config: ${JSON.stringify(axiosConfig)}`, 'api.log');
    try {
      const resp = await axios.get(nextUrl, axiosConfig);
      logger.logInfo(`[API] Raw response: ${JSON.stringify(resp.data)}`, 'api.log');
      const arr = extractArrayFromResponse(resp.data, preferredKeys);
      results = results.concat(arr);
      nextUrl = resp.data.pages && typeof resp.data.pages.next === 'string' ? resp.data.pages.next : null;
    } catch (err) {
      logger.logError(`[API] Axios error for URL ${nextUrl}: ${err && err.stack ? err.stack : err}`,'api.log');
      throw err;
    }
  }
  return results;
}

// Move proxyGet definition here so it is available for all routes
async function proxyGet(req, res, path) {
  const url = `${INTERCOM_API_BASE}${path}`;
  const tokenPresent = !!ACCESS_TOKEN && ACCESS_TOKEN.length > 10;
  logger.logInfo(`[proxyGet] Fetching from Intercom: ${url} | Token present: ${tokenPresent ? 'YES' : 'NO'}`,'api.log');
  if (!tokenPresent) {
    logger.logError('[proxyGet] ACCESS_TOKEN is missing or too short. Check your .env and dotenv loading.','api.log');
    return res.status(500).json({ error: 'Intercom access token missing. Check server logs and .env.' });
  }
  try {
    const response = await axios.get(url, {
      headers: AUTH_HEADER(ACCESS_TOKEN),
      params: req.query,
    });
    logger.logInfo(`[proxyGet] Raw response from Intercom for ${path}: ${JSON.stringify(response.data)}`,'api.log');
    res.status(response.status).json(response.data);
  } catch (err) {
    logger.logError(`[proxyGet] Error for ${url}: ${err.message}`,'api.log');
    res.status(err.response?.status || 500).json({
      error: err.response?.data || err.message,
    });
  }
}

/**
 * @route GET /admins
 * @desc List all admins (from cache)
 */
router.get('/admins', (req, res) => {
  res.json({ admins: intercomCache.cache.admins });
});

/**
 * @route GET /admins/:id
 * @desc Retrieve an admin by ID
 */
router.get('/admins/:id', (req, res) => proxyGet(req, res, `/admins/${req.params.id}`));

/**
 * @route GET /me
 * @desc Get the currently authorized admin
 */
router.get('/me', (req, res) => proxyGet(req, res, '/me'));

/**
 * @route GET /all/admins
 * @desc Get all admins (paginated)
 */
router.get('/all/admins', async (req, res) => {
  logger.logInfo('[GET /all/admins] Fetching all admins...', 'api.log');
  try {
    const admins = await getAllFromIntercom('/admins', ['admins', 'data']);
    logger.logInfo(`[GET /all/admins] Success. Count: ${admins.length}`);
    res.json({ admins });
  } catch (err) {
    logger.logError(`[GET /all/admins] Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /conversations
 * @desc List all conversations
 */
router.get('/conversations', (req, res) => proxyGet(req, res, '/conversations'));

/**
 * @route GET /conversations/:id
 * @desc Retrieve a conversation by ID
 */
router.get('/conversations/:id', (req, res) => proxyGet(req, res, `/conversations/${req.params.id}`));

/**
 * @route GET /all/conversations
 * @desc Get all conversations (paginated)
 */
router.get('/all/conversations', async (req, res) => {
  logger.logInfo('[GET /all/conversations] Fetching all conversations...', 'api.log');
  try {
    const conversations = await getAllFromIntercom('/conversations', ['conversations', 'data']);
    logger.logInfo(`[GET /all/conversations] Success. Count: ${conversations.length}`);
    res.json({ conversations });
  } catch (err) {
    logger.logError(`[GET /all/conversations] Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /contacts
 * @desc List all contacts (users)
 */
router.get('/contacts', (req, res) => proxyGet(req, res, '/contacts'));

/**
 * @route GET /contacts/:id
 * @desc Retrieve a contact by ID
 */
router.get('/contacts/:id', (req, res) => proxyGet(req, res, `/contacts/${req.params.id}`));

/**
 * @route GET /all/contacts
 * @desc Get all contacts (paginated)
 */
router.get('/all/contacts', async (req, res) => {
  logger.logInfo('[GET /all/contacts] Fetching all contacts...', 'api.log');
  try {
    const contacts = await getAllFromIntercom('/contacts', ['contacts', 'data']);
    logger.logInfo(`[GET /all/contacts] Success. Count: ${contacts.length}`);
    res.json({ contacts });
  } catch (err) {
    logger.logError(`[GET /all/contacts] Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /search/contacts
 * @desc Search contacts by email and/or name (live fetch, in-memory filter)
 * @query email, name
 */
router.get('/search/contacts', async (req, res) => {
  const { email, name } = req.query;
  const useLive = shouldUseLive(req);
  logger.logInfo(`[SEARCH] /search/contacts?email=${email || ''}&name=${name || ''} | live=${useLive}`,'api.log');
  try {
    let contacts;
    if (useLive) {
      contacts = await getAllFromIntercom('/contacts', ['contacts', 'data']);
    } else {
      contacts = intercomCache.cache.contacts;
    }
    let results = contacts;
    if (email) {
      results = results.filter(c => c.email && c.email.toLowerCase().includes(email.toLowerCase()));
    }
    if (name) {
      results = results.filter(c => c.name && c.name.toLowerCase().includes(name.toLowerCase()));
    }
    logger.logInfo(`[SEARCH] /search/contacts found ${results.length} results | live=${useLive}`,'api.log');
    res.json({ results, source: useLive ? 'live' : 'cache' });
  } catch (err) {
    logger.logError(`[SEARCH] /search/contacts error: ${err.message}`,'api.log');
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /search/companies
 * @desc Search companies by name (live fetch, in-memory filter)
 * @query name
 */
router.get('/search/companies', async (req, res) => {
  const { name } = req.query;
  const useLive = shouldUseLive(req);
  logger.logInfo(`[SEARCH] /search/companies?name=${name || ''} | live=${useLive}`,'api.log');
  try {
    let companies;
    if (useLive) {
      companies = await getAllFromIntercom('/companies', ['companies', 'data']);
    } else {
      companies = intercomCache.cache.companies;
    }
    let results = companies;
    if (name) {
      results = results.filter(c => c.name && c.name.toLowerCase().includes(name.toLowerCase()));
    }
    logger.logInfo(`[SEARCH] /search/companies found ${results.length} results | live=${useLive}`,'api.log');
    res.json({ results, source: useLive ? 'live' : 'cache' });
  } catch (err) {
    logger.logError(`[SEARCH] /search/companies error: ${err.message}`,'api.log');
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /companies
 * @desc List all companies
 */
router.get('/companies', (req, res) => proxyGet(req, res, '/companies'));

/**
 * @route GET /companies/:id
 * @desc Retrieve a company by ID
 */
router.get('/companies/:id', (req, res) => proxyGet(req, res, `/companies/${req.params.id}`));

/**
 * @route GET /all/companies
 * @desc Get all companies (paginated)
 */
router.get('/all/companies', async (req, res) => {
  logger.logInfo('[GET /all/companies] Fetching all companies...', 'api.log');
  try {
    const companies = await getAllFromIntercom('/companies', ['companies', 'data']);
    logger.logInfo(`[GET /all/companies] Success. Count: ${companies.length}`);
    res.json({ companies });
  } catch (err) {
    logger.logError(`[GET /all/companies] Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Intercom API Router (AI Content Endpoints)
 *
 * Exposes GET endpoints for Intercom AI Content APIs:
 * - Content Import Sources
 * - External Pages
 *
 * See: https://developers.intercom.com/docs/references/rest-api/api.intercom.io/ai-content
 *
 * Usage:
 *   Mount this router at /api/intercom in your main app.
 *   Example: GET /api/intercom/ai/content_import_sources
 *
 * Requires INTERCOM_ACCESS_TOKEN in environment.
 */

function getAuthHeaders() {
  return {
    'Intercom-Version': '2.13',
    'Authorization': `Bearer ${process.env.INTERCOM_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

/**
 * GET /api/intercom/ai/content_import_sources
 * List all content import sources for the app.
 * https://developers.intercom.com/docs/references/rest-api/api.intercom.io/ai-content#get-ai-content_import_sources
 */
router.get('/ai/content_import_sources', async (req, res) => {
  try {
    const url = `${INTERCOM_API_BASE}/ai/content_import_sources`;
    const resp = await axios.get(url, { headers: getAuthHeaders() });
    res.json(resp.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: err.message,
      details: err.response?.data || null,
    });
  }
});

/**
 * GET /api/intercom/ai/external_pages
 * List all external pages in the Fin Content Library.
 * https://developers.intercom.com/docs/references/rest-api/api.intercom.io/ai-content#get-ai-external_pages
 */
router.get('/ai/external_pages', async (req, res) => {
  try {
    const url = `${INTERCOM_API_BASE}/ai/external_pages`;
    const resp = await axios.get(url, { headers: getAuthHeaders() });
    res.json(resp.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: err.message,
      details: err.response?.data || null,
    });
  }
});

/**
 * Update the 'user_training_topic' attribute for a user in Intercom.
 * @route PUT /contacts/:id/training-topic
 * @body { topic: string }
 */
router.put('/contacts/:id/training-topic', async (req, res) => {
  const userId = req.params.id;
  const topic = req.body.topic;
  if (!userId || !topic) {
    return res.status(400).json({ error: 'Both userId and topic are required' });
  }
  const url = `${INTERCOM_API_BASE}/contacts/${userId}`;
  const payload = { custom_attributes: { user_training_topic: topic } };
  try {
    const response = await axios.put(url, payload, {
      headers: {
        'Intercom-Version': '2.13',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    logger.logInfo(`[PUT /contacts/${userId}/training-topic] Update successful: ${JSON.stringify(response.data)}`);
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      logger.logError(`[PUT /contacts/${userId}/training-topic] API error: ${err.response.status} ${JSON.stringify(err.response.data)}`);
      res.status(err.response.status).json({ error: err.response.data });
    } else {
      logger.logError(`[PUT /contacts/${userId}/training-topic] Error: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  }
});

// Helper to determine if live data should be fetched
function shouldUseLive(req) {
  return req.query.live === 'true' || req.query.live === true;
}

export default router;