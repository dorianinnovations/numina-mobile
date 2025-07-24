import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/SimpleAuthContext';
import { PageBackground } from '../components/PageBackground';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useNavigation } from '@react-navigation/native';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { TierBadge } from '../components/TierBadge';

interface ProfileScreenProps {
  onNavigateBack: () => void;
}

interface UserProfile {
  profileImage?: string;
  displayName: string;
  bio: string;
  location: string;
  email?: string;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateBack,
}) => {
  const { isDarkMode } = useTheme();
  const { userData } = useAuth();
  const navigation = useNavigation();
  
  // Pull-to-refresh functionality
  const { refreshControl } = usePullToRefresh(async () => {
    // Refresh profile data
    console.log('Refreshing profile...');
  });
  
  const [editMode, setEditMode] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  
  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const containerScale = useRef(new Animated.Value(0.3)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const messageTranslateY = useRef(new Animated.Value(20)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const closeButtonOpacity = useRef(new Animated.Value(0)).current;
  const closeButtonTranslateY = useRef(new Animated.Value(30)).current;
  const [profile, setProfile] = useState<UserProfile>({
    profileImage: undefined,
    displayName: userData?.email?.split('@')[0] || 'User',
    bio: '',
    location: '',
    email: userData?.email || '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem('userProfile');
      if (stored) {
        const storedProfile = JSON.parse(stored);
        setProfile(prev => ({ ...prev, ...storedProfile }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    try {
      // Success haptic for saving profile
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      setEditMode(false);
      setShowSuccessScreen(true);
      
      // Start the amazing animation sequence
      startSuccessAnimation();
      
      // Auto-hide success screen after 2 seconds (quick animation)
      setTimeout(() => {
        hideSuccessScreen();
      }, 2000);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const startSuccessAnimation = () => {
    // Reset all animation values
    overlayOpacity.setValue(0);
    containerScale.setValue(0.3);
    containerOpacity.setValue(0);
    iconScale.setValue(0);
    iconRotation.setValue(0);
    titleOpacity.setValue(0);
    titleTranslateY.setValue(30);
    messageOpacity.setValue(0);
    messageTranslateY.setValue(20);
    pulseScale.setValue(1);
    closeButtonOpacity.setValue(0);
    closeButtonTranslateY.setValue(30);

    // Everything happens in parallel within 200ms
    Animated.parallel([
      // Overlay fade in
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Container appears with quick bounce
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(containerScale, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      // Icon quick scale and rotation
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(iconRotation, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Title appears quickly
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 200,
        delay: 50,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 200,
        delay: 50,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Message appears quickly
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 200,
        delay: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(messageTranslateY, {
        toValue: 0,
        duration: 200,
        delay: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Close button appears quickly
      Animated.timing(closeButtonOpacity, {
        toValue: 1,
        duration: 200,
        delay: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(closeButtonTranslateY, {
        toValue: 0,
        duration: 200,
        delay: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start gentle pulse after everything is visible
      startPulseAnimation();
    });
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const hideSuccessScreen = () => {
    // Elegant exit animation
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(containerScale, {
        toValue: 0.8,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessScreen(false);
      // Stop pulse animation
      pulseScale.stopAnimation();
    });
  };

  const pickImage = async () => {
    try {
      // Light haptic for image picker
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library permissions.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfile(prev => ({
          ...prev,
          profileImage: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <ScreenWrapper
      showHeader={true}
      showBackButton={true}
      showMenuButton={true}
      title={editMode ? 'Edit Profile' : 'Profile'}
      onBackPress={onNavigateBack}
    >
      <PageBackground>
        <SafeAreaView style={styles.container}>
          <StatusBar 
            barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
            backgroundColor="transparent"
            translucent={true}
          />
          
          {/* Edit Button */}
          <View style={styles.headerButtonContainer}>
            <TouchableOpacity
              style={[
                styles.headerButton,
                {
                  backgroundColor: isDarkMode 
                    ? '#1a1a1a' 
                    : '#add5fa',
                  borderColor: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(255, 255, 255, 0.3)',
                }
              ]}
              onPress={editMode ? saveProfile : () => {
                // Light haptic for entering edit mode
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditMode(true);
              }}
            >
              <FontAwesome5 
                name={editMode ? 'check' : 'edit'} 
                size={18} 
                color={isDarkMode ? '#99CCFF' : '#3e98ff'} 
              />
            </TouchableOpacity>
          </View>

        <View style={styles.contentContainer}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshControl.refreshing}
                onRefresh={refreshControl.onRefresh}
                tintColor="transparent"
                colors={['transparent']}
                progressBackgroundColor="transparent"
              />
            }
          >
            {/* Profile Header */}
            <View style={styles.profileHeader}>
            <TouchableOpacity 
              style={styles.profileImageContainer}
              onPress={editMode ? pickImage : undefined}
              disabled={!editMode}
            >
              {profile.profileImage ? (
                <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.placeholderImage, { backgroundColor: isDarkMode ? '#374151' : '#e5e7eb' }]}>
                  <FontAwesome5 
                    name="user" 
                    size={40} 
                    color={isDarkMode ? '#9ca3af' : '#6b7280'} 
                  />
                </View>
              )}
              {editMode && (
                <View style={styles.editImageOverlay}>
                  <FontAwesome5 name="camera" size={16} color="white" />
                </View>
              )}
            </TouchableOpacity>

            {/* Display Name */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>
                Display Name
              </Text>
              {editMode ? (
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                    color: isDarkMode ? '#fff' : '#000',
                    borderColor: isDarkMode ? '#4b5563' : '#d1d5db'
                  }]}
                  value={profile.displayName}
                  onChangeText={(text) => handleFieldChange('displayName', text)}
                  placeholder="Enter your name"
                  placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                  {profile.displayName}
                </Text>
              )}
            </View>

            {/* Email (Read-only) */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>
                Email
              </Text>
              <View style={styles.emailRow}>
                <Text style={[styles.fieldValue, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>
                  {profile.email}
                </Text>
                {userData?.tierInfo && (
                  <TierBadge tier={userData.tierInfo.tier} size="medium" />
                )}
              </View>
            </View>

            {/* Bio */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>
                Bio
              </Text>
              {editMode ? (
                <TextInput
                  style={[styles.input, styles.textArea, { 
                    backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                    color: isDarkMode ? '#fff' : '#000',
                    borderColor: isDarkMode ? '#4b5563' : '#d1d5db'
                  }]}
                  value={profile.bio}
                  onChangeText={(text) => handleFieldChange('bio', text)}
                  placeholder="Tell us about yourself"
                  placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                  multiline
                  numberOfLines={4}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                  {profile.bio || 'No bio yet'}
                </Text>
              )}
            </View>

            {/* Location */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>
                Location
              </Text>
              {editMode ? (
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                    color: isDarkMode ? '#fff' : '#000',
                    borderColor: isDarkMode ? '#4b5563' : '#d1d5db'
                  }]}
                  value={profile.location}
                  onChangeText={(text) => handleFieldChange('location', text)}
                  placeholder="Where are you from?"
                  placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                  {profile.location || 'No location set'}
                </Text>
              )}
            </View>
          </View>
          </ScrollView>
        </View>
        </SafeAreaView>
        
        {/* Success Screen Overlay */}
        {showSuccessScreen && (
          <Animated.View style={[
            styles.successOverlay,
            {
              opacity: overlayOpacity,
            }
          ]}>
            <Animated.View style={[
              styles.successContainer,
              {
                backgroundColor: isDarkMode ? '#1a1a1a' : '#cae6ff',
                borderColor: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(255, 255, 255, 0.3)',
                opacity: containerOpacity,
                transform: [{ scale: containerScale }],
              }
            ]}>
              <Animated.View
                style={{
                  transform: [
                    { scale: Animated.multiply(iconScale, pulseScale) },
                    { 
                      rotate: iconRotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }) 
                    }
                  ]
                }}
              >
                <FontAwesome5 
                  name="check-circle" 
                  size={15} 
                  color={isDarkMode ? '#6ec5ff' : '#4a5568'} 
                />
              </Animated.View>
              
              <Animated.View
                style={{
                  opacity: titleOpacity,
                  transform: [{ translateY: titleTranslateY }],
                }}
              >
                <Text style={[
                  styles.successTitle,
                  { color: isDarkMode ? '#ffffff' : '#4a5568' }
                ]}>
                  Profile Updated!
                </Text>
              </Animated.View>
              
              <Animated.View
                style={{
                  opacity: messageOpacity,
                  transform: [{ translateY: messageTranslateY }],
                }}
              >
                <Text style={[
                  styles.successMessage,
                  { color: isDarkMode ? '#a0aec0' : '#718096' }
                ]}>
                  Your changes have been saved successfully
                </Text>
              </Animated.View>
              
              {/* Close Button */}
              <Animated.View
                style={{
                  opacity: closeButtonOpacity,
                  transform: [{ translateY: closeButtonTranslateY }],
                  marginTop: 24,
                  width: '100%',
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    {
                      backgroundColor: isDarkMode ? '#6ec5ff' : '#4a5568',
                    }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    hideSuccessScreen();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.closeButtonText,
                    { color: isDarkMode ? '#1a1a1a' : '#ffffff' }
                  ]}>
                    Continue
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        )}
      </PageBackground>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 80,
  },
  headerButtonContainer: {
    position: 'absolute',
    top: 140,
    right: 35,
    zIndex: 1000,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    padding: 20,
    alignItems: 'center',
    
  },
  profileImageContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 150,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3e98ff',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldContainer: {
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Nunito_600SemiBold',
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 24,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    minHeight: 50,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  successContainer: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  closeButton: {
    width: '100%',
    height: 44,
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
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
});