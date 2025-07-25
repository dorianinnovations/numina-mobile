import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { ToolExecution } from '../../services/toolExecutionService';

interface AnalyticsInsight {
  id: string;
  type: 'analytics' | 'ubpm' | 'emotional' | 'behavioral';
  message: string;
  timestamp: number;
  duration?: number;
  data?: any;
}

interface ToolStatusIndicatorProps {
  toolExecutions: ToolExecution[];
  analyticsInsights?: AnalyticsInsight[];
  onNavigateToAnalytics?: () => void;
}

export const ToolStatusIndicator: React.FC<ToolStatusIndicatorProps> = React.memo(({
  toolExecutions,
  analyticsInsights = [],
  onNavigateToAnalytics,
}) => {
  const { isDarkMode } = useTheme();
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [currentType, setCurrentType] = useState<'tool' | 'analytics'>('tool');
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const dismissTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check for recent analytics insights first (higher priority)
    const recentAnalytics = analyticsInsights.filter(
      insight => (Date.now() - insight.timestamp) < (insight.duration || 3000)
    );

    const activeExecutions = toolExecutions.filter(
      exec => exec.status === 'starting' || exec.status === 'executing'
    );
    
    const recentlyCompleted = toolExecutions.filter(
      exec => exec.status === 'completed' && exec.endTime && 
      (Date.now() - exec.endTime) < 2000
    );

    // Prioritize analytics insights over tool executions
    if (recentAnalytics.length) {
      const latest = recentAnalytics[recentAnalytics.length - 1];
      setCurrentStatus(latest.message);
      setCurrentType('analytics');
      setIsDismissed(false);

      // Clear any existing timeout
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after custom duration or 3 seconds
      dismissTimeoutRef.current = setTimeout(() => {
        setIsDismissed(true);
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, latest.duration || 3000);
    } else if (activeExecutions.length) {
      const latest = activeExecutions[activeExecutions.length - 1];
      const statusText = getStatusText(latest.toolName, latest.status);
      setCurrentStatus(statusText);
      setCurrentType('tool');
      setIsDismissed(false);

      // Clear any existing timeout
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after 4 seconds
      dismissTimeoutRef.current = setTimeout(() => {
        setIsDismissed(true);
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 4000);
    } else if (recentlyCompleted.length) {
      // Show completed status briefly
      const latest = recentlyCompleted[recentlyCompleted.length - 1];
      const statusText = getStatusText(latest.toolName, 'completed');
      setCurrentStatus(statusText);
      setCurrentType('tool');
      setIsDismissed(false);

      // Clear any existing timeout
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after 2 seconds for completed
      dismissTimeoutRef.current = setTimeout(() => {
        setIsDismissed(true);
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 2000);
    } else {
      // Clear timeout if no active items
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
      
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    // Cleanup timeout on unmount
    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [toolExecutions, analyticsInsights]);

  const getStatusText = (toolName: string, status: string): string => {
    let action: string;
    if (status === 'starting') {
      action = 'initiated';
    } else if (status === 'executing') {
      action = 'running';
    } else if (status === 'completed') {
      action = 'completed';
    } else {
      action = status;
    }
    
    switch (toolName) {
      case 'web_search':
        return `Web search ${action}`;
      case 'calculator':
        return `Calculation ${action}`;
      case 'news_search':
        return `News search ${action}`;
      case 'weather_check':
        return `Weather check ${action}`;
      case 'music_recommendations':
        return `Music search ${action}`;
      case 'spotify_playlist':
        return `Playlist creation ${action}`;
      case 'translation':
        return `Translation ${action}`;
      case 'stock_lookup':
        return `Stock lookup ${action}`;
      case 'crypto_lookup':
        return `Crypto lookup ${action}`;
      default:
        const displayName = toolName.replace(/_/g, ' ');
        return `${displayName} ${action}`;
    }
  };

  const handlePress = () => {
    if (currentType === 'analytics' && onNavigateToAnalytics) {
      onNavigateToAnalytics();
    }
  };

  const getIndicatorColor = () => {
    if (currentType === 'analytics') {
      return isDarkMode ? '#94ffa2ff' : '#9dff9dff'; // Green for analytics
    }
    return isDarkMode ? '#91d7ffff' : '#8bc1ffff'; // Blue for tools
  };

  if (!currentStatus || isDismissed) return null;

  const isClickable = currentType === 'analytics' && onNavigateToAnalytics;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          opacity: fadeAnim,
        },
      ]}
    >
      {isClickable ? (
        <TouchableOpacity 
          style={styles.statusRow} 
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <View style={[
            styles.indicator,
            { backgroundColor: getIndicatorColor() }
          ]} />
          <Text style={[
            styles.statusText,
            { color: isDarkMode ? '#e5e7eb' : '#374151' }
          ]}>
            {currentStatus}
          </Text>
          <Text style={[
            styles.tapHint,
            { color: isDarkMode ? '#9ca3af' : '#6b7280' }
          ]}>
            • Tap to view
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.statusRow}>
          <View style={[
            styles.indicator,
            { backgroundColor: getIndicatorColor() }
          ]} />
          <Text style={[
            styles.statusText,
            { color: isDarkMode ? '#e5e7eb' : '#374151' }
          ]}>
            {currentStatus}
          </Text>
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Nunito',
    flex: 1,
  },
  tapHint: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'Nunito',
    marginLeft: 8,
  },
});