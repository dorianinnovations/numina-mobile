import React from 'react';
import { View, Dimensions } from 'react-native';
import { Canvas, Circle, RadialGradient, vec, Group, Shadow } from '@shopify/react-native-skia';

const { width, height } = Dimensions.get('window');

const SimpleSkiaGlassSphere = () => {
  const centerX = width / 2;
  const centerY = height / 2;
  const sphereRadius = Math.min(width, height) * 0.3;

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Canvas style={{ flex: 1 }}>
        <Group>
          {/* Main glass sphere with shadow */}
          <Circle cx={centerX} cy={centerY} r={sphereRadius}>
            <Shadow dx={8} dy={12} blur={25} color="rgba(0,0,0,0.2)" />
            <RadialGradient
              c={vec(centerX - sphereRadius * 0.3, centerY - sphereRadius * 0.3)}
              r={sphereRadius * 1.2}
              colors={[
                'rgba(255,255,255,0.9)',
                'rgba(240,248,255,0.6)',
                'rgba(230,243,255,0.3)',
                'rgba(200,230,255,0.1)'
              ]}
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
            />
          </Circle>
          
          {/* Main highlight */}
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
            />
          </Circle>
          
          {/* Depth shadow */}
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
            />
          </Circle>
        </Group>
      </Canvas>
    </View>
  );
};

export default SimpleSkiaGlassSphere;