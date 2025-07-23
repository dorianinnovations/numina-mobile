import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { StreamingMarkdown } from './StreamingMarkdown';

const { width: screenWidth } = Dimensions.get('window');

interface ChainStep {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed';
  message?: string;
  timestamp?: string;
}

interface ChainOfThoughtProgressProps {
  visible: boolean;
  currentStep: string;
  steps: ChainStep[];
  streamingMessage?: string;
  onComplete?: () => void;
}

export const ChainOfThoughtProgress: React.FC<ChainOfThoughtProgressProps> = ({
  visible,
  currentStep,
  steps,
  streamingMessage,
  onComplete,
}) => {
  const { isDarkMode } = useTheme();
  const [displayedMessage, setDisplayedMessage] = useState('');
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const progress = completedSteps / steps.length;
    
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();

    if (progress === 1 && onComplete) {
      setTimeout(() => onComplete(), 1000);
    }
  }, [steps]);

  const getStepIcon = (step: ChainStep) => {
    switch (step.status) {
      case 'completed':
        return 'check-circle';
      case 'active':
        return 'loading';
      default:
        return 'circle-outline';
    }
  };

  const getStepColor = (step: ChainStep) => {
    switch (step.status) {
      case 'completed':
        return '#10B981';
      case 'active':
        return '#3B82F6';
      default:
        return isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim }
      ]}
    >
      <LinearGradient
        colors={isDarkMode 
          ? ['rgba(30, 30, 35, 0.95)', 'rgba(20, 20, 25, 0.9)']
          : ['rgba(255, 255, 255, 0.95)', 'rgba(250, 250, 255, 0.9)']
        }
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <MaterialCommunityIcons 
              name="brain" 
              size={24} 
              color="#3B82F6" 
            />
          </Animated.View>
          <Text style={[
            styles.headerTitle,
            { color: isDarkMode ? '#F8FAFC' : '#1F2937' }
          ]}>
            Thinking Process
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[
            styles.progressTrack,
            { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
          ]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }
              ]}
            />
          </View>
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepIconContainer}>
                <MaterialCommunityIcons 
                  name={getStepIcon(step)} 
                  size={16} 
                  color={getStepColor(step)} 
                />
              </View>
              <View style={styles.stepContent}>
                <Text style={[
                  styles.stepTitle,
                  { 
                    color: step.status === 'active' 
                      ? '#3B82F6' 
                      : isDarkMode ? '#F8FAFC' : '#1F2937',
                    opacity: step.status === 'pending' ? 0.5 : 1
                  }
                ]}>
                  {step.title}
                </Text>
                {step.message && (
                  <Text style={[
                    styles.stepMessage,
                    { color: isDarkMode ? 'rgba(248, 250, 252, 0.7)' : 'rgba(31, 41, 55, 0.7)' }
                  ]}>
                    {step.message}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Streaming Message */}
        {streamingMessage && (
          <View style={styles.streamingContainer}>
            <View style={[
              styles.streamingBubble,
              { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }
            ]}>
              <StreamingMarkdown 
                content={streamingMessage}
                speed={30}
                style={[
                  styles.streamingText,
                  { color: isDarkMode ? '#E5E7EB' : '#374151' }
                ]}
              />
            </View>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth * 0.9,
    maxHeight: 400,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  stepsContainer: {
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepIconContainer: {
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  stepMessage: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  streamingContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
  },
  streamingBubble: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  streamingText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
});