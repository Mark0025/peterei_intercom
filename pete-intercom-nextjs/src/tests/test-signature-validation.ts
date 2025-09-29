/**
 * Test script for HMAC signature validation
 *
 * Usage:
 *   npx tsx src/tests/test-signature-validation.ts
 *
 * Tests:
 * 1. Valid signature should pass
 * 2. Invalid signature should fail
 * 3. Missing signature should fail
 * 4. Tampered body should fail
 */

import crypto from 'crypto';
import { validateIntercomSignature } from '../middleware/signature-validation';

// Test configuration
const TEST_SECRET = 'test_secret_key_12345';
const TEST_BODY = JSON.stringify({
  component_id: 'test_button',
  input_values: {},
  context: {
    user: { id: '123' }
  }
});

/**
 * Generate a valid HMAC-SHA256 signature for testing
 */
function generateSignature(body: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body, 'utf8');
  return hmac.digest('hex');
}

/**
 * Test suite for signature validation
 */
function runTests() {
  console.log('🧪 Running HMAC Signature Validation Tests\n');
  console.log('=' .repeat(60));

  let passed = 0;
  let failed = 0;

  // Test 1: Valid signature should pass
  console.log('\n📝 Test 1: Valid signature');
  const validSignature = generateSignature(TEST_BODY, TEST_SECRET);
  console.log(`   Body: ${TEST_BODY.substring(0, 50)}...`);
  console.log(`   Signature: ${validSignature}`);
  const test1 = validateIntercomSignature(TEST_BODY, validSignature, TEST_SECRET);
  if (test1) {
    console.log('   ✅ PASSED - Valid signature accepted');
    passed++;
  } else {
    console.log('   ❌ FAILED - Valid signature rejected');
    failed++;
  }

  // Test 2: Invalid signature should fail
  console.log('\n📝 Test 2: Invalid signature');
  const invalidSignature = 'this_is_not_a_valid_signature_abc123';
  console.log(`   Body: ${TEST_BODY.substring(0, 50)}...`);
  console.log(`   Signature: ${invalidSignature}`);
  const test2 = validateIntercomSignature(TEST_BODY, invalidSignature, TEST_SECRET);
  if (!test2) {
    console.log('   ✅ PASSED - Invalid signature rejected');
    passed++;
  } else {
    console.log('   ❌ FAILED - Invalid signature accepted');
    failed++;
  }

  // Test 3: Missing signature should fail
  console.log('\n📝 Test 3: Missing signature (null)');
  console.log(`   Body: ${TEST_BODY.substring(0, 50)}...`);
  console.log(`   Signature: null`);
  const test3 = validateIntercomSignature(TEST_BODY, null, TEST_SECRET);
  if (!test3) {
    console.log('   ✅ PASSED - Missing signature rejected');
    passed++;
  } else {
    console.log('   ❌ FAILED - Missing signature accepted');
    failed++;
  }

  // Test 4: Tampered body should fail
  console.log('\n📝 Test 4: Tampered body with original signature');
  const tamperedBody = JSON.stringify({
    component_id: 'TAMPERED_VALUE',
    input_values: {},
    context: {
      user: { id: '123' }
    }
  });
  console.log(`   Original Body: ${TEST_BODY.substring(0, 40)}...`);
  console.log(`   Tampered Body: ${tamperedBody.substring(0, 40)}...`);
  console.log(`   Signature (from original): ${validSignature}`);
  const test4 = validateIntercomSignature(tamperedBody, validSignature, TEST_SECRET);
  if (!test4) {
    console.log('   ✅ PASSED - Tampered body rejected');
    passed++;
  } else {
    console.log('   ❌ FAILED - Tampered body accepted');
    failed++;
  }

  // Test 5: Wrong secret should fail
  console.log('\n📝 Test 5: Valid signature with wrong secret');
  const wrongSecret = 'wrong_secret_key';
  console.log(`   Body: ${TEST_BODY.substring(0, 50)}...`);
  console.log(`   Signature: ${validSignature}`);
  console.log(`   Secret: ${wrongSecret} (should be ${TEST_SECRET})`);
  const test5 = validateIntercomSignature(TEST_BODY, validSignature, wrongSecret);
  if (!test5) {
    console.log('   ✅ PASSED - Wrong secret rejected');
    passed++;
  } else {
    console.log('   ❌ FAILED - Wrong secret accepted');
    failed++;
  }

  // Test 6: Empty body should work with valid signature
  console.log('\n📝 Test 6: Empty body with valid signature');
  const emptyBody = '';
  const emptySignature = generateSignature(emptyBody, TEST_SECRET);
  console.log(`   Body: (empty)`);
  console.log(`   Signature: ${emptySignature}`);
  const test6 = validateIntercomSignature(emptyBody, emptySignature, TEST_SECRET);
  if (test6) {
    console.log('   ✅ PASSED - Empty body with valid signature accepted');
    passed++;
  } else {
    console.log('   ❌ FAILED - Empty body with valid signature rejected');
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Signature validation is working correctly.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please review the implementation.\n');
    process.exit(1);
  }
}

// Run the tests
runTests();