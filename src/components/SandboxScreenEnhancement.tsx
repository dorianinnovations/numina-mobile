import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { SandboxModalManager } from './SandboxModalManager';
import { ChainOfThoughtProgress } from './ChainOfThoughtProgress';
import { SandboxNode } from '../types/sandbox';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SandboxScreenEnhancementProps {
  // Props that would come from the main SandboxScreen
  inputText: string;
  selectedActions: string[];
  isProcessing: boolean;
  onNodesGenerated: (nodes: SandboxNode[]) => void;
  onProcessingStart: () => void;
  onProcessingComplete: () => void;
  onError: (error: any) => void;
}

export const SandboxScreenEnhancement: React.FC<SandboxScreenEnhancementProps> = ({
  inputText,
  selectedActions,
  isProcessing,
  onNodesGenerated,
  onProcessingStart,
  onProcessingComplete,
  onError,
}) => {
  const [showChainOfThought, setShowChainOfThought] = useState(false);
  const modalManagerRef = useRef<any>(null);

  const handleSubmitWithEnhancedFlow = useCallback(async () => {
    if (!inputText.trim()) return;

    try {
      onProcessingStart();
      
      // Build the enhanced query with actions
      const enhancedQuery = inputText + ' ' + selectedActions.join(' ');
      
      // Prepare options for the chain of thought process
      const options = {
        actions: selectedActions,
        useUBPM: true, // Default to using UBPM data
        includeUserData: true,
        generateConnections: true,
        enhanceWithMedia: true
      };

      // Start the enhanced modal flow
      if (modalManagerRef.current) {
        await modalManagerRef.current.startProcess(enhancedQuery, options);
      }

    } catch (error) {
      console.error('Enhanced submission error:', error);
      onError(error);
      onProcessingComplete();
    }
  }, [inputText, selectedActions, onProcessingStart, onError]);

  const handleNodesGenerated = useCallback((nodes: SandboxNode[]) => {
    onProcessingComplete();
    onNodesGenerated(nodes);
  }, [onNodesGenerated, onProcessingComplete]);

  const handleProcessError = useCallback((error: any) => {
    onProcessingComplete();
    onError(error);
  }, [onProcessingComplete, onError]);

  // Expose the enhanced submit function to parent
  React.useImperativeHandle(modalManagerRef, () => ({
    startEnhancedSubmission: handleSubmitWithEnhancedFlow
  }));

  return (
    <View style={styles.container}>
      <SandboxModalManager
        ref={modalManagerRef}
        onNodesGenerated={handleNodesGenerated}
        onError={handleProcessError}
      />
    </View>
  );
};

// Hook for integrating with existing SandboxScreen
export const useSandboxEnhancement = () => {
  const enhancementRef = useRef<any>(null);

  const startEnhancedSubmission = useCallback((inputText: string, selectedActions: string[]) => {
    if (enhancementRef.current) {
      enhancementRef.current.startEnhancedSubmission();
    }
  }, []);

  const EnhancementComponent = useCallback((props: SandboxScreenEnhancementProps) => (
    <SandboxScreenEnhancement
      ref={enhancementRef}
      {...props}
    />
  ), []);

  return {
    EnhancementComponent,
    startEnhancedSubmission
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
});