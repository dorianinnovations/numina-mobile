import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from "../contexts/SimpleAuthContext";
import { PageBackground } from '../components/PageBackground';
import { Header } from '../components/Header';
import ApiService from '../services/api';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  onNavigateBack: () => void;
}

interface UserProfile {
  profileImage?: string;
  coverImage?: string;
  displayName: string;
  bio: string;
  location: string;
  interests: string[];
  personalityType: string;
  joinDate: string;
  visibility: {
    showPersonalityType: boolean;
    showInterests: boolean;
    showLocation: boolean;
    showBio: boolean;
    showSocialLinks: boolean;
    showContactInfo: boolean;
    showOnlineStatus: boolean;
  };
  socialLinks: {
    website?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    spotify?: string;
  };
  contactInfo: {
    email?: string;
    phone?: string;
    timezone?: string;
  };
  customization: {
    themeColor: string;
    profileFrameStyle: string;
    statusMessage?: string;
    isOnline: boolean;
  };
  professionalInfo?: {
    title?: string;
    company?: string;
    industry?: string;
  };
}


const PERSONALITY_TYPES = [
  'Supportive Listener', 'Creative Explorer', 'Analytical Thinker', 
  'Social Connector', 'Mindful Seeker', 'Adventure Enthusiast'
];

const THEME_COLORS = [
  '#86efac', '#60a5fa', '#f472b6', '#fbbf24', '#fb7185', '#a78bfa',
  '#34d399', '#38bdf8', '#e879f9', '#facc15', '#f87171', '#818cf8'
];

const FRAME_STYLES = [
  'circle', 'hexagon', 'star', 'diamond', 'rounded', 'gradient'
];

