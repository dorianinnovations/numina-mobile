/**
 * 📖 AnimatedGradientBorder Stories - Storybook Documentation
 * 
 * Interactive stories for the AnimatedGradientBorder component,
 * showcasing various border themes, animations, and configurations.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';

import { AnimatedGradientBorder } from './AnimatedGradientBorder';
import { ThemeProvider } from '../contexts/ThemeContext';
import { BorderThemeProvider } from '../contexts/BorderThemeContext';
import { BorderSettingsProvider } from '../contexts/BorderSettingsContext';

// Wrapper component to provide necessary contexts
const StoryWrapper: React.FC<{ children: React.ReactNode; darkMode?: boolean }> = ({ 
  children, 
  darkMode = false 
}) => (
  <ThemeProvider initialTheme={darkMode ? 'dark' : 'light'}>
    <BorderThemeProvider>
      <BorderSettingsProvider>
        <View style={[
          styles.storyContainer,
          { backgroundColor: darkMode ? '#000' : '#fff' }
        ]}>
          {children}
        </View>
      </BorderSettingsProvider>
    </BorderThemeProvider>
  </ThemeProvider>
);

// Sample content component
const SampleCard: React.FC<{ title: string; isDark?: boolean }> = ({ title, isDark = false }) => (
  <View style={[
    styles.sampleCard,
    { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }
  ]}>
    <Text style={[
      styles.sampleText,
      { color: isDark ? '#ffffff' : '#000000' }
    ]}>
      {title}
    </Text>
    <Text style={[
      styles.sampleSubtext,
      { color: isDark ? '#888888' : '#666666' }
    ]}>
      This is a sample card with animated border
    </Text>
  </View>
);

const meta: Meta<typeof AnimatedGradientBorder> = {
  title: 'Components/AnimatedGradientBorder',
  component: AnimatedGradientBorder,
  argTypes: {
    isActive: {
      control: { type: 'boolean' },
      description: 'Controls whether the animation is active',
    },
    borderRadius: {
      control: { type: 'range', min: 0, max: 30, step: 1 },
      description: 'Border radius for the container',
    },
    borderWidth: {
      control: { type: 'range', min: 1, max: 10, step: 1 },
      description: 'Thickness of the animated border',
    },
    animationSpeed: {
      control: { type: 'range', min: 1000, max: 8000, step: 500 },
      description: 'Animation speed in milliseconds',
    },
    direction: {
      control: { type: 'select' },
      options: ['clockwise', 'counterclockwise'],
      description: 'Animation direction',
    },
    speed: {
      control: { type: 'select' },
      options: [1, 2, 3],
      description: 'Animation speed preset (1=slow, 2=medium, 3=fast)',
    },
    variation: {
      control: { type: 'select' },
      options: ['smooth', 'pulse', 'wave'],
      description: 'Animation variation style',
    },
    effectsEnabled: {
      control: { type: 'boolean' },
      description: 'Enable/disable border effects',
    },
    brightness: {
      control: { type: 'range', min: 0, max: 100, step: 5 },
      description: 'Brightness level 0-100',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'A sophisticated animated gradient border component with theme integration and performance optimization.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AnimatedGradientBorder>;

// Default story
export const Default: Story = {
  args: {
    isActive: true,
    borderRadius: 12,
    borderWidth: 2,
    animationSpeed: 4000,
    direction: 'clockwise',
    speed: 2,
    variation: 'smooth',
    effectsEnabled: true,
    brightness: 80,
  },
  render: (args) => (
    <StoryWrapper>
      <AnimatedGradientBorder {...args}>
        <SampleCard title="Default Border" />
      </AnimatedGradientBorder>
    </StoryWrapper>
  ),
};

// Fast animation
export const FastAnimation: Story = {
  args: {
    ...Default.args,
    speed: 3,
    animationSpeed: 2000,
  },
  render: (args) => (
    <StoryWrapper>
      <AnimatedGradientBorder {...args}>
        <SampleCard title="Fast Animation" />
      </AnimatedGradientBorder>
    </StoryWrapper>
  ),
};

// Pulse variation
export const PulseVariation: Story = {
  args: {
    ...Default.args,
    variation: 'pulse',
  },
  render: (args) => (
    <StoryWrapper>
      <AnimatedGradientBorder {...args}>
        <SampleCard title="Pulse Variation" />
      </AnimatedGradientBorder>
    </StoryWrapper>
  ),
};

// Wave variation
export const WaveVariation: Story = {
  args: {
    ...Default.args,
    variation: 'wave',
  },
  render: (args) => (
    <StoryWrapper>
      <AnimatedGradientBorder {...args}>
        <SampleCard title="Wave Variation" />
      </AnimatedGradientBorder>
    </StoryWrapper>
  ),
};

// Dark mode
export const DarkMode: Story = {
  args: {
    ...Default.args,
  },
  render: (args) => (
    <StoryWrapper darkMode={true}>
      <AnimatedGradientBorder {...args}>
        <SampleCard title="Dark Mode" isDark={true} />
      </AnimatedGradientBorder>
    </StoryWrapper>
  ),
};

// Inactive state
export const Inactive: Story = {
  args: {
    ...Default.args,
    isActive: false,
  },
  render: (args) => (
    <StoryWrapper>
      <AnimatedGradientBorder {...args}>
        <SampleCard title="Inactive Border" />
      </AnimatedGradientBorder>
    </StoryWrapper>
  ),
};

// High brightness
export const HighBrightness: Story = {
  args: {
    ...Default.args,
    brightness: 100,
  },
  render: (args) => (
    <StoryWrapper>
      <AnimatedGradientBorder {...args}>
        <SampleCard title="High Brightness" />
      </AnimatedGradientBorder>
    </StoryWrapper>
  ),
};

// Counterclockwise
export const Counterclockwise: Story = {
  args: {
    ...Default.args,
    direction: 'counterclockwise',
  },
  render: (args) => (
    <StoryWrapper>
      <AnimatedGradientBorder {...args}>
        <SampleCard title="Counterclockwise" />
      </AnimatedGradientBorder>
    </StoryWrapper>
  ),
};

// Large border radius
export const LargeBorderRadius: Story = {
  args: {
    ...Default.args,
    borderRadius: 24,
  },
  render: (args) => (
    <StoryWrapper>
      <AnimatedGradientBorder {...args}>
        <SampleCard title="Large Border Radius" />
      </AnimatedGradientBorder>
    </StoryWrapper>
  ),
};

// Thick border
export const ThickBorder: Story = {
  args: {
    ...Default.args,
    borderWidth: 6,
  },
  render: (args) => (
    <StoryWrapper>
      <AnimatedGradientBorder {...args}>
        <SampleCard title="Thick Border" />
      </AnimatedGradientBorder>
    </StoryWrapper>
  ),
};

const styles = StyleSheet.create({
  storyContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  sampleCard: {
    padding: 24,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  sampleText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  sampleSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});