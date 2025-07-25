import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Rect, Path, Text as SvgText, Line } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { NuminaColors } from '../../utils/colors';

const { width } = Dimensions.get('window');

interface DataPoint {
  label: string;
  value: number;
  trend?: 'up' | 'down' | 'stable';
  confidence?: number;
}

interface SubCategory {
  id: string;
  name: string;
  icon: string;
  data: DataPoint[];
  chartType: 'radar' | 'line' | 'bar' | 'heatmap' | 'progress';
  color: string;
}

interface AnalyticsCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  subCategories: SubCategory[];
  totalDataPoints: number;
  lastUpdated: string;
}

interface CategoryAnalyticsCardProps {
  category: AnalyticsCategory;
  isExpanded?: boolean;
  onToggleExpand: () => void;
  onGenerateInsight: (categoryId: string) => void;
  isGeneratingInsight?: boolean;
}

export const CategoryAnalyticsCard: React.FC<CategoryAnalyticsCardProps> = ({
  category,
  isExpanded = false,
  onToggleExpand,
  onGenerateInsight,
  isGeneratingInsight = false,
}) => {
  const { isDarkMode } = useTheme();
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

  // Animation values for floating orbs
  const orb1X = useRef(new Animated.Value(0)).current;
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2X = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;

  // Scale animations for pulsing effect
  const orb1Scale = useRef(new Animated.Value(1)).current;
  const orb2Scale = useRef(new Animated.Value(1)).current;

  // Card entrance animation
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  // Button pulse animation
  const buttonPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Card entrance animation
    Animated.parallel([
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Create floating animation for orbs
    const createFloatingAnimation = (xValue: Animated.Value, yValue: Animated.Value, scaleValue: Animated.Value, delay: number) => {
      const floating = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(xValue, {
              toValue: Math.random() * 20 - 10,
              duration: 8000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(yValue, {
              toValue: Math.random() * 20 - 10,
              duration: 8000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(xValue, {
              toValue: Math.random() * 20 - 10,
              duration: 8000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(yValue, {
              toValue: Math.random() * 20 - 10,
              duration: 8000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      const pulsing = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.1,
            duration: 7000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0.9,
            duration: 7000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      );

      setTimeout(() => {
        floating.start();
        pulsing.start();
      }, delay);
    };

    // Start animations with different delays
    createFloatingAnimation(orb1X, orb1Y, orb1Scale, 0);
    createFloatingAnimation(orb2X, orb2Y, orb2Scale, 3000);

    // Button pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const renderRadarChart = (data: DataPoint[], color: string, size: number = 120) => {
    const center = size / 2;
    const radius = center - 20;
    const angleStep = (2 * Math.PI) / data.length;

    // Generate polygon path for data
    const pathData = data.map((point, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const value = Math.max(0, Math.min(1, point.value)); // Normalize to 0-1
      const x = center + radius * value * Math.cos(angle);
      const y = center + radius * value * Math.sin(angle);
      return { x, y, angle, label: point.label, value: point.value };
    });

    const polygonPath = pathData.reduce((path, point, index) => {
      return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
    }, '') + ' Z';

    return (
      <Svg width={size} height={size}>
        {/* Background grid circles */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, i) => (
          <Circle
            key={i}
            cx={center}
            cy={center}
            r={radius * scale}
            fill="none"
            stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            strokeWidth={1}
          />
        ))}
        
        {/* Grid lines */}
        {pathData.map((point, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const endX = center + radius * Math.cos(angle);
          const endY = center + radius * Math.sin(angle);
          return (
            <Line
              key={index}
              x1={center}
              y1={center}
              x2={endX}
              y2={endY}
              stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <Path
          d={polygonPath}
          fill={color + '30'}
          stroke={color}
          strokeWidth={2}
        />

        {/* Data points */}
        {pathData.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={3}
            fill={color}
          />
        ))}

        {/* Labels */}
        {pathData.map((point, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const labelRadius = radius + 15;
          const labelX = center + labelRadius * Math.cos(angle);
          const labelY = center + labelRadius * Math.sin(angle);
          
          return (
            <SvgText
              key={index}
              x={labelX}
              y={labelY}
              fontSize="10"
              fill={isDarkMode ? '#9CA3AF' : '#6B7280'}
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {point.label.slice(0, 8)}
            </SvgText>
          );
        })}
      </Svg>
    );
  };

  const renderLineChart = (data: DataPoint[], color: string, size: number = 200) => {
    if (data.length < 2) return null;

    const chartWidth = size - 40;
    const chartHeight = 80;
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    const points = data.map((point, index) => {
      const x = 20 + (index / (data.length - 1)) * chartWidth;
      const y = 20 + (1 - point.value / maxValue) * chartHeight;
      return { x, y };
    });

    const pathData = points.reduce((path, point, index) => {
      return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
    }, '');

    return (
      <Svg width={size} height={chartHeight + 40}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1.0].map((ratio, i) => (
          <Line
            key={i}
            x1={20}
            y1={20 + chartHeight * (1 - ratio)}
            x2={size - 20}
            y2={20 + chartHeight * (1 - ratio)}
            stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
            strokeWidth={1}
          />
        ))}

        {/* Line path */}
        <Path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={2}
        />

        {/* Data points */}
        {points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={3}
            fill={color}
          />
        ))}
      </Svg>
    );
  };

  const renderProgressBar = (dataPoint: DataPoint, color: string) => {
    const percentage = Math.round(dataPoint.value * 100);
    const trendColor = dataPoint.trend === 'up' ? '#00ff88' : dataPoint.trend === 'down' ? '#ff4757' : '#00aaff';
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }]}>
            {dataPoint.label}
          </Text>
          <View style={styles.progressValueContainer}>
            <Text style={[styles.progressValue, { color: trendColor }]}>
              {percentage}%
            </Text>
            {dataPoint.trend && dataPoint.trend !== 'stable' && (
              <Feather 
                name={dataPoint.trend === 'up' ? 'trending-up' : 'trending-down'} 
                size={12} 
                color={trendColor} 
              />
            )}
          </View>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
          <View
            style={[
              styles.progressFill,
              { 
                backgroundColor: color, 
                width: `${percentage}%`,
                shadowColor: color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 4,
                elevation: 2,
              }
            ]}
          />
        </View>
      </View>
    );
  };

  const renderHeatmap = (data: DataPoint[], color: string, size: number = 200) => {
    const gridSize = Math.ceil(Math.sqrt(data.length));
    const cellSize = size / gridSize;
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return (
      <View style={styles.heatmapContainer}>
        <Svg width={size} height={size}>
          {data.map((point, index) => {
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;
            const x = col * cellSize;
            const y = row * cellSize;
            const intensity = point.value / maxValue;
            const opacity = Math.max(0.1, intensity);
            
            return (
              <Rect
                key={index}
                x={x}
                y={y}
                width={cellSize - 1}
                height={cellSize - 1}
                fill={color}
                fillOpacity={opacity}
                stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                strokeWidth={0.5}
              />
            );
          })}
        </Svg>
        
        {/* Heatmap Legend */}
        <View style={styles.heatmapLegend}>
          <Text style={[styles.heatmapLegendText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            Intensity
          </Text>
          <View style={styles.heatmapLegendBar}>
            <View style={[styles.heatmapLegendGradient, { backgroundColor: color + '20' }]} />
            <View style={[styles.heatmapLegendGradient, { backgroundColor: color + '60' }]} />
            <View style={[styles.heatmapLegendGradient, { backgroundColor: color }]} />
          </View>
        </View>
        
        {/* Data labels */}
        <View style={styles.heatmapLabels}>
          {data.slice(0, 6).map((point, index) => (
            <Text key={index} style={[styles.heatmapLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
              {point.label.slice(0, 8)}: {Math.round(point.value * 100)}%
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const GlowingOrb: React.FC<{
    translateX: Animated.Value;
    translateY: Animated.Value;
    scale: Animated.Value;
    color: string;
    size: number;
    position: { top?: number; bottom?: number; left?: number; right?: number };
  }> = ({ translateX, translateY, scale, color, size, position }) => (
    <Animated.View
      style={[
        styles.orbContainer,
        position,
        {
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
        },
      ]}
    >
      {/* Outer glow */}
      <View
        style={[
          styles.orbGlow,
          {
            width: size * 3,
            height: size * 3,
            borderRadius: (size * 3) / 2,
            backgroundColor: color + '10',
          },
        ]}
      />
      {/* Middle glow */}
      <View
        style={[
          styles.orbGlow,
          {
            width: size * 2,
            height: size * 2,
            borderRadius: (size * 2) / 2,
            backgroundColor: color + '25',
          },
        ]}
      />
      {/* Inner glow */}
      <View
        style={[
          styles.orbGlow,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: (size * 1.4) / 2,
            backgroundColor: color + '40',
          },
        ]}
      />
      {/* Core orb */}
      <View
        style={[
          styles.orb,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: size / 1.2,
            elevation: 10,
          },
        ]}
      />
    </Animated.View>
  );

  const renderSubCategory = (subCategory: SubCategory) => {
    const { chartType, data, color, name, icon } = subCategory;

    return (
      <View key={subCategory.id} style={styles.subCategoryCard}>
        <View style={styles.subCategoryGlass}>
          <BlurView
            intensity={40}
            tint="dark"
            style={styles.subCategoryBlur}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={styles.subCategoryGradient}
            >
              <View style={styles.subCategoryContent}>
                <View style={styles.subCategoryHeader}>
                  <Text style={styles.subCategoryIcon}>{icon}</Text>
                  <Text style={styles.subCategoryName}>
                    {name}
                  </Text>
                  <Text style={styles.dataPointCount}>
                    {data.length} metrics
                  </Text>
                </View>

                <View style={styles.chartContainer}>
                  {chartType === 'radar' && renderRadarChart(data, color)}
                  {chartType === 'line' && renderLineChart(data, color)}
                  {chartType === 'heatmap' && renderHeatmap(data, color)}
                  {chartType === 'progress' && (
                    <View style={styles.progressList}>
                      {data.slice(0, 4).map((point, index) => (
                        <View key={index}>
                          {renderProgressBar(point, color)}
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {data.length > 4 && (
                  <TouchableOpacity style={styles.viewMoreButton}>
                    <Text style={[styles.viewMoreText, { color }]}>
                      View all {data.length} metrics
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          </BlurView>
        </View>
      </View>
    );
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: cardOpacity,
          transform: [{ scale: cardScale }],
        },
      ]}
    >
      {/* Background orbs */}
      <GlowingOrb
        translateX={orb1X}
        translateY={orb1Y}
        scale={orb1Scale}
        color={category.subCategories[0]?.color || '#9cc2ff'}
        size={35}
        position={{ top: -20, left: -20 }}
      />
      <GlowingOrb
        translateX={orb2X}
        translateY={orb2Y}
        scale={orb2Scale}
        color={category.subCategories[1]?.color || '#a4ffc6'}
        size={30}
        position={{ bottom: -15, right: -15 }}
      />

      {/* Glass card container */}
      <View style={styles.glassContainer}>
        <BlurView
          intensity={60}
          tint="dark"
          style={styles.blurView}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
            style={styles.gradientOverlay}
          >
            <View style={styles.cardContent}>
              {/* Category Header */}
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={onToggleExpand}
                activeOpacity={0.8}
              >
                <View style={styles.categoryHeaderLeft}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <View style={styles.categoryHeaderText}>
                    <Text style={styles.categoryName}>
                      {category.name}
                    </Text>
                    <Text style={styles.categoryDescription}>
                      {category.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.categoryHeaderRight}>
                  <View style={styles.dataStats}>
                    <Text style={styles.dataCount}>
                      {category.totalDataPoints}
                    </Text>
                    <Text style={styles.dataLabel}>
                      data points
                    </Text>
                  </View>
                  <Feather
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                </View>
              </TouchableOpacity>

              {/* AI Insight Generation Button */}
              <Animated.View style={{ transform: [{ scale: buttonPulse }] }}>
                <TouchableOpacity
                  style={[
                    styles.insightButton,
                    {
                      opacity: isGeneratingInsight ? 0.7 : 1,
                    }
                  ]}
                  onPress={() => onGenerateInsight(category.id)}
                  disabled={isGeneratingInsight}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={isGeneratingInsight ? 'loader' : 'zap'}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.insightButtonText}>
                    {isGeneratingInsight ? 'Generating...' : 'Generate AI Insight'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Expanded Sub-Categories */}
              {isExpanded && (
                <ScrollView
                  style={styles.subCategoriesContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {category.subCategories.map(renderSubCategory)}
                </ScrollView>
              )}

              {/* Last Updated */}
              <Text style={styles.lastUpdated}>
                Last updated: {category.lastUpdated}
              </Text>
            </View>
          </LinearGradient>
        </BlurView>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    margin: 8,
    marginBottom: 32,
  },
  orbContainer: {
    position: 'absolute',
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    position: 'absolute',
    zIndex: 4,
  },
  orbGlow: {
    position: 'absolute',
    zIndex: 1,
  },
  glassContainer: {
    position: 'relative',
    zIndex: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  blurView: {
    borderRadius: 20,
    overflow: 'hidden',
    flex: 1,
  },
  gradientOverlay: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flex: 1,
  },
  cardContent: {
    padding: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryHeaderText: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Nunito',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 14,
    fontFamily: 'Nunito',
  },
  categoryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dataStats: {
    alignItems: 'flex-end',
  },
  dataCount: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Nunito',
    textShadowColor: 'rgba(0, 255, 136, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dataLabel: {
    fontSize: 11,
    fontFamily: 'Nunito',
  },
  insightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 6,
  },
  insightButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito',
  },
  subCategoriesContainer: {
    maxHeight: 600,
  },
  subCategoryCard: {
    marginBottom: 16,
  },
  subCategoryGlass: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  subCategoryBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    flex: 1,
  },
  subCategoryGradient: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    flex: 1,
  },
  subCategoryContent: {
    padding: 16,
  },
  subCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subCategoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  subCategoryName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito',
    flex: 1,
  },
  dataPointCount: {
    fontSize: 12,
    fontFamily: 'Nunito',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  progressList: {
    width: '100%',
    gap: 12,
  },
  progressContainer: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    fontFamily: 'Nunito',
    flex: 1,
  },
  progressValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Nunito',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Nunito',
  },
  lastUpdated: {
    fontSize: 11,
    fontFamily: 'Nunito',
    textAlign: 'center',
    marginTop: 8,
  },
  heatmapContainer: {
    alignItems: 'center',
    width: '100%',
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  heatmapLegendText: {
    fontSize: 12,
    fontFamily: 'Nunito',
  },
  heatmapLegendBar: {
    flexDirection: 'row',
    width: 60,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  heatmapLegendGradient: {
    flex: 1,
    height: '100%',
  },
  heatmapLabels: {
    marginTop: 12,
    width: '100%',
  },
  heatmapLabel: {
    fontSize: 11,
    fontFamily: 'Nunito',
    marginBottom: 2,
  },
});

export default CategoryAnalyticsCard;