/**
 * 🎨 AnimatedGradientBorder Examples
 * 
 * Complete usage examples for the AnimatedGradientBorder component.
 * Copy and paste these into your app for instant premium effects!
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AnimatedGradientBorder } from './AnimatedGradientBorder';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const BasicExample = () => {
  const [isActive, setIsActive] = useState(false);

  return (
    <View style={styles.container}>
      <AnimatedGradientBorder isActive={isActive}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => setIsActive(!isActive)}
        >
          <Text style={styles.buttonText}>
            {isActive ? 'Stop Animation' : 'Start Animation'}
          </Text>
        </TouchableOpacity>
      </AnimatedGradientBorder>
    </View>
  );
};

export const LoadingCardExample = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View style={styles.container}>
      <AnimatedGradientBorder
        isActive={isLoading}
        borderRadius={16}
        animationSpeed={3000}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Loading Content...</Text>
          <Text style={styles.cardSubtitle}>Please wait while we fetch your data</Text>
          
          <TouchableOpacity 
            style={styles.smallButton}
            onPress={() => setIsLoading(!isLoading)}
          >
            <Text style={styles.smallButtonText}>
              {isLoading ? 'Stop' : 'Start'} Loading
            </Text>
          </TouchableOpacity>
        </View>
      </AnimatedGradientBorder>
    </View>
  );
};

export const CustomGradientExample = () => {
  return (
    <View style={styles.container}>
      <AnimatedGradientBorder
        isActive={true}
        borderRadius={20}
        borderWidth={2}
        animationSpeed={2000}
        gradientColors={[
          'rgba(255, 0, 150, 0.8)',  // Hot pink
          'rgba(255, 0, 150, 0.4)',
          'rgba(255, 0, 150, 0.2)',
          'transparent'
        ]}
        backgroundColor="rgb(20, 20, 30)"
      >
        <View style={[styles.card, { backgroundColor: 'rgb(20, 20, 30)' }]}>
          <Text style={[styles.cardTitle, { color: '#ff0096' }]}>
            Custom Pink Glow
          </Text>
          <Text style={[styles.cardSubtitle, { color: '#ffffff' }]}>
            Fast 2-second animation with hot pink gradient
          </Text>
        </View>
      </AnimatedGradientBorder>
    </View>
  );
};

export const GamingUIExample = () => {
  return (
    <View style={styles.container}>
      <AnimatedGradientBorder
        isActive={true}
        borderRadius={8}
        borderWidth={1}
        animationSpeed={1500}
        gradientColors={[
          'rgba(0, 255, 0, 1)',      // Bright green
          'rgba(0, 255, 0, 0.6)',
          'rgba(0, 255, 0, 0.3)',
          'transparent'
        ]}
        backgroundColor="rgb(10, 10, 10)"
      >
        <View style={[styles.card, { backgroundColor: 'rgb(10, 10, 10)' }]}>
          <Text style={[styles.cardTitle, { color: '#00ff00', fontFamily: 'monospace' }]}>
            SYSTEM ACTIVE
          </Text>
          <Text style={[styles.cardSubtitle, { color: '#00aa00', fontFamily: 'monospace' }]}>
            Fast gaming-style green glow
          </Text>
        </View>
      </AnimatedGradientBorder>
    </View>
  );
};

export const PremiumGoldExample = () => {
  return (
    <View style={styles.container}>
      <AnimatedGradientBorder
        isActive={true}
        borderRadius={12}
        borderWidth={1}
        animationSpeed={5000}
        gradientColors={[
          'rgba(255, 215, 0, 0.9)',   // Gold
          'rgba(255, 215, 0, 0.6)',
          'rgba(255, 215, 0, 0.3)',
          'transparent'
        ]}
        backgroundColor="rgb(25, 20, 15)"
      >
        <View style={[styles.card, { backgroundColor: 'rgb(25, 20, 15)' }]}>
          <Text style={[styles.cardTitle, { color: '#ffd700' }]}>
            ✨ Premium Gold
          </Text>
          <Text style={[styles.cardSubtitle, { color: '#ffed4e' }]}>
            Slow, elegant gold animation for premium features
          </Text>
        </View>
      </AnimatedGradientBorder>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export const AnimatedGradientBorderDemo = () => {
  return (
    <View style={styles.demoContainer}>
      <Text style={styles.demoTitle}>🔥 AnimatedGradientBorder Examples</Text>
      
      <Text style={styles.sectionTitle}>Basic Usage</Text>
      <BasicExample />
      
      <Text style={styles.sectionTitle}>Loading Card</Text>
      <LoadingCardExample />
      
      <Text style={styles.sectionTitle}>Custom Pink Gradient</Text>
      <CustomGradientExample />
      
      <Text style={styles.sectionTitle}>Gaming UI Style</Text>
      <GamingUIExample />
      
      <Text style={styles.sectionTitle}>Premium Gold</Text>
      <PremiumGoldExample />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  demoContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  demoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  container: {
    marginVertical: 10,
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  card: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    minWidth: 250,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 15,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AnimatedGradientBorderDemo;