import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { StreamingMarkdown } from '../text/StreamingMarkdown';
import LottieView from 'lottie-react-native';
import { getWebSocketService } from '../../services/websocketService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ChainStep {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed';
  message?: string;
  timestamp?: string;
}

interface WorkflowStep {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'active' | 'completed';
}

interface WorkflowData {
  type: 'workflow_started' | 'step_progress' | 'workflow_completed';
  workflow?: {
    name: string;
    description: string;
    totalSteps: number;
  };
  currentStep?: WorkflowStep;
  overallProgress: number;
  message: string;
  completionTime?: number;
}

interface ChainOfThoughtProgressProps {
  visible: boolean;
  currentStep: string;
  steps: ChainStep[];
  streamingMessage?: string;
  onComplete?: () => void;
}

export const ChainOfThoughtProgress: React.FC<ChainOfThoughtProgressProps> = ({
  visible,
  currentStep,
  steps,
  streamingMessage,
  onComplete,
}) => {
  const { isDarkMode } = useTheme();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const loaderRotation = useRef(new Animated.Value(0)).current;
  const [capturedMessages, setCapturedMessages] = useState<string[]>([]);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [allTextRendered, setAllTextRendered] = useState(false);
  const messageAnims = useRef<Map<number, Animated.Value>>(new Map()).current;
  
  // Workflow progress state
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null);
  const [workflowComplete, setWorkflowComplete] = useState(false);


  // Fade in/out animation
  useEffect(() => {
    if (visible) {
      // Gentle delay before appearing
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 150);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  // Loader rotation animation
  useEffect(() => {
    if (visible && !showCompleted && !workflowComplete) {
      loaderRotation.setValue(0);
      Animated.loop(
        Animated.timing(loaderRotation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [visible, showCompleted, workflowComplete, loaderRotation]);

  // WebSocket listener for workflow progress
  useEffect(() => {
    if (!visible) return;

    const wsService = getWebSocketService();
    
    const handleWorkflowMessage = (data: any) => {
      console.log('🎯 ChainOfThoughtProgress: Received workflow message:', data);
      
      if (data.updateData) {
        const workflowUpdate: WorkflowData = {
          type: data.updateData.type,
          workflow: data.updateData.workflow,
          currentStep: data.updateData.currentStep,
          overallProgress: data.updateData.overallProgress || 0,
          message: data.updateData.message || '',
          completionTime: data.updateData.completionTime
        };
        
        setWorkflowData(workflowUpdate);
        
        // Mark as complete when workflow is finished
        if (workflowUpdate.type === 'workflow_completed') {
          setWorkflowComplete(true);
          setTimeout(() => {
            if (onComplete) {
              onComplete();
            }
          }, 2000); // Give 2 seconds to show completion before fading
        }
      }
    };

    // Listen for workflow messages
    wsService.addEventListener('sandbox_workflow', handleWorkflowMessage);
    
    // Also try to connect if not connected
    if (!wsService.isConnected()) {
      wsService.initialize().catch(console.warn);
    }

    return () => {
      wsService.removeEventListener('sandbox_workflow', handleWorkflowMessage);
    };
  }, [visible, onComplete]);

  // Detect when all text has finished rendering - INCREASED DELAY TO ENSURE VISIBILITY
  useEffect(() => {
    if (capturedMessages.length > 0) {
      // Wait for streaming to complete (no new messages for 5 seconds) - EXTENDED DELAY
      const renderCheckTimer = setTimeout(() => {
        setAllTextRendered(true);
      }, 5000);
      
      return () => clearTimeout(renderCheckTimer);
    }
  }, [streamingMessage, capturedMessages]);

  // Show completed state only after all text is rendered
  useEffect(() => {
    if (allTextRendered && capturedMessages.length > 0) {
      // Small delay after text completion for smooth transition
      const completionTimer = setTimeout(() => {
        setShowCompleted(true);
      }, 500);
      
      return () => clearTimeout(completionTimer);
    }
  }, [allTextRendered, capturedMessages.length]);

  // Capture streaming messages with staggered animations - Updated for simplified narration
  useEffect(() => {
    console.log('🎯 ChainOfThoughtProgress: Received narration:', {
      message: streamingMessage,
      trimmed: streamingMessage?.trim(),
      length: streamingMessage?.length,
      type: typeof streamingMessage
    });
    
    // Only process non-empty messages to prevent flickering
    if (streamingMessage && streamingMessage.trim() && streamingMessage.trim().length > 0) {
      const trimmed = streamingMessage.trim();
      console.log('✅ Chain of thought message:', trimmed);
    }
    
    if (streamingMessage && streamingMessage.trim() && streamingMessage.trim().length > 0) {
      setCapturedMessages(prev => {
        const trimmedMessage = streamingMessage.trim();
        // Check if this message is already captured to prevent duplicates
        if (prev.includes(trimmedMessage)) {
          console.log('🔄 Duplicate message prevented:', trimmedMessage);
          return prev;
        }
        
        const newMessages = [...prev, trimmedMessage];
        const messageIndex = newMessages.length - 1;
        console.log('✅ Adding new narration to display:', trimmedMessage);
        
        // Create animation value for this message if it doesn't exist
        if (!messageAnims.has(messageIndex)) {
          messageAnims.set(messageIndex, new Animated.Value(0));
        }
        
        // REDUCED DELAYS FOR IMMEDIATE VISIBILITY
        const isFirstMessage = messageIndex === 0;
        const randomDelay = isFirstMessage ? 10 : 50; // Much faster appearance
        const animDuration = isFirstMessage ? 150 : 200; // Faster animation
        
        setTimeout(() => {
          const anim = messageAnims.get(messageIndex);
          if (anim) {
            Animated.timing(anim, {
              toValue: 1,
              duration: animDuration,
              useNativeDriver: true,
            }).start();
          }
        }, randomDelay);
        
        return newMessages;
      });
      setIsFirstMessage(false);
    }
  }, [streamingMessage, messageAnims]);

  // Reset when modal becomes visible
  useEffect(() => {
    if (visible) {
      setCapturedMessages([]);
      setIsFirstMessage(true);
      setShowCompleted(false);
      setAllTextRendered(false);
      setWorkflowData(null);
      setWorkflowComplete(false);
      loaderRotation.setValue(0);
      messageAnims.clear(); // Clear all message animations
    }
  }, [visible, loaderRotation, messageAnims]);

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          opacity: fadeAnim,
          backgroundColor: isDarkMode ? '#0F0F0F' : '#FFFFFF'
        }
      ]}
    >
      <View style={styles.centerContainer}>
        {/* Always show placeholder with loader - keep it consistent */}
        <View style={styles.placeholderRow}>
          <View style={styles.loaderContainer}>
            {(showCompleted || workflowComplete) ? (
              // Completed checkmark
              <View style={[
                styles.completedCircle,
                { 
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)' 
                }
              ]}>
                <Text style={[
                  styles.checkmark,
                  { color: isDarkMode ? '#0F0F0F' : '#FFFFFF' }
                ]}>
                  ✓
                </Text>
              </View>
            ) : (
              // Animated Lottie loader for LLAMA processing
              <View style={{ width: 40, height: 40 }}>
                <LottieView
                  source={require('../../../assets/Loading.json')}
                  autoPlay
                  loop
                  style={{
                    width: 40,
                    height: 40,
                  }}
                />
              </View>
            )}
          </View>
          <Text style={[
            styles.unifiedText,
            { 
              color: isDarkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.6)' 
            }
          ]}>
            {workflowData?.workflow?.name || 'Observing Numina...'}
          </Text>
        </View>

        {/* Show workflow progress */}
        {workflowData && (
          <View style={styles.workflowContainer}>
            {/* Current step info */}
            {workflowData.currentStep && (
              <View style={styles.stepContainer}>
                <Text style={[
                  styles.stepName,
                  { color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)' }
                ]}>
                  {workflowData.currentStep.name}
                </Text>
                <View style={[
                  styles.progressBar,
                  { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
                ]}>
                  <View style={[
                    styles.progressFill,
                    { 
                      width: `${workflowData.currentStep.progress}%`,
                      backgroundColor: workflowData.currentStep.status === 'completed' ? '#10B981' : '#3B82F6'
                    }
                  ]} />
                </View>
              </View>
            )}
            
            {/* Current message */}
            {workflowData.message && (
              <Text style={[
                styles.workflowMessage,
                { color: isDarkMode ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.65)' }
              ]}>
                {workflowData.message}
              </Text>
            )}
            
            {/* Overall progress */}
            <View style={styles.overallProgressContainer}>
              <Text style={[
                styles.progressLabel,
                { color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)' }
              ]}>
                Overall Progress: {workflowData.overallProgress}%
              </Text>
              <View style={[
                styles.overallProgressBar,
                { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)' }
              ]}>
                <View style={[
                  styles.overallProgressFill,
                  { 
                    width: `${workflowData.overallProgress}%`,
                    backgroundColor: workflowData.type === 'workflow_completed' ? '#10B981' : '#8B5CF6'
                  }
                ]} />
              </View>
            </View>
          </View>
        )}

        {/* Fallback to captured messages if no workflow data */}
        {!workflowData && capturedMessages.length > 0 && (
          <View style={styles.messagesContainer}>
            {capturedMessages.map((message, index) => {
              const animValue = messageAnims.get(index) || new Animated.Value(0);
              return (
                <Animated.View 
                  key={index} 
                  style={[
                    styles.messageRow,
                    {
                      opacity: animValue,
                      transform: [{
                        translateY: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={[
                    styles.unifiedText,
                    { 
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.75)' 
                    }
                  ]}>
                    {message}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 9999,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 40,
    width: '100%',
  },
  placeholderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loaderContainer: {
    marginRight: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  completedCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  unifiedText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0.2,
    flex: 1,
  },
  messagesContainer: {
    width: '100%',
    maxWidth: screenWidth * 0.85,
    marginTop: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  messagePrefix: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
    minWidth: 20,
    textAlign: 'right',
  },
  // Workflow progress styles
  workflowContainer: {
    width: '100%',
    maxWidth: screenWidth * 0.85,
    marginTop: 16,
    paddingHorizontal: 12,
  },
  stepContainer: {
    marginBottom: 12,
  },
  stepName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  workflowMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  overallProgressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 6,
  },
  overallProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.5s ease',
  },
});