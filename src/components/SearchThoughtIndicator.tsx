import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';

interface SearchResult {
  toolName: string;
  query?: string;
  searchType?: string;
  location?: string;
  results?: any[];
  message?: string;
  status?: 'searching' | 'found' | 'error';
}

interface SearchThoughtIndicatorProps {
  isSearching: boolean;
  searchResults: SearchResult[];
  emotionalState?: any;
}

export const SearchThoughtIndicator: React.FC<SearchThoughtIndicatorProps> = ({
  isSearching,
  searchResults,
  emotionalState,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Animation values for the 3D cube
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.8)).current;
  
  // Text cycling for search progress
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    if (isSearching) {
      // Start the cube rotation animation
      startCubeAnimation();
      
      // Show search indicator
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Stop animation and fade out
      Animated.timing(opacityAnim, {
        toValue: searchResults.length > 0 ? 0.7 : 0.4,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isSearching]);

  useEffect(() => {
    if (searchResults.length > 0) {
      // Cycle through search results
      const interval = setInterval(() => {
        setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length);
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [searchResults]);

  useEffect(() => {
    // Update display text based on current search or results
    if (isSearching) {
      setDisplayText('🔍 Searching...');
    } else if (searchResults.length > 0) {
      const current = searchResults[currentSearchIndex];
      if (current) {
        let text = '';
        switch (current.toolName) {
          case 'web_search':
            text = `🌐 Found: ${current.query || 'results'}`;
            break;
          case 'music_recommendations':
            text = `🎵 Music: ${current.message || 'playlist ready'}`;
            break;
          case 'reservation_booking':
            text = `🍽️ Restaurant: ${current.message || 'searching venues'}`;
            break;
          default:
            text = `🔧 ${current.toolName}: ${current.message || 'processing'}`;
        }
        setDisplayText(text);
      }
    } else if (emotionalState) {
      setDisplayText(`🧠 ${emotionalState.mood || 'Thinking'}...`);
    } else {
      setDisplayText('💭 Ready');
    }
  }, [isSearching, searchResults, currentSearchIndex, emotionalState]);

  const startCubeAnimation = () => {
    // Create a continuous rotation
    const rotationLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    rotationLoop.start();
    pulseLoop.start();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      {/* 3D Cube Visualization */}
      <Animated.View 
        style={[
          styles.cubeContainer,
          {
            transform: [
              { rotateY: rotation },
              { scale: scaleAnim },
            ],
            opacity: opacityAnim,
          }
        ]}
      >
        {/* Cube face */}
        <View style={[styles.cubeFace, isDark ? styles.cubeFaceDark : styles.cubeFaceLight]}>
          <Text style={[styles.cubeText, isDark ? styles.cubeTextDark : styles.cubeTextLight]}>
            {isSearching ? '🔍' : searchResults.length > 0 ? '✨' : '🧠'}
          </Text>
        </View>
      </Animated.View>

      {/* Status Text */}
      <View style={styles.textContainer}>
        <Text style={[styles.statusText, isDark ? styles.statusTextDark : styles.statusTextLight]}>
          {displayText}
        </Text>
        {searchResults.length > 0 && (
          <Text style={[styles.resultsCount, isDark ? styles.resultsCountDark : styles.resultsCountLight]}>
            {searchResults.length} search{searchResults.length !== 1 ? 'es' : ''} completed
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    minHeight: 60,
  },
  containerLight: {
    backgroundColor: `${NuminaColors.chatGreen[100]}40`,
    borderWidth: 1,
    borderColor: `${NuminaColors.chatGreen[300]}60`,
  },
  containerDark: {
    backgroundColor: `${NuminaColors.chatPurple[900]}40`,
    borderWidth: 1,
    borderColor: `${NuminaColors.chatPurple[700]}60`,
  },
  cubeContainer: {
    width: 32,
    height: 32,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cubeFace: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cubeFaceLight: {
    backgroundColor: `${NuminaColors.chatGreen[200]}60`,
    borderColor: `${NuminaColors.chatGreen[400]}80`,
  },
  cubeFaceDark: {
    backgroundColor: `${NuminaColors.chatPurple[800]}60`,
    borderColor: `${NuminaColors.chatPurple[600]}80`,
  },
  cubeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cubeTextLight: {
    color: NuminaColors.chatGreen[700],
  },
  cubeTextDark: {
    color: NuminaColors.chatPurple[300],
  },
  textContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusTextLight: {
    color: NuminaColors.chatGreen[800],
  },
  statusTextDark: {
    color: NuminaColors.chatPurple[200],
  },
  resultsCount: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  resultsCountLight: {
    color: `${NuminaColors.chatGreen[600]}CC`,
  },
  resultsCountDark: {
    color: `${NuminaColors.chatPurple[400]}CC`,
  },
});