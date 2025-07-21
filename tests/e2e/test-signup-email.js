// Test script to verify RESEND welcome emails on signup
// This tests if new user signups trigger welcome emails via RESEND

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

async function testSignupEmail() {
  console.log('📧 Testing RESEND Welcome Email on Signup...\n');

  // Generate unique test email
  const timestamp = Date.now();
  const testEmail = `signup-test-${timestamp}@example.com`;
  const testPassword = 'TestPassword123';

  console.log(`🧪 Test Email: ${testEmail}`);
  console.log(`🔑 Test Password: ${testPassword}\n`);

  try {
    // Test user signup
    console.log('📝 Step 1: Creating new user account...');
    const signupResponse = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword
      })
    });

    const signupData = await signupResponse.json();
    console.log('📋 Signup Response:', signupData);

    if (signupData.status === 'success' || signupData.success === true) {
      console.log('✅ User signup successful!');
      console.log(`   User ID: ${signupData.data?.user?.id}`);
      console.log(`   Email: ${signupData.data?.user?.email}`);
      console.log(`   Token: ${signupData.token ? 'Generated' : 'Missing'}\n`);

      // Check if there's any email confirmation or welcome email info
      if (signupData.welcomeEmail) {
        console.log('📧 Welcome email status:');
        console.log(`   Email sent: ${signupData.welcomeEmail.sent}`);
        console.log(`   Email service: ${signupData.welcomeEmail.service || 'Not specified'}`);
        console.log(`   Message ID: ${signupData.welcomeEmail.messageId || 'Not provided'}`);
        
        if (signupData.welcomeEmail.sent && signupData.welcomeEmail.service === 'resend') {
          console.log('🎉 RESEND integration confirmed working!');
        } else if (signupData.welcomeEmail.sent) {
          console.log('✅ Email sent via fallback service');
        } else {
          console.log('❌ Email sending failed');
        }
        console.log('');
      } else {
        console.log('⚠️  No welcome email information in signup response');
        console.log('   This might mean:');
        console.log('   - Server-side email integration not updated');
        console.log('   - RESEND integration needs configuration');
        console.log('   - Welcome emails are disabled\n');
      }

      // Test login to verify account works
      console.log('🔐 Step 2: Testing login with new account...');
      const loginResponse = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });

      const loginData = await loginResponse.json();
      
      if (loginData.status === 'success' || loginData.success === true) {
        console.log('✅ Login successful - account is fully functional');
        console.log(`   Token valid: ${loginData.token ? 'Yes' : 'No'}\n`);
      } else {
        console.log('❌ Login failed:', loginData.error || loginData.message);
      }

    } else {
      console.log('❌ Signup failed:', signupData.error || signupData.message);
      
      // Check if it's because email already exists
      if (signupData.error?.includes('already')) {
        console.log('💡 This might be expected if testing multiple times with the same email');
      }
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

// Check server health first
async function checkServerHealth() {
  try {
    console.log('🏥 Checking server health...');
    const response = await fetch(`${API_BASE_URL}/health`);
    const health = await response.json();
    
    console.log('✅ Server status:', health.status);
    console.log(`   Database: ${health.database || 'Unknown'}`);
    console.log(`   LLM API: ${health.llm_api || 'Unknown'}\n`);
    
    return health.status === 'success' || health.status === 'healthy';
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    return false;
  }
}

// Run the complete test
async function runSignupEmailTest() {
  console.log('🚀 RESEND Signup Email Test\n');
  console.log('==========================================\n');

  // Check server health first
  const isHealthy = await checkServerHealth();
  if (!isHealthy) {
    console.log('❌ Server is not healthy, aborting test');
    return;
  }

  // Run signup test
  await testSignupEmail();

  console.log('==========================================');
  console.log('✨ Signup email test complete!\n');
  
  console.log('📝 What to check:');
  console.log('   1. Did the signup response include email confirmation?');
  console.log('   2. Check your email inbox for welcome message');
  console.log('   3. Verify sender is from your RESEND domain');
  console.log('   4. Check server logs for RESEND API calls');
  console.log('   5. Look for any email delivery confirmations\n');
  
  console.log('🔧 If no email received:');
  console.log('   - Check RESEND API key configuration on server');
  console.log('   - Verify DNS records for sending domain');
  console.log('   - Check server logs for email errors');
  console.log('   - Confirm welcome email template exists');
}

// Export for testing
module.exports = {
  testSignupEmail,
  runSignupEmailTest
};

// Run if called directly
if (require.main === module) {
  runSignupEmailTest().catch(console.error);
}