import React, { useRef, Suspense, useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei/native';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber/native';

// Simple GLB model component
function GLBModel({ modelPath, morphFactor }: { modelPath: string; morphFactor: number }) {
  const groupRef = useRef<Group>(null);
  
  try {
    const { scene } = useGLTF(modelPath);
    
    useFrame((state) => {
      if (groupRef.current) {
        const time = state.clock.getElapsedTime();
        
        // Rotate the model
        groupRef.current.rotation.y = time * 0.5;
        
        // Apply morphing transformation
        if (morphFactor > 0.5) {
          // Infinity phase - stretch and twist
          const infinityProgress = (morphFactor - 0.5) * 2;
          groupRef.current.scale.set(
            1 + infinityProgress * 0.3,
            1 - infinityProgress * 0.1,
            1 + infinityProgress * 0.2
          );
          groupRef.current.rotation.z = Math.sin(time * 1.5) * 0.2 * infinityProgress;
        } else {
          // Ring phase - normal scale
          groupRef.current.scale.set(1, 1, 1);
          groupRef.current.rotation.z = 0;
        }
        
        // Gentle floating
        groupRef.current.position.y = Math.sin(time * 0.8) * 0.1;
      }
    });

    return (
      <group ref={groupRef}>
        <primitive object={scene} />
      </group>
    );
  } catch (error) {
    console.warn('GLB loading failed:', error);
    return null;
  }
}

// Test different model paths
const MODEL_PATHS = [
  // Direct file references
  require('../../../assets/models/spinning_rings.glb'),
  require('../../../assets/models/uxr_circle_rotating_ring.glb'),
  require('../../../assets/models/sphere.glb'),
  require('../../../assets/models/triangular_tiles_on_ico_sphere_2.glb'),
];

interface SimpleGLBLoaderProps {
  morphFactor: number;
  onLoadSuccess?: (modelIndex: number) => void;
  onLoadError?: (error: any) => void;
}

export const SimpleGLBLoader: React.FC<SimpleGLBLoaderProps> = ({ 
  morphFactor, 
  onLoadSuccess, 
  onLoadError 
}) => {
  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Try loading models sequentially until one works
  useEffect(() => {
    setHasError(false);
  }, [currentModelIndex]);

  const tryNextModel = () => {
    if (currentModelIndex < MODEL_PATHS.length - 1) {
      setCurrentModelIndex(currentModelIndex + 1);
    } else {
      setHasError(true);
      onLoadError?.('All models failed to load');
    }
  };

  if (hasError) {
    return null; // Return null to trigger fallback
  }

  return (
    <Suspense fallback={null}>
      <ErrorBoundary onError={tryNextModel}>
        <GLBModel 
          modelPath={MODEL_PATHS[currentModelIndex]} 
          morphFactor={morphFactor}
        />
      </ErrorBoundary>
    </Suspense>
  );
};

// Simple error boundary to catch GLB loading errors
class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  onError: () => void;
}, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn('GLB Error Boundary caught:', error, errorInfo);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

export default SimpleGLBLoader;