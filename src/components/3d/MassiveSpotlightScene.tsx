import React, { Suspense } from 'react';

interface MassiveSpotlightSceneProps {
  morphFactor: number;
  modelKey: string;
  RingModel: React.ComponentType<{ morphFactor: number; modelKey: string }>;
  LoadingFallback: React.ComponentType;
}

// Cinematic 3D Scene with massive spotlight system
export const MassiveSpotlightScene: React.FC<MassiveSpotlightSceneProps> = ({ 
  morphFactor, 
  modelKey, 
  RingModel, 
  LoadingFallback 
}) => {
  return (
    <>
      {/* MINIMAL AMBIENT - Let massive spotlight dominate */}
      <ambientLight intensity={0.8} color="#ffffff" />
      
      {/* MASSIVE SPOTLIGHT - High above, away from viewer's eyes */}
      <spotLight
        position={[0, 30, 0]} // MASSIVE height - way above viewer
        target-position={[0, 0, 0]} // Pointing straight down at ring
        angle={0.8} // Wide beam for massive coverage
        penumbra={0.4} // Smooth edges for natural falloff
        intensity={150.0} // MASSIVE intensity
        color="#ffffff" // Pure white massive light
        castShadow
        shadow-mapSize-width={4096} // Ultra high-res shadows
        shadow-mapSize-height={4096}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-bias={-0.0001}
        distance={40} // Massive range
      />
      
      {/* SECONDARY SPOTLIGHTS - Behind viewer, away from eyes */}
      <spotLight
        position={[-20, 12, 15]} // Far behind and to the side
        target-position={[0, 0, 0]}
        angle={0.6}
        penumbra={0.6}
        intensity={40.0}
        color="#f8f8ff"
        distance={30}
      />
      <spotLight
        position={[20, 12, 15]} // Far behind and to the other side
        target-position={[0, 0, 0]}
        angle={0.6}
        penumbra={0.6}
        intensity={40.0}
        color="#fff8f0"
        distance={30}
      />
      
      {/* High-res 3D ring */}
      <Suspense fallback={<LoadingFallback />}>
        <RingModel morphFactor={morphFactor} modelKey={modelKey} />
      </Suspense>
    </>
  );
};

export default MassiveSpotlightScene;