import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

interface AnimatedToolTextProps {
  text: string;
  style?: any;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

export const AnimatedToolText: React.FC<AnimatedToolTextProps> = ({
  text,
  style,
  numberOfLines = 1,
  ellipsizeMode = 'tail'
}) => {
  const letterAnimations = useRef<Animated.Value[]>([]);
  const previousText = useRef<string>('');

  // Initialize animations for each character
  useEffect(() => {
    const textLength = text.length;
    
    // Only reinitialize if text length changed significantly or text is completely different
    const shouldReinitialize = 
      letterAnimations.current.length !== textLength || 
      !text.startsWith(previousText.current.substring(0, Math.min(previousText.current.length, text.length)));

    if (shouldReinitialize) {
      letterAnimations.current = Array.from({ length: textLength }, (_, i) => {
        const existingAnim = letterAnimations.current[i];
        if (existingAnim) {
          return existingAnim;
        }
        return new Animated.Value(0);
      });
    }

    previousText.current = text;
  }, [text]);

  // Animate letters when text changes
  useEffect(() => {
    if (!text || letterAnimations.current.length === 0) return;

    // Reset all animations
    letterAnimations.current.forEach(anim => anim.setValue(0));

    // Create staggered letter animations
    const animations = letterAnimations.current.map((anim, index) => {
      return Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 15, // 15ms stagger between letters
        useNativeDriver: true,
      });
    });

    // Start all animations in parallel with stagger
    Animated.stagger(15, animations).start();
  }, [text]);

  // Split text into characters for individual animation
  const renderAnimatedText = () => {
    if (!text) return null;

    return text.split('').map((char, index) => {
      const animation = letterAnimations.current[index];
      
      if (!animation) return null;

      // Create different animation effects based on character type
      const isEmoji = /[\u{1F300}-\u{1F6FF}]|[\u{2600}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]/u.test(char);
      const isSpace = char === ' ';
      
      if (isSpace) {
        return <Text key={index} style={style}> </Text>;
      }

      return (
        <Animated.Text
          key={`${char}-${index}-${text.length}`} // Unique key that changes with text
          style={[
            style,
            {
              opacity: animation,
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 0.8, 1],
                    outputRange: [8, -1, 0],
                  }),
                },
                {
                  scale: isEmoji 
                    ? animation.interpolate({
                        inputRange: [0, 0.6, 1],
                        outputRange: [0.7, 1.05, 1],
                      })
                    : animation.interpolate({
                        inputRange: [0, 0.8, 1],
                        outputRange: [0.9, 1.02, 1],
                      })
                },
                {
                  rotateZ: isEmoji
                    ? animation.interpolate({
                        inputRange: [0, 0.6, 1],
                        outputRange: ['-3deg', '2deg', '0deg'],
                      })
                    : '0deg'
                }
              ],
            },
          ]}
        >
          {char}
        </Animated.Text>
      );
    });
  };

  // For ellipsis support, we need to wrap in a container
  if (numberOfLines === 1 && ellipsizeMode) {
    return (
      <View style={[styles.container, { flexDirection: 'row' }]}>
        <View style={styles.textContainer}>
          {renderAnimatedText()}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderAnimatedText()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  textContainer: {
    flexDirection: 'row',
    flex: 1,
    overflow: 'hidden',
  },
});

export default AnimatedToolText;