import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { FileUploadService } from '../../services/fileUploadService';
import ApiService from '../../services/api';
import { MessageAttachment } from '../../types/message';
import { ENV } from '../../config/environment';

const UploadTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testServerHealth = async () => {
    try {
      addResult('🧪 Testing server health...');
      const response = await fetch(`${ENV.API_BASE_URL}/`);
      const result = await response.json();
      
      if (response.ok) {
        addResult(`✅ Server healthy: ${result.message} (v${result.version})`);
      } else {
        addResult(`❌ Server unhealthy: ${response.status}`);
      }
    } catch (error) {
      addResult(`❌ Server health error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testVisionUpload = async () => {
    try {
      addResult('🧪 Testing vision upload...');
      
      // Create a small test image (1x1 pixel PNG)
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const dataUrl = `data:image/png;base64,${testImageBase64}`;
      
      const result = await ApiService.uploadImageForVision({
        imageData: dataUrl,
        fileName: 'test-image.png',
        mimeType: 'image/png'
      });
      
      if (result.success) {
        addResult(`✅ Vision upload successful: ${result.data?.url ? 'URL present' : 'No URL'}`);
      } else {
        addResult(`❌ Vision upload failed: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ Vision upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testImagePicker = async () => {
    try {
      addResult('🧪 Testing image picker and upload...');
      const fileUploadService = FileUploadService.getInstance();
      
      // Check permissions first
      const hasPermissions = await fileUploadService.requestPermissions();
      if (!hasPermissions) {
        addResult('❌ Camera/gallery permissions not granted');
        return;
      }
      
      addResult('📸 Pick an image from gallery to test upload...');
      const attachment = await fileUploadService.pickPhoto();
      
      if (!attachment) {
        addResult('❌ No image selected');
        return;
      }
      
      addResult(`📎 Selected: ${attachment.name} (${Math.round(attachment.size / 1024)}KB)`);
      
      // Test vision processing
      addResult('🔄 Processing for vision...');
      const processed = await fileUploadService.processAttachmentForSending(attachment, true);
      
      if (processed.uploadStatus === 'uploaded') {
        addResult(`✅ Vision processing successful: ${processed.serverUrl ? 'URL present' : 'No URL'}`);
      } else {
        addResult(`❌ Vision processing failed: ${processed.uploadStatus}`);
      }
      
    } catch (error) {
      addResult(`❌ Image picker error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    clearResults();
    
    addResult(`🚀 Starting upload tests against: ${ENV.API_BASE_URL}`);
    
    await testServerHealth();
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    
    await testVisionUpload();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    addResult('🎯 Tests completed! Check results above.');
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Test Component</Text>
      <Text style={styles.subtitle}>Testing against: {ENV.API_BASE_URL}</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={runAllTests}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '🔄 Running Tests...' : '🧪 Run All Tests'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={testImagePicker}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>📸 Test Image Upload</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.warningButton]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>🗑️ Clear Results</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
        {testResults.length === 0 && (
          <Text style={styles.placeholderText}>No test results yet. Run tests to see output.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  warningButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    maxHeight: 400,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 5,
    color: '#333',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default UploadTestComponent;