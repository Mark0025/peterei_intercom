/**
 * Test script for OAuth email service
 *
 * Tests:
 * 1. OAuth configuration validation
 * 2. OAuth connection test with refresh token
 * 3. Send test onboarding email via Gmail API
 *
 * Usage:
 *   pnpm exec tsx src/tests/test-email-oauth.ts
 *
 * Requirements:
 *   - GOOGLE_CLIENT_ID set in .env
 *   - GOOGLE_CLIENT_SECRET set in .env
 *   - GOOGLE_REFRESH_TOKEN set in .env (obtain via /api/auth/google)
 */

import { sendOnboardingEmailOAuth, isOAuthConfigured, testOAuthConnection } from '../services/email-oauth';

async function runOAuthEmailTests() {
  console.log('📧 Running OAuth Email Service Tests\n');
  console.log('=' .repeat(60));

  let passed = 0;
  let failed = 0;

  // Test 1: Check if OAuth is configured
  console.log('\n📝 Test 1: OAuth Configuration Check');
  const isConfigured = isOAuthConfigured();
  console.log(`   GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Not set'}`);
  console.log(`   GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? '✓ Set' : '✗ Not set'}`);
  console.log(`   GOOGLE_REFRESH_TOKEN: ${process.env.GOOGLE_REFRESH_TOKEN ? '✓ Set' : '✗ Not set'}`);
  console.log(`   Recipients: ${process.env.EMAIL_RECIPIENTS || 'mark@peterei.com (default)'}`);

  if (isConfigured) {
    console.log('   ✅ PASSED - OAuth is configured');
    passed++;
  } else {
    console.log('   ❌ FAILED - OAuth is not configured');
    console.log('   Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
    failed++;
    process.exit(1);
  }

  // Check for refresh token
  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    console.log('\n⚠️  GOOGLE_REFRESH_TOKEN not set');
    console.log('   To get a refresh token:');
    console.log('   1. Start the dev server: pnpm dev');
    console.log('   2. Visit: http://localhost:3000/api/auth/google');
    console.log('   3. Authorize the app with your Google account');
    console.log('   4. Copy the refresh token and add to .env');
    console.log('   5. Restart the server and run this test again');
    process.exit(1);
  }

  // Test 2: OAuth Connection Test
  console.log('\n📝 Test 2: OAuth Connection Test');
  console.log('   Testing connection to Gmail API...');

  const connectionTest = await testOAuthConnection(process.env.GOOGLE_REFRESH_TOKEN);
  if (connectionTest.success) {
    console.log(`   ✅ PASSED - OAuth connection successful`);
    console.log(`   Connected as: ${connectionTest.email}`);
    passed++;
  } else {
    console.log(`   ❌ FAILED - OAuth connection failed: ${connectionTest.error}`);
    console.log('\n   Common issues:');
    console.log('   - Refresh token is invalid or expired');
    console.log('   - Google API permissions not granted');
    console.log('   - Visit /api/auth/google to re-authorize');
    failed++;
  }

  // Test 3: Send Test Email
  if (connectionTest.success) {
    console.log('\n📝 Test 3: Send Test Onboarding Email (OAuth)');
    console.log('   Sending test email with sample data...');

    const testAnswers = {
      company_name: 'Test Company Inc. (OAuth)',
      user_name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Product Manager',
      team_size: '10-50 employees',
      use_case: 'Customer support automation',
      goals: 'Improve response time and customer satisfaction',
      submitted_at: new Date().toISOString(),
    };

    const emailResult = await sendOnboardingEmailOAuth(testAnswers, process.env.GOOGLE_REFRESH_TOKEN!);

    if (emailResult.success) {
      console.log(`   ✅ PASSED - Test email sent successfully (OAuth)`);
      console.log(`   Message ID: ${emailResult.messageId}`);
      console.log(`   Check inbox at: ${process.env.EMAIL_RECIPIENTS || 'mark@peterei.com'}`);
      passed++;
    } else {
      console.log(`   ❌ FAILED - Failed to send email: ${emailResult.error}`);
      failed++;
    }
  } else {
    console.log('\n📝 Test 3: Send Test Email');
    console.log('   ⏭️  SKIPPED - OAuth connection test failed');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n🎉 All OAuth email tests passed! Email service is working correctly.\n');
    console.log('📬 Check your inbox for the test email.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runOAuthEmailTests();