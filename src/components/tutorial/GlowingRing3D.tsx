import React, { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber/native';
import { 
  Environment, 
  MeshReflectorMaterial, 
  Float,
  useTexture 
} from '@react-three/drei/native';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const GLOW_COLOR = '#ffc04d';

function GlowingRing() {
  const ringRef = useRef<THREE.Mesh>();
  const glowRef = useRef<THREE.Mesh>();

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += 0.01;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y += 0.005;
    }
  });

  return (
    <>
      {/* Outer glow ring */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
        <torusGeometry args={[1.6, 0.15, 16, 100]} />
        <meshStandardMaterial
          color={GLOW_COLOR}
          emissive={GLOW_COLOR}
          emissiveIntensity={3}
          transparent
          opacity={0.4}
          toneMapped={false}
        />
      </mesh>

      {/* Main glowing ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
        <torusGeometry args={[1.5, 0.08, 16, 100]} />
        <meshStandardMaterial
          color={GLOW_COLOR}
          emissive={GLOW_COLOR}
          emissiveIntensity={5}
          toneMapped={false}
        />
      </mesh>

      {/* Inner bright core */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
        <torusGeometry args={[1.5, 0.04, 16, 100]} />
        <meshStandardMaterial
          color="white"
          emissive="white"
          emissiveIntensity={8}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

function WaterSurface() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
      <planeGeometry args={[20, 20]} />
      <MeshReflectorMaterial
        color="#001122"
        metalness={0.8}
        roughness={0.2}
        mirror={0.8}
        mixBlur={8}
        mixStrength={1.5}
        resolution={512}
        blur={[300, 100]}
        minDepthThreshold={0.9}
        maxDepthThreshold={1}
        depthScale={0.01}
        depthToBlurRatioBias={0.25}
        reflectorOffset={0.2}
      />
    </mesh>
  );
}

function FloatingParticles() {
  const particles = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 50; i++) {
      positions.push([
        (Math.random() - 0.5) * 10,
        Math.random() * 3 + 0.5,
        (Math.random() - 0.5) * 10,
      ]);
    }
    return positions;
  }, []);

  return (
    <>
      {particles.map((position, index) => (
        <Float
          key={index}
          speed={0.5 + Math.random() * 0.5}
          rotationIntensity={0.2}
          floatIntensity={0.3}
        >
          <mesh position={position}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial
              color={GLOW_COLOR}
              emissive={GLOW_COLOR}
              emissiveIntensity={2}
              transparent
              opacity={0.6}
              toneMapped={false}
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight 
        position={[0, 2, 0]} 
        intensity={8} 
        color={GLOW_COLOR}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      <GlowingRing />
      <WaterSurface />
      <FloatingParticles />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={2.5}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

interface GlowingRing3DProps {
  style?: any;
}

export const GlowingRing3D: React.FC<GlowingRing3DProps> = ({ style }) => {
  return (
    <Canvas
      style={[{ flex: 1 }, style]}
      camera={{ 
        position: [0, 3, 6], 
        fov: 60,
        near: 0.1,
        far: 100
      }}
      gl={{ 
        physicallyCorrectLights: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2
      }}
    >
      <Scene />
    </Canvas>
  );
};