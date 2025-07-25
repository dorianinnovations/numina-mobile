/**
 * 🔧 DevTools - Development utilities for debugging and testing
 * 
 * Only available in development mode with dev flags enabled.
 * Provides quick access to dev auth bypass and other dev features.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../contexts/SimpleAuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FEATURE_FLAGS } from '../../config/environment';
import { FontAwesome5 } from '@expo/vector-icons';

export const DevTools: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { toggleDevAuthBypass, isDevMode, user, isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();

  // Only show in development mode
  if (!__DEV__ || !isDevMode) return null;

  const isDevUser = user?.email === 'dev@numina.ai';

  return (
    <>
      {/* Floating Dev Tools Button */}
      <TouchableOpacity
        style={[
          styles.floatingButton,
          {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            borderColor: isDarkMode ? '#333' : '#ddd',
          }
        ]}
        onPress={() => setIsVisible(true)}
      >
        <FontAwesome5 
          name="cog" 
          size={16} 
          color={isDarkMode ? '#6ec5ff' : '#007AFF'} 
        />
        <Text style={[
          styles.floatingButtonText,
          { color: isDarkMode ? '#6ec5ff' : '#007AFF' }
        ]}>
          DEV
        </Text>
      </TouchableOpacity>

      {/* Dev Tools Modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsVisible(false)}
      >
        <SafeAreaView style={[
          styles.container,
          { backgroundColor: isDarkMode ? '#000' : '#fff' }
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[
              styles.title,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              🔧 Developer Tools
            </Text>
            <TouchableOpacity
              onPress={() => setIsVisible(false)}
              style={styles.closeButton}
            >
              <FontAwesome5 
                name="times" 
                size={18} 
                color={isDarkMode ? '#fff' : '#000'} 
              />
            </TouchableOpacity>
          </View>

          {/* Auth Status */}
          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              Authentication Status
            </Text>
            <View style={[
              styles.statusCard,
              { backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: isDarkMode ? '#fff' : '#000' }
              ]}>
                Authenticated: {isAuthenticated ? '✅' : '❌'}
              </Text>
              <Text style={[
                styles.statusText,
                { color: isDarkMode ? '#fff' : '#000' }
              ]}>
                User: {user?.email || 'None'}
              </Text>
              <Text style={[
                styles.statusText,
                { color: isDarkMode ? '#fff' : '#000' }
              ]}>
                Tier: {user?.tierInfo?.tier || 'Unknown'}
              </Text>
              <Text style={[
                styles.statusText,
                { 
                  color: isDevUser 
                    ? (isDarkMode ? '#6ec5ff' : '#007AFF')
                    : (isDarkMode ? '#fff' : '#000')
                }
              ]}>
                Dev Mode: {isDevUser ? '🔧 Active' : '❌ Disabled'}
              </Text>
            </View>
          </View>

          {/* Dev Auth Controls */}
          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              Authentication Controls
            </Text>
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isDevUser 
                    ? (isDarkMode ? '#dc2626' : '#ef4444')
                    : (isDarkMode ? '#059669' : '#10b981'),
                }
              ]}
              onPress={toggleDevAuthBypass}
            >
              <FontAwesome5 
                name={isDevUser ? "user-times" : "user-check"} 
                size={16} 
                color="#fff" 
              />
              <Text style={styles.actionButtonText}>
                {isDevUser ? 'Disable Dev Auth' : 'Enable Dev Auth'}
              </Text>
            </TouchableOpacity>

            <Text style={[
              styles.helpText,
              { color: isDarkMode ? '#888' : '#666' }
            ]}>
              Toggle between dev user authentication and normal login flow.
              Dev auth bypasses all login requirements.
            </Text>
          </View>

          {/* Component Development - Ready for Future Use */}
          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              Component Development
            </Text>
            
            <View style={[
              styles.statusCard,
              { backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: isDarkMode ? '#888' : '#666' }
              ]}>
                📖 Storybook ready (currently disabled for performance)
              </Text>
            </View>

            <Text style={[
              styles.helpText,
              { color: isDarkMode ? '#888' : '#666' }
            ]}>
              Storybook integration is available but disabled for faster development.
              All setup files are ready for when you need component development.
            </Text>
          </View>

          {/* Environment Info */}
          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              Environment
            </Text>
            <View style={[
              styles.statusCard,
              { backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: isDarkMode ? '#fff' : '#000' }
              ]}>
                Dev Mode: {__DEV__ ? '✅' : '❌'}
              </Text>
              <Text style={[
                styles.statusText,
                { color: isDarkMode ? '#fff' : '#000' }
              ]}>
                Auth Bypass: {FEATURE_FLAGS.DEV_AUTH_BYPASS ? '✅' : '❌'}
              </Text>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              How to Enable Dev Auth Bypass
            </Text>
            <Text style={[
              styles.instructionText,
              { color: isDarkMode ? '#888' : '#666' }
            ]}>
              1. Add EXPO_PUBLIC_DEV_AUTH_BYPASS=true to your .env file{'\n'}
              2. Restart the development server{'\n'}
              3. The app will automatically authenticate with a dev user{'\n'}
              4. Use this panel to toggle between dev and normal auth
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    top: 80,
    right: 20,
    width: 60,
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    gap: 4,
  },
  floatingButtonText: {
    fontSize: 10,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'monospace',
  },
});

export default DevTools;