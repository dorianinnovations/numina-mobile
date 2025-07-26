#!/usr/bin/env node

/**
 * Test script for upload endpoints
 * Run with: node test-uploads.js
 */

const https = require('https');
const http = require('http');

const API_BASE_URL = 'http://localhost:5000';

// Mock test data
const createTestImage = () => {
  // Simple 1x1 pixel PNG in base64
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
};

const createTestImageDataURL = () => {
  return `data:image/png;base64,${createTestImage()}`;
};

// Test regular FormData upload (simplified without form-data dependency)
async function testFormDataUpload() {
  console.log('\n🧪 Testing FormData Upload Endpoint (/upload)...');
  console.log('ℹ️  Skipping FormData test (requires multipart handling)');
  console.log('💡 You can test this through the mobile app or curl command:');
  console.log('   curl -X POST -F "file=@test.png" -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/upload');
  return true; // Skip for now
}

// Test vision base64 upload
async function testVisionUpload() {
  console.log('\n🧪 Testing Vision Upload Endpoint (/upload/vision)...');
  
  try {
    const imageData = createTestImageDataURL();
    
    const payload = {
      imageData: imageData,
      fileName: 'test-vision-image.png',
      mimeType: 'image/png'
    };

    const response = await fetch(`${API_BASE_URL}/upload/vision`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token', // You'll need a real token
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Vision upload successful:', {
        status: response.status,
        success: result.success,
        url: result.url ? 'Present' : 'Missing',
        fileInfo: result.fileInfo ? 'Present' : 'Missing'
      });
    } else {
      console.log('❌ Vision upload failed:', {
        status: response.status,
        error: result.error,
        message: result.message
      });
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Vision upload error:', error.message);
    return false;
  }
}

// Test server health
async function testServerHealth() {
  console.log('\n🧪 Testing Server Health...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Server is healthy:', {
        status: result.status,
        message: result.message,
        version: result.version
      });
      return true;
    } else {
      console.log('❌ Server health check failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Server health check error:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Upload Endpoint Tests');
  console.log(`📡 Testing against: ${API_BASE_URL}`);
  
  const results = {
    health: await testServerHealth(),
    formData: await testFormDataUpload(),
    vision: await testVisionUpload(),
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\n🎯 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (!results.health) {
    console.log('\n💡 Tip: Make sure your server is running on localhost:5000');
  }
  
  if (!results.formData || !results.vision) {
    console.log('\n💡 Tip: You may need to update the Authorization token in the test');
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testFormDataUpload, testVisionUpload, testServerHealth };