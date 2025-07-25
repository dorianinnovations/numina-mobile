import React, { useRef, useMemo, useEffect } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { 
  Environment, 
  useGLTF, 
  Float,
  MeshDistortMaterial
} from '@react-three/drei/native';
import { 
  Mesh, 
  Vector3, 
  Curve, 
  TubeGeometry, 
  MeshStandardMaterial,
  Color,
  DoubleSide 
} from 'three';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

// Mobile-optimized parametric curves
class MobileRingCurve extends Curve<Vector3> {
  constructor(public radius: number = 1.5) {
    super();
  }

  getPoint(t: number, optionalTarget?: Vector3): Vector3 {
    const point = optionalTarget || new Vector3();
    const angle = t * Math.PI * 2;
    
    point.set(
      Math.cos(angle) * this.radius,
      0,
      Math.sin(angle) * this.radius
    );
    
    return point;
  }
}

class MobileLemniscateCurve extends Curve<Vector3> {
  constructor(public scale: number = 1.5) {
    super();
  }

  getPoint(t: number, optionalTarget?: Vector3): Vector3 {
    const point = optionalTarget || new Vector3();
    const angle = t * Math.PI * 2;
    
    // Simplified lemniscate for mobile performance
    const scaleFactor = this.scale * 2 / (3 - Math.cos(2 * angle));
    
    point.set(
      scaleFactor * Math.cos(angle),
      0,
      scaleFactor * Math.sin(2 * angle) / 2
    );
    
    return point;
  }
}

// Mobile-optimized liquid chrome material
const MobileLiquidChrome: React.FC<{ morphFactor: number; time: number }> = ({ 
  morphFactor, 
  time 
}) => {
  const materialRef = useRef<MeshStandardMaterial>(null);

  useFrame(() => {
    if (materialRef.current) {
      // Simple color temperature shift based on morph
      const warmColor = new Color('#ffd700'); // Gold for infinity
      const coolColor = new Color('#c0c0c0'); // Silver for ring
      
      materialRef.current.color.lerpColors(coolColor, warmColor, morphFactor);
      materialRef.current.emissive.copy(materialRef.current.color).multiplyScalar(0.1);
    }
  });

  return (
    <meshStandardMaterial
      ref={materialRef}
      metalness={0.9}
      roughness={0.1}
      envMapIntensity={1.5}
      color="#c0c0c0"
      side={DoubleSide}
    />
  );
};

// Fallback ring geometry if no GLB model
const ProceduralRing: React.FC<{ morphFactor: number; time: number }> = ({ 
  morphFactor, 
  time 
}) => {
  const meshRef = useRef<Mesh>(null);
  const ringCurve = useMemo(() => new MobileRingCurve(), []);
  const lemniscateCurve = useMemo(() => new MobileLemniscateCurve(), []);

  // Generate tube geometry - lower resolution for mobile
  const geometry = useMemo(() => {
    const curve = morphFactor < 0.5 ? ringCurve : lemniscateCurve;
    return new TubeGeometry(curve, 64, 0.08, 8, false); // Reduced segments
  }, [morphFactor, ringCurve, lemniscateCurve]);

  useFrame(() => {
    if (meshRef.current) {
      // Gentle rotation
      meshRef.current.rotation.y = time * 0.2;
      meshRef.current.position.y = Math.sin(time) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <MobileLiquidChrome morphFactor={morphFactor} time={time} />
    </mesh>
  );
};

// Main 3D scene component
const Scene3D: React.FC<{ morphFactor: number }> = ({ morphFactor }) => {
  const timeRef = useRef(0);

  useFrame((state) => {
    timeRef.current = state.clock.getElapsedTime();
  });

  return (
    <>
      {/* Mobile-optimized lighting */}
      <ambientLight intensity={0.4} />
      <pointLight 
        position={[5, 5, 5]} 
        intensity={1} 
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />

      {/* Environment for reflections */}
      <Environment preset="studio" environmentIntensity={0.6} />

      {/* Main morphing ring */}
      <ProceduralRing morphFactor={morphFactor} time={timeRef.current} />

      {/* Simple ground plane */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -1, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          metalness={0.8} 
          roughness={0.2} 
        />
      </mesh>
    </>
  );
};

interface MorphingRingNativeProps {
  style?: any;
  autoPlay?: boolean;
}

const MorphingRingNative: React.FC<MorphingRingNativeProps> = ({ 
  style, 
  autoPlay = true 
}) => {
  // Animation control with React Native Reanimated
  const morphProgress = useSharedValue(0);

  useEffect(() => {
    if (autoPlay) {
      morphProgress.value = withRepeat(
        withTiming(1, {
          duration: 4000,
          easing: Easing.inOut(Easing.cubic),
        }),
        -1, // Infinite repeat
        true // Reverse
      );
    }
  }, [autoPlay, morphProgress]);

  // Convert shared value to regular value for Three.js
  const [morphFactor, setMorphFactor] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setMorphFactor(morphProgress.value);
    }, 16); // ~60fps updates

    return () => clearInterval(id);
  }, [morphProgress]);

  return (
    <View style={[{ flex: 1 }, style]}>
      <Canvas
        shadows
        camera={{ 
          position: [0, 2, 4], 
          fov: 50,
          near: 0.1,
          far: 100
        }}
        gl={{ 
          powerPreference: "high-performance",
          antialias: false, // Disabled for mobile performance
          alpha: false
        }}
        dpr={[1, 2]} // Limit pixel ratio for performance
      >
        <Scene3D morphFactor={morphFactor} />
      </Canvas>
    </View>
  );
};

export default MorphingRingNative;