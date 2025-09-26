import { spawn } from 'child_process';
import fetch from 'node-fetch';

const SERVER_CMD = 'node';
const SERVER_ARGS = ['src/index.js'];
const HEALTH_URL = 'http://localhost:4000/health';
const HEALTH_TEST_CMD = 'node';
const HEALTH_TEST_ARGS = ['src/tests/endpoint_health_test.js'];
const WAIT_TIMEOUT = 20000; // 20 seconds
const WAIT_INTERVAL = 500; // 0.5 seconds

function waitForHealth(url, timeout = WAIT_TIMEOUT, interval = WAIT_INTERVAL) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch {}
      if (Date.now() - start > timeout) return reject(new Error('Timed out waiting for health endpoint'));
      setTimeout(check, interval);
    };
    check();
  });
}

async function main() {
  console.log('Starting app server...');
  const server = spawn(SERVER_CMD, SERVER_ARGS, { stdio: 'inherit' });

  try {
    await waitForHealth(HEALTH_URL);
    console.log('Health endpoint is up! Running endpoint health test...');
    const test = spawn(HEALTH_TEST_CMD, HEALTH_TEST_ARGS, { stdio: 'inherit' });
    test.on('exit', code => {
      if (code === 0) {
        console.log('Endpoint health test passed. Server is running.');
      } else {
        console.log('Endpoint health test failed. See above for details.');
      }
      // Do not kill the server; leave it running for development.
    });
  } catch (err) {
    console.error('Error: ' + err.message);
    // Optionally, you could kill the server here if health check fails, but per user request, we leave it running.
  }
}

main(); 