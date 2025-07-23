import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  TouchableWithoutFeedback,
  Image,
  Linking,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { StreamingMarkdown } from './StreamingMarkdown';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface NodeData {
  id: string;
  title: string;
  content: string;
  category: string;
  confidence: number;
  personalHook?: string;
  deepInsights?: {
    summary: string;
    keyPatterns: string[];
    personalizedContext: string;
    dataConnections: Array<{
      type: string;
      value: any;
      source: string;
      relevanceScore?: number;
      metadata?: any;
    }>;
    relevanceScore: number;
  };
  mediaAssets?: Array<{
    type: 'image' | 'link' | 'video' | 'document';
    url: string;
    title?: string;
    description?: string;
    thumbnail?: string;
  }>;
}

interface DataTableRow {
  id: string;
  label: string;
  value: string;
  source: string;
  relevance: number;
  type: string;
  metadata?: any;
}

interface EnhancedNodeModalProps {
  visible: boolean;
  nodeData: NodeData | null;
  onClose: () => void;
  onNextNode?: () => void;
  onPreviousNode?: () => void;
  hasNextNode?: boolean;
  hasPreviousNode?: boolean;
  streamingContent?: boolean;
}

export const EnhancedNodeModal: React.FC<EnhancedNodeModalProps> = ({
  visible,
  nodeData,
  onClose,
  onNextNode,
  onPreviousNode,
  hasNextNode = false,
  hasPreviousNode = false,
  streamingContent = false,
}) => {
  const { isDarkMode } = useTheme();
  
  // Animation values
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'media'>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  useEffect(() => {
    if (visible && nodeData) {
      handleOpen();
    } else {
      handleClose();
    }
  }, [visible, nodeData]);

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(modalScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 30,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleNavigation = (direction: 'next' | 'previous') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (direction === 'next' && onNextNode) {
      onNextNode();
    } else if (direction === 'previous' && onPreviousNode) {
      onPreviousNode();
    }
  };

  const transformDataForTable = (): DataTableRow[] => {
    if (!nodeData?.deepInsights?.dataConnections) return [];
    
    return nodeData.deepInsights.dataConnections.map((connection, index) => ({
      id: `data_${index}`,
      label: connection.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: typeof connection.value === 'object' 
        ? JSON.stringify(connection.value).slice(0, 50) + '...'
        : String(connection.value || 'N/A'),
      source: connection.source,
      relevance: connection.relevanceScore || 0.5,
      type: connection.type,
      metadata: connection.metadata
    }));
  };

  const renderTabContent = () => {
    if (!nodeData) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <ScrollView 
            style={styles.tabContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Main Content */}
            <View style={styles.contentSection}>
              {streamingContent ? (
                <StreamingMarkdown 
                  content={nodeData.content}
                  speed={25}
                  style={[
                    styles.contentText,
                    { color: isDarkMode ? '#E5E7EB' : '#374151' }
                  ]}
                />
              ) : (
                <Text style={[
                  styles.contentText,
                  { color: isDarkMode ? '#E5E7EB' : '#374151' }
                ]}>
                  {nodeData.content}
                </Text>
              )}
            </View>

            {/* Personal Hook */}
            {nodeData.personalHook && (
              <View style={[
                styles.personalHookSection,
                { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }
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
                  {nodeData.personalHook}
                </Text>
              </View>
            )}

            {/* Deep Insights */}
            {nodeData.deepInsights && (
              <View style={styles.insightsContainer}>
                {/* Summary */}
                <TouchableOpacity 
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('summary')}
                >
                  <Text style={[
                    styles.sectionTitle,
                    { color: isDarkMode ? '#F8FAFC' : '#1F2937' }
                  ]}>
                    Summary
                  </Text>
                  <MaterialCommunityIcons 
                    name={expandedSections.has('summary') ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                  />
                </TouchableOpacity>
                
                {expandedSections.has('summary') && (
                  <View style={styles.sectionContent}>
                    <Text style={[
                      styles.sectionText,
                      { color: isDarkMode ? '#D1D5DB' : '#4B5563' }
                    ]}>
                      {nodeData.deepInsights.summary}
                    </Text>
                  </View>
                )}

                {/* Key Patterns */}
                <TouchableOpacity 
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('patterns')}
                >
                  <Text style={[
                    styles.sectionTitle,
                    { color: isDarkMode ? '#F8FAFC' : '#1F2937' }
                  ]}>
                    Key Patterns
                  </Text>
                  <MaterialCommunityIcons 
                    name={expandedSections.has('patterns') ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                  />
                </TouchableOpacity>
                
                {expandedSections.has('patterns') && (
                  <View style={styles.sectionContent}>
                    {nodeData.deepInsights.keyPatterns.map((pattern, index) => (
                      <View key={index} style={styles.patternRow}>
                        <MaterialCommunityIcons 
                          name="circle-small" 
                          size={16} 
                          color="#10B981" 
                        />
                        <Text style={[
                          styles.patternText,
                          { color: isDarkMode ? '#D1D5DB' : '#4B5563' }
                        ]}>
                          {pattern}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        );

      case 'data':
        const tableData = transformDataForTable();
        return (
          <View style={styles.tabContent}>
            <View style={styles.tableHeader}>
              <Text style={[
                styles.tableHeaderText,
                { color: isDarkMode ? '#F8FAFC' : '#1F2937' }
              ]}>
                Data Connections ({tableData.length})
              </Text>
            </View>
            
            <FlatList
              data={tableData}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <View style={[
                  styles.tableRow,
                  { 
                    backgroundColor: index % 2 === 0 
                      ? (isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)')
                      : 'transparent'
                  }
                ]}>
                  <View style={styles.tableCell}>
                    <Text style={[
                      styles.tableCellLabel,
                      { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                    ]}>
                      Type
                    </Text>
                    <Text style={[
                      styles.tableCellValue,
                      { color: isDarkMode ? '#F8FAFC' : '#1F2937' }
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                  
                  <View style={styles.tableCell}>
                    <Text style={[
                      styles.tableCellLabel,
                      { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                    ]}>
                      Value
                    </Text>
                    <Text style={[
                      styles.tableCellValue,
                      { color: isDarkMode ? '#E5E7EB' : '#374151' }
                    ]} numberOfLines={2}>
                      {item.value}
                    </Text>
                  </View>
                  
                  <View style={styles.tableCell}>
                    <Text style={[
                      styles.tableCellLabel,
                      { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                    ]}>
                      Source
                    </Text>
                    <Text style={[
                      styles.tableCellValue,
                      { color: isDarkMode ? '#93C5FD' : '#2563EB' }
                    ]}>
                      {item.source}
                    </Text>
                  </View>
                  
                  <View style={styles.tableCell}>
                    <Text style={[
                      styles.tableCellLabel,
                      { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                    ]}>
                      Relevance
                    </Text>
                    <View style={styles.relevanceContainer}>
                      <View style={[
                        styles.relevanceBar,
                        { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
                      ]}>
                        <View style={[
                          styles.relevanceFill,
                          { 
                            width: `${item.relevance * 100}%`,
                            backgroundColor: item.relevance > 0.7 ? '#10B981' : item.relevance > 0.4 ? '#F59E0B' : '#EF4444'
                          }
                        ]} />
                      </View>
                      <Text style={[
                        styles.relevanceText,
                        { color: isDarkMode ? '#D1D5DB' : '#4B5563' }
                      ]}>
                        {Math.round(item.relevance * 100)}%
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            />
          </View>
        );

      case 'media':
        return (
          <View style={styles.tabContent}>
            {nodeData.mediaAssets && nodeData.mediaAssets.length > 0 ? (
              <FlatList
                data={nodeData.mediaAssets}
                keyExtractor={(item, index) => `media_${index}`}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.mediaItem,
                      { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }
                    ]}
                    onPress={() => item.url && Linking.openURL(item.url)}
                  >
                    <View style={styles.mediaIcon}>
                      <MaterialCommunityIcons 
                        name={
                          item.type === 'image' ? 'image' :
                          item.type === 'video' ? 'video' :
                          item.type === 'document' ? 'file-document' :
                          'link'
                        } 
                        size={24} 
                        color="#3B82F6" 
                      />
                    </View>
                    <View style={styles.mediaContent}>
                      <Text style={[
                        styles.mediaTitle,
                        { color: isDarkMode ? '#F8FAFC' : '#1F2937' }
                      ]}>
                        {item.title || 'Untitled'}
                      </Text>
                      {item.description && (
                        <Text style={[
                          styles.mediaDescription,
                          { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                        ]}>
                          {item.description}
                        </Text>
                      )}
                      <Text style={[
                        styles.mediaUrl,
                        { color: isDarkMode ? '#60A5FA' : '#2563EB' }
                      ]}>
                        {item.url}
                      </Text>
                    </View>
                    <MaterialCommunityIcons 
                      name="open-in-new" 
                      size={16} 
                      color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                    />
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons 
                  name="file-image-outline" 
                  size={48} 
                  color={isDarkMode ? '#4B5563' : '#9CA3AF'} 
                />
                <Text style={[
                  styles.emptyStateText,
                  { color: isDarkMode ? '#6B7280' : '#9CA3AF' }
                ]}>
                  No media assets available
                </Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  if (!visible || !nodeData) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: overlayOpacity }
        ]}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Modal */}
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.modal,
            {
              transform: [{ scale: modalScale }, { translateY: slideAnim }],
              opacity: modalOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={isDarkMode 
              ? ['rgba(30, 30, 35, 0.98)', 'rgba(20, 20, 25, 0.95)']
              : ['rgba(255, 255, 255, 0.98)', 'rgba(250, 250, 255, 0.95)']
            }
            style={styles.modalGradient}
          >
            <SafeAreaView style={styles.modalSafeArea}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={[
                    styles.categoryBadge,
                    { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }
                  ]}>
                    <Text style={[
                      styles.categoryText,
                      { color: '#3B82F6' }
                    ]}>
                      {nodeData.category}
                    </Text>
                  </View>
                  <View style={styles.titleContainer}>
                    <Text style={[
                      styles.title,
                      { color: isDarkMode ? '#F8FAFC' : '#1F2937' }
                    ]}>
                      {nodeData.title}
                    </Text>
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
                        {Math.round(nodeData.confidence * 100)}% confidence
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.headerRight}>
                  {/* Navigation */}
                  {(hasNextNode || hasPreviousNode) && (
                    <View style={styles.navigationContainer}>
                      <TouchableOpacity
                        style={[
                          styles.navButton,
                          { 
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            opacity: hasPreviousNode ? 1 : 0.3
                          }
                        ]}
                        onPress={() => handleNavigation('previous')}
                        disabled={!hasPreviousNode}
                      >
                        <MaterialCommunityIcons 
                          name="chevron-left" 
                          size={20} 
                          color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                        />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.navButton,
                          { 
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            opacity: hasNextNode ? 1 : 0.3
                          }
                        ]}
                        onPress={() => handleNavigation('next')}
                        disabled={!hasNextNode}
                      >
                        <MaterialCommunityIcons 
                          name="chevron-right" 
                          size={20} 
                          color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Close Button */}
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
              </View>

              {/* Tabs */}
              <View style={styles.tabContainer}>
                {['overview', 'data', 'media'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tab,
                      activeTab === tab && {
                        backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'
                      }
                    ]}
                    onPress={() => setActiveTab(tab as any)}
                  >
                    <Text style={[
                      styles.tabText,
                      { 
                        color: activeTab === tab 
                          ? '#3B82F6' 
                          : isDarkMode ? '#9CA3AF' : '#6B7280'
                      }
                    ]}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Content */}
              {renderTabContent()}
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  modal: {
    width: screenWidth * 0.95,
    height: screenHeight * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalGradient: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
    gap: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
  },
  titleContainer: {
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentSection: {
    marginBottom: 20,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  personalHookSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  personalHookText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_500Medium',
  },
  insightsContainer: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  sectionContent: {
    paddingBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 8,
  },
  patternText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  tableHeader: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
    marginBottom: 12,
  },
  tableHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  tableRow: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  tableCell: {
    gap: 4,
  },
  tableCellLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCellValue: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  relevanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  relevanceBar: {
    height: 4,
    borderRadius: 2,
    flex: 1,
    overflow: 'hidden',
  },
  relevanceFill: {
    height: '100%',
    borderRadius: 2,
  },
  relevanceText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    minWidth: 32,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  mediaIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContent: {
    flex: 1,
    gap: 4,
  },
  mediaTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  mediaDescription: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  mediaUrl: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});