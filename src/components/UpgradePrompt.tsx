import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface UpgradePromptProps {
  tier: string;
  upgradeOptions: string[];
  onUpgrade: (tier: string) => void;
  onDismiss: () => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  tier,
  upgradeOptions,
  onUpgrade,
  onDismiss
}) => {
  const { isDarkMode } = useTheme();

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: isDarkMode ? '#121212' : '#ffffff',
        borderWidth: 2,
        borderColor: isDarkMode ? '#333333' : '#e0e0e0'
      }
    ]}>
      <Text style={[
        styles.title,
        { color: isDarkMode ? '#BDBDBD' : '#616161' }
      ]}>
        Upgrade to continue
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.upgradeButton, { 
            backgroundColor: '#6ec5ff',
            borderWidth: 1,
            borderColor: isDarkMode ? '#ffffff' : '#000000',
            shadowColor: isDarkMode ? '#6ec5ff' : '#000000',
            shadowOpacity: isDarkMode ? 0.3 : 0.1,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            elevation: 4,
          }]}
          onPress={() => onUpgrade('PRO')}
        >
          <Text style={styles.upgradeButtonText}>
            Pro - $29.99/mo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.upgradeButton, { 
            backgroundColor: '#6ec5ff',
            borderWidth: 1,
            borderColor: isDarkMode ? '#ffffff' : '#000000',
            shadowColor: isDarkMode ? '#6ec5ff' : '#000000',
            shadowOpacity: isDarkMode ? 0.3 : 0.1,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            elevation: 4,
          }]}
          onPress={() => onUpgrade('AETHER')}
        >
          <Text style={styles.upgradeButtonText}>
            Aether - $99.99/mo
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
        <Text style={[
          styles.dismissButtonText,
          { color: isDarkMode ? '#BDBDBD' : '#616161' }
        ]}>
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  upgradeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    height: 44,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  dismissButton: {
    padding: 8,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
});