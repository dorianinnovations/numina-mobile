import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Linking,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Header } from '../components/Header';
import { PageBackground } from '../components/PageBackground';
import { NuminaColors } from '../utils/colors';

interface SignUpScreenProps {
  onNavigateBack: () => void;
  onSignUpSuccess: () => void;
  onNavigateToSignIn: () => void;
  onNavigateToHero?: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onNavigateBack,
  onSignUpSuccess,
  onNavigateToSignIn,
  onNavigateToHero,
}) => {
  const { theme, isDarkMode } = useTheme();

  return (
    <PageBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />
        
        <Header 
          title="Sign Up"
          showBackButton={true}
          onBackPress={onNavigateBack}
        />
        
        <View style={styles.content}>
          <View style={[
            styles.card,
            {
              backgroundColor: isDarkMode ? '#111111' : 'rgba(255, 255, 255, 0.25)',
              borderColor: isDarkMode ? '#222222' : 'rgba(255, 255, 255, 0.3)',
            }
          ]}>
            <Text style={[
              styles.title,
              { color: isDarkMode ? '#ffffff' : '#000000' }
            ]}>
              Join Numina
            </Text>
            
            <Text style={[
              styles.subtitle,
              { color: isDarkMode ? '#888888' : '#666666' }
            ]}>
              Download the mobile app to create your account and explore
            </Text>
            
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[
                  styles.appStoreButton,
                  {
                    backgroundColor: isDarkMode ? '#add5fa' : '#add5fa',
                  }
                ]}
                onPress={() => Linking.openURL('https://apps.apple.com/app/numina')}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <FontAwesome5 name="apple" size={18} color={isDarkMode ? '#000000' : '#ffffff'} />
                  <Text style={[styles.buttonText, { color: isDarkMode ? '#000000' : '#ffffff' }]}>
                    App Store
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.appStoreButton,
                  {
                    backgroundColor: isDarkMode ? '#add5fa' : '#add5fa',
                  }
                ]}
                onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.numina')}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <FontAwesome5 name="google-play" size={18} color={isDarkMode ? '#000000' : '#ffffff'} />
                  <Text style={[styles.buttonText, { color: isDarkMode ? '#000000' : '#ffffff' }]}>
                    Play Store
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.loginLink}
              onPress={onNavigateToSignIn}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.loginLinkText,
                { color: isDarkMode ? '#999999' : '#666666' }
              ]}>
                Already have an account? Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </PageBackground>
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
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'CrimsonPro_700Bold',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    fontFamily: 'Nunito_400Regular',
  },
  buttonsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  appStoreButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  loginLink: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
  },
});