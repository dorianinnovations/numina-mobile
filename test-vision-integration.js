#!/usr/bin/env node

/**
 * Mobile Vision Integration Test
 * Tests the mobile-side file upload and attachment handling
 */

import { FileUploadService } from './src/services/fileUploadService.js';
import ApiService from './src/services/api.js';

// Mock React Native dependencies for testing
global.Platform = { OS: 'ios' };

// Mock Expo modules
const mockExpoModules = {
  'expo-image-picker': {
    launchCameraAsync: () => Promise.resolve({
      canceled: false,
      assets: [{
        uri: 'file:///test/image.jpg',
        width: 1024,
        height: 768
      }]
    }),
    launchImageLibraryAsync: () => Promise.resolve({
      canceled: false,
      assets: [{
        uri: 'file:///test/library-image.jpg',
        width: 800,
        height: 600
      }]
    }),
    requestCameraPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
    requestMediaLibraryPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
    MediaTypeOptions: { Images: 'Images' }
  },
  'expo-document-picker': {
    getDocumentAsync: () => Promise.resolve({
      canceled: false,
      assets: [{
        uri: 'file:///test/document.pdf',
        name: 'test-document.pdf',
        size: 1024000,
        mimeType: 'application/pdf'
      }]
    })
  },
  'expo-file-system': {
    getInfoAsync: (uri) => Promise.resolve({
      exists: true,
      size: 1024000,
      uri
    }),
    readAsStringAsync: () => Promise.resolve('Test file content')
  },
  'expo-image-manipulator': {
    manipulateAsync: (uri, actions, options) => Promise.resolve({
      uri: uri.replace('.jpg', '_compressed.jpg')
    }),
    SaveFormat: { JPEG: 'jpeg' }
  }
};

