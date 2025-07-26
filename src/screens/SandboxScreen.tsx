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
import { PageBackground } from '../components/ui/PageBackground';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { EnhancedSpinner } from '../components/loaders/EnhancedSpinner';
import { ModernLoader } from '../components/loaders/ModernLoader';
import { SandboxModalManager, SandboxModalManagerRef } from '../components/sandbox/SandboxModalManager';
import { SandboxInput } from '../components/sandbox/SandboxInput';
import { ANIMATION_DURATIONS, ERROR_MESSAGES, PROCESSING_MESSAGES } from '../constants/sandbox';
import pillButtonService from '../services/pillButtonService';
import ApiService from '../services/api';
import type { SandboxNode } from '../types/sandbox';

interface SandboxScreenProps {
  onNavigateBack?: () => void;
  // Optional dive parameters for deep research
  diveQuery?: string;
  diveContext?: any;
  diveType?: string;
}


export const SandboxScreen: React.FC<SandboxScreenProps> = ({ 
  onNavigateBack,
  diveQuery,
  diveContext,
  diveType
}) => {
  const { isDarkMode } = useTheme();
  
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
  const [showSubmitIndicator, setShowSubmitIndicator] = useState(false);

  // Simplified state management
  const [nodes, setNodes] = useState<SandboxNode[]>([]);

  // Modal Manager ref
  const modalManagerRef = useRef<SandboxModalManagerRef>(null);

  // Handle dive parameters from NodePortal
  useEffect(() => {
    if (diveQuery && modalManagerRef.current) {
      console.log('🌊 Auto-triggering dive generation:', { diveQuery, diveType, diveContext });
      
      // Set the query (updateQuery doesn't exist, we'll use input state directly)
      setInputText(diveQuery);
      setIsProcessing(true);
      setShowImmediateLoader(true);
      
      // Start the sandbox process with dive context
      modalManagerRef.current.startSandboxProcess(diveQuery, {
        selectedActions: ['research', 'explore'],
        diveContext,
        diveType,
        isDive: true
      }).catch((error) => {
        console.error('🌊 Dive generation failed:', error);
        setIsProcessing(false);
        setShowImmediateLoader(false);
      });
    }
  }, [diveQuery, diveContext, diveType]);

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


  // Cleanup on unmount - Static mode cleanup
  useEffect(() => {
    return () => {
      // Resource manager automatically cleans up component resources
      // No animation cleanup needed in static mode
    };
  }, []);

  const handleSubmit = async () => {
    // Pre-flight systems check before any query submission
    try {
      console.log('🔍 Starting pre-flight validation...');
      
      // Step 1: Basic input validation
      if (!inputText?.trim()) {
        console.error('❌ Pre-flight failed: Empty query');
        return;
      }
      
      if (isProcessing || showImmediateLoader) {
        console.error('❌ Pre-flight failed: Already processing');
        return;
      }
      
      // Step 2: Query content validation
      const trimmedQuery = inputText.trim();
      if (trimmedQuery.length < 3) {
        console.error('❌ Pre-flight failed: Query too short');
        return;
      }
      
      if (trimmedQuery.length > 2000) {
        console.error('❌ Pre-flight failed: Query too long');
        return;
      }
      
      // Step 3: Pill configuration validation
      let validatedActions = [...selectedActions];
      if (validatedActions.length === 0) {
        validatedActions = ['explore'];
        setSelectedActions(validatedActions);
      }
      
      // Validate pill combination
      const pillValidation = pillButtonService.validatePillCombination(validatedActions);
      if (!pillValidation.isValid) {
        console.error('❌ Pre-flight failed: Invalid pill combination', pillValidation.warnings);
        return;
      }
      
      // Step 4: Network connectivity check (basic)
      try {
        const healthCheck = await ApiService.get('/health');
        if (!healthCheck.success) {
          console.error('❌ Pre-flight failed: Server health check failed');
          return;
        }
      } catch (networkError) {
        console.warn('⚠️ Network check failed, proceeding anyway:', networkError);
      }
      
      // Step 5: Modal manager validation
      if (!modalManagerRef.current) {
        console.error('❌ Pre-flight failed: Modal manager not ready');
        return;
      }
      
      console.log('✅ Pre-flight validation passed');
      
      // All systems clear - proceed with submission
      Keyboard.dismiss();
      setShowSubmitIndicator(true); // Show submit indicator immediately
      setShowImmediateLoader(true);
      
      const useUBPM = validatedActions.includes('ubpm');
      
      // Brief delay for UI cohesion, then start research AI experience
      setTimeout(() => {
        setShowImmediateLoader(false);
        setIsProcessing(true);
        startResearchExperience(useUBPM);
      }, 500);
      
    } catch (error) {
      console.error('❌ Pre-flight validation failed with error:', error);
      setShowImmediateLoader(false);
      setIsProcessing(false);
    }
  };

  const startResearchExperience = async (useUBPM: boolean) => {
    try {
      console.log('🔬 Starting Research AI Experience');
      console.log('📝 Query:', inputText.trim());
      console.log('🎯 Actions:', selectedActions);
      console.log('🧠 UBPM Mode:', useUBPM);
      
      // Additional runtime validation
      if (!inputText?.trim()) {
        throw new Error('Query became empty during processing');
      }
      
      if (!selectedActions || selectedActions.length === 0) {
        throw new Error('No actions selected during processing');
      }
      
      // Process pill actions with backend service and USE the result
      const pillConfig = await pillButtonService.processPillActions(
        selectedActions,
        inputText.trim(),
        { useUBPM }
      );
      
      if (!pillConfig || !pillConfig.success) {
        throw new Error(`Pill configuration failed: ${pillConfig?.error || 'Unknown error'}`);
      }
      
      console.log('💊 Pill configuration successful:', pillConfig);
      
      // Final modal manager validation
      if (!modalManagerRef.current) {
        throw new Error('Modal manager became unavailable during processing');
      }
      
      // Start sandbox process with ACTUAL pill configuration integration
      await modalManagerRef.current.startSandboxProcess(inputText.trim(), {
        selectedActions,
        pillConfig: pillConfig.data, // This is now properly used
        useUBPM,
        includeUserData: true,
        generateConnections: true,
      });
      
      // Clear input only on success
      setInputText('');
      setSelectedActions([]);
      
    } catch (error) {
      console.error('❌ Research experience failed:', error);
      
      // Show user-friendly error handling
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        console.error('Network error detected - check connection');
      } else if (error.message?.includes('pill') || error.message?.includes('configuration')) {
        console.error('Configuration error - resetting pills');
        setSelectedActions([]);
      } else {
        console.error('Unknown error occurred during processing');
      }
      
      // Always reset processing state on error
      setIsProcessing(false);
      setShowImmediateLoader(false);
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



  return (
    <ScreenWrapper
      showHeader={true}
      showBackButton={true}
      showMenuButton={true}
      title="Sandbox"
      subtitle="Collaborative discovery environment"
      onBackPress={onNavigateBack}
      headerProps={{
        isVisible: !isInputFocused,
        style: {
          top: Platform.OS === 'ios' ? 50 : 15,
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
              {!isProcessing && (
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


              {/* TODO: Add Research AI Experience UI components here */}



            </Animated.View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </PageBackground>

      {/* SandboxModalManager */}
      <SandboxModalManager
        ref={modalManagerRef}
        onNodesGenerated={(newNodes) => {
          // Simple node display
          setNodes(newNodes);
          setIsProcessing(false);
          console.log('✅ Nodes received and displayed:', newNodes.length);
        }}
        onError={handleModalError}
        onStreamingMessage={(message) => {
          console.log('🎯 SandboxScreen: Received LLAMA message:', message);
          // Hide submit indicator when streaming starts
          if (message && showSubmitIndicator) {
            setShowSubmitIndicator(false);
          }
        }}
        onProcessComplete={() => {
          setIsProcessing(false);
          setShowImmediateLoader(false);
          setShowSubmitIndicator(false); // Ensure submit indicator is hidden
        }}
      />

      {/* Modern immediate loader */}
      <ModernLoader
        visible={showImmediateLoader}
        showSpinner={true}
        message=""
      />

      {/* Submit indicator overlay */}
      {showSubmitIndicator && (
        <View style={styles.submitIndicatorOverlay}>
          <View style={[
            styles.submitIndicatorContainer,
            { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }
          ]}>
            <EnhancedSpinner size={40} color={isDarkMode ? '#fff' : '#000'} />
            <Text style={[
              styles.submitIndicatorText,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              Processing...
            </Text>
          </View>
        </View>
      )}
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
  submitIndicatorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  submitIndicatorContainer: {
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitIndicatorText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
}); 