/**
 * 📖 DevTools Stories - Development Utilities Showcase
 * 
 * Stories for the DevTools component to demonstrate
 * development utilities and authentication features.
 */

import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native';

import { DevTools } from './DevTools';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/SimpleAuthContext';

// Mock environment for Storybook
jest.mock('../config/environment', () => ({
  FEATURE_FLAGS: {
    DEV_AUTH_BYPASS: true,
  },
}));

const StoryWrapper: React.FC<{ children: React.ReactNode; darkMode?: boolean }> = ({ 
  children, 
  darkMode = false 
}) => (
  <ThemeProvider initialTheme={darkMode ? 'dark' : 'light'}>
    <AuthProvider>
      <View style={{ 
        flex: 1, 
        backgroundColor: darkMode ? '#000' : '#fff',
        minHeight: 500,
      }}>
        {children}
      </View>
    </AuthProvider>
  </ThemeProvider>
);

const meta: Meta<typeof DevTools> = {
  title: 'Development/DevTools',
  component: DevTools,
  parameters: {
    docs: {
      description: {
        component: 'Development tools for debugging authentication and app state. Only visible in development mode.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof DevTools>;

export const LightMode: Story = {
  render: () => (
    <StoryWrapper>
      <DevTools />
    </StoryWrapper>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <StoryWrapper darkMode={true}>
      <DevTools />
    </StoryWrapper>
  ),
};