import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

interface PageBackgroundProps {
  children: React.ReactNode;
  style?: any;
}

export const PageBackground: React.FC<PageBackgroundProps> = (props) => {
  if (typeof props !== 'object' || props === null) {
    console.warn('PageBackground: props is not an object!', props);
    return <View style={{ flex: 1, backgroundColor: '#f5f8ff' }} />;
  }
  let { style } = props;
  let children = props.children;

  let { isDarkMode } = useTheme() || {};
  if (typeof isDarkMode !== 'boolean') isDarkMode = false;

  let safeStyle = [];
  safeStyle.push(styles.container);
  if (style && (Array.isArray(style) || (typeof style === 'object' && !Array.isArray(style)))) {
    safeStyle.push(style);
  }

  if (
    typeof children === 'object' &&
    !Array.isArray(children) &&
    !React.isValidElement(children)
  ) {
    console.warn('PageBackground: children is an object, not a valid React node. This will not be rendered.', children);
    children = null;
  }

  if (isDarkMode) {
    return <View style={[styles.container, { backgroundColor: '#0a0a0a' }, style]}>{children}</View>;
  }

  return (
    <LinearGradient
      colors={['#ffffff', '#f7fbff', '#b5d5ff', '#eaf6ff', '#f8f6ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={safeStyle}
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