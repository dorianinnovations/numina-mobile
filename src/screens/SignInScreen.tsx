import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback, // <-- add this
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/SimpleAuthContext';
import { Header } from '../components/ui/Header';
import { log } from '../utils/logger';
import { PageBackground } from '../components/ui/PageBackground';
import { AnimatedAuthStatus } from '../components/animations/AnimatedAuthStatus';
import { NuminaColors } from '../utils/colors';

const { height } = Dimensions.get('window');

interface SignInScreenProps {
  onNavigateBack: () => void;
  onSignInSuccess: () => void;
  onNavigateToSignUp: () => void;
  onNavigateToHero?: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onNavigateBack,
  onSignInSuccess,
  onNavigateToSignUp,
  onNavigateToHero,
}) => {
  
  const { isDarkMode } = useTheme();
  const { login, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [isSignInSuccess, setIsSignInSuccess] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showSlowServerMessage, setShowSlowServerMessage] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // Use either auth loading or local loading
  const loading = authLoading || localLoading;

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const emailInputScaleAnim = useRef(new Animated.Value(1)).current;
  const passwordInputScaleAnim = useRef(new Animated.Value(1)).current;
  const headerOpacityAnim = useRef(new Animated.Value(1)).current;
  const cardTranslateYAnim = useRef(new Animated.Value(0)).current;
  
  // Input refs
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Fast tech entry - no conflicting animations with navigation
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
    slideAnim.setValue(0); // Start in final position for navigation compatibility
    
    return () => {
      // Cleanup on unmount
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const clearErrorOnChange = () => {
    if (error) {
      setError('');
      setAuthStatus('idle');
    }
  };

  const handleSubmit = async () => {
    log.debug('handleSubmit called - starting login attempt', null, 'SignInScreen');
    
    // Dismiss keyboard when form is submitted
    Keyboard.dismiss();
    
    if (!email.trim() || !password.trim()) {
      log.warn('Validation failed - empty fields', null, 'SignInScreen');
      setError('Please fill in all fields');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    log.info('Validation passed, proceeding with login', { email: email.trim() }, 'SignInScreen');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setError('');
    setLocalLoading(true);
    setIsSignInSuccess(false);
    setAuthStatus('loading');
    setShowSlowServerMessage(false);

    // Start 15-second timeout for slow server message
    const timeout = setTimeout(() => {
      if (localLoading) {
        setShowSlowServerMessage(true);
      }
    }, 15000);
    setTimeoutId(timeout);

    // Ultra-smooth button press animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(buttonScaleAnim, {
          toValue: 0.92,
          duration: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonScaleAnim, {
          toValue: 1.05,
          duration: 60,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonScaleAnim, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    try {
      const result = await login({
        email: email.trim(),
        password: password.trim(),
      });

      log.debug('Login result', { result, successType: typeof result.success }, 'SignInScreen');

      if (result && result.success === true) {
        log.info('Login successful, calling onSignInSuccess', null, 'SignInScreen');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        setIsSignInSuccess(true);
        setAuthStatus('success');
        
        // Call success callback immediately - auth routing will handle navigation
        onSignInSuccess();
      } else {
        log.warn('Login failed, staying on signin screen', null, 'SignInScreen');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        // Set user-friendly error message
        const errorMessage = result?.error || 'Invalid email or password';
        setError(errorMessage);
        setIsSignInSuccess(false);
        setAuthStatus('error');
        
        // Clear error status after showing it
        setTimeout(() => {
          setAuthStatus('idle');
        }, 3000); // Extended to 3 seconds for better visibility
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Set graceful error message for unexpected errors
      const errorMessage = err.message || 'Connection failed';
      setError(errorMessage);
      setIsSignInSuccess(false);
      setAuthStatus('error');
      
      // Clear error status after showing it
      setTimeout(() => {
        setAuthStatus('idle');
      }, 3000); // Extended to 3 seconds for better visibility
    } finally {
      setLocalLoading(false);
      setShowSlowServerMessage(false);
      
      // Clear timeout when request completes
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
    }
  };

  return (
    <PageBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />
      
      {/* Header */}
      <Animated.View style={[styles.headerContainer, { opacity: headerOpacityAnim }]}>
        <Header 
          title="Numina"
          showBackButton={true}
          showMenuButton={true}
          showAuthOptions={false}
          onBackPress={() => {
            // Fast exit - let navigation handle the transition
            onNavigateBack();
          }}
          onTitlePress={onNavigateToHero}
          onMenuPress={(key: string) => {}}
        />
      </Animated.View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateX: slideAnim },
                    { scale: scaleAnim },
                    { translateY: cardTranslateYAnim },
                  ],
                },
              ]}
            >
              {/* Neumorphic form container */}
              <View style={styles.formWrapper}>
                <View style={[
                  styles.formContainer, 
                  isDarkMode ? {
                    backgroundColor: '#0a0a0a',
                    borderColor: '#181818',
                    borderWidth: 1.2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.6,
                    shadowRadius: 12,
                    elevation: 15,
                  } : styles.glassmorphic
                ]}>
                  {/*  header */}
                  <View style={styles.header}>
                    <Animated.Text
                      style={[
                        styles.title,
                        {
                          color: isDarkMode ? '#ffffff' : '#000000',
                          transform: [{ 
                            translateX: slideAnim.interpolate({
                              inputRange: [-30, 0],
                              outputRange: [-15, 0],
                            }) 
                          }],
                        },
                      ]}
                    >
                      Sign in
                    </Animated.Text>
                    <Text style={[
                      styles.subtitle, 
                      { color: isDarkMode ? '#888888' : '#666666' }
                    ]}>
                      <Text style={{ color: isDarkMode ? '#87ebde' : '#6883ff' }}>Welcome </Text>
                      <Text style={{ color: isDarkMode ? '#a3c3ff' : '#8a69ff' }}>back</Text>
                      <Text style={{ color: isDarkMode ? '#c6ade6' : '#bb72ff' }}> to </Text>
                      <Text style={{ color: isDarkMode ? '#ffd99f' : '#ffd18d' }}>Numina</Text>
                    </Text>
                  </View>

                  {/* Form Content */}
                  <View style={styles.formContent}>
                    {/* Input fields */}
                    <View style={styles.inputGroup}>
                      <Animated.View style={{ transform: [{ scale: emailInputScaleAnim }] }}>
                        <TextInput
                          ref={emailInputRef}
                          style={[
                            styles.input,
                            { 
                              color: isDarkMode ? '#ffffff' : '#000000',
                              backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                              shadowColor: isDarkMode ? '#000000' : '#000000',
                              shadowOffset: { width: 0, height: isDarkMode ? 4 : 1 },
                              shadowOpacity: isDarkMode ? 0.5 : 0.12,
                              shadowRadius: isDarkMode ? 12 : 3,
                              elevation: isDarkMode ? 6 : 3,
                            }
                          ]}
                          placeholder="Email"
                          placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
                          value={email}
                          onChangeText={(text) => {
                            setEmail(text);
                            clearErrorOnChange();
                          }}
                          autoCapitalize="none"
                          autoCorrect={false}
                          spellCheck={false}
                          keyboardType="email-address"
                          keyboardAppearance={isDarkMode ? 'dark' : 'light'} // iOS only
                          returnKeyType="next"
                          editable={!loading}
                          onSubmitEditing={() => passwordInputRef.current?.focus()}
                          onFocus={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            Animated.parallel([
                              Animated.spring(emailInputScaleAnim, {
                                toValue: 1.02,
                                useNativeDriver: true,
                                speed: 50,
                                bounciness: 8,
                              }),
                              Animated.timing(headerOpacityAnim, {
                                toValue: 0,
                                duration: 150,
                                easing: Easing.out(Easing.cubic),
                                useNativeDriver: true,
                              }),
                              Animated.timing(cardTranslateYAnim, {
                                toValue: -0.08 * height,
                                duration: 400,
                                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                useNativeDriver: true,
                              }),
                            ]).start();
                          }}
                          onBlur={() => {
                            Animated.parallel([
                              Animated.spring(emailInputScaleAnim, {
                                toValue: 1,
                                useNativeDriver: true,
                                speed: 50,
                                bounciness: 8,
                              }),
                              Animated.timing(headerOpacityAnim, {
                                toValue: 1,
                                duration: 200,
                                easing: Easing.in(Easing.cubic),
                                useNativeDriver: true,
                              }),
                              Animated.timing(cardTranslateYAnim, {
                                toValue: 0,
                                duration: 350,
                                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                useNativeDriver: true,
                              }),
                            ]).start();
                          }}
                        />
                      </Animated.View>
                      <Animated.View style={{ transform: [{ scale: passwordInputScaleAnim }] }}>
                        <TextInput
                          ref={passwordInputRef}
                          style={[
                            styles.input,
                            { 
                              color: isDarkMode ? '#ffffff' : '#000000',
                              backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                              shadowColor: isDarkMode ? '#000000' : '#000000',
                              shadowOffset: { width: 0, height: isDarkMode ? 4 : 1 },
                              shadowOpacity: isDarkMode ? 0.5 : 0.12,
                              shadowRadius: isDarkMode ? 12 : 3,
                              elevation: isDarkMode ? 6 : 3,
                            }
                          ]}
                          placeholder="Password"
                          placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            clearErrorOnChange();
                          }}
                          secureTextEntry
                          autoCorrect={false}
                          spellCheck={false}
                          keyboardAppearance={isDarkMode ? 'dark' : 'light'} // iOS only
                          returnKeyType="done"
                          editable={!loading}
                          onSubmitEditing={() => {
                            Keyboard.dismiss();
                            handleSubmit();
                          }}
                          onFocus={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            Animated.parallel([
                              Animated.spring(passwordInputScaleAnim, {
                                toValue: 1.02,
                                useNativeDriver: true,
                                speed: 50,
                                bounciness: 8,
                              }),
                              Animated.timing(headerOpacityAnim, {
                                toValue: 0,
                                duration: 150,
                                easing: Easing.out(Easing.cubic),
                                useNativeDriver: true,
                              }),
                              Animated.timing(cardTranslateYAnim, {
                                toValue: -0.08 * height,
                                duration: 400,
                                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                useNativeDriver: true,
                              }),
                            ]).start();
                          }}
                          onBlur={() => {
                            Animated.parallel([
                              Animated.spring(passwordInputScaleAnim, {
                                toValue: 1,
                                useNativeDriver: true,
                                speed: 50,
                                bounciness: 8,
                              }),
                              Animated.timing(headerOpacityAnim, {
                                toValue: 1,
                                duration: 200,
                                easing: Easing.in(Easing.cubic),
                                useNativeDriver: true,
                              }),
                              Animated.timing(cardTranslateYAnim, {
                                toValue: 0,
                                duration: 350,
                                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                useNativeDriver: true,
                              }),
                            ]).start();
                          }}
                        />
                      </Animated.View>
                    </View>

                    {/* Sign In Button with Animation */}
                    <View style={styles.buttonContainer}>
                      <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                        <TouchableOpacity
                          style={[
                            styles.primaryButton,
                            {
                              backgroundColor: isDarkMode ? '#0a0a0a' : '#add5fa',
                              opacity: (loading || isSignInSuccess) ? 0.9 : 1,
                              borderColor: isDarkMode ? '#262626' : 'transparent',
                              borderWidth: isDarkMode ? 1 : 0,
                            }
                          ]}
                          onPress={handleSubmit}
                          disabled={loading || isSignInSuccess}
                          activeOpacity={0.9}
                        >
                          <View style={styles.buttonContent}>
                            <View style={styles.buttonTextContainer}>
                              <Text style={[
                                styles.primaryButtonText, 
                                { color: isDarkMode ? '#ffffff' : '#ffffff' }
                              ]}>
                                {loading ? 'Signing In' : isSignInSuccess ? 'Success!' : 'Sign In'}
                              </Text>
                            </View>
                            {authStatus !== 'idle' && (
                              <View style={styles.spinnerContainer}>
                                <AnimatedAuthStatus
                                  status={authStatus}
                                  color={isDarkMode ? NuminaColors.darkMode[600] : '#ffffff'}
                                  size={16}
                                  onAnimationComplete={() => {
                                    if (authStatus === 'error') {
                                      setAuthStatus('idle');
                                    }
                                  }}
                                />
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    </View>

                    {/* Create Account Link */}
                    <TouchableOpacity
                      style={styles.linkButton}
                      onPress={() => {
                        // Light haptic for navigation
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        // Fast navigation - let navigation handle transition
                        onNavigateToSignUp();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.linkText, 
                        { color: isDarkMode ? '#cccccc' : '#b0b0b0' }
                      ]}>
                        Don't have an account? <Text style={[styles.linkTextBold, { color: isDarkMode ? '#aaaaaa' : '#888888' }]}>Sign</Text> <Text style={[styles.linkTextBold, { color: isDarkMode ? '#aaaaaa' : '#888888' }]}>up</Text>
                      </Text>
                    </TouchableOpacity>

                      {/* Error Message */}
                      {error && (
                        <Animated.View
                          style={[
                            styles.errorContainer,
                            {
                              opacity: fadeAnim,
                              transform: [{ translateY: slideAnim }],
                            },
                          ]}
                        >
                          <Text style={styles.errorText}>{error}</Text>
                        </Animated.View>
                      )}

                      {/* Slow Server Message */}
                      {showSlowServerMessage && !error && (
                        <Animated.View
                          style={[
                            styles.slowServerContainer,
                            {
                              opacity: fadeAnim,
                              transform: [{ translateY: slideAnim }],
                            },
                          ]}
                        >
                          <Text style={[
                            styles.slowServerText,
                            { color: isDarkMode ? '#fbbf24' : '#d97706' }
                          ]}>
                            Server may be slow, please wait...
                          </Text>
                        </Animated.View>
                      )}
                    </View>
                  </View>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingTop: 100,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  formWrapper: {
    position: 'relative',
    width: '100%',
  },
  formContainer: {
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  glassmorphic: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -1.5,
    fontFamily: 'Nunito_700Bold',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
  },
  formContent: {
    gap: 24,
  },
  inputGroup: {
    gap: 16,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '400',
    height: 42,
    fontFamily: 'Nunito_400Regular',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButton: {
    width: '100%',
    height: 37,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
    fontFamily: 'Nunito_500Medium',
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular',
  },
  linkTextBold: {
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  errorContainer: {
    marginTop: 16,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
  },
  slowServerContainer: {
    marginTop: 16,
  },
  slowServerText: {
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
  },
  buttonContainer: {
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});