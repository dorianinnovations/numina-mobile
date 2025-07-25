import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { Header } from '../components/ui/Header';
import { PageBackground } from '../components/ui/PageBackground';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import ToolExecutionService, { ToolExecution } from '../services/toolExecutionService';

const { width, height } = Dimensions.get('window');

type NuminaSensesNavigationProp = StackNavigationProp<RootStackParamList, 'Sentiment'>;

interface NuminaSensesV2Props {
  onNavigateBack: () => void;
}

interface FloatingOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  executions: ToolExecution[];
  currentExecution?: ToolExecution;
}

const FloatingToolOverlay: React.FC<FloatingOverlayProps> = ({
  isVisible,
  onClose,
  executions,
  currentExecution,
}) => {
  const { isDarkMode } = useTheme();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: height * 0.6, // Slide up from bottom
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: height,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    Animated.spring(slideAnim, {
      toValue: isExpanded ? height * 0.6 : height * 0.2,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'music_recommendations': return 'music';
      case 'web_search': return 'flash';
      case 'spotify_playlist': return 'playlist-music';
      case 'reservation_booking': return 'food';
      case 'itinerary_generator': return 'map';
      case 'credit_management': return 'credit-card';
      default: return 'cog';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'starting': return NuminaColors.chatGreen[500];
      case 'executing': return NuminaColors.chatBlue[500];
      case 'completed': return NuminaColors.success;
      case 'error': return NuminaColors.error;
      default: return NuminaColors.darkMode[500];
    }
  };

  return (
    <>
      {/* Semi-transparent backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: opacityAnim,
            backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
          },
        ]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        <TouchableOpacity style={styles.backdropTouchable} onPress={onClose} />
      </Animated.View>

      {/* Floating drawer */}
      <Animated.View
        style={[
          styles.floatingDrawer,
          {
            transform: [{ translateY: slideAnim }],
            backgroundColor: isDarkMode ? NuminaColors.darkMode[800] : '#FFFFFF',
          },
        ]}
      >
        {/* Drawer header */}
        <View style={styles.drawerHeader}>
          <TouchableOpacity onPress={toggleExpanded} style={styles.dragHandle}>
            <View style={[styles.handle, { backgroundColor: isDarkMode ? '#555' : '#DDD' }]} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons
                name="robot-outline"
                size={24}
                color={NuminaColors.chatGreen[500]}
              />
              <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFF' : '#000' }]}>
                Numina Senses
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={isDarkMode ? '#FFF' : '#000'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Current execution display */}
        {currentExecution && (
          <View style={[styles.currentExecution, { borderBottomColor: isDarkMode ? '#333' : '#EEE' }]}>
            <View style={styles.executionHeader}>
              <MaterialCommunityIcons
                name={getToolIcon(currentExecution.toolName)}
                size={20}
                color={getStatusColor(currentExecution.status)}
              />
              <Text style={[styles.executionTitle, { color: isDarkMode ? '#FFF' : '#000' }]}>
                {currentExecution.details.action || currentExecution.toolName}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentExecution.status) }]}>
                <Text style={styles.statusText}>{currentExecution.status}</Text>
              </View>
            </View>
            
            {currentExecution.status === 'executing' && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: isDarkMode ? '#333' : '#EEE' }]}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: NuminaColors.chatBlue[500],
                        width: `${currentExecution.progress || 0}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: isDarkMode ? '#AAA' : '#666' }]}>
                  {currentExecution.progress || 0}%
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Execution history (expanded view) */}
        {isExpanded && (
          <ScrollView style={styles.executionHistory} showsVerticalScrollIndicator={false}>
            {executions.slice(0, 10).map((execution) => (
              <View
                key={execution.id}
                style={[styles.executionItem, { borderBottomColor: isDarkMode ? '#333' : '#EEE' }]}
              >
                <View style={styles.executionRow}>
                  <MaterialCommunityIcons
                    name={getToolIcon(execution.toolName)}
                    size={16}
                    color={getStatusColor(execution.status)}
                  />
                  <Text style={[styles.executionName, { color: isDarkMode ? '#FFF' : '#000' }]}>
                    {execution.toolName.replace('_', ' ')}
                  </Text>
                  <Text style={[styles.executionTime, { color: isDarkMode ? '#AAA' : '#666' }]}>
                    {execution.endTime
                      ? `${execution.endTime - execution.startTime}ms`
                      : 'Running...'
                    }
                  </Text>
                </View>
                
                {execution.details.results && (
                  <Text
                    style={[styles.executionResult, { color: isDarkMode ? '#AAA' : '#666' }]}
                    numberOfLines={2}
                  >
                    {typeof execution.details.results === 'string'
                      ? execution.details.results
                      : JSON.stringify(execution.details.results).substring(0, 100) + '...'
                    }
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        )}

        {/* Live stats */}
        <View style={[styles.liveStats, { borderTopColor: isDarkMode ? '#333' : '#EEE' }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: NuminaColors.chatGreen[500] }]}>
              {executions.filter(e => e.status === 'executing').length}
            </Text>
            <Text style={[styles.statLabel, { color: isDarkMode ? '#AAA' : '#666' }]}>
              Active
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: NuminaColors.success }]}>
              {executions.filter(e => e.status === 'completed').length}
            </Text>
            <Text style={[styles.statLabel, { color: isDarkMode ? '#AAA' : '#666' }]}>
              Completed
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: NuminaColors.chatBlue[500] }]}>
              {executions.length}
            </Text>
            <Text style={[styles.statLabel, { color: isDarkMode ? '#AAA' : '#666' }]}>
              Total
            </Text>
          </View>
        </View>
      </Animated.View>
    </>
  );
};

export const NuminaSensesV2: React.FC<NuminaSensesV2Props> = ({ onNavigateBack }) => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation<NuminaSensesNavigationProp>();
  const [executions, setExecutions] = useState<ToolExecution[]>([]);
  const [currentExecution, setCurrentExecution] = useState<ToolExecution | undefined>();
  const [overlayVisible, setOverlayVisible] = useState(false);
  const toolExecutionService = ToolExecutionService.getInstance();

  useEffect(() => {
    // Subscribe to tool execution updates
    const handleExecutionStarted = (execution: ToolExecution) => {
      setCurrentExecution(execution);
      setOverlayVisible(true);
    };

    const handleExecutionProgress = (execution: ToolExecution) => {
      setCurrentExecution(execution);
    };

    const handleExecutionCompleted = (execution: ToolExecution) => {
      setCurrentExecution(undefined);
      // Keep overlay open for a moment to show completion
      setTimeout(() => {
        if (!toolExecutionService.getCurrentExecutions().length) {
          setOverlayVisible(false);
        }
      }, 2000);
    };

    const handleExecutionsUpdated = (newExecutions: ToolExecution[]) => {
      setExecutions(newExecutions);
    };

    // Subscribe to events
    toolExecutionService.on('executionStarted', handleExecutionStarted);
    toolExecutionService.on('executionProgress', handleExecutionProgress);
    toolExecutionService.on('executionCompleted', handleExecutionCompleted);
    toolExecutionService.on('executionFailed', handleExecutionCompleted);
    toolExecutionService.on('executionsUpdated', handleExecutionsUpdated);

    // Get initial data
    setExecutions(toolExecutionService.getRecentExecutions());

    return () => {
      // Cleanup subscriptions
      toolExecutionService.off('executionStarted', handleExecutionStarted);
      toolExecutionService.off('executionProgress', handleExecutionProgress);
      toolExecutionService.off('executionCompleted', handleExecutionCompleted);
      toolExecutionService.off('executionFailed', handleExecutionCompleted);
      toolExecutionService.off('executionsUpdated', handleExecutionsUpdated);
    };
  }, []);

  return (
    <PageBackground>
      <SafeAreaView style={styles.container}>
        <Header
          title="Numina Senses"
          onBackPress={onNavigateBack}
          showBackButton={true}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Real-time tool execution overview */}
          <View style={[styles.card, { backgroundColor: isDarkMode ? NuminaColors.darkMode[800] : '#FFFFFF' }]}>
            <View style={styles.cardInsetShadow} />
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="robot-outline" size={24} color={NuminaColors.chatGreen[500]} />
              <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFF' : '#000' }]}>
                Real-time AI Processing
              </Text>
            </View>
            
            <Text style={[styles.cardDescription, { color: isDarkMode ? '#AAA' : '#666' }]}>
              Live view of your AI assistant's tool execution and processing activities.
            </Text>

            <TouchableOpacity
              style={[styles.viewButton, { backgroundColor: NuminaColors.chatGreen[500] }]}
              onPress={() => setOverlayVisible(true)}
            >
              <Text style={styles.viewButtonText}>View Live Activity</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Recent executions preview */}
          <View style={[styles.card, { backgroundColor: isDarkMode ? NuminaColors.darkMode[800] : '#FFFFFF' }]}>
            <View style={styles.cardInsetShadow} />
            <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFF' : '#000' }]}>
              Recent Tool Executions
            </Text>
            
            {executions.slice(0, 3).map((execution) => (
              <View
                key={execution.id}
                style={[styles.executionPreview, { borderBottomColor: isDarkMode ? '#333' : '#EEE' }]}
              >
                <MaterialCommunityIcons
                  name={execution.toolName === 'music_recommendations' ? 'music-note' : 'cog'}
                  size={16}
                  color={execution.status === 'completed' ? NuminaColors.success : NuminaColors.chatGreen[500]}
                />
                <Text style={[styles.previewText, { color: isDarkMode ? '#FFF' : '#000' }]}>
                  {execution.toolName.replace('_', ' ')}
                </Text>
                <Text style={[styles.previewStatus, { color: isDarkMode ? '#AAA' : '#666' }]}>
                  {execution.status}
                </Text>
              </View>
            ))}

            {executions.length === 0 && (
              <Text style={[styles.emptyText, { color: isDarkMode ? '#AAA' : '#666' }]}>
                No recent tool executions. Start a conversation to see AI processing in real-time!
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Floating tool overlay */}
        <FloatingToolOverlay
          isVisible={overlayVisible}
          onClose={() => setOverlayVisible(false)}
          executions={executions}
          currentExecution={currentExecution}
        />
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    // Simulated inset shadow
    overflow: 'hidden',
  },
  cardInsetShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    zIndex: 1,
    pointerEvents: 'none',
    // Simulate inset shadow: 8px x 12px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 0,
    backgroundColor: 'rgba(0,0,0,0.08)',
    opacity: 0.18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginRight: 4,
  },
  executionPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  previewText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  previewStatus: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  
  // Floating overlay styles
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdropTouchable: {
    flex: 1,
  },
  floatingDrawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: height * 0.4,
    maxHeight: height * 0.8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  drawerHeader: {
    paddingTop: 8,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  currentExecution: {
    padding: 20,
    borderBottomWidth: 1,
  },
  executionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  executionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  executionHistory: {
    flex: 1,
  },
  executionItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  executionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  executionName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    textTransform: 'capitalize',
  },
  executionTime: {
    fontSize: 12,
  },
  executionResult: {
    fontSize: 12,
    marginLeft: 24,
    lineHeight: 16,
  },
  liveStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});