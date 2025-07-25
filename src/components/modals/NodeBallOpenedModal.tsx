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
import { useTheme } from '../../contexts/ThemeContext';
import { StreamingMarkdown } from '../text/StreamingMarkdown';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { NodeBall, SandboxNode } from '../../types/sandbox';
import { BlurView } from 'expo-blur';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface NodeBallOpenedModalProps {
  visible: boolean;
  nodeBall: NodeBall | null;
  onClose: () => void;
  onNavigateToNodeBall?: (nodeBallId: string) => void;
  connectedNodeBalls?: NodeBall[];
  showSkeleton?: boolean;
}

export const NodeBallOpenedModal: React.FC<NodeBallOpenedModalProps> = ({
  visible,
  nodeBall,
  onClose,
  onNavigateToNodeBall,
  connectedNodeBalls = [],
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
    if (visible && nodeBall) {
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
  }, [visible, nodeBall, showSkeleton]);

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
    if (!nodeBall?.content) return;
    
    setIsStreaming(true);
    setStreamedContent('');
    
    // Stream content character by character for realistic effect
    const fullContent = nodeBall.content;
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
            {nodeBall?.category || 'insight'}
          </Text>
        </View>
        
        <Text style={[
          styles.nodeTitle,
          { color: isDarkMode ? '#ffffff' : '#1a1a1a' }
        ]}>
          {nodeBall?.title}
        </Text>
        
        {nodeBall?.confidence && (
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
              {Math.round(nodeBall.confidence * 100)}% confidence
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
      {nodeBall?.personalHook && !isStreaming && (
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
            {nodeBall.personalHook}
          </Text>
        </View>
      )}

      {/* Curated Research Discovery */}
      {nodeBall?.deepInsights?.dataConnections && nodeBall.deepInsights.dataConnections.length > 0 && !isStreaming && (
        <BlurView 
          intensity={20} 
          tint={isDarkMode ? 'dark' : 'light'}
          style={[
            styles.curatedSection,
            {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={[
              styles.sectionIcon,
              { backgroundColor: isDarkMode ? 'rgba(147, 197, 253, 0.15)' : 'rgba(59, 130, 246, 0.1)' }
            ]}>
              <MaterialCommunityIcons name="library" size={16} color="#93C5FD" />
            </View>
            <Text style={[
              styles.curatedSectionTitle,
              { color: isDarkMode ? '#ffffff' : '#1a1a1a' }
            ]}>
              Curated Research
            </Text>
            <Text style={[
              styles.curatedCount,
              { color: isDarkMode ? '#93C5FD' : '#3B82F6' }
            ]}>
              {nodeBall.deepInsights.dataConnections.filter(conn => conn.type === 'search_result').length} sources
            </Text>
          </View>
          
          {nodeBall.deepInsights.dataConnections
            .filter(conn => conn.type === 'search_result')
            .slice(0, 5)
            .map((connection, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.curatedItem,
                { 
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.7)',
                  borderColor: isDarkMode ? 'rgba(147, 197, 253, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                  shadowColor: isDarkMode ? 'rgba(147, 197, 253, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                }
              ]}
              activeOpacity={0.8}
            >
              <View style={styles.curatedItemHeader}>
                <View style={[
                  styles.relevanceIndicator,
                  { 
                    backgroundColor: isDarkMode ? 'rgba(147, 197, 253, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                    width: `${Math.round(connection.relevanceScore * 100)}%`
                  }
                ]} />
                <Text style={[
                  styles.relevanceScore,
                  { color: isDarkMode ? '#93C5FD' : '#3B82F6' }
                ]}>
                  {Math.round(connection.relevanceScore * 100)}%
                </Text>
              </View>
              <Text style={[
                styles.curatedItemTitle,
                { color: isDarkMode ? '#ffffff' : '#1a1a1a' }
              ]}>
                {connection.value.title}
              </Text>
              <Text style={[
                styles.curatedItemSnippet,
                { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }
              ]}>
                {connection.value.snippet}
              </Text>
              <View style={styles.curatedItemFooter}>
                <Text style={[
                  styles.curatedSource,
                  { color: isDarkMode ? 'rgba(147, 197, 253, 0.8)' : 'rgba(59, 130, 246, 0.8)' }
                ]}>
                  {connection.source}
                </Text>
                <MaterialCommunityIcons 
                  name="arrow-top-right" 
                  size={14} 
                  color={isDarkMode ? 'rgba(147, 197, 253, 0.6)' : 'rgba(59, 130, 246, 0.6)'} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </BlurView>
      )}

      {/* Enhanced Content: Media Assets */}
      {nodeBall?.mediaAssets && nodeBall.mediaAssets.length > 0 && !isStreaming && (
        <View style={styles.enhancedContentSection}>
          <Text style={[
            styles.sectionTitle,
            { color: isDarkMode ? '#ffffff' : '#1a1a1a' }
          ]}>
            Resource Collection
          </Text>
          
          {nodeBall.mediaAssets.slice(0, 8).map((asset, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.mediaAssetCard,
                { 
                  backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                  borderLeftColor: '#10B981',
                }
              ]}
            >
              <MaterialCommunityIcons 
                name={asset.type === 'link' ? 'link' : 'file'} 
                size={16} 
                color="#10B981" 
              />
              <View style={styles.mediaAssetContent}>
                <Text style={[
                  styles.mediaAssetTitle,
                  { color: isDarkMode ? '#6EE7B7' : '#047857' }
                ]}>
                  {asset.title}
                </Text>
                {asset.description && (
                  <Text style={[
                    styles.mediaAssetDescription,
                    { color: isDarkMode ? '#e5e5e5' : '#4a4a4a' }
                  ]}>
                    {asset.description.substring(0, 100)}...
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Enhanced Content: Tool Executions */}
      {nodeBall?.deepInsights?.dataConnections && !isStreaming && (
        <View style={styles.enhancedContentSection}>
          <Text style={[
            styles.sectionTitle,
            { color: isDarkMode ? '#ffffff' : '#1a1a1a' }
          ]}>
            Processing Insights
          </Text>
          
          {nodeBall.deepInsights.dataConnections
            .filter(conn => conn.type === 'tool_execution')
            .slice(0, 3)
            .map((connection, index) => (
            <View
              key={index}
              style={[
                styles.toolExecutionCard,
                { 
                  backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.05)',
                  borderLeftColor: '#A855F7',
                }
              ]}
            >
              <Text style={[
                styles.toolExecutionTitle,
                { color: isDarkMode ? '#C4B5FD' : '#7C3AED' }
              ]}>
                {connection.value.toolName.replace('_', ' ').toUpperCase()}
              </Text>
              <Text style={[
                styles.toolExecutionQuery,
                { color: isDarkMode ? '#e5e5e5' : '#4a4a4a' }
              ]}>
                Query: {connection.value.query}
              </Text>
              <Text style={[
                styles.toolExecutionStatus,
                { color: connection.value.success ? '#10B981' : '#EF4444' }
              ]}>
                {connection.value.success ? '✅ Success' : '❌ Failed'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Lock This Insight - Compelling CTA */}
      {!nodeBall?.isLocked && (
        <TouchableOpacity 
          style={[
            styles.lockInsightButton,
            {
              backgroundColor: isDarkMode ? 'rgba(147, 197, 253, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              borderColor: isDarkMode ? 'rgba(147, 197, 253, 0.3)' : 'rgba(59, 130, 246, 0.3)',
              shadowColor: isDarkMode ? 'rgba(147, 197, 253, 0.4)' : 'rgba(59, 130, 246, 0.4)',
            }
          ]}
          activeOpacity={0.8}
        >
          <BlurView intensity={25} tint={isDarkMode ? 'dark' : 'light'} style={styles.lockButtonBlur}>
            <View style={styles.lockButtonContent}>
              <MaterialCommunityIcons name="lock-plus" size={18} color={isDarkMode ? '#93C5FD' : '#3B82F6'} />
              <Text style={[
                styles.lockButtonText,
                { color: isDarkMode ? '#93C5FD' : '#3B82F6' }
              ]}>
                Lock This Context
              </Text>
              <Text style={[
                styles.lockButtonSubtext,
                { color: isDarkMode ? 'rgba(147, 197, 253, 0.7)' : 'rgba(59, 130, 246, 0.7)' }
              ]}>
                Build on this insight for your next exploration
              </Text>
            </View>
          </BlurView>
        </TouchableOpacity>
      )}

      {/* Locked Indicator */}
      {nodeBall?.isLocked && (
        <View style={[
          styles.lockedIndicator,
          {
            backgroundColor: isDarkMode ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 215, 0, 0.1)',
            borderColor: isDarkMode ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 215, 0, 0.3)',
          }
        ]}>
          <MaterialCommunityIcons name="lock" size={16} color="#FFD700" />
          <Text style={[
            styles.lockedText,
            { color: isDarkMode ? '#FFD700' : '#B45309' }
          ]}>
            Context Locked & Active
          </Text>
        </View>
      )}

      {/* Connected NodeBalls */}
      {connectedNodeBalls.length > 0 && !isStreaming && (
        <View style={styles.connectedNodesSection}>
          <Text style={[
            styles.connectedNodesTitle,
            { color: isDarkMode ? '#ffffff' : '#1a1a1a' }
          ]}>
            Related Insights
          </Text>
          
          <View style={styles.connectedNodesGrid}>
            {connectedNodeBalls.map((connectedNodeBall) => (
              <TouchableOpacity
                key={connectedNodeBall.id}
                style={[
                  styles.connectedNodeCard,
                  { 
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  }
                ]}
                onPress={() => onNavigateToNodeBall?.(connectedNodeBall.id)}
              >
                <Text style={[
                  styles.connectedNodeTitle,
                  { color: isDarkMode ? '#ffffff' : '#1a1a1a' }
                ]}>
                  {connectedNodeBall.title}
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

  if (!visible || !nodeBall) return null;

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
  
  // Enhanced Content Styles  
  enhancedContentSection: {
    marginBottom: 24,  
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  searchResultCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  searchResultSnippet: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  searchResultSource: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mediaAssetCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  mediaAssetContent: {
    flex: 1,
    marginLeft: 12,
  },
  mediaAssetTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  mediaAssetDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  toolExecutionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  toolExecutionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  toolExecutionQuery: {
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 18,
  },
  toolExecutionStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Glassmorphic Curated Styles
  curatedSection: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  curatedSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.2,
  },
  
  curatedCount: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  
  curatedItem: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  
  curatedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    height: 4,
  },
  
  relevanceIndicator: {
    height: 3,
    borderRadius: 2,
    flex: 1,
    marginRight: 8,
  },
  
  relevanceScore: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  
  curatedItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 6,
  },
  
  curatedItemSnippet: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  
  curatedItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  curatedSource: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Lock CTA Styles
  lockInsightButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  
  lockButtonBlur: {
    flex: 1,
  },
  
  lockButtonContent: {
    padding: 18,
    alignItems: 'center',
  },
  
  lockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  
  lockButtonSubtext: {
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  
  lockedIndicator: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  lockedText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
});