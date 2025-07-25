import React, { useRef, Suspense, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { Environment, useGLTF } from '@react-three/drei/native';
import { Group } from 'three';
import Animated, { 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { getModelAsset, getModelInfo, getAllModels, getAvailableModelKeys } from './ModelRegistry';

// High-resolution procedural ring with premium materials
function HighResProceduralRing({ morphFactor }: { morphFactor: number }) {
  const meshRef = useRef<any>(null);
  const materialRef = useRef<any>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (meshRef.current) {
      // PLANET-LIKE ROTATION - Perfect axis rotation
      const planetRotation = time * 0.12; // Steady rotation like a planet
      
      // Fixed tilt like a planet's axis (23.5° Earth tilt = ~0.41 radians)
      meshRef.current.rotation.x = 0.41; // Planet-like axial tilt
      meshRef.current.rotation.y = planetRotation; // Steady rotation on axis
      meshRef.current.rotation.z = 0.41; // No banking - perfect axis
      
      // LOCKED POSITION - No floating, perfectly centered like a planet
      meshRef.current.position.set(0, 0, 0);
      
      // Scale stays constant during planet rotation
      if (morphFactor <= 0.5) {
        // Ring phase - perfect sphere-like scaling
        const breathe = 1 + Math.sin(time * 0.8) * 0.01; // Minimal breathing
        meshRef.current.scale.set(breathe, breathe, breathe);
      }
      
      // Advanced morphing with parametric curves
      if (morphFactor > 0.5) {
        // Infinity phase - complex deformation while maintaining pendant feel
        const infinityProgress = (morphFactor - 0.5) * 2;
        const smoothProgress = infinityProgress * infinityProgress * (3 - 2 * infinityProgress); // Smoothstep
        
        // Figure-8 transformation
        meshRef.current.scale.set(
          1 + smoothProgress * 0.4,
          1 - smoothProgress * 0.15,
          1 + smoothProgress * 0.25
        );
        
        // Additional twist for infinity while hanging
        meshRef.current.rotation.y += Math.sin(time * 1.5) * 0.2 * smoothProgress;
      } else {
        // Ring phase - perfect circle with subtle breathing
        const breathe = 1 + Math.sin(time * 1.5) * 0.02;
        meshRef.current.scale.set(breathe, breathe, breathe);
      }
    }
    
    // ULTRA HIGH FIDELITY CHROME - premium visual quality
    if (materialRef.current) {
      // Premium metallic properties with micro-variations
      const microRoughness = 0.03 + Math.sin(time * 4) * 0.005; // Subtle surface variation
      materialRef.current.metalness = 0.95; // Near-perfect metalness
      materialRef.current.roughness = microRoughness; // Dynamic micro-roughness
      materialRef.current.transparent = true;
      materialRef.current.opacity = 0.95; // Nearly solid for better presence
      
      // Rich dark chrome with premium color grading
      if (morphFactor > 0.5) {
        const infinityProgress = (morphFactor - 0.5) * 2;
        // Premium chrome with warm undertones during morph
        materialRef.current.color.setRGB(
          0.12 + infinityProgress * 0.08,  // Richer dark chrome
          0.12 + infinityProgress * 0.08,
          0.10 + infinityProgress * 0.05
        );
        // Enhanced emissive during morph
        materialRef.current.emissive.setRGB(
          0.05 + infinityProgress * 0.03,
          0.05 + infinityProgress * 0.03,
          0.04 + infinityProgress * 0.02
        );
      } else {
        // Ultra-rich dark chrome base
        materialRef.current.color.setRGB(0.12, 0.12, 0.12);
        materialRef.current.emissive.setRGB(0.05, 0.05, 0.05);
      }
      
      // Dynamic reflection intensity for realism
      materialRef.current.envMapIntensity = 4.0 + Math.sin(time * 0.8) * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      {/* SMALLER high fidelity torus geometry */}
      <torusGeometry args={[0.54, 0.12, 160, 320]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#1a1a1a" // Darker, richer chrome base
        metalness={0.99} // Near-perfect metalness
        roughness={0.03} // Ultra-smooth for premium reflections
        transparent={true} // Enable transparency
        opacity={0.99} // Much less transparent - nearly solid
        envMapIntensity={4.0} // Enhanced reflections
        emissive="#080808" // Subtle inner glow for definition
        emissiveIntensity={0.07}
        // Enhanced material properties for visual fidelity
      />
    </mesh>
  );
}

// For now, disable GLB loading due to Metro bundler issues
// The require() system in React Native returns asset IDs, not URLs
// useGLTF expects URLs, causing the "url.lastIndexOf is not a function" error

function RingModel({ morphFactor, modelKey }: { morphFactor: number; modelKey: string }) {
  // Always use procedural ring until GLB loading is properly fixed
  return <HighResProceduralRing morphFactor={morphFactor} />;
}

// Loading fallback
function LoadingFallback() {
  const meshRef = useRef<any>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[1.5, 0.1, 16, 32]} />
      <meshStandardMaterial color="#666" />
    </mesh>
  );
}

// Cinematic 3D Scene with orbiting camera
const Scene: React.FC<{ morphFactor: number; modelKey: string }> = ({ morphFactor, modelKey }) => {
  const lightRef1 = useRef<any>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // LOCKED CAMERA - No movement, abstract viewing angle
    // Camera stays in fixed position for stable viewing
    
    // PROFESSIONAL KEY LIGHT - Camera shoot level
    if (lightRef1.current) {
      // Professional studio key light position
      lightRef1.current.position.set(0, 15, 0);
      lightRef1.current.intensity = 50.0; // Professional studio brightness
    }
  });

  return (
    <>
      {/* PROFESSIONAL CAMERA SHOOT AMBIENT */}
      <ambientLight intensity={2.5} color="#ffffff" />
      
      {/* MAIN KEY LIGHT - Professional studio setup */}
      <spotLight
        ref={lightRef1}
        position={[0, 15, 0]} // High key light position
        target-position={[0, 0, 0]} // Pointing directly down at ring
        angle={0.6} // Focused beam
        penumbra={0.3} // Sharp professional edges
        intensity={50.0} // Professional studio brightness
        color="#ffffff" // Pure studio white
        castShadow
        shadow-mapSize-width={4096} // Ultra high-res shadows
        shadow-mapSize-height={4096}
        shadow-camera-near={0.1}
        shadow-camera-far={30}
        shadow-bias={-0.0001}
      />
      
      {/* FILL LIGHTS - Professional 3-point lighting */}
      <spotLight
        position={[-10, 8, 8]} // Key fill light
        target-position={[0, 0, 0]}
        angle={0.8}
        penumbra={0.5}
        intensity={25.0}
        color="#f8f8ff" // Slightly cool fill
        distance={20}
      />
      <spotLight
        position={[10, 8, -8]} // Secondary fill
        target-position={[0, 0, 0]}
        angle={0.8}
        penumbra={0.5}
        intensity={20.0}
        color="#fff8f0" // Slightly warm fill
        distance={20}
      />
      
      {/* RIM LIGHTS - Professional edge definition */}
      <spotLight
        position={[-12, 2, 0]} // Left rim
        target-position={[0, 0, 0]}
        angle={0.4}
        penumbra={0.7}
        intensity={15.0}
        color="#ffffff"
        distance={18}
      />
      <spotLight
        position={[12, 2, 0]} // Right rim
        target-position={[0, 0, 0]}
        angle={0.4}
        penumbra={0.7}
        intensity={15.0}
        color="#ffffff"
        distance={18}
      />
      
      {/* Removed Environment - it was causing white circle */}
      
      {/* Removed particles for crystal clear focus */}
      
      {/* High-res 3D ring */}
      <Suspense fallback={<LoadingFallback />}>
        <RingModel morphFactor={morphFactor} modelKey={modelKey} />
      </Suspense>
      
      {/* Floor removed - focusing on ring only */}
      
    </>
  );
};

