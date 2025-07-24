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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { StreamingMarkdown } from './StreamingMarkdown';
import { SkeletonLoader } from './SkeletonLoader';
import { SandboxNode } from '../types/sandbox';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface NodeExplorationScreenProps {
  visible: boolean;
  node: SandboxNode | null;
  onClose: () => void;
  onNavigateToNode?: (nodeId: string) => void;
  connectedNodes?: SandboxNode[];
  showSkeleton?: boolean;
}

export const NodeExplorationScreen: React.FC<NodeExplorationScreenProps> = ({
  visible,
  node,
  onClose,
  onNavigateToNode,
  connectedNodes = [],
  showSkeleton = false,
}) => {
  const { isDarkMode } = useTheme();
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const cursorAnim = useRef(new Animated.Value(1)).current;
  
  // Streaming state
  const [isStreaming, setIsStreaming] = useState(true);
  const [streamedContent, setStreamedContent] = useState('');
  
  useEffect(() => {
    if (visible && node) {
      // Slide up animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      if (showSkeleton) {
        setIsStreaming(true);
      } else {
        // Start streaming content simulation
        simulateContentStreaming();
      }
    } else {
      // Slide down animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, node, showSkeleton]);

  // Cursor blinking animation
  useEffect(() => {
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(cursorAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    
    if (isStreaming) {
      blinkAnimation.start();
    } else {
      blinkAnimation.stop();
      cursorAnim.setValue(0); // Hide cursor when done
    }
    
    return () => blinkAnimation.stop();
  }, [isStreaming]);

  const simulateContentStreaming = () => {
    if (!node?.content) return;
    
    setIsStreaming(true);
    setStreamedContent('');
    
    // Stream content character by character for realistic effect
    const fullContent = node.content;
    let currentIndex = 0;
    
    const streamInterval = setInterval(() => {
      if (currentIndex < fullContent.length) {
        setStreamedContent(fullContent.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsStreaming(false);
        clearInterval(streamInterval);
      }
    }, 25); // Fast streaming for good UX
  };

  const renderSkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      <SkeletonLoader
        width="80%"
        height={24}
        style={styles.skeletonTitle}
        animate={true}
      />
      <SkeletonLoader
        width="60%"
        height={16}
        style={styles.skeletonSubtitle}
        animate={true}
      />
      
      <View style={styles.skeletonContentArea}>
        <SkeletonLoader width="100%" height={16} style={styles.skeletonLine} animate={true} />
        <SkeletonLoader width="95%" height={16} style={styles.skeletonLine} animate={true} />
        <SkeletonLoader width="88%" height={16} style={styles.skeletonLine} animate={true} />
        <SkeletonLoader width="92%" height={16} style={styles.skeletonLine} animate={true} />
        <SkeletonLoader width="70%" height={16} style={styles.skeletonLine} animate={true} />
      </View>
      
      {/* Streaming cursor */}
      <Animated.View
        style={[
          styles.streamingCursor,
          {
            opacity: cursorAnim,
          }
        ]}
      >
        <Text style={[
          styles.cursorText,
          { color: isDarkMode ? '#ffffff' : '#000000' }
        ]}>
          |
        </Text>
      </Animated.View>
    </View>
  );

  const renderStreamedContent = () => (
    <ScrollView 
      style={styles.contentScrollView}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Node Header */}
      <View style={styles.nodeHeader}>
        <View style={[
          styles.categoryBadge,
          { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }
        ]}>
          <Text style={[styles.categoryText, { color: '#3B82F6' }]}>
            {node?.category || 'insight'}
          </Text>
        </View>
        
        <Text style={[
          styles.nodeTitle,
          { color: isDarkMode ? '#ffffff' : '#1a1a1a' }
        ]}>
          {node?.title}
        </Text>
        
        {node?.confidence && (
          <View style={styles.confidenceContainer}>
            <MaterialCommunityIcons 
              name="chart-line" 
              size={14} 
              color="#10B981" 
            />
            <Text style={[
              styles.confidenceText,
              { color: isDarkMode ? '#6EE7B7' : '#059669' }
            ]}>
              {Math.round(node.confidence * 100)}% confidence
            </Text>
          </View>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <StreamingMarkdown 
          content={streamedContent}
          animationSpeed={0}
          style={[
            styles.contentText,
            { color: isDarkMode ? '#e5e5e5' : '#2a2a2a' }
          ]}
        />
        
        {/* Show streaming cursor at end of content */}
        {isStreaming && (
          <Animated.Text
            style={[
              styles.inlineStreamingCursor,
              {
                color: isDarkMode ? '#ffffff' : '#000000',
                opacity: cursorAnim,
              }
            ]}
          >
            |
          </Animated.Text>
        )}
      </View>

      {/* Personal Hook */}
      {node?.personalHook && !isStreaming && (
        <View style={[
          styles.personalHookSection,
          { 
            backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            borderLeftColor: '#3B82F6',
          }
        ]}>
          <MaterialCommunityIcons 
            name="account-heart" 
            size={18} 
            color="#3B82F6" 
          />
          <Text style={[
            styles.personalHookText,
            { color: isDarkMode ? '#93C5FD' : '#2563EB' }
          ]}>
            {node.personalHook}
          </Text>
        </View>
      )}

      {/* Connected Nodes */}
      {connectedNodes.length > 0 && !isStreaming && (
        <View style={styles.connectedNodesSection}>
          <Text style={[
            styles.connectedNodesTitle,
            { color: isDarkMode ? '#ffffff' : '#1a1a1a' }
          ]}>
            Related Insights
          </Text>
          
          <View style={styles.connectedNodesGrid}>
            {connectedNodes.map((connectedNode) => (
              <TouchableOpacity
                key={connectedNode.id}
                style={[
                  styles.connectedNodeCard,
                  { 
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  }
                ]}
                onPress={() => onNavigateToNode?.(connectedNode.id)}
              >
                <Text style={[
                  styles.connectedNodeTitle,
                  { color: isDarkMode ? '#ffffff' : '#1a1a1a' }
                ]}>
                  {connectedNode.title}
                </Text>
                <MaterialCommunityIcons 
                  name="arrow-right" 
                  size={16} 
                  color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );

  if (!visible || !node) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#0F0F0F' : '#FFFFFF',
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[
              styles.closeButton,
              { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
            ]}
            onPress={onClose}
          >
            <MaterialCommunityIcons 
              name="close" 
              size={20} 
              color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Animated.View 
          style={[
            styles.content,
            { opacity: contentOpacity }
          ]}
        >
          {isStreaming ? renderSkeletonLoader() : renderStreamedContent()}
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
    zIndex: 10000,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  
  // Skeleton Loader Styles
  skeletonContainer: {
    flex: 1,
    paddingTop: 40,
  },
  skeletonTitle: {
    marginBottom: 12,
  },
  skeletonSubtitle: {
    marginBottom: 32,
  },
  skeletonContentArea: {
    marginBottom: 20,
  },
  skeletonLine: {
    marginBottom: 12,
  },
  streamingCursor: {
    marginTop: 8,
  },
  cursorText: {
    fontSize: 20,
    fontWeight: '300',
  },
  
  // Content Styles
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  nodeHeader: {
    marginBottom: 32,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  nodeTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: 8,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mainContent: {
    marginBottom: 32,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  contentText: {
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0.2,
    flex: 1,
  },
  inlineStreamingCursor: {
    fontSize: 17,
    fontWeight: '300',
    marginLeft: 2,
  },
  personalHookSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    borderLeftWidth: 3,
  },
  personalHookText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  connectedNodesSection: {
    marginTop: 20,
  },
  connectedNodesTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  connectedNodesGrid: {
    gap: 12,
  },
  connectedNodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  connectedNodeTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});