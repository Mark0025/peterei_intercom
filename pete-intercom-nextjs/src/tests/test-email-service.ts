/**
 * Test script for email service
 *
 * Tests:
 * 1. Email configuration validation
 * 2. SMTP connection test
 * 3. Send test onboarding email
 *
 * Usage:
 *   npx tsx src/tests/test-email-service.ts
 *
 * Requirements:
 *   - EMAIL_USER set in .env
 *   - EMAIL_PASS set in .env
 *   - Gmail account with "App Password" enabled
 */

import { sendOnboardingEmail, isEmailConfigured, testEmailConnection } from '../services/email';

async function runEmailTests() {
  console.log('📧 Running Email Service Tests\n');
  console.log('=' .repeat(60));

  let passed = 0;
  let failed = 0;

  // Test 1: Check if email is configured
  console.log('\n📝 Test 1: Email Configuration Check');
  const isConfigured = isEmailConfigured();
  console.log(`   Email USER: ${process.env.EMAIL_USER ? '✓ Set' : '✗ Not set'}`);
  console.log(`   Email PASS: ${process.env.EMAIL_PASS ? '✓ Set' : '✗ Not set'}`);
  console.log(`   Recipients: ${process.env.EMAIL_RECIPIENTS || 'mark@peterei.com (default)'}`);

  if (isConfigured) {
    console.log('   ✅ PASSED - Email is configured');
    passed++;
  } else {
    console.log('   ❌ FAILED - Email is not configured');
    console.log('   Please set EMAIL_USER and EMAIL_PASS in .env');
    failed++;
    process.exit(1);
  }

  // Test 2: SMTP Connection Test
  console.log('\n📝 Test 2: SMTP Connection Test');
  console.log('   Testing connection to Gmail SMTP...');

  const connectionTest = await testEmailConnection();
  if (connectionTest.success) {
    console.log('   ✅ PASSED - SMTP connection successful');
    passed++;
  } else {
    console.log(`   ❌ FAILED - SMTP connection failed: ${connectionTest.error}`);
    console.log('\n   Common issues:');
    console.log('   - Gmail "App Password" not enabled');
    console.log('   - Incorrect EMAIL_USER or EMAIL_PASS');
    console.log('   - Firewall blocking SMTP port (587)');
    failed++;
  }

  // Test 3: Send Test Email
  if (connectionTest.success) {
    console.log('\n📝 Test 3: Send Test Onboarding Email');
    console.log('   Sending test email with sample data...');

    const testAnswers = {
      company_name: 'Test Company Inc.',
      user_name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Product Manager',
      team_size: '10-50 employees',
      use_case: 'Customer support automation',
      goals: 'Improve response time and customer satisfaction',
      submitted_at: new Date().toISOString(),
    };

    const emailResult = await sendOnboardingEmail(testAnswers);

    if (emailResult.success) {
      console.log(`   ✅ PASSED - Test email sent successfully`);
      console.log(`   Message ID: ${emailResult.messageId}`);
      console.log(`   Check inbox at: ${process.env.EMAIL_RECIPIENTS || 'mark@peterei.com'}`);
      passed++;
    } else {
      console.log(`   ❌ FAILED - Failed to send email: ${emailResult.error}`);
      failed++;
    }
  } else {
    console.log('\n📝 Test 3: Send Test Email');
    console.log('   ⏭️  SKIPPED - SMTP connection test failed');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n🎉 All email tests passed! Email service is working correctly.\n');
    console.log('📬 Check your inbox for the test email.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runEmailTests();