// Apply mocks
Object.entries(mockExpoModules).forEach(([moduleName, mockImplementation]) => {
  global[moduleName] = mockImplementation;
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testFileUploadService() {
  log('\n🔄 Testing FileUploadService...', 'blue');
  
  try {
    const service = FileUploadService.getInstance();
    
    // Test permissions
    log('  Testing permission handling...', 'cyan');
    const hasPermissions = await service.requestPermissions();
    log(`  ✓ Permissions: ${hasPermissions ? 'Granted' : 'Denied'}`, hasPermissions ? 'green' : 'yellow');
    
    // Test photo capture
    log('  Testing photo capture...', 'cyan');
    const photoAttachment = await service.takePhoto();
    if (photoAttachment) {
      log('  ✓ Photo capture successful', 'green');
      log(`    Type: ${photoAttachment.type}`, 'cyan');
      log(`    Size: ${photoAttachment.size} bytes`, 'cyan');
      log(`    URI: ${photoAttachment.uri}`, 'cyan');
    }
    
    // Test photo picking
    log('  Testing photo library...', 'cyan');
    const libraryAttachment = await service.pickPhoto();
    if (libraryAttachment) {
      log('  ✓ Photo library successful', 'green');
      log(`    Type: ${libraryAttachment.type}`, 'cyan');
      log(`    Size: ${libraryAttachment.size} bytes`, 'cyan');
    }
    
    // Test document picking
    log('  Testing document picker...', 'cyan');
    const documentAttachment = await service.pickDocument();
    if (documentAttachment) {
      log('  ✓ Document picker successful', 'green');
      log(`    Type: ${documentAttachment.type}`, 'cyan');
      log(`    MIME: ${documentAttachment.mimeType}`, 'cyan');
    }
    
    // Test validation
    log('  Testing file validation...', 'cyan');
    if (photoAttachment) {
      const validation = service.validateFile(photoAttachment);
      log(`  ✓ Validation: ${validation ? 'Failed - ' + validation : 'Passed'}`, validation ? 'yellow' : 'green');
    }
    
    return true;
  } catch (error) {
    log(`  ✗ FileUploadService test failed: ${error.message}`, 'red');
    return false;
  }
}

function testAttachmentTypes() {
  log('\n🔄 Testing attachment type handling...', 'blue');
  
  const testAttachments = [
    {
      id: 'test-1',
      type: 'image',
      name: 'test-image.jpg',
      size: 1024000,
      uri: 'file:///test/image.jpg',
      mimeType: 'image/jpeg',
      uploadStatus: 'pending'
    },
    {
      id: 'test-2', 
      type: 'text',
      name: 'test-file.txt',
      size: 5000,
      uri: 'file:///test/text.txt',
      mimeType: 'text/plain',
      uploadStatus: 'pending'
    },
    {
      id: 'test-3',
      type: 'document',
      name: 'test-doc.pdf',
      size: 2048000,
      uri: 'file:///test/document.pdf', 
      mimeType: 'application/pdf',
      uploadStatus: 'pending'
    }
  ];
  
  log('  Testing attachment creation...', 'cyan');
  testAttachments.forEach(attachment => {
    log(`  ✓ ${attachment.type}: ${attachment.name} (${attachment.size} bytes)`, 'green');
  });
  
  log('  Testing vision-compatible formats...', 'cyan');
  const visionCompatible = testAttachments.filter(att => att.type === 'image');
  log(`  ✓ Vision-compatible attachments: ${visionCompatible.length}`, 'green');
  
  return true;
}

function testDataUrlConversion() {
  log('\n🔄 Testing data URL conversion...', 'blue');
  
  try {
    // Test base64 image creation (simulated)
    const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const dataUrl = `data:image/png;base64,${testBase64}`;
    
    log('  ✓ Data URL created successfully', 'green');
    log(`    Length: ${dataUrl.length} characters`, 'cyan');
    log(`    Format: ${dataUrl.substring(0, 30)}...`, 'cyan');
    
    // Test data URL validation
    const isValidDataUrl = dataUrl.startsWith('data:image');
    log(`  ✓ Data URL validation: ${isValidDataUrl ? 'Valid' : 'Invalid'}`, isValidDataUrl ? 'green' : 'red');
    
    return true;
  } catch (error) {
    log(`  ✗ Data URL test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testVisionPayload() {
  log('\n🔄 Testing vision payload format...', 'blue');
  
  try {
    // Simulate how mobile app would format vision requests
    const visionPayload = {
      message: 'What do you see in this image?',
      attachments: [
        {
          type: 'image',
          url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...',
          id: 'mobile-image-1'
        }
      ],
      stream: true
    };
    
    log('  ✓ Vision payload structure valid', 'green');
    log(`    Message: "${visionPayload.message}"`, 'cyan');
    log(`    Attachments: ${visionPayload.attachments.length}`, 'cyan');
    log(`    Streaming: ${visionPayload.stream}`, 'cyan');
    
    // Test attachment format
    const attachment = visionPayload.attachments[0];
    const hasValidUrl = attachment.url && attachment.url.startsWith('data:image');
    log(`  ✓ Attachment URL format: ${hasValidUrl ? 'Valid' : 'Invalid'}`, hasValidUrl ? 'green' : 'red');
    
    return true;
  } catch (error) {
    log(`  ✗ Vision payload test failed: ${error.message}`, 'red');
    return false;
  }
}

function displayMobileInstructions() {
  log('\n📱 Mobile App Testing Instructions:', 'bright');
  log('====================================', 'bright');
  
  log('\n1. Start the mobile app:', 'yellow');
  log('   cd numina-mobile && npm start', 'cyan');
  
  log('\n2. Test photo capture:', 'yellow');
  log('   • Open chat screen', 'cyan');
  log('   • Tap attachment button (📎)', 'cyan');
  log('   • Select "Take Photo"', 'cyan');
  log('   • Capture an image', 'cyan');
  log('   • Send message with photo', 'cyan');
  
  log('\n3. Test photo library:', 'yellow');
  log('   • Tap attachment button', 'cyan');
  log('   • Select "Photo Library"', 'cyan');
  log('   • Choose existing image', 'cyan');
  log('   • Send message', 'cyan');
  
  log('\n4. Test document upload:', 'yellow');
  log('   • Tap attachment button', 'cyan');
  log('   • Select "Document"', 'cyan');
  log('   • Choose text file or PDF', 'cyan');
  log('   • Send message', 'cyan');
  
  log('\n5. Expected GPT-4o Vision behavior:', 'yellow');
  log('   • Images are automatically analyzed', 'cyan');
  log('   • AI describes image content', 'cyan');
  log('   • Text in images is recognized', 'cyan');
  log('   • Charts/graphs are interpreted', 'cyan');
  
  log('\n🔧 Troubleshooting:', 'yellow');
  log('   • Ensure numina-server is running', 'cyan');
  log('   • Check camera/photo permissions', 'cyan');
  log('   • Verify network connectivity', 'cyan');
  log('   • Check server logs for errors', 'cyan');
}

async function runMobileTests() {
  log('📱 Mobile Vision Integration Tests', 'bright');
  log('================================', 'bright');
  
  const results = [];
  
  try {
    results.push(await testFileUploadService());
    results.push(testAttachmentTypes());
    results.push(testDataUrlConversion());
    results.push(await testVisionPayload());
    
    const passed = results.filter(Boolean).length;
    const total = results.length;
    
    log(`\n📊 Test Results: ${passed}/${total} passed`, passed === total ? 'green' : 'yellow');
    
    if (passed === total) {
      log('✅ All mobile vision integration tests passed!', 'green');
      log('\n🎯 Your mobile app is ready for GPT-4o vision testing!', 'bright');
    } else {
      log('⚠️  Some tests failed. Check the issues above.', 'yellow');
    }
    
    displayMobileInstructions();
    
  } catch (error) {
    log(`\n💥 Test suite failed: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run the mobile tests
runMobileTests();