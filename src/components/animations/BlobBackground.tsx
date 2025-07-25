import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AnimatedColorBlob } from './AnimatedColorBlob';

interface BlobBackgroundProps {
  isDarkMode: boolean;
}

export const BlobBackground: React.FC<BlobBackgroundProps> = ({ isDarkMode }) => {
  const blobConfigs = [
    {
      colors: isDarkMode 
        ? ['#A4F4CF', '#7DD3FC', '#C084FC'] 
        : ['#C6D2FF', '#A78BFA', '#F472B6'],
      size: 250,
      duration: 25000,
      delay: 0,
    },
    {
      colors: isDarkMode 
        ? ['#FEE685', '#FFD872', '#FBBF24'] 
        : ['#FFD872', '#FEE685', '#F59E0B'],
      size: 180,
      duration: 30000,
      delay: 2000,
    },
    {
      colors: isDarkMode 
        ? ['#C084FC', '#F472B6', '#EC4899'] 
        : ['#A78BFA', '#F472B6', '#EC4899'],
      size: 220,
      duration: 22000,
      delay: 4000,
    },
    {
      colors: isDarkMode 
        ? ['#7DD3FC', '#A4F4CF', '#34D399'] 
        : ['#60A5FA', '#C6D2FF', '#93C5FD'],
      size: 160,
      duration: 28000,
      delay: 1000,
    },
    {
      colors: isDarkMode 
        ? ['#FBBF24', '#F59E0B', '#EAB308'] 
        : ['#FDE047', '#FACC15', '#EAB308'],
      size: 200,
      duration: 26000,
      delay: 3000,
    },
  ];

  return (
    <View style={styles.container} pointerEvents="none">
      {blobConfigs.map((config, index) => (
        <AnimatedColorBlob
          key={index}
          colors={config.colors as [string, string, ...string[]]}
          size={config.size}
          duration={config.duration}
          delay={config.delay}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});

export default BlobBackground;