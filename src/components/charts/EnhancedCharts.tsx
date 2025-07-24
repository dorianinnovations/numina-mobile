import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  StackedBarChart,
  LineChartBicolor,
  PopulationPyramid 
} from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface ChartData {
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

interface EnhancedBarChartProps {
  data: ChartData[];
  title?: string;
  width?: number;
  height?: number;
  showGradient?: boolean;
  animated?: boolean;
  showValueOnTop?: boolean;
  spacing?: number;
  barBorderRadius?: number;
  frontColor?: string;
  gradientColor?: string;
  yAxisThickness?: number;
  xAxisThickness?: number;
  hideRules?: boolean;
  hideYAxisText?: boolean;
  maxValue?: number;
}

export const EnhancedBarChart: React.FC<EnhancedBarChartProps> = ({
  data,
  title,
  width = screenWidth - 40,
  height = 220,
  showGradient = true,
  animated = true,
  showValueOnTop = true,
  spacing = 30,
  barBorderRadius = 8,
  frontColor = '#4A9FFF',
  gradientColor = '#87CEEB',
  yAxisThickness = 0,
  xAxisThickness = 0,
  hideRules = false,
  hideYAxisText = false,
  maxValue
}) => {
  const { isDarkMode } = useTheme();

  const chartData = data.map(item => ({
    ...item,
    frontColor: item.frontColor || frontColor,
    gradientColor: showGradient ? (item.gradientColor || gradientColor) : undefined,
    spacing: item.spacing || spacing,
    labelTextStyle: {
      color: isDarkMode ? '#fff' : '#666',
      fontSize: 11,
      fontWeight: '500',
      ...item.labelTextStyle
    }
  }));

  return (
    <View style={styles.chartContainer}>
      {title && (
        <Text style={[styles.chartTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
          {title}
        </Text>
      )}
      <BarChart
        data={chartData}
        width={width}
        height={height}
        animateOnDataChange={animated}
        animationDuration={1200}
        showGradient={showGradient}
        showValueOnTopOfBar={showValueOnTop}
        spacing={spacing}
        barBorderRadius={barBorderRadius}
        yAxisThickness={yAxisThickness}
        xAxisThickness={xAxisThickness}
        hideRules={hideRules}
        hideYAxisText={hideYAxisText}
        maxValue={maxValue}
        yAxisTextStyle={{
          color: isDarkMode ? '#888' : '#666',
          fontSize: 10
        }}
        backgroundColor="transparent"
        noOfSections={4}
        stepValue={maxValue ? maxValue / 4 : undefined}
        rulesColor={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
        isAnimated={animated}
      />
    </View>
  );
};

interface EnhancedLineChartProps {
  data: ChartData[];
  title?: string;
  width?: number;
  height?: number;
  curved?: boolean;
  animated?: boolean;
  showGradient?: boolean;
  color?: string;
  thickness?: number;
  showDataPointsOnFocus?: boolean;
  focusEnabled?: boolean;
  showStripOnFocus?: boolean;
  stripColor?: string;
}

export const EnhancedLineChart: React.FC<EnhancedLineChartProps> = ({
  data,
  title,
  width = screenWidth - 40,
  height = 220,
  curved = true,
  animated = true,
  showGradient = true,
  color = '#4A9FFF',
  thickness = 3,
  showDataPointsOnFocus = true,
  focusEnabled = true,
  showStripOnFocus = true,
  stripColor
}) => {
  const { isDarkMode } = useTheme();

  const chartData = data.map(item => ({
    ...item,
    dataPointColor: color,
    dataPointRadius: 5,
    dataPointLabelComponent: item.text ? () => (
      <View style={styles.dataPointLabel}>
        <Text style={[styles.dataPointText, { color: isDarkMode ? '#fff' : '#000' }]}>
          {item.text}
        </Text>
      </View>
    ) : undefined
  }));

  return (
    <View style={styles.chartContainer}>
      {title && (
        <Text style={[styles.chartTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
          {title}
        </Text>
      )}
      <LineChart
        data={chartData}
        width={width}
        height={height}
        curved={curved}
        isAnimated={animated}
        animationDuration={1200}
        color={color}
        thickness={thickness}
        showDataPointOnFocus={showDataPointsOnFocus}
        focusEnabled={focusEnabled}
        showStripOnFocus={showStripOnFocus}
        stripColor={stripColor || (isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)')}
        stripHeight={height}
        stripOpacity={0.3}
        backgroundColor="transparent"
        yAxisColor={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
        xAxisColor={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
        yAxisTextStyle={{
          color: isDarkMode ? '#888' : '#666',
          fontSize: 10
        }}
        xAxisLabelTextStyle={{
          color: isDarkMode ? '#888' : '#666',
          fontSize: 10
        }}
        startFillColor={showGradient ? color : undefined}
        endFillColor={showGradient ? 'rgba(0,0,0,0)' : undefined}
        startOpacity={showGradient ? 0.3 : 0}
        endOpacity={0}
        areaChart={showGradient}
        hideDataPoints={!showDataPointsOnFocus}
        dataPointsColor={color}
        dataPointsRadius={4}
        rulesColor={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
        noOfSections={4}
      />
    </View>
  );
};

interface PieChartData {
  value: number;
  color: string;
  text?: string;
  label?: string;
  focused?: boolean;
  gradientCenterColor?: string;
}

interface EnhancedPieChartProps {
  data: PieChartData[];
  title?: string;
  radius?: number;
  donut?: boolean;
  innerRadius?: number;
  showText?: boolean;
  showLabels?: boolean;
  showGradient?: boolean;
  centerLabelComponent?: () => React.ReactNode;
  animated?: boolean;
}

export const EnhancedPieChart: React.FC<EnhancedPieChartProps> = ({
  data,
  title,
  radius = 100,
  donut = false,
  innerRadius = 50,
  showText = true,
  showLabels = true,
  showGradient = true,
  centerLabelComponent,
  animated = true
}) => {
  const { isDarkMode } = useTheme();

  const chartData = data.map(item => ({
    ...item,
    gradientCenterColor: showGradient ? item.gradientCenterColor || item.color : undefined,
    textColor: isDarkMode ? '#fff' : '#000',
    textSize: 12,
    fontWeight: '600'
  }));

  return (
    <View style={styles.chartContainer}>
      {title && (
        <Text style={[styles.chartTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
          {title}
        </Text>
      )}
      <View style={styles.pieChartWrapper}>
        <PieChart
          data={chartData}
          radius={radius}
          donut={donut}
          innerRadius={donut ? innerRadius : 0}
          showText={showText}
          showTextBackground={true}
          textBackgroundColor={isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)'}
          textBackgroundRadius={15}
          centerLabelComponent={centerLabelComponent}
          isAnimated={animated}
          animationDuration={1200}
          strokeWidth={donut ? 0 : 1}
          strokeColor={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
        />
        {showLabels && (
          <View style={styles.legendContainer}>
            {data.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View 
                  style={[styles.legendColor, { backgroundColor: item.color }]} 
                />
                <Text style={[styles.legendText, { color: isDarkMode ? '#ccc' : '#666' }]}>
                  {item.label || item.text}: {item.value}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

interface PersonalityRadarChartProps {
  data: { trait: string; score: number; color: string }[];
  title?: string;
  maxValue?: number;
}

export const PersonalityRadarChart: React.FC<PersonalityRadarChartProps> = ({
  data,
  title,
  maxValue = 10
}) => {
  const { isDarkMode } = useTheme();

  const barData = data.map(item => ({
    value: item.score,
    label: item.trait.substring(0, 5),
    frontColor: item.color,
    gradientColor: `${item.color}80`,
    spacing: 25,
    labelTextStyle: {
      color: isDarkMode ? '#fff' : '#666',
      fontSize: 10,
      fontWeight: '500'
    }
  }));

  return (
    <View style={styles.chartContainer}>
      {title && (
        <Text style={[styles.chartTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
          {title}
        </Text>
      )}
      <BarChart
        data={barData}
        width={screenWidth - 40}
        height={200}
        animateOnDataChange
        animationDuration={1200}
        showGradient
        showValueOnTopOfBar
        spacing={25}
        barBorderRadius={6}
        yAxisThickness={0}
        xAxisThickness={0}
        hideRules={false}
        maxValue={maxValue}
        backgroundColor="transparent"
        noOfSections={4}
        rulesColor={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
        isAnimated
      />
    </View>
  );
};

interface EmotionalHeatmapProps {
  data: { day: string; hour: number; intensity: number }[];
  title?: string;
}

export const EmotionalHeatmapChart: React.FC<EmotionalHeatmapProps> = ({
  data,
  title
}) => {
  const { isDarkMode } = useTheme();

  const processedData = data.map(item => ({
    value: item.intensity,
    label: `${item.day.substring(0, 3)} ${item.hour}h`,
    frontColor: `rgba(239, 68, 68, ${Math.max(0.2, item.intensity / 10)})`,
    spacing: 8
  }));

  return (
    <View style={styles.chartContainer}>
      {title && (
        <Text style={[styles.chartTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
          {title}
        </Text>
      )}
      <BarChart
        data={processedData}
        width={screenWidth - 40}
        height={150}
        spacing={8}
        barBorderRadius={3}
        yAxisThickness={0}
        xAxisThickness={0}
        hideRules
        hideYAxisText
        showValueOnTopOfBar={false}
        isAnimated
        animationDuration={800}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  dataPointLabel: {
    backgroundColor: 'rgba(74, 159, 255, 0.9)',
    borderRadius: 8,
    padding: 4,
    marginTop: -30,
  },
  dataPointText: {
    fontSize: 10,
    fontWeight: '600',
  },
  pieChartWrapper: {
    alignItems: 'center',
  },
  legendContainer: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export {
  BarChart as GiftedBarChart,
  LineChart as GiftedLineChart,
  PieChart as GiftedPieChart,
  StackedBarChart as GiftedStackedBarChart,
  LineChartBicolor as GiftedLineChartBicolor,
  PopulationPyramid as GiftedPopulationPyramid
};