interface ModelRingNativeProps {
  style?: any;
}

const ModelRingNative: React.FC<ModelRingNativeProps> = ({ style }) => {
  const morphProgress = useSharedValue(0);
  const [morphFactor, setMorphFactor] = React.useState(0);
  const [selectedModel, setSelectedModel] = useState<string>('spinning_rings');
  const [showModelSelector, setShowModelSelector] = useState(false);
  
  const allModels = getAllModels();

  // Start morphing animation
  React.useEffect(() => {
    morphProgress.value = withRepeat(
      withTiming(1, {
        duration: 6000, // 6 second cycle
        easing: Easing.inOut(Easing.cubic),
      }),
      -1,
      true
    );
  }, []);

  // Update morph factor for Three.js
  React.useEffect(() => {
    const id = setInterval(() => {
      setMorphFactor(morphProgress.value);
    }, 16);
    return () => clearInterval(id);
  }, [morphProgress]);

  const currentModelInfo = getModelInfo(selectedModel);

  return (
    <View style={[{ flex: 1 }, style]}>
      <Canvas
        shadows
        camera={{ 
          position: [-15, 5, 20], // WAY further back
          fov: 30, // Much tighter FOV
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          powerPreference: "high-performance",
          antialias: true 
        }}
      >
        <Scene morphFactor={morphFactor} modelKey={selectedModel} />
      </Canvas>
      
      {/* Model Selector Toggle */}
      <TouchableOpacity 
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)'
        }}
        onPress={() => setShowModelSelector(!showModelSelector)}
      >
        <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
          🎛️ Models
        </Text>
      </TouchableOpacity>
      
      {/* Model Selector Panel */}
      {showModelSelector && (
        <View style={{
          position: 'absolute',
          top: 60,
          right: 10,
          backgroundColor: 'rgba(0,0,0,0.9)',
          borderRadius: 12,
          padding: 16,
          minWidth: 200,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)'
        }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
            Select 3D Model:
          </Text>
          <ScrollView style={{ maxHeight: 200 }}>
            {getAvailableModelKeys().map((modelKey) => {
              const modelInfo = getModelInfo(modelKey);
              return (
                <TouchableOpacity
                  key={modelKey}
                  style={{
                    backgroundColor: selectedModel === modelKey ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.1)',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 8,
                    borderWidth: selectedModel === modelKey ? 2 : 1,
                    borderColor: selectedModel === modelKey ? '#ffd700' : 'rgba(255,255,255,0.2)'
                  }}
                  onPress={() => {
                    setSelectedModel(modelKey);
                    setShowModelSelector(false);
                  }}
                >
                  <Text style={{ 
                    color: selectedModel === modelKey ? '#ffd700' : 'white', 
                    fontSize: 14,
                    fontWeight: selectedModel === modelKey ? '700' : '500'
                  }}>
                    {modelInfo.emoji} {modelInfo.name}
                  </Text>
                  <Text style={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    fontSize: 11,
                    marginTop: 2
                  }}>
                    {modelInfo.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
      
      {/* Current Model Status */}
      <View style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 8,
        borderRadius: 4,
      }}>
        <Text style={{ color: 'white', fontSize: 12 }}>
          📸 Professional Camera Shoot Lighting
        </Text>
      </View>
    </View>
  );
};

export default ModelRingNative;