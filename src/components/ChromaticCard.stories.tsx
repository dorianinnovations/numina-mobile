/**
 * 📖 ChromaticCard Stories - Premium Card Components
 * 
 * Interactive stories for ChromaticCard components showcasing
 * different tiers, styles, and premium effects.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native';

import { ChromaticCard } from './ChromaticCard';
import { ThemeProvider } from '../contexts/ThemeContext';

const StoryWrapper: React.FC<{ children: React.ReactNode; darkMode?: boolean }> = ({ 
  children, 
  darkMode = false 
}) => (
  <ThemeProvider initialTheme={darkMode ? 'dark' : 'light'}>
    <View style={[
      styles.storyContainer,
      { backgroundColor: darkMode ? '#000' : '#fff' }
    ]}>
      {children}
    </View>
  </ThemeProvider>
);

const SampleContent: React.FC<{ title: string; subtitle: string; isDark?: boolean }> = ({ 
  title, 
  subtitle, 
  isDark = false 
}) => (
  <View style={styles.cardContent}>
    <Text style={[
      styles.cardTitle,
      { color: isDark ? '#ffffff' : '#000000' }
    ]}>
      {title}
    </Text>
    <Text style={[
      styles.cardSubtitle,
      { color: isDark ? '#888888' : '#666666' }
    ]}>
      {subtitle}
    </Text>
  </View>
);

const meta: Meta<typeof ChromaticCard> = {
  title: 'Components/ChromaticCard',
  component: ChromaticCard,
  argTypes: {
    tier: {
      control: { type: 'select' },
      options: ['Core', 'Aether'],
      description: 'Card tier for premium styling',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'premium', 'luxury'],
      description: 'Card styling variant',
    },
    glowIntensity: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Intensity of glow effects',
    },
    isActive: {
      control: { type: 'boolean' },
      description: 'Whether the card is in active state',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'Premium card component with tier-based styling and advanced visual effects.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ChromaticCard>;

export const CoreTier: Story = {
  args: {
    tier: 'Core',
    variant: 'default',
    glowIntensity: 0.6,
    isActive: true,
  },
  render: (args) => (
    <StoryWrapper>
      <ChromaticCard {...args}>
        <SampleContent 
          title="Core Tier Card" 
          subtitle="Basic premium styling with subtle effects" 
        />
      </ChromaticCard>
    </StoryWrapper>
  ),
};

export const AetherTier: Story = {
  args: {
    tier: 'Aether',
    variant: 'luxury',
    glowIntensity: 0.9,
    isActive: true,
  },
  render: (args) => (
    <StoryWrapper>
      <ChromaticCard {...args}>
        <SampleContent 
          title="Aether Tier Card" 
          subtitle="Premium luxury styling with enhanced effects" 
        />
      </ChromaticCard>
    </StoryWrapper>
  ),
};

export const PremiumVariant: Story = {
  args: {
    tier: 'Core',
    variant: 'premium',
    glowIntensity: 0.8,
    isActive: true,
  },
  render: (args) => (
    <StoryWrapper>
      <ChromaticCard {...args}>
        <SampleContent 
          title="Premium Variant" 
          subtitle="Enhanced styling with premium effects" 
        />
      </ChromaticCard>
    </StoryWrapper>
  ),
};

export const DarkMode: Story = {
  args: {
    tier: 'Aether',
    variant: 'luxury',
    glowIntensity: 0.7,
    isActive: true,
  },
  render: (args) => (
    <StoryWrapper darkMode={true}>
      <ChromaticCard {...args}>
        <SampleContent 
          title="Dark Mode Card" 
          subtitle="Optimized for dark themes" 
          isDark={true}
        />
      </ChromaticCard>
    </StoryWrapper>
  ),
};

export const InactiveState: Story = {
  args: {
    tier: 'Core',
    variant: 'default',
    glowIntensity: 0.3,
    isActive: false,
  },
  render: (args) => (
    <StoryWrapper>
      <ChromaticCard {...args}>
        <SampleContent 
          title="Inactive Card" 
          subtitle="Reduced effects when not active" 
        />
      </ChromaticCard>
    </StoryWrapper>
  ),
};

export const LowGlow: Story = {
  args: {
    tier: 'Core',
    variant: 'default',
    glowIntensity: 0.2,
    isActive: true,
  },
  render: (args) => (
    <StoryWrapper>
      <ChromaticCard {...args}>
        <SampleContent 
          title="Low Glow Intensity" 
          subtitle="Subtle glow effects" 
        />
      </ChromaticCard>
    </StoryWrapper>
  ),
};

export const HighGlow: Story = {
  args: {
    tier: 'Aether',
    variant: 'luxury',
    glowIntensity: 1.0,
    isActive: true,
  },
  render: (args) => (
    <StoryWrapper>
      <ChromaticCard {...args}>
        <SampleContent 
          title="High Glow Intensity" 
          subtitle="Maximum glow effects" 
        />
      </ChromaticCard>
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
  cardContent: {
    padding: 24,
    alignItems: 'center',
    minWidth: 250,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});