import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

interface ShimmerTextProps {
  children: string;
  style?: TextStyle;
  duration?: number;
}

export const ShimmerText: React.FC<ShimmerTextProps> = ({
  children,
  style,
  duration = 2500
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => animate(), 200);
      });
    };
    
    animate();
  }, [animatedValue, duration]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View>
      <MaskedView
        style={{ flexDirection: 'row', height: style?.fontSize ? style.fontSize : 20 }}
        maskElement={
          <Text style={[style, { backgroundColor: 'transparent' }]}>
            {children}
          </Text>
        }
      >
        <Animated.View
          style={{
            flex: 1,
            flexDirection: 'row',
            transform: [{ translateX }],
          }}
        >
          <LinearGradient
            colors={['#7BA7E7', '#7BA7E7', '#add5fa', '#ffffff', '#add5fa', '#7BA7E7', '#7BA7E7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              width: 300,
            }}
            locations={[0, 0.3, 0.4, 0.5, 0.6, 0.7, 1]}
          />
        </Animated.View>
      </MaskedView>
    </View>
  );
};