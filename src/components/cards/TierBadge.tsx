import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface TierBadgeProps {
  tier?: 'CORE' | 'AETHER' | 'core' | 'aether' | string;
  size?: 'small' | 'medium' | 'large';
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'medium' }) => {
  const { isDarkMode } = useTheme();

  const tierConfig = {
    CORE: {
      color: '#6B7280',
      bgColor: isDarkMode ? '#374151' : '#F3F4F6',
      icon: 'circle',
      label: 'Core'
    },
    AETHER: {
      color: '#7C3AED',
      bgColor: isDarkMode ? '#5bd0ff' : '#90e9ff',
      icon: 'gem',
      label: 'Aether'
    }
  };

  // Normalize tier to uppercase and provide fallback
  const normalizedTier = tier?.toString().toUpperCase() as keyof typeof tierConfig;
  const config = tierConfig[normalizedTier] || tierConfig.CORE;
  const sizeStyles = {
    small: { fontSize: 10, padding: 4, iconSize: 8 },
    medium: { fontSize: 12, padding: 6, iconSize: 10 },
    large: { fontSize: 14, padding: 8, iconSize: 12 }
  };

  return (
    <View style={[
      styles.badge,
      { backgroundColor: config.bgColor },
      { padding: sizeStyles[size].padding }
    ]}>
      <FontAwesome5 
        name={config.icon} 
        size={sizeStyles[size].iconSize} 
        color={config.color} 
      />
      <Text style={[
        styles.label,
        { color: config.color, fontSize: sizeStyles[size].fontSize }
      ]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    gap: 4,
  },
  label: {
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});