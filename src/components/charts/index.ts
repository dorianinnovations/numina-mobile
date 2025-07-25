// Enhanced Chart Components - React Native Gifted Charts Integration
export {
  EnhancedBarChart,
  EnhancedLineChart,
  EnhancedPieChart,
  PersonalityRadarChart,
  EmotionalHeatmapChart,
  GiftedBarChart,
  GiftedLineChart,
  GiftedPieChart,
  // GiftedStackedBarChart, // Not available
  GiftedLineChartBicolor,
  GiftedPopulationPyramid
} from './EnhancedCharts';

// Specialized Analytics Chart Components
export {
  PersonalityInsightsChart,
  BehavioralPatternsChart,
  EmotionalTrendsChart,
  GrowthMetricsChart,
  SocialConnectionChart,
  WeeklyInsightsChart,
  AnalyticsCard
} from './AnalyticsChartComponents';

// Chart data type definitions
export interface ChartDataPoint {
  value: number;
  label?: string;
  frontColor?: string;
  gradientColor?: string;
  spacing?: number;
  labelWidth?: number;
  labelTextStyle?: object;
  color?: string;
  focused?: boolean;
  text?: string;
}

export interface PieChartDataPoint {
  value: number;
  color: string;
  text?: string;
  label?: string;
  focused?: boolean;
  gradientCenterColor?: string;
}

export interface PersonalityTraitData {
  trait: string;
  score: number;
  color: string;
}

export interface EmotionalDataPoint {
  day: string;
  hour: number;
  intensity: number;
}