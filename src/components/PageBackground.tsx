import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface PageBackgroundProps {
  children: React.ReactNode;
  style?: any;
}

export const PageBackground: React.FC<PageBackgroundProps> = ({ 
  children, 
  style 
}) => {
  const { isDarkMode } = useTheme();

  if (isDarkMode) {
    return (
      <View 
        style={[
          styles.container, 
          { backgroundColor: '#0a0a0a' },
          style
        ]}
      >
        {children}
      </View>
    );
  }

  if (Platform.OS === 'web') {
    // Firefox-compatible CSS gradient
    return (
      <View 
        style={[
          styles.container,
          {
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 25%, #e2f1ff 50%, #dbeafe 75%, #f5f8ff 100%)',
            backgroundColor: '#f8fafc', // Fallback for older browsers
          },
          style
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[
        '#ffffff',  
        '#f8fafc',  
        '#e2f1ff',  
        '#dbeafe',  
        '#f5f8ff',  
      ]}
      style={[styles.container, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PageBackground;