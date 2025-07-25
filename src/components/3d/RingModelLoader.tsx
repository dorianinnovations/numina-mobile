import React, { useRef, useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { 
  Environment, 
  useGLTF, 
  Clone,
  Float
} from '@react-three/drei/native';
import { 
  Mesh, 
  Vector3, 
  Group,
  MeshStandardMaterial,
  Color 
} from 'three';
import Animated, { 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  Easing,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

// Enhanced ring model component
const RingModel: React.FC<{ 
  modelPath: string; 
  morphProgress: number; 
  fallbackComponent?: React.ComponentType<any>;
}> = ({ 
  modelPath, 
  morphProgress, 
  fallbackComponent: FallbackComponent 
}) => {
  const groupRef = useRef<Group>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Try to load GLB model only if path provided
  let gltf;
  if (modelPath) {
    try {
      gltf = useGLTF(modelPath);
      if (gltf && !modelLoaded) {
        setModelLoaded(true);
      }
    } catch (error) {
      console.warn('Failed to load ring model:', error);
      if (!loadError) {
        setLoadError(true);
      }
    }
  } else {
    // No model path provided, use fallback
    if (!loadError) {
      setLoadError(true);
    }
  }

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Morphing transformation
      // Ring: circular arrangement
      // Infinity: figure-8 deformation
      
      if (morphProgress < 0.5) {
        // Ring phase
        groupRef.current.rotation.y = time * 0.3;
        groupRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
      } else {
        // Infinity phase - simulate figure-8 by scaling and rotating
        const infinityProgress = (morphProgress - 0.5) * 2;
        
        // Create figure-8 effect by dual rotation and scaling
        groupRef.current.rotation.y = time * 0.5;
        groupRef.current.rotation.z = Math.sin(time * 1.5) * 0.2 * infinityProgress;
        
        // Scale transformation to simulate infinity symbol stretching
        const scaleX = 1 + infinityProgress * 0.3;
        const scaleY = 1 - infinityProgress * 0.2;
        const scaleZ = 1 + infinityProgress * 0.1;
        
        groupRef.current.scale.set(scaleX, scaleY, scaleZ);
      }
      
      // Gentle floating
      groupRef.current.position.y = Math.sin(time * 0.8) * 0.1;
    }
  });

  // Render GLB model if loaded, otherwise fallback
  if (loadError || !gltf) {
    return FallbackComponent ? <FallbackComponent morphProgress={morphProgress} /> : null;
  }

  return (
    <group ref={groupRef}>
      <Clone object={gltf.scene} />
    </group>
  );
};

// Enhanced liquid chrome material for loaded models
const EnhancedModelMaterial: React.FC<{ morphProgress: number }> = ({ morphProgress }) => {
  const materialRef = useRef<MeshStandardMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Dynamic color based on morph progress
      const ringColor = new Color('#c0c0c0'); // Silver
      const infinityColor = new Color('#ffd700'); // Gold
      
      materialRef.current.color.lerpColors(ringColor, infinityColor, morphProgress);
      
      // Pulsing emissive effect
      const pulse = Math.sin(time * 2) * 0.1 + 0.2;
      materialRef.current.emissive.copy(materialRef.current.color).multiplyScalar(pulse);
      
      // Dynamic metalness based on morph
      materialRef.current.metalness = 0.8 + morphProgress * 0.2;
      materialRef.current.roughness = 0.1 - morphProgress * 0.05;
    }
  });

  return (
    <meshStandardMaterial
      ref={materialRef}
      metalness={0.9}
      roughness={0.05}
      envMapIntensity={2}
      color="#c0c0c0"
    />
  );
};

// Professional lighting setup for ring models
const RingLighting: React.FC = () => {
  const lightRef = useRef<any>(null);

  useFrame((state) => {
    if (lightRef.current) {
      const time = state.clock.getElapsedTime();
      // Subtle light movement for dynamic reflections
      lightRef.current.position.x = Math.sin(time * 0.5) * 2;
      lightRef.current.position.z = Math.cos(time * 0.5) * 2;
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      
      {/* Key light */}
      <spotLight
        ref={lightRef}
        position={[3, 5, 3]}
        angle={0.4}
        penumbra={0.5}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      {/* Fill light */}
      <pointLight
        position={[-2, 3, -2]}
        intensity={0.8}
        color="#4a90e2"
      />
      
      {/* Rim light */}
      <pointLight
        position={[0, -2, 4]}
        intensity={0.6}
        color="#ff6b35"
      />
    </>
  );
};

interface RingModelLoaderProps {
  modelPath?: string;
  style?: any;
  autoPlay?: boolean;
  fallbackComponent?: React.ComponentType<any>;
}

const RingModelLoader: React.FC<RingModelLoaderProps> = ({ 
  modelPath, // Remove default require() - will trigger fallback
  style,
  autoPlay = true,
  fallbackComponent
}) => {
  const morphProgress = useSharedValue(0);
  const [currentMorphProgress, setCurrentMorphProgress] = useState(0);

  useEffect(() => {
    if (autoPlay) {
      morphProgress.value = withRepeat(
        withTiming(1, {
          duration: 6000, // 6 second cycle
          easing: Easing.inOut(Easing.cubic),
        }),
        -1, // Infinite
        true // Reverse
      );
    }
  }, [autoPlay, morphProgress]);

  // Update morph progress for Three.js
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentMorphProgress(morphProgress.value);
    }, 16);

    return () => clearInterval(id);
  }, [morphProgress]);

  return (
    <View style={[{ flex: 1 }, style]}>
      <Canvas
        shadows
        camera={{ 
          position: [0, 1, 3], 
          fov: 60,
          near: 0.1,
          far: 100
        }}
        gl={{ 
          powerPreference: "high-performance",
          antialias: true,
          alpha: false
        }}
        dpr={[1, 2]}
      >
        {/* Environment for realistic reflections */}
        <Environment 
          preset="studio" 
          environmentIntensity={1.2} 
        />
        
        {/* Professional lighting */}
        <RingLighting />
        
        {/* Main ring model */}
        <RingModel 
          modelPath={modelPath}
          morphProgress={currentMorphProgress}
          fallbackComponent={fallbackComponent}
        />
        
        {/* Reflective floor */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -1.5, 0]}
          receiveShadow
        >
          <planeGeometry args={[8, 8]} />
          <meshStandardMaterial 
            color="#0a0a0a"
            metalness={0.9}
            roughness={0.1}
            envMapIntensity={0.8}
          />
        </mesh>
      </Canvas>
      
      {/* Loading/Error overlay */}
      <View style={{
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 8,
        borderRadius: 4,
      }}>
        <Text style={{ color: 'white', fontSize: 12 }}>
          3D Ring: {modelPath ? 'Loading Model...' : 'Procedural Ring'}
        </Text>
      </View>
    </View>
  );
};

export default RingModelLoader;