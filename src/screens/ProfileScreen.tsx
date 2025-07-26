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
import { PageBackground } from '../components/ui/PageBackground';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { useNavigation } from '@react-navigation/native';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { TierBadge } from '../components/cards/TierBadge';
import { BaseWalletCard } from '../components/cards/WalletCard';
import { ChromaticCard } from '../components/cards/ChromaticCard';

interface ProfileScreenProps {
  onNavigateBack: () => void;
}

interface UserProfile {
  profileImage?: string;
  displayName: string;
  bio: string;
  location: string;
  email?: string;
  joinDate?: string;
  status?: 'online' | 'away' | 'offline';
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
  
  // Staggered load-in animations
  const editButtonOpacity = useRef(new Animated.Value(0)).current;
  const profileContentOpacity = useRef(new Animated.Value(0)).current;
  
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
    joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    status: 'online'
  });

  useEffect(() => {
    // Staggered load-in sequence
    const animateSequence = () => {
      // Edit button first (200ms delay)
      setTimeout(() => {
        Animated.timing(editButtonOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 200);

      // Profile content second (500ms delay)
      setTimeout(() => {
        Animated.timing(profileContentOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 500);
    };

    animateSequence();
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
      
      // Show action sheet for camera or library
      Alert.alert(
        'Update Profile Picture',
        'Choose how you\'d like to update your profile picture',
        [
          {
            text: 'Camera',
            onPress: () => takePhoto(),
          },
          {
            text: 'Photo Library',
            onPress: () => selectFromLibrary(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error in pickImage:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
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
        // Auto-save when photo is updated
        setTimeout(() => saveProfile(), 100);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const selectFromLibrary = async () => {
    try {
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
        // Auto-save when photo is updated
        setTimeout(() => saveProfile(), 100);
      }
    } catch (error) {
      console.error('Error selecting from library:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const StatusIndicator: React.FC<{ status: 'online' | 'away' | 'offline' }> = ({ status }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    
    useEffect(() => {
      if (status === 'online') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.3,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }, [status]);

    const getStatusColor = () => {
      switch (status) {
        case 'online': return '#10b981';
        case 'away': return '#f59e0b';
        case 'offline': return '#6b7280';
        default: return '#6b7280';
      }
    };

    return (
      <View style={styles.statusContainer}>
        <Animated.View 
          style={[
            styles.statusDot,
            { 
              backgroundColor: getStatusColor(),
              transform: [{ scale: status === 'online' ? pulseAnim : 1 }]
            }
          ]} 
        />
        <Text style={[styles.statusText, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>
    );
  };

  const SocialStatsCard: React.FC = () => {
    return (
      <BaseWalletCard style={styles.socialCard}>
        <View style={styles.socialStats}>
          <View style={styles.socialStatItem}>
            <Text style={[styles.socialNumber, { color: isDarkMode ? '#fff' : '#000' }]}>
              {Math.floor(Math.random() * 50) + 5}
            </Text>
            <Text style={[styles.socialLabel, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>
              Conversations
            </Text>
          </View>
          <View style={styles.socialDivider} />
          <View style={styles.socialStatItem}>
            <Text style={[styles.socialNumber, { color: isDarkMode ? '#fff' : '#000' }]}>
              {Math.floor(Math.random() * 100) + 10}
            </Text>
            <Text style={[styles.socialLabel, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>
              Connections
            </Text>
          </View>
          <View style={styles.socialDivider} />
          <View style={styles.socialStatItem}>
            <Text style={[styles.socialNumber, { color: isDarkMode ? '#fff' : '#000' }]}>
              {Math.floor(Math.random() * 20) + 2}
            </Text>
            <Text style={[styles.socialLabel, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>
              Credits
            </Text>
          </View>
        </View>
      </BaseWalletCard>
    );
  };

  const ActivityCard: React.FC = () => {
    return (
      <BaseWalletCard style={styles.activityCard}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          Recent Activity
        </Text>
        <View style={styles.activityItem}>
          <FontAwesome5 name="comment-dots" size={16} color={isDarkMode ? '#6ec5ff' : '#3e98ff'} />
          <Text style={[styles.activityText, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>
            Had a great chat about creativity
          </Text>
          <Text style={[styles.activityTime, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>
            2h ago
          </Text>
        </View>
        <View style={styles.activityItem}>
          <FontAwesome5 name="lightbulb" size={16} color={isDarkMode ? '#6ec5ff' : '#3e98ff'} />
          <Text style={[styles.activityText, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>
            Explored new AI tools
          </Text>
          <Text style={[styles.activityTime, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>
            1d ago
          </Text>
        </View>
      </BaseWalletCard>
    );
  };

  const InterestsCard: React.FC = () => {
    const interests = ['AI & Tech', 'Creative Writing', 'Philosophy', 'Music'];
    
    return (
      <BaseWalletCard style={styles.interestsCard}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          Interests
        </Text>
        <View style={styles.interestsContainer}>
          {interests.map((interest, index) => (
            <View key={index} style={[styles.interestTag, { 
              backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
              borderColor: isDarkMode ? '#4b5563' : '#e5e7eb'
            }]}>
              <Text style={[styles.interestText, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>
                {interest}
              </Text>
            </View>
          ))}
        </View>
      </BaseWalletCard>
    );
  };

  const DiscoveriesCard: React.FC = () => {
    const interests = ['AI & Tech', 'Creative Writing', 'Philosophy', 'Music'];
    
    return (
      <BaseWalletCard style={styles.interestsCard}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          Discoveries
        </Text>
        <View style={styles.interestsContainer}>
          {interests.map((interest, index) => (
            <View key={index} style={[styles.interestTag, { 
              backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
              borderColor: isDarkMode ? '#4b5563' : '#e5e7eb'
            }]}>
              <Text style={[styles.interestText, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>
                {interest}
              </Text>
            </View>
          ))}
        </View>
      </BaseWalletCard>
    );
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
          <Animated.View style={[styles.headerButtonContainer, { opacity: editButtonOpacity }]}>
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
          </Animated.View>

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
            <Animated.View style={{ opacity: profileContentOpacity }}>
            {/* NEW: Rectangular Header with Profile Picture */}
            <View style={[styles.rectangularHeader, { backgroundColor: isDarkMode ? '#1a1a2e' : '#667eea' }]}>
              {/* Header Background Pattern */}
              <View style={[styles.headerPattern, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' }]} />
              
              {/* Left-aligned Profile Picture */}
              <TouchableOpacity 
                style={styles.headerProfileContainer}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                {profile.profileImage ? (
                  <Image source={{ uri: profile.profileImage }} style={styles.headerProfileImage} />
                ) : (
                  <View style={[styles.headerProfileImage, styles.headerPlaceholderImage, { backgroundColor: isDarkMode ? '#374151' : 'rgba(255,255,255,0.2)' }]}>
                    <FontAwesome5 
                      name="user" 
                      size={32} 
                      color={isDarkMode ? '#9ca3af' : 'rgba(255,255,255,0.8)'} 
                    />
                  </View>
                )}
                {/* Upload Overlay - Always visible for upload */}
                <View style={styles.uploadOverlay}>
                  <FontAwesome5 name="camera" size={14} color="white" />
                </View>
              </TouchableOpacity>

              {/* Profile Info - Right side */}
              <View style={styles.headerProfileInfo}>
                <Text style={[styles.headerDisplayName, { color: isDarkMode ? '#fff' : '#fff' }]}>
                  {profile.displayName}
                </Text>
                <Text style={[styles.headerUsername, { color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.9)' }]}>
                  @{profile.displayName.toLowerCase().replace(/\s/g, '')}
                </Text>
                {userData?.tierInfo && (
                  <View style={styles.headerTierBadge}>
                    <TierBadge tier={userData.tierInfo.tier} size="small" />
                  </View>
                )}
              </View>
            </View>

            {/* Traditional Profile Header - Keep for editing fields */}
            <View style={styles.profileFieldsContainer}>

            {/* Display Name with Status */}
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
                <View style={styles.nameStatusRow}>
                  <Text style={[styles.fieldValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                    {profile.displayName}
                  </Text>
                  <StatusIndicator status={profile.status || 'online'} />
                </View>
              )}
            </View>

            {/* Join Date */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: isDarkMode ? '#d1d5db' : '#374151' }]}>
                Member Since
              </Text>
              <Text style={[styles.fieldValue, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>
                {profile.joinDate}
              </Text>
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

            {/* Social Stats */}
            <SocialStatsCard />

            {/* Recent Activity */}
            <ActivityCard />

            {/* Interests */}
            <InterestsCard />
            </Animated.View>
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
  
  // NEW: Rectangular Header Styles
  rectangularHeader: {
    position: 'relative',
    width: '100%',
    height: 160,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: '100%',
    transform: [{ skewX: '-15deg' }],
  },
  headerProfileContainer: {
    position: 'relative',
    zIndex: 2,
  },
  headerProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerPlaceholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  uploadOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerProfileInfo: {
    flex: 1,
    marginLeft: 20,
    zIndex: 2,
  },
  headerDisplayName: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerUsername: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    marginBottom: 8,
  },
  headerTierBadge: {
    alignSelf: 'flex-start',
  },
  
  profileHeader: {
    padding: 20,
    alignItems: 'center',
    
  },
  profileFieldsContainer: {
    paddingHorizontal: 20,
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

  // New styles for enhanced profile features
  nameStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    marginBottom: 16,
  },
  socialCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },
  socialStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  socialStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  socialNumber: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 4,
  },
  socialLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    textAlign: 'center',
  },
  socialDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
    marginHorizontal: 20,
  },
  activityCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(107, 114, 128, 0.1)',
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  interestsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },
  discoveriesCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },

  
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
});