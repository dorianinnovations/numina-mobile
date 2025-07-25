import React, { useRef } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { Environment } from '@react-three/drei/native';
import { Mesh, TorusGeometry, MeshStandardMaterial } from 'three';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

// Simple ring component
const Ring: React.FC<{ morphFactor: number }> = ({ morphFactor }) => {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Simple rotation
      meshRef.current.rotation.y = time * 0.5;
      
      // Morph effect by scaling
      const scaleX = 1 + morphFactor * 0.5;
      const scaleZ = 1 - morphFactor * 0.3;
      meshRef.current.scale.set(scaleX, 1, scaleZ);
      
      // Gentle floating
      meshRef.current.position.y = Math.sin(time * 0.8) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} castShadow>
      <torusGeometry args={[1.5, 0.1, 16, 32]} />
      <meshStandardMaterial
        color={morphFactor > 0.5 ? '#ffd700' : '#c0c0c0'}
        metalness={0.9}
        roughness={0.1}
        emissive={morphFactor > 0.5 ? '#332200' : '#111111'}
      />
    </mesh>
  );
};

// 3D Scene
const Scene: React.FC<{ morphFactor: number }> = ({ morphFactor }) => {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1} castShadow />
      <Environment preset="studio" environmentIntensity={0.6} />
      
      <Ring morphFactor={morphFactor} />
      
      {/* Simple ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
      </mesh>
    </>
  );
};

interface SimpleRingNativeProps {
  style?: any;
}

const SimpleRingNative: React.FC<SimpleRingNativeProps> = ({ style }) => {
  const morphProgress = useSharedValue(0);
  const [morphFactor, setMorphFactor] = React.useState(0);

  // Start animation
  React.useEffect(() => {
    morphProgress.value = withRepeat(
      withTiming(1, {
        duration: 4000,
        easing: Easing.inOut(Easing.cubic),
      }),
      -1,
      true
    );
  }, []);

  // Update morph factor
  React.useEffect(() => {
    const id = setInterval(() => {
      setMorphFactor(morphProgress.value);
    }, 16);
    return () => clearInterval(id);
  }, [morphProgress]);

  return (
    <View style={[{ flex: 1 }, style]}>
      <Canvas
        shadows
        camera={{ position: [0, 2, 4], fov: 50 }}
        gl={{ powerPreference: "high-performance" }}
      >
        <Scene morphFactor={morphFactor} />
      </Canvas>
    </View>
  );
};

export default SimpleRingNative;