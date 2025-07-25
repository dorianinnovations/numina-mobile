import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Easing,
} from 'react-native';
import {
  Canvas,
  Group,
  Rect,
  LinearGradient,
  vec,
  Fill,
  Shader,
  Skia,
  Circle,
  BlurMask,
  Path,
  Blur,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { Header } from '../components/ui/Header';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

const source = Skia.RuntimeEffect.Make(`
  uniform vec2 resolution;
  uniform float time;
  uniform vec2 mouse;
  
  vec3 colorA = vec3(0.149, 0.141, 0.912);
  vec3 colorB = vec3(1.000, 0.833, 0.224);
  
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    
    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(st);
      st *= 2.;
      amplitude *= .5;
    }
    return value;
  }
  
  vec4 main(vec2 fragCoord) {
    vec2 st = fragCoord / resolution;
    vec2 mouseNorm = mouse / resolution;
    
    // Warp space based on mouse position
    float dist = distance(st, mouseNorm);
    vec2 warp = st + 0.1 * sin(time * 0.5 + dist * 10.0);
    
    // Generate flowing noise
    float n = fbm(warp * 3.0 + time * 0.2);
    
    // Create color flow
    vec3 color = mix(colorA, colorB, n);
    
    // Add glow around mouse
    float glow = exp(-dist * 8.0) * 0.5;
    color += vec3(glow);
    
    // Subtle vignette
    float vignette = 1.0 - distance(st, vec2(0.5)) * 0.5;
    color *= vignette;
    
    return vec4(color, 1.0);
  }
`)!;

interface PremiumTutorialScreenProps {
  onNavigateHome: () => void;
  onStartChat: () => void;
  onTitlePress?: () => void;
  onMenuPress?: (key: string) => void;
}

export const PremiumTutorialScreen: React.FC<PremiumTutorialScreenProps> = ({
  onNavigateHome,
  onStartChat,
  onTitlePress,
  onMenuPress,
}) => {
  const { isDarkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const time = useSharedValue(0);
  const mouseX = useSharedValue(width / 2);
  const mouseY = useSharedValue(height / 2);

  useEffect(() => {
    time.value = withRepeat(withTiming(30000, { duration: 30000 }), -1);
  }, [time]);
  
  // Touch tracking
  const handleTouch = (e: any) => {
    const touch = e.nativeEvent.touches[0];
    if (touch) {
      mouseX.value = touch.pageX;
      mouseY.value = touch.pageY;
    }
  };
  
  // Morphing shape path
  const morphProgress = useSharedValue(0);
  useEffect(() => {
    morphProgress.value = withRepeat(withTiming(1, { duration: 8000 }), -1, true);
  }, [morphProgress]);
  const path = useDerivedValue(() => {
    const t = morphProgress.value;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width * 0.3;
    const path = Skia.Path.Make();
    path.moveTo(
      centerX + radius * Math.cos(0) * (1 + 0.2 * Math.sin(t * Math.PI * 2)),
      centerY + radius * Math.sin(0) * (1 + 0.2 * Math.cos(t * Math.PI * 3))
    );
    for (let i = 0; i <= 360; i += 10) {
      const angle = (i * Math.PI) / 180;
      const warp = 0.2 * Math.sin(t * Math.PI * 2 + angle * 3);
      const x = centerX + radius * Math.cos(angle) * (1 + warp);
      const y = centerY + radius * Math.sin(angle) * (1 + warp * Math.cos(t * Math.PI));
      path.lineTo(x, y);
    }
    path.close();
    return path;
  }, [morphProgress]);
  
  // Floating particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    x: useSharedValue(0),
    y: useSharedValue(0),
    scale: useSharedValue(0),
    durationX: 10000 + i * 1000,
    durationY: 8000 + i * 1500,
    durationScale: 4000 + i * 500,
  }));
  useEffect(() => {
    particles.forEach((particle) => {
      particle.x.value = withRepeat(withTiming(width, { duration: particle.durationX }), -1, false);
      particle.y.value = withRepeat(withTiming(height, { duration: particle.durationY }), -1, false);
      particle.scale.value = withRepeat(withTiming(1.5, { duration: particle.durationScale }), -1, true);
    });
  }, []);
  
  const uniforms = useDerivedValue(
    () => ({
      resolution: vec(width, height),
      time: time.value,
      mouse: vec(mouseX.value, mouseY.value),
    }),
    [time, mouseX, mouseY]
  );

  const steps = [
    {
      title: "Welcome to something different",
      subtitle: "An AI that evolves with you",
    },
    {
      title: "Think naturally",
      subtitle: "No prompts, just conversation",
    },
    {
      title: "Discover connections",
      subtitle: "Ideas that surprise you",
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Shader background */}
      <Canvas 
        style={StyleSheet.absoluteFillObject}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
      >
        <Fill>
          <Shader source={source} uniforms={uniforms} />
        </Fill>
        
        {/* Morphing glass shape */}
        <Group>
          <Path path={path} color="rgba(255,255,255,0.1)">
            <Blur blur={20} />
          </Path>
          <Path 
            path={path} 
            color="transparent"
            style="stroke"
            strokeWidth={2}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, height)}
              colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.2)']}
            />
          </Path>
        </Group>
        
        {/* Floating particles */}
        {particles.map((particle, i) => {
          const x = useDerivedValue(() => particle.x.value, [particle.x]);
          const y = useDerivedValue(() => particle.y.value, [particle.y]);
          const scale = useDerivedValue(() => particle.scale.value, [particle.scale]);
          return (
            <Circle
              key={i}
              cx={x}
              cy={y}
              r={3}
              opacity={0.6}
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(6, 6)}
                colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
              />
              <BlurMask blur={2} style="solid" />
            </Circle>
          );
        })}
      </Canvas>
      
      {/* Header */}
      <Header 
        title="Numina"
        showBackButton={true}
        showMenuButton={true}
        showAuthOptions={false}
        onBackPress={onNavigateHome}
        onTitlePress={onTitlePress}
        onMenuPress={onMenuPress}
      />
      
      {/* Content */}
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
            {steps[currentStep].title}
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#ccc' : '#333' }]}>
            {steps[currentStep].subtitle}
          </Text>
        </View>
        
        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
            onPress={() => {
              if (currentStep > 0) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCurrentStep(currentStep - 1);
              }
            }}
            disabled={currentStep === 0}
          >
            <Text style={styles.navButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.dots}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentStep && styles.dotActive,
                ]}
              />
            ))}
          </View>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1);
              } else {
                onStartChat();
              }
            }}
          >
            <Text style={styles.navButtonText}>
              {currentStep === steps.length - 1 ? 'Start' : '→'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  title: {
    fontSize: 36,
    fontWeight: '300',
    marginBottom: 16,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    opacity: 0.8,
  },
  navigation: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
});