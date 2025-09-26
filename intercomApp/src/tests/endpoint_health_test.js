// Following .cursor/rules/test-driven-system.mdc and endpoint-health-best-practices.mdc
// This script checks all registered endpoints for 200 OK and logs results. Fails if any endpoint is broken.

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';
const LOG_PATH = path.join(__dirname, '../logs/api.log');

// List of endpoints to test (add more as needed)
const endpoints = [
  '/',
  '/popout',
  '/PeteAI',
  '/whatsworking',
  '/admin/training',
  '/admin/support',
  '/admin/logs',
  '/admin/health',
  '/api/endpoints',
  '/health',
];

async function testEndpoint(endpoint) {
  try {
    const url = BASE_URL + endpoint;
    const method = endpoint === '/PeteAI' ? 'post' : 'get';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: method === 'post' ? JSON.stringify({ message: 'health check' }) : undefined,
    });
    const ok = res.status >= 200 && res.status < 300;
    const msg = `[${ok ? 'PASS' : 'FAIL'}] [${method.toUpperCase()}] ${url} - Status: ${res.status}`;
    log(msg, ok ? 'pass' : 'fail');
    return { ok, endpoint, method, status: res.status };
  } catch (err) {
    const msg = `[ERROR] [${endpoint}] ${err.message}`;
    log(msg, 'error');
    return { ok: false, endpoint, method: 'get', status: 'ERROR' };
  }
}

function log(msg, type = 'info') {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_PATH, line);
  let colored;
  if (type === 'pass') colored = chalk.green(msg);
  else if (type === 'fail') colored = chalk.red(msg);
  else if (type === 'error') colored = chalk.yellow(msg);
  else colored = msg;
  console.log(colored);
}

async function main() {
  log('--- Endpoint Health Test Start ---');
  let allOk = true;
  let passCount = 0;
  let failCount = 0;
  let errorCount = 0;
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    if (result.ok) passCount++;
    else if (result.status === 'ERROR') errorCount++;
    else failCount++;
    if (!result.ok) allOk = false;
  }
  log('--- Endpoint Health Test End ---');
  const summary = `Summary: ${chalk.green(passCount + ' passed')}, ${chalk.red(failCount + ' failed')}, ${chalk.yellow(errorCount + ' errors')}, ${endpoints.length} total.`;
  console.log(summary);
  fs.appendFileSync(LOG_PATH, `[${new Date().toISOString()}] ${summary}\n`);
  if (!allOk) {
    log('Some endpoints failed. Exiting with code 1.', 'fail');
    process.exit(1);
  } else {
    log('All endpoints passed.', 'pass');
    process.exit(0);
  }
}

main(); 