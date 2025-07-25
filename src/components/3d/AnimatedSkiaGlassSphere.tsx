import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import { 
  Canvas, 
  Circle, 
  RadialGradient, 
  LinearGradient,
  vec, 
  Group, 
  Shadow,
  useSharedValueEffect,
  useValue,
  interpolate,
  Extrapolate
} from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const AnimatedSkiaGlassSphere = () => {
  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) * 0.3;
  
  // Animation values
  const progress = useSharedValue(0);
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);
  
  // Start animations
  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 4000 }), -1, false);
    rotation.value = withRepeat(withTiming(360, { duration: 8000 }), -1, false);
    pulse.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
  }, []);
  
  // Derived animated values
  const animatedRadius = useDerivedValue(() => {
    return baseRadius + Math.sin(pulse.value * Math.PI) * 15;
  });
  
  const highlight1X = useDerivedValue(() => {
    const angle = (progress.value * Math.PI * 2);
    return centerX + Math.cos(angle) * baseRadius * 0.3;
  });
  
  const highlight1Y = useDerivedValue(() => {
    const angle = (progress.value * Math.PI * 2);
    return centerY + Math.sin(angle) * baseRadius * 0.3;
  });
  
  const highlight2X = useDerivedValue(() => {
    const angle = (progress.value * Math.PI * 2) + Math.PI;
    return centerX + Math.cos(angle) * baseRadius * 0.4;
  });
  
  const highlight2Y = useDerivedValue(() => {
    const angle = (progress.value * Math.PI * 2) + Math.PI;
    return centerY + Math.sin(angle) * baseRadius * 0.4;
  });
  
  // Convert to Skia values
  const skiaRadius = useValue(0);
  const skiaH1X = useValue(0);
  const skiaH1Y = useValue(0);
  const skiaH2X = useValue(0);
  const skiaH2Y = useValue(0);
  
  useSharedValueEffect(() => {
    skiaRadius.current = animatedRadius.value;
  }, animatedRadius);
  
  useSharedValueEffect(() => {
    skiaH1X.current = highlight1X.value;
  }, highlight1X);
  
  useSharedValueEffect(() => {
    skiaH1Y.current = highlight1Y.value;
  }, highlight1Y);
  
  useSharedValueEffect(() => {
    skiaH2X.current = highlight2X.value;
  }, highlight2X);
  
  useSharedValueEffect(() => {
    skiaH2Y.current = highlight2Y.value;
  }, highlight2Y);

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Canvas style={{ flex: 1 }}>
        <Group>
          {/* Main glass sphere with breathing effect */}
          <Circle cx={centerX} cy={centerY} r={skiaRadius}>
            <Shadow dx={8} dy={12} blur={25} color="rgba(0,0,0,0.2)" />
            <RadialGradient
              c={vec(centerX - baseRadius * 0.3, centerY - baseRadius * 0.3)}
              r={baseRadius * 1.4}
              colors={[
                'rgba(255,255,255,0.95)',
                'rgba(240,248,255,0.7)',
                'rgba(230,243,255,0.4)',
                'rgba(200,230,255,0.15)',
                'rgba(180,220,255,0.05)'
              ]}
              positions={[0, 0.2, 0.5, 0.8, 1]}
            />
          </Circle>
          
          {/* Inner core with subtle animation */}
          <Circle cx={centerX} cy={centerY} r={skiaRadius.current * 0.65}>
            <RadialGradient
              c={vec(centerX - baseRadius * 0.2, centerY - baseRadius * 0.2)}
              r={baseRadius * 0.9}
              colors={[
                'rgba(255,255,255,0.85)',
                'rgba(230,243,255,0.6)',
                'rgba(200,230,255,0.3)',
                'rgba(180,220,255,0.1)'
              ]}
              positions={[0, 0.3, 0.7, 1]}
            />
          </Circle>
          
          {/* Animated highlight 1 */}
          <Circle cx={skiaH1X} cy={skiaH1Y} r={baseRadius * 0.2}>
            <RadialGradient
              c={vec(skiaH1X.current, skiaH1Y.current)}
              r={baseRadius * 0.25}
              colors={[
                'rgba(255,255,255,0.9)',
                'rgba(255,255,255,0.5)',
                'rgba(255,255,255,0.0)'
              ]}
              positions={[0, 0.6, 1]}
            />
          </Circle>
          
          {/* Animated highlight 2 */}
          <Circle cx={skiaH2X} cy={skiaH2Y} r={baseRadius * 0.12}>
            <RadialGradient
              c={vec(skiaH2X.current, skiaH2Y.current)}
              r={baseRadius * 0.15}
              colors={[
                'rgba(255,255,255,0.8)',
                'rgba(240,248,255,0.4)',
                'rgba(255,255,255,0.0)'
              ]}
              positions={[0, 0.5, 1]}
            />
          </Circle>
          
          {/* Prismatic rim effect */}
          <Circle cx={centerX} cy={centerY} r={skiaRadius.current * 0.98}>
            <LinearGradient
              start={vec(centerX - baseRadius, centerY - baseRadius)}
              end={vec(centerX + baseRadius, centerY + baseRadius)}
              colors={[
                'rgba(255,255,255,0.0)',
                'rgba(255,200,255,0.3)',  // Pink
                'rgba(200,255,255,0.4)',  // Cyan
                'rgba(255,255,200,0.3)',  // Yellow
                'rgba(200,255,200,0.2)',  // Green
                'rgba(255,255,255,0.0)'
              ]}
              positions={[0, 0.15, 0.35, 0.55, 0.75, 1]}
            />
          </Circle>
          
          {/* Depth shadow */}
          <Circle 
            cx={centerX + baseRadius * 0.15} 
            cy={centerY + baseRadius * 0.4} 
            r={baseRadius * 0.35}
          >
            <RadialGradient
              c={vec(centerX + baseRadius * 0.15, centerY + baseRadius * 0.4)}
              r={baseRadius * 0.4}
              colors={[
                'rgba(80,120,180,0.4)',
                'rgba(120,160,220,0.2)',
                'rgba(255,255,255,0.0)'
              ]}
              positions={[0, 0.6, 1]}
            />
          </Circle>
          
          {/* Caustic light patterns */}
          <Circle 
            cx={centerX - baseRadius * 0.6} 
            cy={centerY + baseRadius * 0.2} 
            r={baseRadius * 0.1}
          >
            <RadialGradient
              c={vec(centerX - baseRadius * 0.6, centerY + baseRadius * 0.2)}
              r={baseRadius * 0.15}
              colors={[
                'rgba(255,255,255,0.6)',
                'rgba(200,255,255,0.3)',
                'rgba(255,255,255,0.0)'
              ]}
              positions={[0, 0.4, 1]}
            />
          </Circle>
          
          <Circle 
            cx={centerX + baseRadius * 0.7} 
            cy={centerY - baseRadius * 0.3} 
            r={baseRadius * 0.08}
          >
            <RadialGradient
              c={vec(centerX + baseRadius * 0.7, centerY - baseRadius * 0.3)}
              r={baseRadius * 0.12}
              colors={[
                'rgba(255,255,255,0.7)',
                'rgba(255,200,255,0.3)',
                'rgba(255,255,255,0.0)'
              ]}
              positions={[0, 0.5, 1]}
            />
          </Circle>
        </Group>
      </Canvas>
    </View>
  );
};

export default AnimatedSkiaGlassSphere;