import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/SimpleAuthContext';
import { PageBackground } from '../components/PageBackground';
import { Header } from '../components/Header';

interface ProfileScreenProps {
  onNavigateBack: () => void;
  onTitlePress?: () => void;
  onMenuPress?: (key: string) => void;
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
  onTitlePress,
  onMenuPress,
}) => {
  const { isDarkMode } = useTheme();
  const { userData } = useAuth();
  
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    profileImage: undefined,
    displayName: userData?.displayName || userData?.email?.split('@')[0] || 'User',
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
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
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
          showMenuButton={true}
          onBackPress={onNavigateBack}
          onTitlePress={onTitlePress}
          onMenuPress={onMenuPress}
        />
        
        {/* Edit Button */}
        <View style={styles.headerButtonContainer}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
            onPress={editMode ? saveProfile : () => {
              // Light haptic for entering edit mode
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEditMode(true);
            }}
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
              <Text style={[styles.fieldValue, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>
                {profile.email}
              </Text>
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
  profileHeader: {
    padding: 20,
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10b981',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldContainer: {
    width: '100%',
    marginBottom: 20,
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});