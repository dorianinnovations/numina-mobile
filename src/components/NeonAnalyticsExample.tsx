import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { NeonAnalyticsCard } from './NeonAnalyticsCard';
import { NeonProgressCard } from './NeonProgressCard';
import { NeonGlassCard } from './NeonGlassCard';
import { Text } from 'react-native';

// Example of how to use the neon glass effects in your analytics screen
export const NeonAnalyticsExample: React.FC = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Progress card example */}
      <NeonProgressCard
        title="Analytics Progress 75%"
        progress={75}
        glowColors={['#00ffaa', '#ff6b9d', '#ffd93d', '#0099ff']}
        onClose={() => console.log('Close pressed')}
      />

      {/* Analytics cards in a row */}
      <View style={styles.cardRow}>
        <NeonAnalyticsCard
          title="Total Sessions"
          value="127"
          icon="activity"
          subtitle="This week"
          trend="up"
          glowColors={['#00ffaa', '#0099ff']}
        />
        <NeonAnalyticsCard
          title="Avg Duration"
          value="12m"
          icon="clock"
          subtitle="Per session"
          trend="up"
          glowColors={['#ff6b9d', '#ffd93d']}
        />
      </View>

      <View style={styles.cardRow}>
        <NeonAnalyticsCard
          title="Insights"
          value="23"
          icon="zap"
          subtitle="Generated"
          trend="neutral"
          glowColors={['#0099ff', '#9b59b6']}
        />
        <NeonAnalyticsCard
          title="Growth Score"
          value="8.4"
          icon="trending-up"
          subtitle="Out of 10"
          trend="up"
          glowColors={['#ffd93d', '#ff6b9d']}
        />
      </View>

      {/* Large analytics card with custom content */}
      <NeonGlassCard
        intensity={70}
        glowColors={['#00ffaa', '#0099ff', '#ff6b9d', '#ffd93d', '#9b59b6']}
        style={styles.largeCard}
      >
        <Text style={styles.largeCardTitle}>Emotional Patterns</Text>
        <Text style={styles.largeCardSubtitle}>
          Your emotional patterns show increased positivity and stability over the past month.
        </Text>
        <View style={styles.patternStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Positive Trend</Text>
            <Text style={styles.statValue}>+12%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Stability</Text>
            <Text style={styles.statValue}>94%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Consistency</Text>
            <Text style={styles.statValue}>87%</Text>
          </View>
        </View>
      </NeonGlassCard>

      {/* Another progress card with different colors */}
      <NeonProgressCard
        title="Weekly Goal 92%"
        progress={92}
        glowColors={['#9b59b6', '#3742fa', '#2ed573', '#ffa502']}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  largeCard: {
    marginVertical: 16,
  },
  largeCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  largeCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Nunito_400Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  patternStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Nunito_400Regular',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00ffaa',
    fontFamily: 'Nunito_700Bold',
    textShadowColor: 'rgba(0, 255, 170, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});