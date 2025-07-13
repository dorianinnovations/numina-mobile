import React, { useState, useEffect } from 'react';
import { View, Image, Animated, StyleSheet, ImageSourcePropType } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface OptimizedImageProps {
  source: ImageSourcePropType;
  style?: any;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'repeat' | 'center';
  showLoader?: boolean;
  preload?: boolean;
}

/**
 * Optimized Image Component with preloading and smooth fade-in
 * Eliminates the cheap look of slow image loading
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  resizeMode = 'contain',
  showLoader = true,
  preload = true,
}) => {
  const { isDarkMode } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    if (preload && source) {
      try {
        // Handle both local and remote images
        const uri = typeof source === 'string' ? source : Image.resolveAssetSource(source).uri;
        if (uri) {
          Image.prefetch(uri).catch(() => {
            setIsError(true);
          });
        }
      } catch (error) {
        setIsError(true);
      }
    }
  }, [source, preload]);

  const handleLoad = () => {
    setIsLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Set loaded to true immediately for local images if no preload
  useEffect(() => {
    if (!preload && source) {
      setIsLoaded(true);
      fadeAnim.setValue(1);
    }
  }, [source, preload]);

  const handleError = () => {
    setIsError(true);
    setIsLoaded(true);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Loading placeholder */}
      {showLoader && !isLoaded && (
        <View 
          style={[
            styles.placeholder, 
            { 
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            }
          ]}
        >
          {/* Shimmer effect */}
          <Animated.View 
            style={[
              styles.shimmer,
              {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              }
            ]}
          />
        </View>
      )}
      
      {/* Actual image */}
      {source && (
        <Animated.View style={{ opacity: fadeAnim }}>
          <Image
            source={source}
            style={[styles.image, style]}
            resizeMode={resizeMode}
            onLoad={handleLoad}
            onError={handleError}
            fadeDuration={0} // Disable default fade, use our custom one
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
  shimmer: {
    flex: 1,
    borderRadius: 8,
  },
  image: {
    borderRadius: 8,
  },
});

export default OptimizedImage;