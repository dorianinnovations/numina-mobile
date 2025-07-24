import { useRef, useEffect, useCallback } from 'react';
import { Animated } from 'react-native';
import { SandboxNode } from '../types/sandbox';
import { NuminaAnimations } from '../utils/animations';
import { animationManager } from '../utils/animationManager';

interface NodeAnimation {
  opacity: Animated.Value;
  scale: Animated.Value;
  translateY: Animated.Value;
  glow?: Animated.Value;
  pulse?: Animated.Value;
}

interface UseNodeAnimationsReturn {
  nodeAnims: React.MutableRefObject<Map<string, NodeAnimation>>;
  createInsightArrivalAnimation: (insightNode: SandboxNode) => NodeAnimation;
  animateNodesIn: (nodesToAnimate: SandboxNode[]) => void;
  cleanupAnimations: () => void;
}

export const useNodeAnimations = (): UseNodeAnimationsReturn => {
  const nodeAnims = useRef<Map<string, NodeAnimation>>(new Map());
  const animationRefs = useRef<Set<Animated.CompositeAnimation>>(new Set());

  const cleanupAnimations = useCallback(() => {
    // Clean up traditional animations
    animationRefs.current.forEach(animation => {
      animation.stop();
    });
    animationRefs.current.clear();
    
    // Clean up managed animations
    animationManager.stopPool('node');
    animationManager.stopPool('insight');
    
    // Clear node animations
    nodeAnims.current.clear();
  }, []);

  useEffect(() => {
    return cleanupAnimations;
  }, []);

  const createInsightArrivalAnimation = useCallback((insightNode: SandboxNode): NodeAnimation => {
    const arrivalAnim: NodeAnimation = {
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.3),
      translateY: new Animated.Value(-50),
      glow: new Animated.Value(0),
      pulse: new Animated.Value(0.5),
    };

    nodeAnims.current.set(insightNode.id, arrivalAnim);

    // Use safe animation manager instead of infinite loops
    const arrivalAnimation = animationManager.createInsightArrival(arrivalAnim);
    
    if (arrivalAnimation) {
      arrivalAnimation.start(() => {
        // Create bounded pulse after arrival (5 iterations max)
        const subtlePulse = animationManager.createSafeLoop('insight', 
          () => Animated.sequence([
            Animated.timing(arrivalAnim.pulse!, {
              toValue: 0.8,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(arrivalAnim.pulse!, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          3 // Only 3 subtle pulses, then stop
        );
        
        if (subtlePulse) {
          subtlePulse.start();
        }
      });
    }

    NuminaAnimations.haptic.success();
    
    return arrivalAnim;
  }, []);

  const animateNodesIn = useCallback((nodesToAnimate: SandboxNode[]) => {
    // Limit nodes to prevent performance issues
    const limitedNodes = nodesToAnimate.slice(0, 12);
    
    const batchAnimation = animationManager.createBoundedAnimation('node', 
      () => {
        const animations = limitedNodes.map((node, index) => {
          const nodeAnim = nodeAnims.current.get(node.id);
          if (!nodeAnim) return Animated.timing(new Animated.Value(0), { toValue: 1, duration: 0, useNativeDriver: true });

          return Animated.sequence([
            Animated.delay(index * 100), // Reduced stagger
            Animated.parallel([
              Animated.timing(nodeAnim.opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.spring(nodeAnim.scale, {
                toValue: 1,
                tension: 200,
                friction: 8,
                useNativeDriver: true,
              }),
              Animated.timing(nodeAnim.translateY, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
            ])
          ]);
        });
        
        return Animated.parallel(animations);
      },
      { autoCleanup: true }
    );
    
    if (batchAnimation) {
      batchAnimation.start(() => {
        NuminaAnimations.haptic.success();
      });
    }
  }, []);

  return {
    nodeAnims,
    createInsightArrivalAnimation,
    animateNodesIn,
    cleanupAnimations,
  };
}; 