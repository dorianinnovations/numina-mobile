import React, { useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import { Canvas, Circle, LinearGradient, RadialGradient, vec, Group, Shadow, Blur } from '@shopify/react-native-skia';

const { width, height } = Dimensions.get('window');

const SkiaGlassSphere = () => {
  const centerX = width / 2;
  const centerY = height / 2;
  const sphereRadius = Math.min(width, height) * 0.3;
  
  // Create layered glass effect
  const glassSphere = useMemo(() => {
    return (
      <Group>
        {/* Outer glass sphere with shadow */}
        <Circle cx={centerX} cy={centerY} r={sphereRadius}>
          <Shadow dx={10} dy={15} blur={20} color="rgba(0,0,0,0.3)" />
          <RadialGradient
            c={vec(centerX - sphereRadius * 0.3, centerY - sphereRadius * 0.3)}
            r={sphereRadius * 1.2}
            colors={[
              'rgba(255,255,255,0.9)',
              'rgba(240,248,255,0.6)',
              'rgba(230,243,255,0.3)',
              'rgba(200,230,255,0.1)'
            ]}
            positions={[0, 0.3, 0.7, 1]}
          />
        </Circle>
        
        {/* Inner crystalline core */}
        <Circle cx={centerX} cy={centerY} r={sphereRadius * 0.6}>
          <RadialGradient
            c={vec(centerX - sphereRadius * 0.2, centerY - sphereRadius * 0.2)}
            r={sphereRadius * 0.8}
            colors={[
              'rgba(255,255,255,0.8)',
              'rgba(230,243,255,0.5)',
              'rgba(200,230,255,0.2)',
              'rgba(180,220,255,0.1)'
            ]}
            positions={[0, 0.4, 0.8, 1]}
          />
        </Circle>
        
        {/* Highlight reflection */}
        <Circle 
          cx={centerX - sphereRadius * 0.4} 
          cy={centerY - sphereRadius * 0.4} 
          r={sphereRadius * 0.25}
        >
          <RadialGradient
            c={vec(centerX - sphereRadius * 0.4, centerY - sphereRadius * 0.4)}
            r={sphereRadius * 0.3}
            colors={[
              'rgba(255,255,255,0.9)',
              'rgba(255,255,255,0.4)',
              'rgba(255,255,255,0.0)'
            ]}
            positions={[0, 0.6, 1]}
          />
        </Circle>
        
        {/* Secondary highlight */}
        <Circle 
          cx={centerX + sphereRadius * 0.3} 
          cy={centerY + sphereRadius * 0.2} 
          r={sphereRadius * 0.15}
        >
          <RadialGradient
            c={vec(centerX + sphereRadius * 0.3, centerY + sphereRadius * 0.2)}
            r={sphereRadius * 0.2}
            colors={[
              'rgba(255,255,255,0.7)',
              'rgba(240,248,255,0.3)',
              'rgba(255,255,255,0.0)'
            ]}
            positions={[0, 0.5, 1]}
          />
        </Circle>
        
        {/* Rim light effect */}
        <Circle cx={centerX} cy={centerY} r={sphereRadius * 0.95}>
          <LinearGradient
            start={vec(centerX - sphereRadius, centerY - sphereRadius)}
            end={vec(centerX + sphereRadius, centerY + sphereRadius)}
            colors={[
              'rgba(255,255,255,0.0)',
              'rgba(240,248,255,0.2)',
              'rgba(230,243,255,0.4)',
              'rgba(200,230,255,0.2)',
              'rgba(255,255,255,0.0)'
            ]}
            positions={[0, 0.2, 0.5, 0.8, 1]}
          />
        </Circle>
        
        {/* Bottom shadow/depth */}
        <Circle 
          cx={centerX + sphereRadius * 0.1} 
          cy={centerY + sphereRadius * 0.3} 
          r={sphereRadius * 0.4}
        >
          <RadialGradient
            c={vec(centerX + sphereRadius * 0.1, centerY + sphereRadius * 0.3)}
            r={sphereRadius * 0.5}
            colors={[
              'rgba(100,150,200,0.3)',
              'rgba(150,180,220,0.1)',
              'rgba(255,255,255,0.0)'
            ]}
            positions={[0, 0.7, 1]}
          />
        </Circle>
      </Group>
    );
  }, [centerX, centerY, sphereRadius]);

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Canvas style={{ flex: 1 }}>
        {glassSphere}
      </Canvas>
    </View>
  );
};

export default SkiaGlassSphere;