const INTEREST_OPTIONS = [
  'Mindfulness', 'Technology', 'Art & Creativity', 'Fitness & Wellness',
  'Reading', 'Music', 'Travel', 'Cooking', 'Photography', 'Gaming',
  'Nature & Outdoors', 'Social Impact', 'Learning & Growth', 'Community Building'
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateBack,
}) => {
  const { isDarkMode } = useTheme();
  const { userData } = useAuth();
  
  const [editMode, setEditMode] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showInterestSelector, setShowInterestSelector] = useState(false);
  const [showPersonalitySelector, setShowPersonalitySelector] = useState(false);
  const [showCoverImagePicker, setShowCoverImagePicker] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showSocialLinksEditor, setShowSocialLinksEditor] = useState(false);
  const [showContactInfoEditor, setShowContactInfoEditor] = useState(false);
  const [showPrivacyControls, setShowPrivacyControls] = useState(false);
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [isSavingSocialLinks, setIsSavingSocialLinks] = useState(false);
  const [socialLinksSaved, setSocialLinksSaved] = useState(false);
  
  // Animation refs
  const spinAnim = useRef(new Animated.Value(0)).current;
  
  const [profile, setProfile] = useState<UserProfile>({
    profileImage: undefined,
    coverImage: undefined,
    displayName: userData?.displayName || userData?.email?.split('@')[0] || 'User',
    bio: '',
    location: '',
    interests: [],
    personalityType: '',
    joinDate: userData?.createdAt || new Date().toISOString(),
    visibility: {
      showPersonalityType: true,
      showInterests: true,
      showLocation: true,
      showBio: true,
      showSocialLinks: true,
      showContactInfo: false,
      showOnlineStatus: true,
    },
    socialLinks: {},
    contactInfo: {
      email: userData?.email || '',
    },
    customization: {
      themeColor: '#80c1ff',
      profileFrameStyle: 'circle',
      statusMessage: '',
      isOnline: true
    },
    professionalInfo: {}
  });
  
  const [tempSocialLinks, setTempSocialLinks] = useState(profile.socialLinks);

  useEffect(() => {
    requestPermissions();
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      // Load user profile from local storage first
      const stored = await AsyncStorage.getItem('userProfile');
      if (stored) {
        const storedProfile = JSON.parse(stored);
        setProfile(prev => ({ ...prev, ...storedProfile }));
      }
      
      // Then try to load from API
      // const response = await ApiService.getUserProfile();
      // if (response.success) {
      //   setProfile(response.data);
      //   await AsyncStorage.setItem('userProfile', JSON.stringify(response.data));
      // }
      console.log('Loading profile data...');
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to upload photos.');
    }
  };

  const pickImage = async (source: 'camera' | 'library', imageType: 'profile' | 'cover' = 'profile') => {
    try {
      let result;
      
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'We need camera permissions to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: imageType === 'cover' ? [16, 9] : [1, 1],
          quality: 0.7,
          base64: false,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: imageType === 'cover' ? [16, 9] : [1, 1],
          quality: 0.7,
          base64: false,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const updatedProfile = imageType === 'cover' 
          ? { ...profile, coverImage: result.assets[0].uri }
          : { ...profile, profileImage: result.assets[0].uri };
        
        setProfile(updatedProfile);
        
        // Persist to storage
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        
        if (imageType === 'cover') {
          setShowCoverImagePicker(false);
        } else {
          setShowImagePicker(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const saveProfile = async () => {
    try {
      // Save to local storage
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      
      // Here you would typically save to your backend
      // await ApiService.updateUserProfile(profile);
      console.log('Saving profile:', profile);
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const toggleInterest = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openSocialLinksEditor = () => {
    setTempSocialLinks(profile.socialLinks);
    setShowSocialLinksEditor(true);
    setSocialLinksSaved(false);
  };

  const saveSocialLinks = async () => {
    setIsSavingSocialLinks(true);
    
    // Start spinning animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    spinAnimation.start();
    
    try {
      const updatedProfile = { ...profile, socialLinks: tempSocialLinks };
      setProfile(updatedProfile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      
      // Stop spinning animation
      spinAnimation.stop();
      spinAnim.setValue(0);
      
      // Show success animation
      setSocialLinksSaved(true);
      setTimeout(() => {
        setSocialLinksSaved(false);
        setShowSocialLinksEditor(false);
      }, 1500);
    } catch (error) {
      console.error('Error saving social links:', error);
      Alert.alert('Error', 'Failed to save social links. Please try again.');
      // Stop spinning animation on error
      spinAnimation.stop();
      spinAnim.setValue(0);
    } finally {
      setIsSavingSocialLinks(false);
    }
  };

  const cancelSocialLinksEdit = () => {
    setTempSocialLinks(profile.socialLinks);
    setShowSocialLinksEditor(false);
    setSocialLinksSaved(false);
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
          title={editMode ? 'Edit Profile' : 'Profile'}
          showBackButton={true}
          showMenuButton={false}
          onBackPress={onNavigateBack}
        />
        
        {/* Edit/Save Button positioned separately */}
        <View style={styles.headerButtonContainer}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={editMode ? saveProfile : () => setEditMode(true)}
          >
              <FontAwesome5 
                name={editMode ? 'check' : 'edit'} 
                size={18} 
                color={isDarkMode ? '#86efac' : '#10b981'} 
              />
            </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Enhanced Profile Header */}
          <View style={[
            styles.profileHeader,
            {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0, 0, 0, 0.1)',
            }
          ]}>
            {/* Cover Photo Section */}
            <View style={styles.coverPhotoSection}>
              <TouchableOpacity
                style={[
                  styles.coverPhoto,
                  {
                    backgroundColor: profile.coverImage ? 'transparent' : 
                      isDarkMode ? 'rgba(134, 239, 172, 0.1)' : 'rgba(134, 239, 172, 0.15)',
                  }
                ]}
                onPress={() => setShowCoverImagePicker(true)}
              >
                {profile.coverImage ? (
                  <Image source={{ uri: profile.coverImage }} style={styles.coverPhotoImage} />
                ) : (
                  <LinearGradient
                    colors={[profile.customization.themeColor + '40', profile.customization.themeColor + '20']}
                    style={styles.coverPhotoGradient}
                  >
                    <FontAwesome5 
                      name="image" 
                      size={24} 
                      color={profile.customization.themeColor} 
                    />
                  </LinearGradient>
                )}
                {editMode && (
                  <View style={[
                    styles.editCoverOverlay,
                    { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)' }
                  ]}>
                    <FontAwesome5 
                      name="camera" 
                      size={16} 
                      color={isDarkMode ? '#ffffff' : '#000000'} 
                    />
                    <Text style={[
                      styles.editCoverText,
                      { color: isDarkMode ? '#ffffff' : '#000000' }
                    ]}>
                      Cover Photo
                    </Text>
                  </View>
                )}
                
                {/* Eyeball button for public preview */}
                <TouchableOpacity
                  style={[
                    styles.eyeballButton,
                    {
                      backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                    }
                  ]}
                  onPress={() => setShowPublicPreview(true)}
                >
                  <FontAwesome5 
                    name="eye" 
                    size={16} 
                    color={profile.customization.themeColor} 
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>

            {/* Profile Content Container */}
            <View style={styles.profileContent}>
              {/* Profile Image with Frame Style */}
              <TouchableOpacity
                style={[
                  styles.profileImageContainer,
                  {
                    backgroundColor: isDarkMode ? 'rgba(134, 239, 172, 0.1)' : 'rgba(134, 239, 172, 0.15)',
                    borderColor: profile.customization.themeColor,
                    borderWidth: 3,
                  },
                  profile.customization.profileFrameStyle === 'hexagon' && styles.hexagonFrame,
                  profile.customization.profileFrameStyle === 'star' && styles.starFrame,
                  profile.customization.profileFrameStyle === 'diamond' && styles.diamondFrame,
                ]}
                onPress={() => setShowImagePicker(true)}
              >
                {profile.profileImage ? (
                  <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
                ) : (
                  <FontAwesome5 
                    name="user" 
                    size={32} 
                    color={profile.customization.themeColor} 
                  />
                )}
                {editMode && (
                  <View style={[
                    styles.editImageOverlay,
                    { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)' }
                  ]}>
                    <FontAwesome5 
                      name="camera" 
                      size={16} 
                      color={isDarkMode ? '#ffffff' : '#000000'} 
                    />
                  </View>
                )}
                {/* Online Status Indicator */}
                {profile.customization.isOnline && (
                  <View style={[
                    styles.onlineIndicator,
                    { backgroundColor: '#10b981' }
                  ]} />
                )}
              </TouchableOpacity>

              {/* Display Name & Status */}
              <View style={styles.nameSection}>
                {editMode ? (
                  <TextInput
                    style={[
                      styles.editInput,
                      styles.displayNameInput,
                      { 
                        color: isDarkMode ? '#ffffff' : '#000000',
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      }
                    ]}
                    value={profile.displayName}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, displayName: text }))}
                    placeholder="Display Name"
                    placeholderTextColor={isDarkMode ? '#888888' : '#666666'}
                    keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                  />
                ) : (
                  <Text style={[
                    styles.displayName,
                    { color: isDarkMode ? '#ffffff' : '#000000' }
                  ]}>
                    {profile.displayName}
                  </Text>
                )}

                {/* Status Message */}
                {editMode ? (
                  <TextInput
                    style={[
                      styles.editInput,
                      styles.statusInput,
                      { 
                        color: isDarkMode ? '#ffffff' : '#000000',
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      }
                    ]}
                    value={profile.customization.statusMessage}
                    onChangeText={(text) => setProfile(prev => ({ 
                      ...prev, 
                      customization: { ...prev.customization, statusMessage: text }
                    }))}
                    placeholder="What's on your mind?"
                    placeholderTextColor={isDarkMode ? '#888888' : '#666666'}
                    keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                  />
                ) : profile.customization.statusMessage ? (
                  <Text style={[
                    styles.statusMessage,
                    { color: isDarkMode ? '#bbbbbb' : '#666666' }
                  ]}>
                    {profile.customization.statusMessage}
                  </Text>
                ) : null}
              </View>

              {/* Personality Type Badge */}
              {profile.personalityType && profile.visibility.showPersonalityType && (
                <TouchableOpacity
                  style={[
                    styles.personalityBadge,
                    {
                      backgroundColor: profile.customization.themeColor + '20',
                      borderColor: profile.customization.themeColor,
                    }
                  ]}
                  onPress={editMode ? () => setShowPersonalitySelector(true) : undefined}
                  disabled={!editMode}
                >
                  <FontAwesome5 name="brain" size={14} color={profile.customization.themeColor} />
                  <Text style={[
                    styles.personalityBadgeText,
                    { color: profile.customization.themeColor }
                  ]}>
                    {profile.personalityType}
                  </Text>
                  {editMode && (
                    <FontAwesome5 name="edit" size={12} color={profile.customization.themeColor} />
                  )}
                </TouchableOpacity>
              )}

              {/* Professional Info */}
              {profile.professionalInfo && (profile.professionalInfo.title || profile.professionalInfo.company) && (
                <View style={styles.professionalSection}>
                  {profile.professionalInfo.title && (
                    <Text style={[
                      styles.professionalTitle,
                      { color: profile.customization.themeColor }
                    ]}>
                      {profile.professionalInfo.title}
                    </Text>
                  )}
                  {profile.professionalInfo.company && (
                    <Text style={[
                      styles.professionalCompany,
                      { color: isDarkMode ? '#bbbbbb' : '#666666' }
                    ]}>
                      {profile.professionalInfo.company}
                    </Text>
                  )}
                </View>
              )}

              {/* Interests Tags */}
              {profile.interests.length > 0 && profile.visibility.showInterests && (
                <View style={styles.interestsInHeader}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.interestsScroll}
                  >
                    {profile.interests.slice(0, 3).map((interest, index) => (
                      <View
                        key={index}
                        style={[
                          styles.interestTagSmall,
                          {
                            backgroundColor: profile.customization.themeColor + '15',
                            borderColor: profile.customization.themeColor + '50',
                          }
                        ]}
                      >
                        <Text style={[
                          styles.interestTagText,
                          { color: profile.customization.themeColor }
                        ]}>
                          {interest}
                        </Text>
                      </View>
                    ))}
                    {profile.interests.length > 3 && (
                      <TouchableOpacity
                        style={[
                          styles.interestTagSmall,
                          styles.moreInterestsTag,
                          {
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                          }
                        ]}
                        onPress={() => setShowInterestSelector(true)}
                      >
                        <Text style={[
                          styles.interestTagText,
                          { color: isDarkMode ? '#ffffff' : '#000000' }
                        ]}>
                          +{profile.interests.length - 3}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                  {editMode && (
                    <TouchableOpacity
                      style={[
                        styles.editInterestsButton,
                        { borderColor: profile.customization.themeColor }
                      ]}
                      onPress={() => setShowInterestSelector(true)}
                    >
                      <FontAwesome5 name="plus" size={12} color={profile.customization.themeColor} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Enhanced Bio */}
              {editMode ? (
                <TextInput
                  style={[
                    styles.editInput,
                    styles.bioInput,
                    { 
                      color: isDarkMode ? '#ffffff' : '#000000',
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                    }
                  ]}
                  value={profile.bio}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={isDarkMode ? '#888888' : '#666666'}
                  multiline={true}
                  numberOfLines={4}
                  keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                />
              ) : (profile.bio && profile.visibility.showBio) ? (
                <Text style={[
                  styles.bio,
                  { color: isDarkMode ? '#bbbbbb' : '#666666' }
                ]}>
                  {profile.bio}
                </Text>
              ) : null}

              {/* Location & Info Row */}
              <View style={styles.infoRow}>
                {editMode ? (
                  <View style={styles.locationContainer}>
                    <FontAwesome5 name="map-marker-alt" size={14} color={profile.customization.themeColor} />
                    <TextInput
                      style={[
                        styles.editInput,
                        styles.locationInput,
                        { 
                          color: isDarkMode ? '#ffffff' : '#000000',
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                        }
                      ]}
                      value={profile.location}
                      onChangeText={(text) => setProfile(prev => ({ ...prev, location: text }))}
                      placeholder="Your location"
                      placeholderTextColor={isDarkMode ? '#888888' : '#666666'}
                      keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                    />
                  </View>
                ) : (profile.location && profile.visibility.showLocation) ? (
                  <View style={styles.locationContainer}>
                    <FontAwesome5 name="map-marker-alt" size={14} color={profile.customization.themeColor} />
                    <Text style={[
                      styles.location,
                      { color: isDarkMode ? '#bbbbbb' : '#666666' }
                    ]}>
                      {profile.location}
                    </Text>
                  </View>
                ) : null}

                {/* Join Date */}
                <Text style={[
                  styles.joinDate,
                  { color: isDarkMode ? '#888888' : '#999999' }
                ]}>
                  Member since {new Date(profile.joinDate).getFullYear()}
                </Text>
              </View>

            </View>
          </View>

          {/* Profile Options Section */}
          <View style={[
            styles.optionsSection,
            {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0, 0, 0, 0.1)',
            }
          ]}>
         
            
            <View style={styles.optionsList}>
              <TouchableOpacity
                style={[
                  styles.optionBrick,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  }
                ]}
                onPress={openSocialLinksEditor}
              >
                <FontAwesome5 name="link" size={16} color={profile.customization.themeColor} />
                <Text style={[
                  styles.optionBrickText,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Social Links
                </Text>
                <FontAwesome5 name="chevron-right" size={12} color={isDarkMode ? '#888888' : '#666666'} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.optionBrick,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  }
                ]}
                onPress={() => setShowContactInfoEditor(true)}
              >
                <FontAwesome5 name="envelope" size={16} color={profile.customization.themeColor} />
                <Text style={[
                  styles.optionBrickText,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Contact Info
                </Text>
                <FontAwesome5 name="chevron-right" size={12} color={isDarkMode ? '#888888' : '#666666'} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.optionBrick,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  }
                ]}
                onPress={() => setShowThemeSelector(true)}
              >
                <FontAwesome5 name="palette" size={16} color={profile.customization.themeColor} />
                <Text style={[
                  styles.optionBrickText,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Appearance
                </Text>
                <FontAwesome5 name="chevron-right" size={12} color={isDarkMode ? '#888888' : '#666666'} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.optionBrick,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  }
                ]}
                onPress={() => setShowPrivacyControls(true)}
              >
                <FontAwesome5 name="eye" size={16} color={profile.customization.themeColor} />
                <Text style={[
                  styles.optionBrickText,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Privacy Settings
                </Text>
                <FontAwesome5 name="chevron-right" size={12} color={isDarkMode ? '#888888' : '#666666'} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.optionBrick,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  }
                ]}
                onPress={() => setShowInterestSelector(true)}
              >
                <FontAwesome5 name="heart" size={16} color={profile.customization.themeColor} />
                <Text style={[
                  styles.optionBrickText,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Interests
                </Text>
                <FontAwesome5 name="chevron-right" size={12} color={isDarkMode ? '#888888' : '#666666'} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.optionBrick,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  }
                ]}
                onPress={() => setShowPersonalitySelector(true)}
              >
                <FontAwesome5 name="brain" size={16} color={profile.customization.themeColor} />
                <Text style={[
                  styles.optionBrickText,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Personality Type
                </Text>
                <FontAwesome5 name="chevron-right" size={12} color={isDarkMode ? '#888888' : '#666666'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Public Preview Modal */}
          <Modal
            visible={showPublicPreview}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowPublicPreview(false)}
          >
            <View style={styles.modalOverlay}>
              <BlurView
                intensity={95}
                style={styles.modalOverlay}
                experimentalBlurMethod="dimezisBlurView"
              >
                <View style={[
                  styles.publicPreviewModal,
                  {
                    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  }
                ]}>
                  <View style={styles.modalHeader}>
                    <Text style={[
                      styles.modalTitle,
                      { color: isDarkMode ? '#ffffff' : '#000000' }
                    ]}>
                      Public Profile Preview
                    </Text>
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={() => setShowPublicPreview(false)}
                    >
                      <FontAwesome5 name="times" size={18} color={isDarkMode ? '#ffffff' : '#000000'} />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Preview Profile Card */}
                  <View style={[
                    styles.previewProfileCard,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.9)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0, 0, 0, 0.1)',
                    }
                  ]}>
                    {/* Preview Cover Photo */}
                    <View style={styles.previewCoverPhoto}>
                      {profile.coverImage ? (
                        <Image source={{ uri: profile.coverImage }} style={styles.previewCoverPhotoImage} />
                      ) : (
                        <LinearGradient
                          colors={[profile.customization.themeColor + '40', profile.customization.themeColor + '20']}
                          style={styles.previewCoverPhotoGradient}
                        >
                          <FontAwesome5 
                            name="image" 
                            size={16} 
                            color={profile.customization.themeColor} 
                          />
                        </LinearGradient>
                      )}
                    </View>
                    
                    {/* Preview Profile Content */}
                    <View style={styles.previewProfileContent}>
                      {/* Preview Profile Image */}
                      <View style={[
                        styles.previewProfileImage,
                        {
                          backgroundColor: isDarkMode ? 'rgba(134, 239, 172, 0.1)' : 'rgba(134, 239, 172, 0.15)',
                          borderColor: profile.customization.themeColor,
                        }
                      ]}>
                        {profile.profileImage ? (
                          <Image source={{ uri: profile.profileImage }} style={styles.previewProfileImageInner} />
                        ) : (
                          <FontAwesome5 name="user" size={24} color={profile.customization.themeColor} />
                        )}
                        {profile.customization.isOnline && profile.visibility.showOnlineStatus && (
                          <View style={styles.previewOnlineIndicator} />
                        )}
                      </View>
                      
                      {/* Preview Profile Info */}
                      <Text style={[
                        styles.previewDisplayName,
                        { color: isDarkMode ? '#ffffff' : '#000000' }
                      ]}>
                        {profile.displayName}
                      </Text>
                      
                      {profile.customization.statusMessage && (
                        <Text style={[
                          styles.previewStatusMessage,
                          { color: isDarkMode ? '#bbbbbb' : '#666666' }
                        ]}>
                          {profile.customization.statusMessage}
                        </Text>
                      )}
                      
                      {profile.personalityType && profile.visibility.showPersonalityType && (
                        <View style={[
                          styles.previewPersonalityBadge,
                          {
                            backgroundColor: profile.customization.themeColor + '20',
                            borderColor: profile.customization.themeColor,
                          }
                        ]}>
                          <FontAwesome5 name="brain" size={10} color={profile.customization.themeColor} />
                          <Text style={[
                            styles.previewPersonalityText,
                            { color: profile.customization.themeColor }
                          ]}>
                            {profile.personalityType}
                          </Text>
                        </View>
                      )}
                      
                      {profile.interests.length > 0 && profile.visibility.showInterests && (
                        <View style={styles.previewInterestsContainer}>
                          {profile.interests.slice(0, 3).map((interest, index) => (
                            <View
                              key={index}
                              style={[
                                styles.previewInterestTag,
                                {
                                  backgroundColor: profile.customization.themeColor + '15',
                                  borderColor: profile.customization.themeColor + '50',
                                }
                              ]}
                            >
                              <Text style={[
                                styles.previewInterestText,
                                { color: profile.customization.themeColor }
                              ]}>
                                {interest}
                              </Text>
                            </View>
                          ))}
                          {profile.interests.length > 3 && (
                            <Text style={[
                              styles.previewMoreInterests,
                              { color: isDarkMode ? '#888888' : '#666666' }
                            ]}>
                              +{profile.interests.length - 3}
                            </Text>
                          )}
                        </View>
                      )}
                      
                      {profile.bio && profile.visibility.showBio && (
                        <Text style={[
                          styles.previewBio,
                          { color: isDarkMode ? '#bbbbbb' : '#666666' }
                        ]} numberOfLines={2}>
                          {profile.bio}
                        </Text>
                      )}
                      
                      {profile.location && profile.visibility.showLocation && (
                        <View style={styles.previewLocationContainer}>
                          <FontAwesome5 name="map-marker-alt" size={10} color={profile.customization.themeColor} />
                          <Text style={[
                            styles.previewLocation,
                            { color: isDarkMode ? '#bbbbbb' : '#666666' }
                          ]}>
                            {profile.location}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </BlurView>
            </View>
          </Modal>
        </ScrollView>

        {/* Image Picker Modal */}
        <Modal
          visible={showImagePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowImagePicker(false)}
        >
          <BlurView style={styles.modalOverlay} intensity={20}>
            <View style={[
              styles.imagePickerModal,
              {
                backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                borderColor: isDarkMode ? '#333333' : '#e5e7eb',
              }
            ]}>
              <Text style={[
                styles.modalTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>
                Choose Photo Source
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.imagePickerOption,
                  {
                    backgroundColor: isDarkMode ? 'rgba(134, 239, 172, 0.1)' : 'rgba(134, 239, 172, 0.15)',
                    borderColor: isDarkMode ? '#80c1ff' : '#80c1ff',
                  }
                ]}
                onPress={() => pickImage('camera')}
              >
                <FontAwesome5 name="camera" size={20} color={isDarkMode ? '#80c1ff' : '#80c1ff'} />
                <Text style={[
                  styles.imagePickerOptionText,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Take Photo
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.imagePickerOption,
                  {
                    backgroundColor: isDarkMode ? 'rgba(134, 239, 172, 0.1)' : 'rgba(134, 239, 172, 0.15)',
                    borderColor: isDarkMode ? '#80c1ff' : '#80c1ff',
                  }
                ]}
                onPress={() => pickImage('library')}
              >
                <FontAwesome5 name="image" size={20} color={isDarkMode ? '#80c1ff' : '#80c1ff'} />
                <Text style={[
                  styles.imagePickerOptionText,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Choose from Library
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowImagePicker(false)}
              >
                <Text style={[
                  styles.cancelButtonText,
                  { color: isDarkMode ? '#888888' : '#666666' }
                ]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Modal>

        {/* Interest Selector Modal */}
        <Modal
          visible={showInterestSelector}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowInterestSelector(false)}
        >
          <BlurView style={styles.modalOverlay} intensity={20}>
            <View style={[
              styles.interestSelectorModal,
              {
                backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                borderColor: isDarkMode ? '#333333' : '#e5e7eb',
              }
            ]}>
              <View style={styles.modalHeader}>
                <Text style={[
                  styles.modalTitle,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Select Your Interests
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowInterestSelector(false)}
                >
                  <FontAwesome5 name="times" size={18} color={isDarkMode ? '#888888' : '#666666'} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.interestScrollView}>
                <View style={styles.interestOptionsContainer}>
                  {INTEREST_OPTIONS.map((interest, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.interestOption,
                        {
                          backgroundColor: profile.interests.includes(interest)
                            ? (isDarkMode ? 'rgba(134, 239, 172, 0.2)' : 'rgba(134, 239, 172, 0.3)')
                            : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                          borderColor: profile.interests.includes(interest)
                            ? (isDarkMode ? '#80c1ff' : '#80c1ff')
                            : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                        }
                      ]}
                      onPress={() => toggleInterest(interest)}
                    >
                      <Text style={[
                        styles.interestOptionText,
                        {
                          color: profile.interests.includes(interest)
                            ? (isDarkMode ? '#80c1ff' : '#80c1ff')
                            : (isDarkMode ? '#ffffff' : '#000000')
                        }
                      ]}>
                        {interest}
                      </Text>
                      {profile.interests.includes(interest) && (
                        <FontAwesome5 
                          name="check" 
                          size={14} 
                          color={isDarkMode ? '#80c1ff' : '#80c1ff'} 
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </BlurView>
        </Modal>

        {/* Personality Selector Modal */}
        <Modal
          visible={showPersonalitySelector}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPersonalitySelector(false)}
        >
          <BlurView style={styles.modalOverlay} intensity={20}>
            <View style={[
              styles.personalitySelectorModal,
              {
                backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                borderColor: isDarkMode ? '#333333' : '#e5e7eb',
              }
            ]}>
              <View style={styles.modalHeader}>
                <Text style={[
                  styles.modalTitle,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Choose Your Personality Type
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowPersonalitySelector(false)}
                >
                  <FontAwesome5 name="times" size={18} color={isDarkMode ? '#888888' : '#666666'} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.personalityOptionsContainer}>
                {PERSONALITY_TYPES.map((type, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.personalityOption,
                      {
                        backgroundColor: profile.personalityType === type
                          ? (isDarkMode ? 'rgba(134, 239, 172, 0.2)' : 'rgba(134, 239, 172, 0.3)')
                          : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                        borderColor: profile.personalityType === type
                          ? (isDarkMode ? '#80c1ff' : '#80c1ff')
                          : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                      }
                    ]}
                    onPress={() => {
                      setProfile(prev => ({ ...prev, personalityType: type }));
                      setShowPersonalitySelector(false);
                    }}
                  >
                    <FontAwesome5 
                      name="brain" 
                      size={18} 
                      color={profile.personalityType === type
                        ? (isDarkMode ? '#80c1ff' : '#80c1ff')
                        : (isDarkMode ? '#888888' : '#666666')
                      } 
                    />
                    <Text style={[
                      styles.personalityOptionText,
                      {
                        color: profile.personalityType === type
                          ? (isDarkMode ? '#80c1ff' : '#80c1ff')
                          : (isDarkMode ? '#ffffff' : '#000000')
                      }
                    ]}>
                      {type}
                    </Text>
                    {profile.personalityType === type && (
                      <FontAwesome5 
                        name="check" 
                        size={16} 
                        color={isDarkMode ? '#80c1ff' : '##80c1ff'} 
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </BlurView>
        </Modal>

        {/* Cover Image Picker Modal */}
        <Modal
          visible={showCoverImagePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCoverImagePicker(false)}
        >
          <BlurView style={styles.modalOverlay} intensity={20}>
            <View style={[
              styles.imagePickerModal,
              {
                backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                borderColor: isDarkMode ? '#333333' : '#e5e7eb',
              }
            ]}>
              <Text style={[
                styles.modalTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>
                Choose Cover Photo
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.imagePickerOption,
                  {
                    backgroundColor: isDarkMode ? 'rgba(134, 239, 172, 0.1)' : 'rgba(134, 239, 172, 0.15)',
                    borderColor: isDarkMode ? '#80c1ff' : '#80c1ff',
                  }
                ]}
                onPress={() => pickImage('camera', 'cover')}
              >
                <FontAwesome5 name="camera" size={20} color={isDarkMode ? '#80c1ff' : '#80c1ff'} />
                <Text style={[
                  styles.imagePickerOptionText,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Take Photo
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.imagePickerOption,
                  {
                    backgroundColor: isDarkMode ? 'rgba(134, 239, 172, 0.1)' : 'rgba(134, 239, 172, 0.15)',
                    borderColor: isDarkMode ? '#80c1ff' : '#80c1ff',
                  }
                ]}
                onPress={() => pickImage('library', 'cover')}
              >
                <FontAwesome5 name="image" size={20} color={isDarkMode ? '#80c1ff' : '#80c1ff'} />
                <Text style={[
                  styles.imagePickerOptionText,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Choose from Library
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCoverImagePicker(false)}
              >
                <Text style={[
                  styles.cancelButtonText,
                  { color: isDarkMode ? '#888888' : '#666666' }
                ]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Modal>

        {/* Theme Selector Modal */}
        <Modal
          visible={showThemeSelector}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowThemeSelector(false)}
        >
          <BlurView style={styles.modalOverlay} intensity={20}>
            <View style={[
              styles.themeSelectorModal,
              {
                backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                borderColor: isDarkMode ? '#333333' : '#e5e7eb',
              }
            ]}>
              <View style={styles.modalHeader}>
                <Text style={[
                  styles.modalTitle,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Customize Your Theme
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowThemeSelector(false)}
                >
                  <FontAwesome5 name="times" size={18} color={isDarkMode ? '#888888' : '#666666'} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.themeScrollView}>
                <Text style={[
                  styles.sectionSubtitle,
                  { color: isDarkMode ? '#bbbbbb' : '#666666' }
                ]}>
                  Theme Colors
                </Text>
                <View style={styles.colorGrid}>
                  {THEME_COLORS.map((color, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.colorOption,
                        {
                          backgroundColor: color,
                          borderColor: profile.customization.themeColor === color
                            ? (isDarkMode ? '#ffffff' : '#000000')
                            : 'transparent',
                          borderWidth: profile.customization.themeColor === color ? 2 : 0,
                        }
                      ]}
                      onPress={() => setProfile(prev => ({
                        ...prev,
                        customization: { ...prev.customization, themeColor: color }
                      }))}
                    >
                      {profile.customization.themeColor === color && (
                        <FontAwesome5 
                          name="check" 
                          size={16} 
                          color={isDarkMode ? '#ffffff' : '#000000'} 
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Text style={[
                  styles.sectionSubtitle,
                  { color: isDarkMode ? '#bbbbbb' : '#666666', marginTop: 24 }
                ]}>
                  Profile Frame Style
                </Text>
                <View style={styles.frameStyleOptions}>
                  {FRAME_STYLES.map((frameStyle, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.frameStyleOption,
                        {
                          backgroundColor: profile.customization.profileFrameStyle === frameStyle
                            ? (isDarkMode ? 'rgba(134, 239, 172, 0.2)' : 'rgba(134, 239, 172, 0.3)')
                            : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                          borderColor: profile.customization.profileFrameStyle === frameStyle
                            ? profile.customization.themeColor
                            : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                        }
                      ]}
                      onPress={() => setProfile(prev => ({
                        ...prev,
                        customization: { ...prev.customization, profileFrameStyle: frameStyle }
                      }))}
                    >
                      <Text style={[
                        styles.frameStyleText,
                        {
                          color: profile.customization.profileFrameStyle === frameStyle
                            ? profile.customization.themeColor
                            : (isDarkMode ? '#ffffff' : '#000000')
                        }
                      ]}>
                        {frameStyle.charAt(0).toUpperCase() + frameStyle.slice(1)}
                      </Text>
                      {profile.customization.profileFrameStyle === frameStyle && (
                        <FontAwesome5 
                          name="check" 
                          size={14} 
                          color={profile.customization.themeColor} 
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </BlurView>
        </Modal>

        {/* Social Links Editor Modal */}
        <Modal
          visible={showSocialLinksEditor}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSocialLinksEditor(false)}
        >
          <BlurView style={styles.modalOverlay} intensity={20}>
            <View style={[
              styles.socialLinksModal,
              {
                backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                borderColor: isDarkMode ? '#333333' : '#e5e7eb',
              }
            ]}>
              <View style={styles.modalHeader}>
                <Text style={[
                  styles.modalTitle,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Social Links
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowSocialLinksEditor(false)}
                >
                  <FontAwesome5 name="times" size={18} color={isDarkMode ? '#888888' : '#666666'} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.socialLinksContent}>
                <View style={styles.socialLinkInput}>
                  <FontAwesome5 name="globe" size={16} color={isDarkMode ? '#80c1ff' : '#80c1ff'} />
                  <TextInput
                    style={[
                      styles.editInput,
                      styles.linkInput,
                      { 
                        color: isDarkMode ? '#ffffff' : '#000000',
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      }
                    ]}
                    value={tempSocialLinks.website || ''}
                    onChangeText={(text) => setTempSocialLinks(prev => ({
                      ...prev,
                      website: text
                    }))}
                    placeholder="Website URL"
                    placeholderTextColor={isDarkMode ? '#888888' : '#666666'}
                    keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                  />
                </View>
                
                <View style={styles.socialLinkInput}>
                  <FontAwesome5 name="twitter" size={16} color="#1DA1F2" />
                  <TextInput
                    style={[
                      styles.editInput,
                      styles.linkInput,
                      { 
                        color: isDarkMode ? '#ffffff' : '#000000',
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      }
                    ]}
                    value={tempSocialLinks.twitter || ''}
                    onChangeText={(text) => setTempSocialLinks(prev => ({
                      ...prev,
                      twitter: text
                    }))}
                    placeholder="@username"
                    placeholderTextColor={isDarkMode ? '#888888' : '#666666'}
                    keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                  />
                </View>
                
                <View style={styles.socialLinkInput}>
                  <FontAwesome5 name="instagram" size={16} color="#E4405F" />
                  <TextInput
                    style={[
                      styles.editInput,
                      styles.linkInput,
                      { 
                        color: isDarkMode ? '#ffffff' : '#000000',
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      }
                    ]}
                    value={tempSocialLinks.instagram || ''}
                    onChangeText={(text) => setTempSocialLinks(prev => ({
                      ...prev,
                      instagram: text
                    }))}
                    placeholder="@username"
                    placeholderTextColor={isDarkMode ? '#888888' : '#666666'}
                    keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                  />
                </View>
                
                <View style={styles.socialLinkInput}>
                  <FontAwesome5 name="linkedin" size={16} color="#0077B5" />
                  <TextInput
                    style={[
                      styles.editInput,
                      styles.linkInput,
                      { 
                        color: isDarkMode ? '#ffffff' : '#000000',
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      }
                    ]}
                    value={tempSocialLinks.linkedin || ''}
                    onChangeText={(text) => setTempSocialLinks(prev => ({
                      ...prev,
                      linkedin: text
                    }))}
                    placeholder="LinkedIn profile URL"
                    placeholderTextColor={isDarkMode ? '#888888' : '#666666'}
                    keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                  />
                </View>
              </ScrollView>
              
              {/* Save/Cancel Buttons */}
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                    }
                  ]}
                  onPress={cancelSocialLinksEdit}
                  disabled={isSavingSocialLinks}
                >
                  <Text style={[
                    styles.modalButtonText,
                    { color: isDarkMode ? '#ffffff' : '#000000' }
                  ]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor: socialLinksSaved ? '#10b981' : profile.customization.themeColor,
                      borderColor: socialLinksSaved ? '#10b981' : profile.customization.themeColor,
                      opacity: isSavingSocialLinks ? 0.7 : 1,
                    }
                  ]}
                  onPress={saveSocialLinks}
                  disabled={isSavingSocialLinks || socialLinksSaved}
                >
                  {socialLinksSaved ? (
                    <View style={styles.saveSuccessContainer}>
                      <FontAwesome5 name="check" size={16} color="#ffffff" />
                      <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
                        Saved!
                      </Text>
                    </View>
                  ) : isSavingSocialLinks ? (
                    <View style={styles.savingContainer}>
                      <Animated.View 
                        style={[
                          styles.loadingSpinner,
                          {
                            transform: [{
                              rotate: spinAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '360deg']
                              })
                            }]
                          }
                        ]} 
                      />
                      <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
                        Saving...
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
                      Save
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>

        {/* Privacy Controls Modal */}
        <Modal
          visible={showPrivacyControls}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPrivacyControls(false)}
        >
          <BlurView style={styles.modalOverlay} intensity={20}>
            <View style={[
              styles.privacyControlsModal,
              {
                backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                borderColor: isDarkMode ? '#333333' : '#e5e7eb',
              }
            ]}>
              <View style={styles.modalHeader}>
                <Text style={[
                  styles.modalTitle,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Privacy Settings
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowPrivacyControls(false)}
                >
                  <FontAwesome5 name="times" size={18} color={isDarkMode ? '#888888' : '#666666'} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.privacyControlsContent}>
                <Text style={[
                  styles.privacyDescription,
                  { color: isDarkMode ? '#bbbbbb' : '#666666' }
                ]}>
                  Control what others can see on your public profile
                </Text>
                
                {[
                  { key: 'showPersonalityType', label: 'Personality Type', icon: 'brain' },
                  { key: 'showInterests', label: 'Interests', icon: 'heart' },
                  { key: 'showLocation', label: 'Location', icon: 'map-marker-alt' },
                  { key: 'showBio', label: 'Bio', icon: 'file-text' },
                  { key: 'showSocialLinks', label: 'Social Links', icon: 'link' },
                  { key: 'showContactInfo', label: 'Contact Info', icon: 'envelope' },
                  { key: 'showOnlineStatus', label: 'Online Status', icon: 'circle' },
                ].map((item, index) => (
                  <View key={index} style={styles.privacyControlItem}>
                    <View style={styles.privacyControlLeft}>
                      <FontAwesome5 
                        name={item.icon} 
                        size={16} 
                        color={profile.customization.themeColor} 
                      />
                      <Text style={[
                        styles.privacyControlLabel,
                        { color: isDarkMode ? '#ffffff' : '#000000' }
                      ]}>
                        {item.label}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.privacyToggle,
                        {
                          backgroundColor: profile.visibility[item.key as keyof typeof profile.visibility]
                            ? profile.customization.themeColor
                            : (isDarkMode ? '#333333' : '#cccccc')
                        }
                      ]}
                      onPress={() => setProfile(prev => ({
                        ...prev,
                        visibility: {
                          ...prev.visibility,
                          [item.key]: !prev.visibility[item.key as keyof typeof prev.visibility]
                        }
                      }))}
                    >
                      <View style={[
                        styles.privacyToggleKnob,
                        {
                          backgroundColor: '#ffffff',
                          transform: [{ 
                            translateX: profile.visibility[item.key as keyof typeof profile.visibility] ? 20 : 2 
                          }]
                        }
                      ]} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </BlurView>
        </Modal>

        {/* Contact Info Editor Modal */}
        <Modal
          visible={showContactInfoEditor}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowContactInfoEditor(false)}
        >
          <BlurView style={styles.modalOverlay} intensity={20}>
            <View style={[
              styles.contactInfoModal,
              {
                backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                borderColor: isDarkMode ? '#333333' : '#e5e7eb',
              }
            ]}>
              <View style={styles.modalHeader}>
                <Text style={[
                  styles.modalTitle,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  Contact Information
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowContactInfoEditor(false)}
                >
                  <FontAwesome5 name="times" size={18} color={isDarkMode ? '#888888' : '#666666'} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.contactInfoContent}>
                <View style={styles.contactInfoInput}>
                  <FontAwesome5 name="envelope" size={16} color={isDarkMode ? '#80c1ff' : '#80c1ff'} />
                  <TextInput
                    style={[
                      styles.editInput,
                      styles.contactInput,
                      { 
                        color: isDarkMode ? '#ffffff' : '#000000',
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      }
                    ]}
                    value={profile.contactInfo.email || ''}
                    onChangeText={(text) => setProfile(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, email: text }
                    }))}
                    placeholder="Email address"
                    placeholderTextColor={isDarkMode ? '#888888' : '#666666'}
                    keyboardType="email-address"
                    keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                  />
                </View>
                
                <View style={styles.contactInfoInput}>
                  <FontAwesome5 name="phone" size={16} color={isDarkMode ? '#80c1ff' : '#80c1ff'} />
                  <TextInput
                    style={[
                      styles.editInput,
                      styles.contactInput,
                      { 
                        color: isDarkMode ? '#ffffff' : '#000000',
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      }
                    ]}
                    value={profile.contactInfo.phone || ''}
                    onChangeText={(text) => setProfile(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, phone: text }
                    }))}
                    placeholder="Phone number"
                    placeholderTextColor={isDarkMode ? '#888888' : '#666666'}
                    keyboardType="phone-pad"
                    keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                  />
                </View>
                
                <View style={styles.contactInfoInput}>
                  <FontAwesome5 name="clock" size={16} color={isDarkMode ? '#80c1ff' : '#80c1ff'} />
                  <TextInput
                    style={[
                      styles.editInput,
                      styles.contactInput,
                      { 
                        color: isDarkMode ? '#ffffff' : '#000000',
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      }
                    ]}
                    value={profile.contactInfo.timezone || ''}
                    onChangeText={(text) => setProfile(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, timezone: text }
                    }))}
                    placeholder="Timezone (e.g., PST, EST)"
                    placeholderTextColor={isDarkMode ? '#888888' : '#666666'}
                    keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                  />
                </View>
              </ScrollView>
            </View>
          </BlurView>
        </Modal>

      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    borderRadius: 8,
    borderWidth: 0,
    marginTop: 90,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  coverPhotoSection: {
    height: 110,
    width: '100%',
  },
  coverPhoto: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  coverPhotoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPhotoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editCoverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  editCoverText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  profileContent: {
    padding: 24,
    alignItems: 'center',
    marginTop: -40,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 10,
    zIndex: 1000,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  nameSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  statusMessage: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  statusInput: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  hexagonFrame: {
    transform: [{ rotate: '30deg' }],
  },
  starFrame: {
    borderRadius: 0,
  },
  diamondFrame: {
    transform: [{ rotate: '45deg' }],
    borderRadius: 8,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 1,
  },
  editImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 47,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  bio: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  location: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
  },
  joinDate: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
  },
  editInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
  },
  displayNameInput: {
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  bioInput: {
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    width: '100%',
  },
  locationInput: {
    flex: 1,
    marginLeft: 4,
  },
  section: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 32,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  removeInterest: {
    marginLeft: 4,
  },
  personalityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  personalityText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    fontStyle: 'italic',
  },
  privacyOptions: {
    gap: 16,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privacyOptionText: {
    flex: 1,
    marginRight: 16,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    marginBottom: 2,
  },
  privacyOptionDesc: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    lineHeight: 18,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  imagePickerModal: {
    width: width * 0.85,
    borderRadius: 8,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 20,
    textAlign: 'center',
  },
  imagePickerOption: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 16,
  },
  imagePickerOptionText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  
  // Interest Selector Modal
  interestSelectorModal: {
    width: width * 0.9,
    maxHeight: '80%',
    borderRadius: 8,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestScrollView: {
    maxHeight: 400,
  },
  interestOptionsContainer: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  interestOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  interestOptionText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  
  // Personality Selector Modal
  personalitySelectorModal: {
    width: width * 0.9,
    maxHeight: '70%',
    borderRadius: 8,
    borderWidth: 1,
  },
  personalityOptionsContainer: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  personalityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  personalityOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  
  // Subscription Card Styles
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  activeContent: {
    gap: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  nextBilling: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
  },
  features: {
    gap: 4,
    marginTop: 8,
  },
  feature: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
  },
  upgradePrompt: {
    alignItems: 'center',
    gap: 8,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    textAlign: 'center',
  },
  upgradeDesc: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  upgradeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  
  // Theme Selector Modal
  themeSelectorModal: {
    width: width * 0.9,
    maxHeight: '80%',
    borderRadius: 8,
    borderWidth: 1,
  },
  themeScrollView: {
    maxHeight: 500,
    padding: 20,
    paddingTop: 0,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameStyleOptions: {
    gap: 12,
  },
  frameStyleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  frameStyleText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  
  // Social Links Modal
  socialLinksModal: {
    width: width * 0.9,
    maxHeight: '70%',
    borderRadius: 8,
    borderWidth: 1,
  },
  socialLinksContent: {
    maxHeight: 400,
    padding: 20,
    paddingTop: 0,
  },
  socialLinkInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  linkInput: {
    flex: 1,
  },
  
  // Contact Info Modal
  contactInfoModal: {
    width: width * 0.9,
    maxHeight: '60%',
    borderRadius: 8,
    borderWidth: 1,
  },
  contactInfoContent: {
    maxHeight: 300,
    padding: 20,
    paddingTop: 0,
  },
  contactInfoInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  contactInput: {
    flex: 1,
  },
  
  // Integrated Profile Header Components
  personalityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginBottom: 16,
    alignSelf: 'center',
  },
  personalityBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  interestsInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  interestsScroll: {
    flex: 1,
  },
  interestTagSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  interestTagText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  moreInterestsTag: {
    minWidth: 32,
    alignItems: 'center',
  },
  editInterestsButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Professional Info Styles
  professionalSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  professionalTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    textAlign: 'center',
  },
  professionalCompany: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    marginTop: 2,
  },
  
  // Privacy Controls Modal
  privacyControlsModal: {
    width: width * 0.9,
    maxHeight: '80%',
    borderRadius: 8,
    borderWidth: 1,
  },
  privacyControlsContent: {
    maxHeight: 500,
    padding: 20,
    paddingTop: 0,
  },
  privacyDescription: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    marginBottom: 20,
    textAlign: 'center',
  },
  privacyControlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  privacyControlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  privacyControlLabel: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  privacyToggle: {
    width: 44,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    position: 'relative',
  },
  privacyToggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
  },
  
  // Options Section
  optionsSection: {
    width: '99%',
    alignSelf: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  optionsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsList: {
    gap: 8,
  },
  optionBrick: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    gap: 12,
  },
  optionBrickText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    flex: 1,
  },
  
  // Preview Section
  previewSection: {
    width: '90%',
    alignSelf: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  previewDescription: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  
  // Mini Profile Card
  miniProfileCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  miniCoverPhoto: {
    height: 60,
    width: '100%',
  },
  miniCoverPhotoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  miniCoverPhotoGradient: {
    width: '100%',
    height: '100%',
  },
  miniProfileContent: {
    padding: 16,
    alignItems: 'center',
    marginTop: -20,
  },
  miniProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  miniProfileImageInner: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  miniOnlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  miniDisplayName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 4,
    textAlign: 'center',
  },
  miniStatusMessage: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  miniPersonalityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    marginBottom: 8,
  },
  miniPersonalityText: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  miniInterestsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  miniInterestTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  miniInterestText: {
    fontSize: 9,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  miniMoreInterests: {
    fontSize: 9,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
  },
  
  // Eyeball button styles
  eyeballButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  // Public preview modal styles
  publicPreviewModal: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  
  modalHeaderAlt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  modalCloseButton: {
    padding: 8,
  },
  
  previewProfileCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  previewCoverPhoto: {
    width: '100%',
    height: 80,
    backgroundColor: '#f0f0f0',
  },
  
  previewCoverPhotoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  previewCoverPhotoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  previewProfileContent: {
    padding: 16,
    alignItems: 'center',
  },
  
  previewProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -30,
    marginBottom: 12,
    position: 'relative',
  },
  
  previewProfileImageInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    resizeMode: 'cover',
  },
  
  previewOnlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  
  previewDisplayName: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  
  previewStatusMessage: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    marginBottom: 8,
  },
  
  previewPersonalityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 4,
  },
  
  previewPersonalityText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  
  previewInterestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
    justifyContent: 'center',
  },
  
  previewInterestTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  
  previewInterestText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  
  previewMoreInterests: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    alignSelf: 'center',
  },
  
  previewBio: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  
  previewLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  previewLocation: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
  },
  
  // Modal button styles
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginTop: 20,
  },
  
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  
  saveSuccessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  loadingSpinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderTopColor: 'transparent',
    // Add animation via transform property
  },
});
