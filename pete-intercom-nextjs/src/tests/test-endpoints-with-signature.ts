/**
 * Integration test for Canvas Kit endpoints with signature validation
 *
 * Tests the actual HTTP endpoints to ensure signature validation works end-to-end
 *
 * Usage:
 *   1. Start dev server: npm run dev
 *   2. Run tests: npx tsx src/tests/test-endpoints-with-signature.ts
 */

import crypto from 'crypto';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CLIENT_SECRET = process.env.INTERCOM_CLIENT_SECRET || 'test_secret_for_testing';

/**
 * Generate HMAC-SHA256 signature for a request body
 */
function generateSignature(body: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body, 'utf8');
  return hmac.digest('hex');
}

/**
 * Test Canvas Kit Initialize endpoint
 */
async function testInitializeEndpoint() {
  console.log('\n📝 Test 1: POST /api/initialize with VALID signature');

  const requestBody = JSON.stringify({
    context: {
      user: { id: 'test_user_123' },
      location: 'messenger_home'
    }
  });

  const signature = generateSignature(requestBody, CLIENT_SECRET);

  console.log(`   Request Body: ${requestBody.substring(0, 60)}...`);
  console.log(`   Signature: ${signature}`);
  console.log(`   Secret: ${CLIENT_SECRET.substring(0, 10)}...`);

  try {
    const response = await fetch(`${BASE_URL}/api/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Body-Signature': signature
      },
      body: requestBody
    });

    console.log(`   Response Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
      console.log('   ✅ PASSED - Valid signature accepted, Canvas Kit response received');
      return true;
    } else {
      const error = await response.text();
      console.log(`   ❌ FAILED - Valid signature rejected: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR - ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

/**
 * Test Initialize endpoint with INVALID signature
 */
async function testInitializeWithInvalidSignature() {
  console.log('\n📝 Test 2: POST /api/initialize with INVALID signature');

  const requestBody = JSON.stringify({
    context: {
      user: { id: 'test_user_123' },
      location: 'messenger_home'
    }
  });

  const invalidSignature = 'this_is_not_a_valid_signature_abc123';

  console.log(`   Request Body: ${requestBody.substring(0, 60)}...`);
  console.log(`   Signature: ${invalidSignature}`);

  try {
    const response = await fetch(`${BASE_URL}/api/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Body-Signature': invalidSignature
      },
      body: requestBody
    });

    console.log(`   Response Status: ${response.status} ${response.statusText}`);

    if (response.status === 401) {
      console.log('   ✅ PASSED - Invalid signature correctly rejected with 401');
      return true;
    } else {
      console.log(`   ❌ FAILED - Expected 401, got ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR - ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

/**
 * Test Initialize endpoint with NO signature
 */
async function testInitializeWithNoSignature() {
  console.log('\n📝 Test 3: POST /api/initialize with NO signature header');

  const requestBody = JSON.stringify({
    context: {
      user: { id: 'test_user_123' },
      location: 'messenger_home'
    }
  });

  console.log(`   Request Body: ${requestBody.substring(0, 60)}...`);
  console.log(`   Signature: (not provided)`);

  try {
    const response = await fetch(`${BASE_URL}/api/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No X-Body-Signature header
      },
      body: requestBody
    });

    console.log(`   Response Status: ${response.status} ${response.statusText}`);

    if (response.status === 401) {
      console.log('   ✅ PASSED - Missing signature correctly rejected with 401');
      return true;
    } else {
      console.log(`   ❌ FAILED - Expected 401, got ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR - ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

/**
 * Test Submit endpoint with valid signature
 */
async function testSubmitEndpoint() {
  console.log('\n📝 Test 4: POST /api/submit with VALID signature');

  const requestBody = JSON.stringify({
    component_id: 'start_onboarding_button',
    input_values: {},
    context: {
      user: { id: 'test_user_123' }
    }
  });

  const signature = generateSignature(requestBody, CLIENT_SECRET);

  console.log(`   Request Body: ${requestBody.substring(0, 60)}...`);
  console.log(`   Signature: ${signature}`);

  try {
    const response = await fetch(`${BASE_URL}/api/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Body-Signature': signature
      },
      body: requestBody
    });

    console.log(`   Response Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
      console.log('   ✅ PASSED - Valid signature accepted, Canvas Kit response received');
      return true;
    } else {
      const error = await response.text();
      console.log(`   ❌ FAILED - Valid signature rejected: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR - ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

/**
 * Test Submit endpoint with invalid signature
 */
async function testSubmitWithInvalidSignature() {
  console.log('\n📝 Test 5: POST /api/submit with INVALID signature');

  const requestBody = JSON.stringify({
    component_id: 'start_onboarding_button',
    input_values: {},
    context: {
      user: { id: 'test_user_123' }
    }
  });

  const invalidSignature = 'invalid_signature_xyz789';

  console.log(`   Request Body: ${requestBody.substring(0, 60)}...`);
  console.log(`   Signature: ${invalidSignature}`);

  try {
    const response = await fetch(`${BASE_URL}/api/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Body-Signature': invalidSignature
      },
      body: requestBody
    });

    console.log(`   Response Status: ${response.status} ${response.statusText}`);

    if (response.status === 401) {
      const data = await response.json();
      console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
      console.log('   ✅ PASSED - Invalid signature correctly rejected with 401');
      return true;
    } else {
      console.log(`   ❌ FAILED - Expected 401, got ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR - ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

/**
 * Test signature with tampered body
 */
async function testTamperedBody() {
  console.log('\n📝 Test 6: POST /api/initialize with TAMPERED body');

  const originalBody = JSON.stringify({
    context: {
      user: { id: 'test_user_123' },
      location: 'messenger_home'
    }
  });

  const tamperedBody = JSON.stringify({
    context: {
      user: { id: 'HACKER_USER_999' }, // Tampered!
      location: 'messenger_home'
    }
  });

  // Generate signature for original body
  const signature = generateSignature(originalBody, CLIENT_SECRET);

  console.log(`   Original Body: ${originalBody.substring(0, 60)}...`);
  console.log(`   Tampered Body: ${tamperedBody.substring(0, 60)}...`);
  console.log(`   Signature: ${signature} (for original body)`);

  try {
    // Send tampered body with original signature
    const response = await fetch(`${BASE_URL}/api/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Body-Signature': signature
      },
      body: tamperedBody
    });

    console.log(`   Response Status: ${response.status} ${response.statusText}`);

    if (response.status === 401) {
      console.log('   ✅ PASSED - Tampered body correctly rejected with 401');
      return true;
    } else {
      console.log(`   ❌ FAILED - Tampered body was accepted! Security vulnerability!`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR - ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

/**
 * Run all integration tests
 */
async function runAllTests() {
  console.log('🧪 Running Canvas Kit Endpoint Integration Tests');
  console.log('=' .repeat(70));
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`Client Secret: ${CLIENT_SECRET.substring(0, 15)}...`);
  console.log('\nℹ️  Make sure the dev server is running: npm run dev\n');

  const results = [];

  // Run tests
  results.push(await testInitializeEndpoint());
  results.push(await testInitializeWithInvalidSignature());
  results.push(await testInitializeWithNoSignature());
  results.push(await testSubmitEndpoint());
  results.push(await testSubmitWithInvalidSignature());
  results.push(await testTamperedBody());

  // Summary
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;

  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 Integration Test Results: ${passed}/${results.length} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n🎉 All integration tests passed! Endpoints are properly secured.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Check endpoint implementation.\n');
    process.exit(1);
  }
}

// Check if server is running before tests
async function checkServerRunning() {
  try {
    const response = await fetch(BASE_URL, { method: 'HEAD' });
    return true;
  } catch (error) {
    console.error('\n❌ Error: Dev server is not running!');
    console.error(`   Cannot connect to ${BASE_URL}`);
    console.error('\n   Please start the server first:');
    console.error('   npm run dev\n');
    process.exit(1);
  }
}

// Run tests
(async () => {
  await checkServerRunning();
  await runAllTests();
})();