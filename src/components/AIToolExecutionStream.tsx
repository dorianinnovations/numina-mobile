import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';

const { width } = Dimensions.get('window');

interface ToolExecution {
  id: string;
  toolName: string;
  status: 'starting' | 'executing' | 'completed' | 'error';
  startTime: number;
  endTime?: number;
  details: {
    action?: string;
    query?: string;
    searchType?: string;
    location?: string;
    parameters?: any;
    results?: any;
    error?: string;
  };
  progress?: number; // 0-100
}

interface UBPMInsight {
  id: string;
  type: 'ubpm_insight';
  significance: number; // 0-1
  summary: string;
  patterns: Array<{
    type: string;
    pattern: string;
    description: string;
    confidence: number;
  }>;
  timestamp: Date;
  status: 'new' | 'acknowledged';
}

interface AIToolExecutionStreamProps {
  executions: ToolExecution[];
  ubpmInsights?: UBPMInsight[];
  isVisible: boolean;
  onToggleVisibility: () => void;
  currentMessage?: string;
  onAcknowledgeUBPM?: (insightId: string) => void;
}

export const AIToolExecutionStream: React.FC<AIToolExecutionStreamProps> = ({
  executions,
  ubpmInsights = [],
  isVisible,
  onToggleVisibility,
  currentMessage,
  onAcknowledgeUBPM,
}) => {
  const { isDarkMode } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const heightAnim = useRef(new Animated.Value(isVisible ? 200 : 0)).current;
  const chevronRotation = useRef(new Animated.Value(0)).current;
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: isVisible ? (isExpanded ? 300 : 100) : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isVisible, isExpanded]);

  useEffect(() => {
    // Auto-scroll to bottom when new executions are added
    if (executions.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [executions]);

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'web_search': return '⚡';
      case 'music_recommendations': return '🎵';
      case 'spotify_playlist': return '🎧';
      case 'reservation_booking': return '🍽️';
      case 'itinerary_generator': return '✈️';
      case 'credit_management': return '💳';
      default: return '🔧';
    }
  };

  const getUBPMIcon = (significance: number) => {
    if (significance > 0.9) return '🧠';
    if (significance > 0.7) return '💡';
    if (significance > 0.5) return '📊';
    return '🔍';
  };

  const getUBPMColor = (significance: number) => {
    if (significance > 0.9) return isDarkMode ? '#7d38ecff' : '#7c3aed'; // Purple for high significance
    if (significance > 0.7) return isDarkMode ? '#2563eb' : '#3b82f6'; // Blue for medium-high
    if (significance > 0.5) return isDarkMode ? '#059669' : '#10b981'; // Green for medium
    return isDarkMode ? '#6b7280' : '#9ca3af'; // Gray for low
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'starting': return isDarkMode ? NuminaColors.chatPurple[200] : NuminaColors.chatGreen[300];
      case 'executing': return isDarkMode ? NuminaColors.chatPurple[200] : NuminaColors.chatGreen[300];
      case 'completed': return isDarkMode ? NuminaColors.success[200] : NuminaColors.success[300];
      case 'error': return isDarkMode ? NuminaColors.error[200] : NuminaColors.error[300];
      default: return isDarkMode ? NuminaColors.chatPurple[200] : NuminaColors.chatGreen[300];
    }
  };

  const formatExecutionTime = (execution: ToolExecution) => {
    if (!execution.endTime) {
      return `${((Date.now() - execution.startTime) / 1000).toFixed(1)}s`;
    }
    return `${((execution.endTime - execution.startTime) / 1000).toFixed(1)}s`;
  };

  const getExecutionDetails = (execution: ToolExecution) => {
    const { details } = execution;
    switch (execution.toolName) {
      case 'web_search':
        return `Searching: "${details.query}" (${details.searchType || 'general'})`;
      case 'music_recommendations':
        return `Finding ${details.parameters?.mood || 'music'} recommendations`;
      case 'spotify_playlist':
        return `Creating playlist: "${details.parameters?.playlistName || 'New Playlist'}"`;
      case 'reservation_booking':
        return `Booking: ${details.parameters?.restaurantName || 'restaurant'}`;
      case 'itinerary_generator':
        return `Planning: ${details.parameters?.destination || 'trip'}`;
      default:
        return details.action || 'Processing...';
    }
  };

  const renderExecutionItem = (execution: ToolExecution) => {
    const isActive = execution.status === 'executing' || execution.status === 'starting';
    const statusColor = getStatusColor(execution.status);

    return (
      <View key={execution.id} style={[styles.executionItem, isDarkMode ? styles.executionItemDark : styles.executionItemLight]}>
        {/* Status Indicator */}
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
          {isActive && (
            <Animated.View style={styles.pulseIndicator} />
          )}
        </View>

        {/* Tool Icon & Name */}
        <View style={styles.toolInfo}>
          <Text style={styles.toolIcon}>{getToolIcon(execution.toolName)}</Text>
          <View style={styles.toolDetails}>
            <Text style={[styles.toolName, isDarkMode ? styles.textDark : styles.textLight]}>
              {execution.toolName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
            <Text style={[styles.executionDetails, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
              {getExecutionDetails(execution)}
            </Text>
          </View>
        </View>

        {/* Status & Timing */}
        <View style={styles.statusInfo}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {execution.status.toUpperCase()}
          </Text>
          <Text style={[styles.timingText, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
            {formatExecutionTime(execution)}
          </Text>
        </View>
      </View>
    );
  };

  const renderUBPMInsight = (insight: UBPMInsight) => {
    const ubpmColor = getUBPMColor(insight.significance);
    const isNew = insight.status === 'new';

    return (
      <TouchableOpacity
        key={insight.id}
        style={[
          styles.executionItem, 
          isDarkMode ? styles.executionItemDark : styles.executionItemLight,
          isNew && styles.ubpmInsightNew
        ]}
        onPress={() => onAcknowledgeUBPM?.(insight.id)}
        activeOpacity={0.8}
      >
        {/* UBPM Indicator */}
        <View style={[styles.statusIndicator, { backgroundColor: ubpmColor }]}>
          {isNew && (
            <Animated.View style={[styles.pulseIndicator, { backgroundColor: ubpmColor }]} />
          )}
        </View>

        {/* UBPM Icon & Details */}
        <View style={styles.toolInfo}>
          <Text style={styles.toolIcon}>{getUBPMIcon(insight.significance)}</Text>
          <View style={styles.toolDetails}>
            <Text style={[styles.toolName, isDarkMode ? styles.textDark : styles.textLight]}>
              UBPM Pattern Insight
            </Text>
            <Text style={[styles.executionDetails, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
              {insight.summary}
            </Text>
            {insight.patterns.length > 0 && (
              <Text style={[styles.ubpmPatternText, { color: ubpmColor }]}>
                {insight.patterns[0].description}
              </Text>
            )}
          </View>
        </View>

        {/* Significance & Status */}
        <View style={styles.statusInfo}>
          <Text style={[styles.statusText, { color: ubpmColor }]}>
            {isNew ? 'NEW' : 'SEEN'}
          </Text>
          <Text style={[styles.timingText, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
            {Math.round(insight.significance * 100)}%
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const activeExecutions = executions.filter(e => e.status === 'executing' || e.status === 'starting');
  const newUBPMInsights = ubpmInsights.filter(i => i.status === 'new');
  const hasActiveTools = activeExecutions.length > 0;
  const hasNewUBPM = newUBPMInsights.length > 0;

  return (
    <Animated.View style={[
      styles.container, 
      { 
        height: heightAnim, 
        backgroundColor: isDarkMode ? '#121212' : '#ffffff',
        borderColor: isDarkMode
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(0, 0, 0, 0.1)',
      }
    ]}>
      <LinearGradient
        colors={isDarkMode ? ['#121212', '#0f0f0f'] : ['#ffffff', '#f8fafc']}
        style={styles.gradient}
      >
        {/* Header with Toggle */}
        <TouchableOpacity 
          style={styles.header} 
          onPress={() => {
            setIsExpanded(!isExpanded);
            Animated.timing(chevronRotation, {
              toValue: isExpanded ? 0 : 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }}
          activeOpacity={0.8}
        >
          <View style={styles.headerLeft}>
            <View style={[
              styles.activityIndicator, 
              (hasActiveTools || hasNewUBPM) && styles.activityIndicatorActive
            ]}>
              <Text style={styles.activityIcon}>
                {hasNewUBPM ? '🧠' : hasActiveTools ? '⚡' : '🔧'}
              </Text>
            </View>
            <Text style={[styles.headerTitle, isDarkMode ? { color: '#FFFFFF' } : { color: NuminaColors.darkMode[500] }]}>
              {hasNewUBPM ? 'UBPM Insights' : 'Numina Tools'} 
              {hasActiveTools && ` (${activeExecutions.length} active)`}
              {hasNewUBPM && ` (${newUBPMInsights.length} new)`}
            </Text>
          </View>
          <View style={styles.chevronContainer}>
            <Animated.View style={[
              styles.chevron,
              { transform: [{ rotate: chevronRotation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '180deg']
              })}] }
            ]}>
              <FontAwesome5 
                name="chevron-up" 
                size={14} 
                color={isDarkMode ? '#FFFFFF' : NuminaColors.chatBlue[400]} 
              />
            </Animated.View>
          </View>
        </TouchableOpacity>

        {/* Current AI Message */}
        {currentMessage && (
          <View style={styles.currentMessage}>
            <Text style={[styles.currentMessageText, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
              💭 {currentMessage}
            </Text>
          </View>
        )}

        {/* Executions & UBPM List */}
        {isExpanded && (
          <ScrollView 
            ref={scrollViewRef}
            style={styles.executionsList}
            showsVerticalScrollIndicator={false}
          >
            {executions.length === 0 && ubpmInsights.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: NuminaColors.chatBlue[400] }]}>
                  Numina's tools and behavioral insights will appear here
                </Text>
              </View>
            ) : (
              <>
                {/* Show new UBPM insights first */}
                {newUBPMInsights.map(renderUBPMInsight)}
                
                {/* Show active tool executions */}
                {executions.map(renderExecutionItem)}
                
                {/* Show acknowledged UBPM insights at bottom */}
                {ubpmInsights.filter(i => i.status === 'acknowledged').map(renderUBPMInsight)}
              </>
            )}
          </ScrollView>
        )}

        {/* Quick Stats */}
        {!isExpanded && (executions.length > 0 || ubpmInsights.length > 0) && (
          <View style={styles.quickStats}>
            <Text style={[styles.quickStatsText, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
              {executions.filter(e => e.status === 'completed').length} completed • {activeExecutions.length} active
              {ubpmInsights.length > 0 && ` • ${ubpmInsights.length} UBPM insights`}
            </Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 44,
    marginHorizontal: 1,
    marginVertical: 18,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
  },
  gradient: {
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  activityIndicatorActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  activityIcon: {
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito',
  },
  currentMessage: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 8,
  },
  currentMessageText: {
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: 'Nunito',
  },
  executionsList: {
    marginTop: 8,
    maxHeight: 180,
  },
  executionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderRadius: 8,
  },
  executionItemLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  executionItemDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  pulseIndicator: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.6)',
    // Add pulse animation here if needed
  },
  toolInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  toolDetails: {
    flex: 1,
  },
  toolName: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Nunito',
  },
  executionDetails: {
    fontSize: 10,
    marginTop: 1,
    fontFamily: 'Nunito',
  },
  statusInfo: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Nunito',
  },
  timingText: {
    fontSize: 9,
    marginTop: 1,
    fontFamily: 'Nunito',
  },
  quickStats: {
    marginTop: 8,
    alignItems: 'center',
  },
  quickStatsText: {
    fontSize: 10,
    fontFamily: 'Nunito',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: 'Nunito',
  },
  textDark: {
    color: NuminaColors.chatPurple[100],
  },
  textLight: {
    color: NuminaColors.chatGreen[800],
  },
  textSecondaryDark: {
    color: NuminaColors.chatPurple[300],
  },
  textSecondaryLight: {
    color: NuminaColors.chatGreen[600],
  },
  chevronContainer: {
    padding: 8,
    borderRadius: 6,
  },
  chevron: {
  },
  ubpmInsightNew: {
    borderLeftWidth: 3,
    borderLeftColor: '#3aa6ffff',
  },
  ubpmPatternText: {
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: 2,
    fontFamily: 'Nunito',
  },
});