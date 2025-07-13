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
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ScreenTransitions } from '../utils/animations';
import { Header } from '../components/Header';
import { PageBackground } from '../components/PageBackground';

const { width } = Dimensions.get('window');

interface SignInScreenProps {
  onNavigateBack: () => void;
  onSignInSuccess: () => void;
  onNavigateToSignUp: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onNavigateBack,
  onSignInSuccess,
  onNavigateToSignUp,
}) => {
  const { theme, isDarkMode } = useTheme();
  const { login, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [isSignInSuccess, setIsSignInSuccess] = useState(false);
  
  // Use either auth loading or local loading
  const loading = authLoading || localLoading;

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const emailInputScaleAnim = useRef(new Animated.Value(1)).current;
  const passwordInputScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Input refs
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    // Dismiss keyboard when form is submitted
    Keyboard.dismiss();
    
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLocalLoading(true);
    setIsSignInSuccess(false);

    // Animate button press
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.98,
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
      const result = await login({
        email: email.trim(),
        password: password.trim(),
      });

      if (result.success) {
        setIsSignInSuccess(true);
        
        setTimeout(() => {
          ScreenTransitions.fadeOutScale(fadeAnim, scaleAnim, () => {
            onSignInSuccess();
          });
        }, 800);
      } else {
        setError(result.error || 'Invalid email or password');
        setIsSignInSuccess(false);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during sign-in.');
      setIsSignInSuccess(false);
    } finally {
      setLocalLoading(false);
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
      <Header 
        title="Numina"
        showBackButton={true}
        showMenuButton={true}
        onBackPress={() => {
          ScreenTransitions.fadeOutScale(fadeAnim, scaleAnim, () => {
            onNavigateBack();
          });
        }}
        onMenuPress={() => {}}
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
                { translateY: slideAnim },
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
                      transform: [{ 
                        translateX: slideAnim.interpolate({
                          inputRange: [-30, 0],
                          outputRange: [-40, 0],
                        }) 
                      }],
                    },
                  ]}
                >
                  Sign In
                </Animated.Text>
                <Text style={[
                  styles.subtitle, 
                  { color: isDarkMode ? '#888888' : '#666666' }
                ]}>
                  Welcome back to Numina
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
                    returnKeyType="done"
                    editable={!loading}
                    onSubmitEditing={() => {
                      Keyboard.dismiss();
                      handleSubmit();
                    }}
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
              </View>

              {/* Sign In Button */}
              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: isDarkMode ? '#ffffff' : '#000000',
                      opacity: (loading || isSignInSuccess) ? 0.7 : 1,
                    }
                  ]}
                  onPress={handleSubmit}
                  disabled={loading || isSignInSuccess}
                  activeOpacity={0.9}
                >
                  <Text style={[
                    styles.primaryButtonText, 
                    { color: isDarkMode ? '#000000' : '#ffffff' }
                  ]}>
                    {loading ? 'Signing In…' : isSignInSuccess ? 'Success!' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Create Account Link */}
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => {
                  ScreenTransitions.fadeOutScale(fadeAnim, scaleAnim, () => {
                    onNavigateToSignUp();
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.linkText, 
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Don't have an account? <Text style={styles.linkTextBold}>Sign up</Text>
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
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
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
  },
  primaryButton: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
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
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  linkTextBold: {
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 16,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
});