import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
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
  
  const backgroundComponent = useMemo(() => {
    if (isDarkMode) {
      return (
        <View 
          style={[
            styles.container, 
            { backgroundColor: 'transparent' },
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
          '#fff2f2',  
          '#e2f1ff',  
          'rgb(227, 242, 255)',  
          '#f5f8ff',  
        ]}
        style={[styles.container, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
    );
  }, [isDarkMode, style, children]);

  return backgroundComponent;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PageBackground;