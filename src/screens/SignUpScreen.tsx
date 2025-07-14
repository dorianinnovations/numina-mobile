import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  Keyboard,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from "../contexts/SimpleAuthContext";
import { ScreenTransitions } from '../utils/animations';
import { Header } from '../components/Header';
import { PageBackground } from '../components/PageBackground';
import { AnimatedAuthStatus } from '../components/AnimatedAuthStatus';

const { width } = Dimensions.get('window');

interface SignUpScreenProps {
  onNavigateBack: () => void;
  onSignUpSuccess: () => void;
  onNavigateToSignIn: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onNavigateBack,
  onSignUpSuccess,
  onNavigateToSignIn,
}) => {
  const { theme, isDarkMode } = useTheme();
  const { signUp, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [isSignUpSuccess, setIsSignUpSuccess] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // Use either auth loading or local loading
  const loading = authLoading || localLoading;

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const emailInputScaleAnim = useRef(new Animated.Value(1)).current;
  const passwordInputScaleAnim = useRef(new Animated.Value(1)).current;
  const confirmPasswordInputScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Input refs
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Entry animation - slide in from left for back navigation
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
    ScreenTransitions.slideInLeft(slideAnim);
  }, []);

  const handleSubmit = async () => {
    // Dismiss keyboard when form is submitted
    Keyboard.dismiss();
    
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setSuccess(false);
    setIsSignUpSuccess(false);
    setLocalLoading(true);
    setAuthStatus('loading');

    // Animate button press
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    try {
      const result = await signUp({
        email: email.trim(),
        password: password.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      if (result.success) {
        setSuccess(true);
        setIsSignUpSuccess(true);
        setAuthStatus('success');
        
        setTimeout(() => {
          ScreenTransitions.fadeOutScale(fadeAnim, scaleAnim, () => {
            onSignUpSuccess();
          });
        }, 1500);
      } else {
        setError(result.error || 'An error occurred during sign up');
        setIsSignUpSuccess(false);
        setAuthStatus('error');
        setTimeout(() => {
          setAuthStatus('idle');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
      setIsSignUpSuccess(false);
      setAuthStatus('error');
      setTimeout(() => {
        setAuthStatus('idle');
      }, 2000);
    } finally {
      setLocalLoading(false);
    }
  };

  // Loading screen with minimal design
  if (loading) {
    return (
      <PageBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color={isDarkMode ? '#ffffff' : '#000000'} 
          />
          <Text style={[
            styles.loadingText, 
            { color: isDarkMode ? '#ffffff' : '#000000' }
          ]}>
            Creating account...
          </Text>
          </View>
        </SafeAreaView>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent"
        translucent={true} 
      />
      
      {/* Header */}
      <Header 
        title="Numina"
        showBackButton={true}
        showMenuButton={true}
        onBackPress={() => {
          ScreenTransitions.slideOutRight(slideAnim, () => {
            onNavigateBack();
          });
        }}
        onMenuPress={(key: string) => {}}
      />

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
              ],
            },
          ]}
        >
          {/* Neumorphic form container */}
          <View style={styles.formWrapper}>
            <View style={[
              styles.formContainer, 
              isDarkMode ? {
                backgroundColor: '#111111',
                borderColor: '#222222',
              } : styles.glassmorphic
            ]}>
              {/* Clean header */}
              <View style={styles.header}>
                <Animated.Text
                  style={[
                    styles.title,
                    {
                      color: isDarkMode ? '#ffffff' : '#000000',
                      transform: [{ translateX: slideAnim.interpolate({
                        inputRange: [-30, 0],
                        outputRange: [-15, 0],
                      })}],
                    },
                  ]}
                >
                  Ready to begin?
                </Animated.Text>
                <Text style={[
                  styles.subtitle, 
                  { color: isDarkMode ? '#888888' : '#666666' }
                ]}>
                  Create your Numina account for free
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
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.02)',
                        borderColor: isDarkMode ? '#23272b' : 'rgba(0, 0, 0, 0.05)',
                      }
                    ]}
                    placeholder="Email"
                    placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                    returnKeyType="next"
                    editable={!loading}
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    onPressIn={() => {
                      Animated.spring(emailInputScaleAnim, {
                        toValue: 1.02,
                        useNativeDriver: true,
                        speed: 50,
                        bounciness: 8,
                      }).start();
                    }}
                    onPressOut={() => {
                      Animated.spring(emailInputScaleAnim, {
                        toValue: 1,
                        useNativeDriver: true,
                        speed: 50,
                        bounciness: 8,
                      }).start();
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
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.02)',
                        borderColor: isDarkMode ? '#23272b' : 'rgba(0, 0, 0, 0.05)',
                      }
                    ]}
                    placeholder="Password"
                    placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                    returnKeyType="next"
                    editable={!loading}
                    onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                    onPressIn={() => {
                      Animated.spring(passwordInputScaleAnim, {
                        toValue: 1.02,
                        useNativeDriver: true,
                        speed: 50,
                        bounciness: 8,
                      }).start();
                    }}
                    onPressOut={() => {
                      Animated.spring(passwordInputScaleAnim, {
                        toValue: 1,
                        useNativeDriver: true,
                        speed: 50,
                        bounciness: 8,
                      }).start();
                    }}
                  />
                </Animated.View>
                <Animated.View style={{ transform: [{ scale: confirmPasswordInputScaleAnim }] }}>
                  <TextInput
                    ref={confirmPasswordInputRef}
                    style={[
                      styles.input,
                      { 
                        color: isDarkMode ? '#ffffff' : '#000000',
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.02)',
                        borderColor: isDarkMode ? '#23272b' : 'rgba(0, 0, 0, 0.05)',
                      }
                    ]}
                    placeholder="Confirm Password"
                    placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                    returnKeyType="done"
                    editable={!loading}
                    onSubmitEditing={() => {
                      Keyboard.dismiss();
                      handleSubmit();
                    }}
                    onPressIn={() => {
                      Animated.spring(confirmPasswordInputScaleAnim, {
                        toValue: 1.02,
                        useNativeDriver: true,
                        speed: 50,
                        bounciness: 8,
                      }).start();
                    }}
                    onPressOut={() => {
                      Animated.spring(confirmPasswordInputScaleAnim, {
                        toValue: 1,
                        useNativeDriver: true,
                        speed: 50,
                        bounciness: 8,
                      }).start();
                    }}
                  />
                </Animated.View>
              </View>

              {/* Sign Up Button with Animation */}
              <View style={styles.buttonContainer}>
                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor: isDarkMode ? '#c5c5c5' : '#add5fa',
                        opacity: (loading || isSignUpSuccess) ? 0.9 : 1,
                      }
                    ]}
                    onPress={handleSubmit}
                    disabled={loading || isSignUpSuccess}
                    activeOpacity={0.9}
                  >
                    <View style={styles.buttonContent}>
                      <View style={styles.buttonTextContainer}>
                        <Text style={[
                          styles.primaryButtonText, 
                          { color: isDarkMode ? '#000000' : '#ffffff' }
                        ]}>
                          {loading ? 'Creating Account...' : isSignUpSuccess ? 'Success' : 'Get Started'}
                        </Text>
                      </View>
                      {authStatus !== 'idle' && (
                        <View style={styles.spinnerContainer}>
                          <AnimatedAuthStatus
                            status={authStatus}
                            color={isDarkMode ? '#000000' : '#ffffff'}
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

              {/* Sign In Link */}
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => {
                  ScreenTransitions.slideOutRight(slideAnim, () => {
                    onNavigateToSignIn();
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.linkText, 
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Already have an account? <Text style={[styles.linkTextBold, { color: isDarkMode ? '#add5fa' : '#000000' }]}>Sign</Text> <Text style={[styles.linkTextBold, { color: isDarkMode ? '#add5fa' : '#000000' }]}>in</Text>
                </Text>
              </TouchableOpacity>

              {/* Error Message */}
              {error && (
                <Animated.View
                  style={[
                    styles.messageContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

                {/* Success Message */}
                {success && (
                  <Animated.View
                    style={[
                      styles.messageContainer,
                      {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                      },
                    ]}
                  >
                    <View style={styles.successContent}>
                      <FontAwesome5 name="check-circle" size={20} color="#10b981" />
                      <Text style={[styles.successText, { color: '#10b981' }]}>
                        Account created successfully! Redirecting...
                      </Text>
                    </View>
                  </Animated.View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  glassmorphic: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 8,
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
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '400',
    height: 38,
    fontFamily: 'Nunito_400Regular',
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
  primaryButtonText: {
    fontSize: 14,
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
  messageContainer: {
    marginTop: 16,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
  },
  successContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  successText: {
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
});