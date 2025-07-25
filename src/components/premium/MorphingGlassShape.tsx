import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface SimpleBlobProps {
  style?: any;
}

export const SimpleBlob: React.FC<SimpleBlobProps> = ({ style }) => {
  const size = width * 0.4;
  const radius = size * 0.4;

  return (
    <View style={[styles.container, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="pastelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#E1F5FE" stopOpacity="0.8" />
            <Stop offset="35%" stopColor="#E8EAF6" stopOpacity="0.7" />
            <Stop offset="70%" stopColor="#F3E5F5" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#E8F5E8" stopOpacity="0.5" />
          </LinearGradient>
        </Defs>
        
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="url(#pastelGradient)"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SimpleBlob;
export { SimpleBlob as MorphingGlassShape };