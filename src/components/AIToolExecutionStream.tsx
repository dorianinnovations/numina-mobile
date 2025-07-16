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

interface AIToolExecutionStreamProps {
  executions: ToolExecution[];
  isVisible: boolean;
  onToggleVisibility: () => void;
  currentMessage?: string;
}

export const AIToolExecutionStream: React.FC<AIToolExecutionStreamProps> = ({
  executions,
  isVisible,
  onToggleVisibility,
  currentMessage,
}) => {
  const { isDarkMode } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const heightAnim = useRef(new Animated.Value(isVisible ? 200 : 0)).current;
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
      case 'web_search': return '🔍';
      case 'music_recommendations': return '🎵';
      case 'spotify_playlist': return '🎧';
      case 'reservation_booking': return '🍽️';
      case 'itinerary_generator': return '✈️';
      case 'credit_management': return '💳';
      default: return '🔧';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'starting': return isDarkMode ? NuminaColors.chatPurple[400] : NuminaColors.chatGreen[500];
      case 'executing': return isDarkMode ? NuminaColors.chatPurple[300] : NuminaColors.chatGreen[600];
      case 'completed': return isDarkMode ? NuminaColors.success[400] : NuminaColors.success[600];
      case 'error': return isDarkMode ? NuminaColors.error[400] : NuminaColors.error[600];
      default: return isDarkMode ? NuminaColors.chatPurple[500] : NuminaColors.chatGreen[500];
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

  const activeExecutions = executions.filter(e => e.status === 'executing' || e.status === 'starting');
  const hasActiveTools = activeExecutions.length > 0;

  return (
    <Animated.View style={[styles.container, { height: heightAnim }]}>
      <LinearGradient
        colors={isDarkMode ? [NuminaColors.chatPurple[900], NuminaColors.chatPurple[800]] : [NuminaColors.chatGreen[50], NuminaColors.chatGreen[100]]}
        style={styles.gradient}
      >
        {/* Header with Toggle */}
        <TouchableOpacity 
          style={styles.header} 
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.8}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.activityIndicator, hasActiveTools && styles.activityIndicatorActive]}>
              <Text style={styles.activityIcon}>
                {hasActiveTools ? '⚡' : '🧠'}
              </Text>
            </View>
            <Text style={[styles.headerTitle, isDarkMode ? styles.textDark : styles.textLight]}>
              AI Tools {hasActiveTools ? `(${activeExecutions.length} active)` : ''}
            </Text>
          </View>
          <FontAwesome5 
            name={isExpanded ? 'chevron-down' : 'chevron-up'} 
            size={12} 
            color={isDarkMode ? NuminaColors.chatPurple[300] : NuminaColors.chatGreen[600]} 
          />
        </TouchableOpacity>

        {/* Current AI Message */}
        {currentMessage && (
          <View style={styles.currentMessage}>
            <Text style={[styles.currentMessageText, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
              💭 {currentMessage}
            </Text>
          </View>
        )}

        {/* Executions List */}
        {isExpanded && (
          <ScrollView 
            ref={scrollViewRef}
            style={styles.executionsList}
            showsVerticalScrollIndicator={false}
          >
            {executions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                  Ready to execute AI tools...
                </Text>
              </View>
            ) : (
              executions.map(renderExecutionItem)
            )}
          </ScrollView>
        )}

        {/* Quick Stats */}
        {!isExpanded && executions.length > 0 && (
          <View style={styles.quickStats}>
            <Text style={[styles.quickStatsText, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
              {executions.filter(e => e.status === 'completed').length} completed • {activeExecutions.length} active
            </Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  },
  executionDetails: {
    fontSize: 10,
    marginTop: 1,
  },
  statusInfo: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  timingText: {
    fontSize: 9,
    marginTop: 1,
  },
  quickStats: {
    marginTop: 8,
    alignItems: 'center',
  },
  quickStatsText: {
    fontSize: 10,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 12,
    fontStyle: 'italic',
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
});