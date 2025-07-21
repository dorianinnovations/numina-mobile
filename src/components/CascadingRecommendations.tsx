/**
 * CascadingRecommendations Component
 * Shows empty state when no recommendations are available
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';

interface CascadingRecommendationsProps {
  userId: string;
  focusArea?: string;
  onRecommendationAction?: (recommendation: any, action: string) => void;
}

export const CascadingRecommendations: React.FC<CascadingRecommendationsProps> = ({
  userId,
  focusArea,
  onRecommendationAction
}) => {
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    // Simulate loading then show empty state
    const timer = setTimeout(() => {
      setLoading(false);
      setRecommendations([]);
    }, 1000);

    return () => clearTimeout(timer);
  }, [userId, focusArea]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <ActivityIndicator size="large" color={NuminaColors.primary[500]} />
        <Text style={[styles.loadingText, { color: isDarkMode ? '#999' : '#666' }]}>
          Loading recommendations...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.emptyState}>
        <Feather name="compass" size={48} color={isDarkMode ? '#999' : '#666'} />
        <Text style={[styles.emptyTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          No Recommendations Available
        </Text>
        <Text style={[styles.emptyMessage, { color: isDarkMode ? '#999' : '#666' }]}>
          Check back later for personalized insights and recommendations based on your activity.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default CascadingRecommendations;