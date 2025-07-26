import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { StreamingMarkdown } from '../components/text/StreamingMarkdown';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { NodeBall, SandboxNode } from '../types/sandbox';
import { BlurView } from 'expo-blur';
import { PortalParticles } from '../components/animations/PortalParticles';
import { NuminaColors } from '../utils/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface NodePortalScreenProps {
  node: SandboxNode | null;
  visible: boolean;
  onClose: () => void;
  onDiveDeeper: (context: string, type: 'metric' | 'search' | 'prediction' | 'context') => void;
  showSkeleton?: boolean;
}

export const NodePortalScreen: React.FC<NodePortalScreenProps> = ({
  node,
  visible,
  onClose,
  onDiveDeeper,
  showSkeleton = false,
}) => {
  const { isDarkMode } = useTheme();
  
  // Animation states
  const portalAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  
  // Portal transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentNode, setCurrentNode] = useState<SandboxNode | null>(null);
  
  // Streaming content state
  const [streamedContent, setStreamedContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (visible && node) {
      // Start portal entry animation
      enterPortal(node);
    } else if (!visible) {
      // Exit portal animation
      exitPortal();
    }
  }, [visible, node]);

  const enterPortal = (newNode: SandboxNode) => {
    setIsTransitioning(true);
    setCurrentNode(newNode);
    
    // Portal entry sequence
    Animated.sequence([
      // Particle effect entrance
      Animated.timing(particleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Portal opens
      Animated.timing(portalAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Content fades in
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsTransitioning(false);
      startContentStreaming();
    });
  };

  const exitPortal = () => {
    Animated.sequence([
      // Content fades out
      Animated.timing(contentAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Portal closes
      Animated.timing(portalAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      // Particles dissipate
      Animated.timing(particleAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentNode(null);
      setStreamedContent('');
    });
  };

  const diveToNewNode = (context: string, type: 'metric' | 'search' | 'prediction' | 'context') => {
    console.log('🌊 NodePortal: Dive deeper triggered:', { context: context.substring(0, 50), type });
    
    // Trigger dive animation
    setIsTransitioning(true);
    
    Animated.sequence([
      // Current content swirls away
      Animated.parallel([
        Animated.timing(contentAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim, {
          toValue: 0.5,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Portal spiral effect
      Animated.timing(particleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Complete animation and navigate
      console.log('🌊 NodePortal: Animation complete, calling onDiveDeeper');
      setIsTransitioning(false);
      onDiveDeeper(context, type);
    });
  };

  const startContentStreaming = () => {
    if (!currentNode) return;
    
    setIsStreaming(true);
    setStreamedContent('');
    
    // Simulate streaming content
    const content = currentNode.content || '';
    let index = 0;
    
    const streamInterval = setInterval(() => {
      if (index < content.length) {
        setStreamedContent(content.substring(0, index + 1));
        index++;
      } else {
        setIsStreaming(false);
        clearInterval(streamInterval);
      }
    }, 20);
  };

  const renderInteractiveElements = () => {
    if (!currentNode || isTransitioning) return null;

    const microButtons = [
      { text: 'Dive into metrics', type: 'metric' as const, icon: 'analytics' },
      { text: 'Search deeper', type: 'search' as const, icon: 'search' },
      { text: 'View predictions', type: 'prediction' as const, icon: 'trending-up' },
      { text: 'Explore context', type: 'context' as const, icon: 'layers' },
    ];

    return (
      <View style={styles.interactiveContainer}>
        <Text style={[styles.interactiveTitle, { color: isDarkMode ? NuminaColors.darkMode[100] : NuminaColors.darkMode[700] }]}>
          Dive Deeper
        </Text>
        <View style={styles.microButtonsGrid}>
          {microButtons.map((button, index) => (
            <TouchableOpacity
              key={button.type}
              style={[
                styles.microButton,
                { 
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                }
              ]}
              onPress={() => diveToNewNode(currentNode.title, button.type)}
            >
              <Ionicons 
                name={button.icon as any} 
                size={16} 
                color={isDarkMode ? NuminaColors.chatPurple[400] : NuminaColors.chatPurple[600]} 
              />
              <Text style={[
                styles.microButtonText,
                { color: isDarkMode ? NuminaColors.darkMode[100] : NuminaColors.darkMode[700] }
              ]}>
                {button.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (showSkeleton || isTransitioning) {
      return (
        <View style={styles.skeletonContainer}>
          <SkeletonLoader width="80%" height={20} style={styles.skeletonTitle} />
          <SkeletonLoader width="100%" height={120} style={styles.skeletonContent} />
          <SkeletonLoader width="60%" height={16} style={styles.skeletonMeta} />
        </View>
      );
    }

    if (!currentNode) return null;

    return (
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: contentAnim,
            transform: [{
              translateY: contentAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            }]
          }
        ]}
      >
        {/* Node Title */}
        <Text style={[styles.nodeTitle, { color: isDarkMode ? NuminaColors.darkMode[100] : NuminaColors.darkMode[700] }]}>
          {currentNode.title}
        </Text>

        {/* Node Content */}
        <ScrollView 
          style={styles.contentScroll}
          showsVerticalScrollIndicator={false}
        >
          <StreamingMarkdown
            content={streamedContent || currentNode.content}
            isComplete={!isStreaming}
          />

          {/* Personal Hook */}
          {currentNode.personalHook && (
            <View style={[
              styles.personalHookContainer,
              { backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(99, 102, 241, 0.1)' }
            ]}>
              <Ionicons 
                name="person-circle" 
                size={16} 
                color={isDarkMode ? NuminaColors.chatPurple[400] : NuminaColors.chatPurple[600]} 
              />
              <Text style={[
                styles.personalHookText,
                { color: isDarkMode ? NuminaColors.chatPurple[400] : NuminaColors.chatPurple[600] }
              ]}>
                {currentNode.personalHook}
              </Text>
            </View>
          )}

          {/* Interactive Elements */}
          {renderInteractiveElements()}
        </ScrollView>
      </Animated.View>
    );
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDarkMode ? NuminaColors.darkMode[900] : NuminaColors.darkMode[50] }
    ]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Particle Background */}
      <Animated.View 
        style={[
          styles.particleContainer,
          {
            opacity: particleAnim,
            transform: [{
              scale: particleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              })
            }]
          }
        ]}
      >
        <PortalParticles
          isActive={visible}
          transitionType={isTransitioning ? 'dive' : (currentNode ? 'enter' : 'exit')}
          particleColor={isDarkMode ? NuminaColors.chatPurple[400] : NuminaColors.chatPurple[600]}
          particleCount={80}
        />
      </Animated.View>

      {/* Portal Effect */}
      <Animated.View 
        style={[
          styles.portalContainer,
          {
            opacity: portalAnim,
            transform: [{
              scale: portalAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              })
            }]
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.closeButton,
              { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
            ]}
            onPress={onClose}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDarkMode ? NuminaColors.darkMode[100] : NuminaColors.darkMode[700]} 
            />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[
              styles.screenTitle,
              { color: isDarkMode ? NuminaColors.darkMode[100] : NuminaColors.darkMode[700] }
            ]}>
              Node Portal
            </Text>
            <View style={[
              styles.portalIndicator,
              { backgroundColor: isDarkMode ? NuminaColors.chatPurple[400] : NuminaColors.chatPurple[600] }
            ]} />
          </View>
          
          <View style={styles.headerRight} />
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {renderContent()}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  portalContainer: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    height: 80,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  portalIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.8,
  },
  headerRight: {
    width: 44,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    flex: 1,
  },
  nodeTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    lineHeight: 36,
  },
  contentScroll: {
    flex: 1,
  },
  nodeContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  personalHookContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  personalHookText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  interactiveContainer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  interactiveTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  microButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  microButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: '45%',
  },
  microButtonText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  skeletonContainer: {
    flex: 1,
    paddingTop: 20,
  },
  skeletonTitle: {
    marginBottom: 20,
  },
  skeletonContent: {
    marginBottom: 16,
  },
  skeletonMeta: {
    marginBottom: 12,
  },
});