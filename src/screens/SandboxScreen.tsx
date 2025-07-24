import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { PageBackground } from '../components/PageBackground';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { EnhancedSpinner } from '../components/EnhancedSpinner';
import { ModernLoader } from '../components/ModernLoader';
import { SandboxModalManager, SandboxModalManagerRef } from '../components/SandboxModalManager';
import { SandboxInput } from '../components/SandboxInput';
import { SandboxNodes } from '../components/SandboxNodes';
import { useSandboxData } from '../hooks/useSandboxData';
import { useStableSandboxState } from '../hooks/useStableSandboxState';
import { ANIMATION_DURATIONS, ERROR_MESSAGES, PROCESSING_MESSAGES } from '../constants/sandbox';
import { useResourceManager } from '../utils/resourceManager';
import { useExtremeAnimations } from '../utils/extremeAnimationSystem';
import NodeCanvas from '../components/NodeCanvas';
import getOptimizedWebSocketService from '../services/optimizedWebSocketService';
import type { SandboxNode } from '../types/sandbox';

interface SandboxScreenProps {
  onNavigateBack?: () => void;
}


export const SandboxScreen: React.FC<SandboxScreenProps> = ({ 
  onNavigateBack 
}) => {
  const { isDarkMode } = useTheme();
  const componentId = 'sandbox-screen';
  const { createTimeout, createInterval, createAbortController } = useResourceManager(componentId);
  const { createBoundedAnimation, createSafeLoop, startAnimation } = useExtremeAnimations(componentId);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cursorAnim = useRef(new Animated.Value(1)).current;
  const pillsAnim = useRef(new Animated.Value(0)).current;
  const inputContainerAnim = useRef(new Animated.Value(0)).current;
  const contentOffsetAnim = useRef(new Animated.Value(0)).current;
  const buttonContentAnim = useRef(new Animated.Value(1)).current;
  const sendButtonAnim = useRef(new Animated.Value(0)).current;
  const sendButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const headerOpacityAnim = useRef(new Animated.Value(1)).current;

  // State management
  const [inputText, setInputText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showImmediateLoader, setShowImmediateLoader] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');

  // Custom hooks - Static mode (no animations)
  const [sandboxState, sandboxActions] = useStableSandboxState();
  const { nodes, lockedNodes, nodeConnections, showNodes } = sandboxState;
  const { 
    handleNodesGenerated,
    handleLockNode,
    handleUnlockNode,
    saveSandboxSession,
    buildContextFromLockedNodes,
  } = useSandboxData();

  // Modal Manager ref
  const modalManagerRef = useRef<SandboxModalManagerRef>(null);

  // Initial animations
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATION_DURATIONS.FADE_IN,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Simple cursor animation that stops when input not focused
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    
    if (isInputFocused) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cursorAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      
      animation.start();
    }
    
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isInputFocused, cursorAnim]);

  // Keyboard handling
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const keyboardHeight = e.endCoordinates.height;
        Animated.timing(contentOffsetAnim, {
          toValue: -keyboardHeight * 0.4,
          duration: Platform.OS === 'ios' ? ANIMATION_DURATIONS.KEYBOARD_SHOW : 200,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        Animated.timing(contentOffsetAnim, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? ANIMATION_DURATIONS.KEYBOARD_HIDE : 200,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [contentOffsetAnim]);

  // Input focus animations
  useEffect(() => {
    Animated.timing(pillsAnim, {
      toValue: isInputFocused ? 1 : 0,
      duration: ANIMATION_DURATIONS.PILLS_FADE,
      useNativeDriver: true,
    }).start();

    Animated.timing(inputContainerAnim, {
      toValue: isInputFocused ? -40 : 0,
      duration: ANIMATION_DURATIONS.INPUT_CONTAINER,
      useNativeDriver: true,
    }).start();
  }, [isInputFocused, pillsAnim, inputContainerAnim]);

  // Send button animations
  useEffect(() => {
    const shouldShowButton = inputText.trim().length > 0 || selectedActions.length > 0;
    
    if (shouldShowButton) {
      setTimeout(() => {
        Animated.timing(sendButtonAnim, {
          toValue: 1,
          duration: ANIMATION_DURATIONS.SEND_BUTTON_IN,
          useNativeDriver: true,
        }).start();
      }, 50);
    } else {
      Animated.timing(sendButtonAnim, {
        toValue: 0,
        duration: ANIMATION_DURATIONS.SEND_BUTTON_OUT,
        useNativeDriver: true,
      }).start();
    }

    if (isInputFocused) {
      const textLength = inputText.length;
      const adjustmentOffset = Math.min(textLength * 0.3, 15);
      
      Animated.timing(inputContainerAnim, {
        toValue: -40 + adjustmentOffset,
        duration: ANIMATION_DURATIONS.INPUT_CONTAINER,
        useNativeDriver: true,
      }).start();
    }
  }, [inputText, selectedActions, isInputFocused, sendButtonAnim, inputContainerAnim]);

  // Button content animations
  useEffect(() => {
    Animated.sequence([
      Animated.timing(buttonContentAnim, {
        toValue: 0.7,
        duration: ANIMATION_DURATIONS.BUTTON_CONTENT,
        useNativeDriver: true,
      }),
      Animated.timing(buttonContentAnim, {
        toValue: 1,
        duration: ANIMATION_DURATIONS.BUTTON_CONTENT_RESET,
        useNativeDriver: true,
      })
    ]).start();
  }, [selectedActions, buttonContentAnim]);

  // Header animations
  useEffect(() => {
    Animated.timing(headerOpacityAnim, {
      toValue: isInputFocused ? 0 : 1,
      duration: ANIMATION_DURATIONS.HEADER_FADE,
      useNativeDriver: true,
    }).start();
  }, [isInputFocused, headerOpacityAnim]);

  // WebSocket integration for real-time insight nodes - Fixed dependencies
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const setupInsightNodeListener = async () => {
      try {
        const webSocketService = getOptimizedWebSocketService('https://server-a7od.onrender.com');
        
        await webSocketService.initialize();
        
        const handleInsightNodeArrival = (data: any) => {
          console.log('🔮 Insight Node arriving:', data);
          
          if (data.type === 'insight_discovery' && data.insightNode) {
            const insightNode: SandboxNode = {
              ...data.insightNode,
              isInsightNode: true,
              position: data.insightNode.position || {
                x: Math.random() * 200 + 100,
                y: Math.random() * 300 + 150,
              }
            };
            
            // Direct state update without timeout to prevent loops
            sandboxActions.addNode(insightNode);
          }
        };
        
        const handlerId = webSocketService.addEventListener(
          'insight_discovery', 
          handleInsightNodeArrival,
          { priority: 'high', timeout: 300000 }
        );
        
        cleanup = () => {
          webSocketService.removeEventListener('insight_discovery', handlerId);
        };
        
      } catch (error) {
        console.warn('WebSocket setup failed:', error);
      }
    };
    
    setupInsightNodeListener();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [sandboxActions]);

  // Cleanup on unmount - Static mode cleanup
  useEffect(() => {
    return () => {
      // Resource manager automatically cleans up component resources
      // No animation cleanup needed in static mode
    };
  }, []);

  const handleSubmit = () => {
    if (inputText.trim() && !isProcessing && !showImmediateLoader) {
      // Dismiss keyboard immediately
      Keyboard.dismiss();
      
      // Show immediate loader right away
      setShowImmediateLoader(true);
      
      if (selectedActions.length === 0) {
        setSelectedActions(['explore']);
      }
      
      // Check if UBPM pill is selected
      const useUBPM = selectedActions.includes('ubpm');
      
      // Mandatory 3s delay for cohesion, then start processing
      createTimeout(() => {
        setShowImmediateLoader(false);
        setIsProcessing(true);
        startChainOfThoughtProcess(useUBPM);
      }, 3000, 'high');
    }
  };


  const startChainOfThoughtProcess = async (useUBPM: boolean) => {
    try {
      // Build enhanced query with locked context
      const lockedContext = buildContextFromLockedNodes();
      const enhancedQuery = lockedContext + inputText + ' ' + selectedActions.join(' ');
      
      // Start process via modal manager (original working approach)
      if (modalManagerRef.current) {
        await modalManagerRef.current.startSandboxProcess(enhancedQuery, {
          actions: selectedActions,
          useUBPM,
          includeUserData: true,
          generateConnections: true,
        });
      }
      
      // Clear input
      setInputText('');
      setSelectedActions([]);
      setIsProcessing(false);
    } catch (error) {
      console.error(ERROR_MESSAGES.CHAIN_OF_THOUGHT_FAILED, error);
      setIsProcessing(false);
    }
  };


  const handleModalError = (error: any) => {
    console.error(ERROR_MESSAGES.MODAL_PROCESS_FAILED, error);
    setIsProcessing(false);
  };

  const handleNodePress = (node: SandboxNode) => {
    if (modalManagerRef.current) {
      modalManagerRef.current.showNode(node);
    }
  };


  const renderProcessingState = () => (
    <View style={styles.processingContainer}>
      <EnhancedSpinner type="holographic" size={24} />
      <Text style={[styles.processingText, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
        {PROCESSING_MESSAGES.WEAVING_CONNECTIONS}
      </Text>
    </View>
  );

  return (
    <ScreenWrapper
      showHeader={true}
      showBackButton={true}
      showMenuButton={true}
      title="Sandbox"
      subtitle="Collaborative discovery environment"
      onBackPress={onNavigateBack}
      headerProps={{
        style: {
          top: Platform.OS === 'ios' ? 50 : 15,
          opacity: headerOpacityAnim,
        },
      }}
    >
      <PageBackground>
        <SafeAreaView style={styles.container}>
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              {!isProcessing && !showNodes && (
                <SandboxInput
                  inputText={inputText}
                  setInputText={setInputText}
                  isInputFocused={isInputFocused}
                  setIsInputFocused={setIsInputFocused}
                  selectedActions={selectedActions}
                  setSelectedActions={setSelectedActions}
                  isProcessing={isProcessing}
                  showChainOfThought={false}
                  onSubmit={handleSubmit}
                  contentOffsetAnim={contentOffsetAnim}
                  inputContainerAnim={inputContainerAnim}
                  sendButtonAnim={sendButtonAnim}
                  sendButtonScaleAnim={sendButtonScaleAnim}
                  buttonContentAnim={buttonContentAnim}
                  pillsAnim={pillsAnim}
                  cursorAnim={cursorAnim}
                />
              )}

              {isProcessing && renderProcessingState()}

              {showNodes && (
                <NodeCanvas 
                  nodes={nodes}
                  onNodePress={handleNodePress}
                  onLockNode={(node) => {
                    sandboxActions.lockNode(node.id);
                    handleLockNode(node);
                  }}
                  onUnlockNode={(nodeId) => {
                    sandboxActions.lockNode(nodeId);
                    handleUnlockNode(nodeId);
                  }}
                  lockedNodes={lockedNodes}
                  nodeConnections={nodeConnections}
                />
              )}



            </Animated.View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </PageBackground>

      {/* SandboxModalManager */}
      <SandboxModalManager
        ref={modalManagerRef}
        onNodesGenerated={(newNodes) => {
          // Immediate node display without processing state
          sandboxActions.batchUpdate({
            nodes: newNodes,
            showNodes: true,
          });
          setIsProcessing(false); // Clear processing immediately
          handleNodesGenerated(newNodes);
        }}
        onError={handleModalError}
        onStreamingMessage={(message) => {
          console.log('🎯 SandboxScreen: Received LLAMA message:', message);
        }}
        onProcessComplete={() => {
          setIsProcessing(false);
          setShowImmediateLoader(false);
        }}
      />

      {/* Modern immediate loader */}
      <ModernLoader
        visible={showImmediateLoader}
        showSpinner={true}
        message=""
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 75,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 24,
    textAlign: 'center',
  },
  streamingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  streamingText: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
}); 