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
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from "../contexts/SimpleAuthContext";
import { Header } from '../components/Header';
import { PageBackground } from '../components/PageBackground';
import { AnimatedAuthStatus } from '../components/AnimatedAuthStatus';
import { TermsOfService } from '../components/TermsOfService';
import { PrivacyPolicy } from '../components/PrivacyPolicy';
import AppInitializer from '../services/appInitializer';

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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
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
  const headerOpacityAnim = useRef(new Animated.Value(1)).current;
  const keyboardSlideAnim = useRef(new Animated.Value(0)).current;
  
  // Input refs
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Fast tech entry - no conflicting animations with navigation
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
    slideAnim.setValue(0); // Start in final position for navigation compatibility
  }, []);

  // Keyboard listeners for subtle slide-up animation
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', (event) => {
      Animated.timing(keyboardSlideAnim, {
        toValue: -12, // Very subtle 12px slide up
        duration: (event.duration || 250) * 1.2, // 20% slower for smoothness
        useNativeDriver: true,
      }).start();
    });
    
    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', (event) => {
      Animated.timing(keyboardSlideAnim, {
        toValue: 0,
        duration: (event.duration || 250) * 1.2, // 20% slower for smoothness
        useNativeDriver: true,
      }).start();
    });
    
    // Android fallback listeners
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      if (Platform.OS === 'android') {
        Animated.timing(keyboardSlideAnim, {
          toValue: -12, // Very subtle 12px slide up
          duration: 240, // Slower for smoothness
          useNativeDriver: true,
        }).start();
      }
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (Platform.OS === 'android') {
        Animated.timing(keyboardSlideAnim, {
          toValue: 0,
          duration: 240, // Slower for smoothness
          useNativeDriver: true,
        }).start();
      }
    });
    
    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const handleSubmit = async () => {
    // Dismiss keyboard when form is submitted
    Keyboard.dismiss();
    
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      // Error haptic for validation failure
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      const missing = [];
      if (!termsAccepted) missing.push('Terms of Service');
      if (!privacyAccepted) missing.push('Privacy Policy');
      
      setError(`Please review and accept our ${missing.join(' and ')} below to continue`);
      // Light haptic for gentle reminder
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Auto-scroll to terms section or highlight it
      setTimeout(() => {
        setError('');
      }, 4000);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      // Error haptic for validation failure
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      // Error haptic for validation failure
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Heavy haptic for account creation (important action)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);


    setError('');
    setSuccess(false);
    setIsSignUpSuccess(false);
    setLocalLoading(true);
    setAuthStatus('loading');

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
      const result = await signUp({
        email: email.trim(),
        password: password.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      if (result.success) {
        // Success haptic for successful account creation
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        setSuccess(true);
        setIsSignUpSuccess(true);
        setAuthStatus('success');
        
        // TERMS ACCEPTANCE TRIGGER - Three-Tier System Activation
        if (termsAccepted && privacyAccepted) {
          console.log('🎯 Terms accepted on signup - triggering enhanced initialization...');
          
          // Small delay to let auth state settle, then trigger three-tier system
          setTimeout(async () => {
            try {
              console.log('🚀 Post-signup three-tier initialization starting...');
              
              // Force re-initialization with enhanced features for terms-accepting users
              await AppInitializer.performInitialDataSync();
              
              // Additional features for users who accept terms
              const healthStatus = await AppInitializer.getHealthStatus();
              console.log('📊 Enhanced features activated:', healthStatus);
              
              console.log('✅ Terms acceptance three-tier system complete!');
            } catch (error) {
              console.error('❌ Terms acceptance enhanced initialization failed:', error);
            }
          }, 2000);
        }
        
        setTimeout(() => {
          onSignUpSuccess();
        }, 1500);
      } else {
        // Error haptic for signup failure
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        setError(result.error || 'An error occurred during sign up');
        setIsSignUpSuccess(false);
        setAuthStatus('error');
        setTimeout(() => {
          setAuthStatus('idle');
        }, 2000);
      }
    } catch (err: any) {
      // Error haptic for unexpected errors
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      setError(err.message || 'Sign up failed');
      setIsSignUpSuccess(false);
      setAuthStatus('error');
      setTimeout(() => {
        setAuthStatus('idle');
      }, 2000);
    } finally {
      setLocalLoading(false);
    }
  };

  // No separate loading screen - AppNavigator handles loading overlay

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
              onNavigateBack();
            }}
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
                      { translateY: keyboardSlideAnim }, // Subtle slide up on keyboard
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
                      backgroundColor: '#0a0a0a',
                      borderColor: '#181818',
                      borderWidth: 1.3,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.7,
                      shadowRadius: 16,
                      elevation: 18,
                    } : styles.glassmorphic
                  ]}>
                    {/* Clean header */}
                    <View style={styles.header}>
                      <Animated.Text
                        style={[
                          styles.title,
                          {
                            color: isDarkMode ? '#ffffff' : '#000000',
                            transform: [{ translateX: slideAnim.interpolate({ inputRange: [-30, 0], outputRange: [-15, 0] }) }],
                          },
                        ]}
                      >
                        Glad you made it.
                      </Animated.Text>
                      <Text style={[
                        styles.subtitle, 
                        { color: isDarkMode ? '#888888' : '#666666' }
                      ]}>
                        Create your credentials to get started
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
                                shadowOffset: { width: 0, height: isDarkMode ? 4 : 2 },
                                shadowOpacity: isDarkMode ? 0.5 : 0.08,
                                shadowRadius: isDarkMode ? 12 : 8,
                                elevation: isDarkMode ? 6 : 3,
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
                            onFocus={() => {
                                setIsInputFocused(true);
                                // Light haptic for input focus
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
                                    duration: 100,
                                    useNativeDriver: true,
                                  }),
                                ]).start();
                            }}
                            onBlur={() => {
                                setIsInputFocused(false);
                                Animated.parallel([
                                  Animated.spring(emailInputScaleAnim, {
                                    toValue: 1,
                                    useNativeDriver: true,
                                    speed: 50,
                                    bounciness: 8,
                                  }),
                                  Animated.timing(headerOpacityAnim, {
                                    toValue: 1,
                                    duration: 100,
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
                                shadowOffset: { width: 0, height: isDarkMode ? 4 : 2 },
                                shadowOpacity: isDarkMode ? 0.5 : 0.08,
                                shadowRadius: isDarkMode ? 12 : 8,
                                elevation: isDarkMode ? 6 : 3,
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
                            onFocus={() => {
                                setIsInputFocused(true);
                                // Light haptic for input focus
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
                                    duration: 100,
                                    useNativeDriver: true,
                                  }),
                                ]).start();
                            }}
                            onBlur={() => {
                                setIsInputFocused(false);
                                Animated.parallel([
                                  Animated.spring(passwordInputScaleAnim, {
                                    toValue: 1,
                                    useNativeDriver: true,
                                    speed: 50,
                                    bounciness: 8,
                                  }),
                                  Animated.timing(headerOpacityAnim, {
                                    toValue: 1,
                                    duration: 100,
                                    useNativeDriver: true,
                                  }),
                                ]).start();
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
                                backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                                shadowColor: isDarkMode ? '#000000' : '#000000',
                                shadowOffset: { width: 0, height: isDarkMode ? 4 : 2 },
                                shadowOpacity: isDarkMode ? 0.5 : 0.08,
                                shadowRadius: isDarkMode ? 12 : 8,
                                elevation: isDarkMode ? 6 : 3,
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
                            onFocus={() => {
                                setIsInputFocused(true);
                                // Light haptic for input focus
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                Animated.parallel([
                                  Animated.spring(confirmPasswordInputScaleAnim, {
                                    toValue: 1.02,
                                    useNativeDriver: true,
                                    speed: 50,
                                    bounciness: 8,
                                  }),
                                  Animated.timing(headerOpacityAnim, {
                                    toValue: 0,
                                    duration: 100,
                                    useNativeDriver: true,
                                  }),
                                ]).start();
                            }}
                            onBlur={() => {
                                setIsInputFocused(false);
                                Animated.parallel([
                                  Animated.spring(confirmPasswordInputScaleAnim, {
                                    toValue: 1,
                                    useNativeDriver: true,
                                    speed: 50,
                                    bounciness: 8,
                                  }),
                                  Animated.timing(headerOpacityAnim, {
                                    toValue: 1,
                                    duration: 100,
                                    useNativeDriver: true,
                                  }),
                                ]).start();
                            }}
                          />
                        </Animated.View>
                      </View>

                      {/* Terms of Service and Privacy Policy Checkboxes */}
                      <View style={styles.termsContainer}>
                        <TouchableOpacity
                          style={[
                            styles.termsCheckboxContainer,
                          ]}
                          onPress={() => {
                            if (!hasReadTerms) {
                              // Force user to read terms first
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                              setShowTermsModal(true);
                              return;
                            }
                            // Light haptic for checkbox toggle
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setTermsAccepted(!termsAccepted);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[
                            styles.termsCheckbox,
                            {
                              backgroundColor: termsAccepted 
                                ? (isDarkMode ? '#add5fa' : '#007AFF')
                                : 'transparent',
                              borderColor: termsAccepted 
                                ? (isDarkMode ? '#add5fa' : '#007AFF')
                                : (isDarkMode ? '#666666' : '#cccccc'),
                            }
                          ]}>
                            {termsAccepted && (
                              <FontAwesome5 
                                name="check" 
                                size={10} 
                                color={isDarkMode ? '#000000' : '#ffffff'} 
                              />
                            )}
                          </View>
                          <Text style={[
                            styles.termsCheckboxText,
                            { color: isDarkMode ? '#ffffff' : '#000000' }
                          ]}>
                            I agree to the{' '}
                            <Text 
                              style={[
                                styles.termsLinkText, 
                                { color: isDarkMode ? '#add5fa' : '#007AFF' }
                              ]}
                              onPress={() => setShowTermsModal(true)}
                            >
                              Terms of Service
                            </Text>
                          </Text>
                          
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.termsCheckboxContainer,
                          ]}
                          onPress={() => {
                            if (!hasReadPrivacy) {
                              // Force user to read privacy policy first
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                              setShowPrivacyModal(true);
                              return;
                            }
                            // Light haptic for checkbox toggle
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setPrivacyAccepted(!privacyAccepted);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[
                            styles.termsCheckbox,
                            {
                              backgroundColor: privacyAccepted 
                                ? (isDarkMode ? '#add5fa' : '#007AFF')
                                : 'transparent',
                              borderColor: privacyAccepted 
                                ? (isDarkMode ? '#add5fa' : '#007AFF')
                                : (isDarkMode ? '#666666' : '#cccccc'),
                            }
                          ]}>
                            {privacyAccepted && (
                              <FontAwesome5 
                                name="check" 
                                size={10} 
                                color={isDarkMode ? '#000000' : '#ffffff'} 
                              />
                            )}
                          </View>
                          <Text style={[
                            styles.termsCheckboxText,
                            { color: isDarkMode ? '#ffffff' : '#000000' }
                          ]}>
                            I agree to the{' '}
                            <Text 
                              style={[
                                styles.termsLinkText, 
                                { color: isDarkMode ? '#add5fa' : '#007AFF' }
                              ]}
                              onPress={() => setShowPrivacyModal(true)}
                            >
                              Privacy Policy
                            </Text>
                          </Text>
                        </TouchableOpacity>
                        
                        {/* Divider under privacy policy */}
                        <View style={[
                          styles.termsDivider,
                          {
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
                          }
                        ]} />
                      </View>

                      {/* Sign Up Button with Animation */}
                      <View style={styles.buttonContainer}>
                        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                          <TouchableOpacity
                            style={[
                              styles.primaryButton,
                              {
                                backgroundColor: isDarkMode ? '#0a0a0a' : '#add5fa',
                                opacity: (loading || isSignUpSuccess) ? 0.9 : 1,
                                borderColor: isDarkMode ? '#262626' : 'transparent',
                                borderWidth: isDarkMode ? 1 : 0,
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
                                  { color: isDarkMode ? '#ffffff' : '#ffffff' }
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
                          // Light haptic for navigation
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          onNavigateToSignIn();
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
          </View>
        </TouchableWithoutFeedback>
        
        {/* Terms of Service Modal */}
        <Modal
          visible={showTermsModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowTermsModal(false)}
        >
          <SafeAreaView style={[
            styles.modalContainer,
            { backgroundColor: isDarkMode ? '#000000' : '#ffffff' }
          ]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  // Light haptic for modal close
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowTermsModal(false);
                }}
              >
                <FontAwesome5 
                  name="times" 
                  size={20} 
                  color={isDarkMode ? '#ffffff' : '#000000'} 
                />
              </TouchableOpacity>
            </View>
            
            {/* Terms Component */}
            <TermsOfService
              onAccept={(accepted) => {
                setTermsAccepted(accepted);
                setHasReadTerms(true);
                if (accepted) {
                  setShowTermsModal(false);
                }
              }}
              accepted={termsAccepted}
            />
          </SafeAreaView>
        </Modal>

        {/* Privacy Policy Modal */}
        <Modal
          visible={showPrivacyModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowPrivacyModal(false)}
        >
          <SafeAreaView style={[
            styles.modalContainer,
            { backgroundColor: isDarkMode ? '#000000' : '#ffffff' }
          ]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  // Light haptic for modal close
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowPrivacyModal(false);
                }}
              >
                <FontAwesome5 
                  name="times" 
                  size={20} 
                  color={isDarkMode ? '#ffffff' : '#000000'} 
                />
              </TouchableOpacity>
            </View>
            
            {/* Privacy Policy Component */}
            <PrivacyPolicy
              onAccept={(accepted) => {
                setPrivacyAccepted(accepted);
                setHasReadPrivacy(true);
                if (accepted) {
                  setShowPrivacyModal(false);
                }
              }}
              accepted={privacyAccepted}
            />
          </SafeAreaView>
        </Modal>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  glassmorphic: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
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
    gap: 5,
  },
  inputGroup: {
    gap: 12,
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 0,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '400',
    height: 48,
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
  buttonContainer: {
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
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
    marginTop: 4,
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
  termsContainer: {
    marginTop: 32,
    marginBottom: 16,
    gap: 16,
    paddingHorizontal: 4,
  },
  termsCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 1,
    paddingHorizontal: 16,
  },
  termsDivider: {
    height: 1,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  termsCheckbox: {
    width: 15,
    height: 15,
    borderRadius: 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  termsCheckboxText: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
    lineHeight: 20,
    fontFamily: 'Nunito_400Regular',
  },
  termsLinkText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: 'Nunito_600SemiBold',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});