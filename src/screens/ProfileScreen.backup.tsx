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
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from "../contexts/SimpleAuthContext";
import { PageBackground } from '../components/PageBackground';
import { Header } from '../components/Header';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileOptions } from '../components/profile/ProfileOptions';
import { ProfileModals } from '../components/profile/ProfileModals';
import { api as ApiService } from '../services/api/api';
import { getCloudStorageService, UploadProgress } from '../services/cloudStorageService';
import { UserProfile, ProfileScreenProps } from '../types/profile';

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
  const [uploadProgress, setUploadProgress] = useState<{
    profile?: UploadProgress;
    cover?: UploadProgress;
  }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showSocialLinksEditor, setShowSocialLinksEditor] = useState(false);
  const [showContactInfoEditor, setShowContactInfoEditor] = useState(false);
  const [showPrivacyControls, setShowPrivacyControls] = useState(false);
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [isSavingSocialLinks, setIsSavingSocialLinks] = useState(false);
  const [socialLinksSaved, setSocialLinksSaved] = useState(false);
  
  // Animation refs
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
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

  // Pulse animation for online indicator
  useEffect(() => {
    if (profile.customization.isOnline) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [profile.customization.isOnline]);

  const loadProfileData = async () => {
    try {
      const stored = await AsyncStorage.getItem('userProfile');
      if (stored) {
        const storedProfile = JSON.parse(stored);
        setProfile(prev => ({ ...prev, ...storedProfile }));
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera and photo library permissions to use this feature.');
    }
  };

  const pickImage = async (source: 'camera' | 'library', imageType: 'profile' | 'cover' = 'profile') => {
    try {
      if (!userData?.uid) {
        Alert.alert('Error', 'User not authenticated. Please log in again.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: imageType === 'profile' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setIsUploading(true);
        
        const cloudStorage = getCloudStorageService();
        const uploadResult = await cloudStorage.uploadUserImage(
          imageUri,
          userData.uid,
          imageType === 'profile' ? 'profile' : 'banner',
          (progress: UploadProgress) => {
            setUploadProgress(prev => ({
              ...prev,
              [imageType]: progress
            }));
          }
        );

        if (uploadResult.success && uploadResult.url) {
          setProfile(prev => ({
            ...prev,
            [imageType === 'profile' ? 'profileImage' : 'coverImage']: uploadResult.url
          }));
          await AsyncStorage.setItem('userProfile', JSON.stringify({
            ...profile,
            [imageType === 'profile' ? 'profileImage' : 'coverImage']: uploadResult.url
          }));
        } else {
          console.error(`❌ ${imageType} image upload failed:`, uploadResult.error);
          Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload image. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error picking/uploading image:', error);
      Alert.alert('Error', 'Failed to select or upload image. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const saveProfile = async () => {
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      setEditMode(false);
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

  const openSocialLinksEditor = () => {
    setTempSocialLinks(profile.socialLinks);
    setShowSocialLinksEditor(true);
  };

  const saveSocialLinks = async () => {
    try {
      setIsSavingSocialLinks(true);
      
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();

      setProfile(prev => ({
        ...prev,
        socialLinks: tempSocialLinks
      }));

      await AsyncStorage.setItem('userProfile', JSON.stringify({
        ...profile,
        socialLinks: tempSocialLinks
      }));

      setSocialLinksSaved(true);
      setTimeout(() => setSocialLinksSaved(false), 2000);
      setShowSocialLinksEditor(false);
    } catch (error) {
      console.error('Error saving social links:', error);
      Alert.alert('Error', 'Failed to save social links. Please try again.');
    } finally {
      setIsSavingSocialLinks(false);
      spinAnim.setValue(0);
    }
  };

  const cancelSocialLinksEdit = () => {
    setTempSocialLinks(profile.socialLinks);
    setShowSocialLinksEditor(false);
  };

  const handleSocialLinkChange = (key: string, value: string) => {
    setTempSocialLinks(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleContactInfoChange = (key: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [key]: value
      }
    }));
  };

  const handleVisibilityToggle = (key: string) => {
    setProfile(prev => ({
      ...prev,
      visibility: {
        ...prev.visibility,
        [key]: !prev.visibility[key as keyof typeof prev.visibility]
      }
    }));
  };

  return (
    <PageBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />
        
        <Header 
          title={editMode ? 'Edit Profile' : 'Profile'}
          showBackButton={true}
          showMenuButton={false}
          onBackPress={onNavigateBack}
        />
        
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
          <ProfileHeader
            profile={profile}
            editMode={editMode}
            uploadProgress={uploadProgress}
            onImagePress={() => setShowImagePicker(true)}
            onCoverPress={() => setShowCoverImagePicker(true)}
            onPreviewPress={() => setShowPublicPreview(true)}
            onDisplayNameChange={(text) => setProfile(prev => ({ ...prev, displayName: text }))}
            onBioChange={(text) => setProfile(prev => ({ ...prev, bio: text }))}
            onLocationChange={(text) => setProfile(prev => ({ ...prev, location: text }))}
            onStatusMessageChange={(text) => setProfile(prev => ({ 
              ...prev, 
              customization: { ...prev.customization, statusMessage: text }
            }))}
            pulseAnim={pulseAnim}
          />

          <ProfileOptions
            profile={profile}
            onSocialLinksPress={openSocialLinksEditor}
            onContactInfoPress={() => setShowContactInfoEditor(true)}
            onAppearancePress={() => setShowThemeSelector(true)}
            onPrivacyPress={() => setShowPrivacyControls(true)}
            onInterestsPress={() => setShowInterestSelector(true)}
            onPersonalityPress={() => setShowPersonalitySelector(true)}
          />
        </ScrollView>

        <ProfileModals
          profile={profile}
          showInterestSelector={showInterestSelector}
          showPersonalitySelector={showPersonalitySelector}
          showThemeSelector={showThemeSelector}
          showSocialLinksEditor={showSocialLinksEditor}
          showContactInfoEditor={showContactInfoEditor}
          showPrivacyControls={showPrivacyControls}
          showPublicPreview={showPublicPreview}
          tempSocialLinks={tempSocialLinks}
          onInterestSelectorClose={() => setShowInterestSelector(false)}
          onPersonalitySelectorClose={() => setShowPersonalitySelector(false)}
          onThemeSelectorClose={() => setShowThemeSelector(false)}
          onSocialLinksEditorClose={() => setShowSocialLinksEditor(false)}
          onContactInfoEditorClose={() => setShowContactInfoEditor(false)}
          onPrivacyControlsClose={() => setShowPrivacyControls(false)}
          onPublicPreviewClose={() => setShowPublicPreview(false)}
          onInterestToggle={toggleInterest}
          onPersonalitySelect={(type) => setProfile(prev => ({ ...prev, personalityType: type }))}
          onThemeColorSelect={(color) => setProfile(prev => ({ 
            ...prev, 
            customization: { ...prev.customization, themeColor: color }
          }))}
          onFrameStyleSelect={(style) => setProfile(prev => ({ 
            ...prev, 
            customization: { ...prev.customization, profileFrameStyle: style }
          }))}
          onSocialLinkChange={handleSocialLinkChange}
          onContactInfoChange={handleContactInfoChange}
          onVisibilityToggle={handleVisibilityToggle}
          onSaveSocialLinks={saveSocialLinks}
          onCancelSocialLinks={cancelSocialLinksEdit}
        />

        {/* Image Picker Modals */}
        {showImagePicker && (
          <View style={styles.imagePickerOverlay}>
            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={() => {
                setShowImagePicker(false);
                pickImage('library', 'profile');
              }}
            >
              <FontAwesome5 name="images" size={24} color={profile.customization.themeColor} />
              <Text style={styles.imagePickerText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={() => {
                setShowImagePicker(false);
                pickImage('camera', 'profile');
              }}
            >
              <FontAwesome5 name="camera" size={24} color={profile.customization.themeColor} />
              <Text style={styles.imagePickerText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {showCoverImagePicker && (
          <View style={styles.imagePickerOverlay}>
            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={() => {
                setShowCoverImagePicker(false);
                pickImage('library', 'cover');
              }}
            >
              <FontAwesome5 name="images" size={24} color={profile.customization.themeColor} />
              <Text style={styles.imagePickerText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={() => {
                setShowCoverImagePicker(false);
                pickImage('camera', 'cover');
              }}
            >
              <FontAwesome5 name="camera" size={24} color={profile.customization.themeColor} />
              <Text style={styles.imagePickerText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButtonContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 100,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imagePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    gap: 12,
  },
  imagePickerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
});
