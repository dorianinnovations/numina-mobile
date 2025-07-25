import React from 'react';
import { View, Text } from 'react-native';
import SimpleSkiaGlassSphere from './SimpleSkiaGlassSphere';



interface ModelRingNativeProps {
  style?: any;
}

const ModelRingNative: React.FC<ModelRingNativeProps> = ({ style }) => {
  return (
    <View style={[
      { 
        flex: 1,
        backgroundColor: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }, 
      style
    ]}>
      <SimpleSkiaGlassSphere />
      
      {/* Clean Numina Info - Top Left */}
      <View style={{
        position: 'absolute',
        top: 60,
        left: 24,
        pointerEvents: 'none',
      }}>
        <Text style={{
          color: 'rgba(255,255,255,0.95)',
          fontSize: 20,
          fontFamily: 'System',
          fontWeight: '600',
          letterSpacing: -0.3,
          marginBottom: 4,
        }}>
          Numina
        </Text>
        <Text style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 13,
          fontFamily: 'System',
          fontWeight: '400',
          letterSpacing: -0.1,
          lineHeight: 18,
        }}>
          AI-Powered Intelligence{'\n'}
          Neural Processing Engine
        </Text>
      </View>
    </View>
  );
};

export default ModelRingNative;