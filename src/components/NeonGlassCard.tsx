import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';

interface NeonGlassCardProps {
  children: React.ReactNode;
  style?: any;
  intensity?: number;
  glowColors?: string[];
}

export const NeonGlassCard: React.FC<NeonGlassCardProps> = ({
  children,
  style,
  intensity = 50,
  glowColors = ['#00ffff', '#ff00ff', '#ffff00', '#ff6b6b', '#4ecdc4']
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Glass card container */}
      <View style={styles.glassContainer}>
        <BlurView
          intensity={intensity}
          tint="dark"
          style={styles.blurView}
        >
          <View style={styles.glassOverlay}>
            {children}
          </View>
        </BlurView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    margin: 8,
  },
  glassContainer: {
    position: 'relative',
    zIndex: 10,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  blurView: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  glassOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});