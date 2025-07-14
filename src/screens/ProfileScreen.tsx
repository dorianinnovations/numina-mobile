import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { PageBackground } from '../components/PageBackground';
import { Header } from '../components/Header';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  onNavigateBack: () => void;
}

interface UserProfile {
  profileImage?: string;
  displayName: string;
  bio: string;
  location: string;
  interests: string[];
  personalityType: string;
  joinDate: string;
  isPublic: boolean;
  showEmotionalInsights: boolean;
  showActivityStatus: boolean;
}

const PERSONALITY_TYPES = [
  'Empathetic Listener', 'Creative Explorer', 'Analytical Thinker', 
  'Social Connector', 'Mindful Seeker', 'Adventure Enthusiast'
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
  
  const [profile, setProfile] = useState<UserProfile>({
    profileImage: undefined,
    displayName: userData?.email?.split('@')[0] || 'User',
    bio: '',
    location: '',
    interests: [],
    personalityType: '',
    joinDate: new Date().toISOString(),
    isPublic: true,
    showEmotionalInsights: false,
    showActivityStatus: true,
  });

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to upload photos.');
    }
  };

  const pickImage = async (source: 'camera' | 'library') => {
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
          aspect: [1, 1],
          quality: 0.7,
          base64: false,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
          base64: false,
        });
      }

      if (!result.canceled && result.assets[0]) {
        // Use the image directly without manipulation for now
        setProfile(prev => ({ ...prev, profileImage: result.assets[0].uri }));
        setShowImagePicker(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const saveProfile = async () => {
    try {
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

  return (
    <PageBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onNavigateBack}
          >
            <FontAwesome5 name="arrow-left" size={18} color={isDarkMode ? '#ffffff' : '#000000'} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            {editMode ? 'Edit Profile' : 'Profile'}
          </Text>
          
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
            {/* Profile Image */}
            <TouchableOpacity
              style={[
                styles.profileImageContainer,
                {
                  backgroundColor: isDarkMode ? 'rgba(134, 239, 172, 0.1)' : 'rgba(134, 239, 172, 0.15)',
                  borderColor: isDarkMode ? '#86efac' : '#10b981',
                }
              ]}
              onPress={editMode ? () => setShowImagePicker(true) : undefined}
              disabled={!editMode}
            >
              {profile.profileImage ? (
                <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
              ) : (
                <FontAwesome5 
                  name="user" 
                  size={32} 
                  color={isDarkMode ? '#86efac' : '#10b981'} 
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
            </TouchableOpacity>

            {/* Display Name */}
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
              />
            ) : (
              <Text style={[
                styles.displayName,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>
                {profile.displayName}
              </Text>
            )}

            {/* Bio */}
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
                numberOfLines={3}
              />
            ) : profile.bio ? (
              <Text style={[
                styles.bio,
                { color: isDarkMode ? '#bbbbbb' : '#666666' }
              ]}>
                {profile.bio}
              </Text>
            ) : null}

            {/* Location */}
            {editMode ? (
              <View style={styles.locationContainer}>
                <FontAwesome5 name="map-marker-alt" size={14} color={isDarkMode ? '#86efac' : '#10b981'} />
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
                />
              </View>
            ) : profile.location ? (
              <View style={styles.locationContainer}>
                <FontAwesome5 name="map-marker-alt" size={14} color={isDarkMode ? '#86efac' : '#10b981'} />
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

          {/* Interests Section */}
          <View style={[
            styles.section,
            {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0, 0, 0, 0.1)',
            }
          ]}>
            <View style={styles.sectionHeader}>
              <Text style={[
                styles.sectionTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>
                Interests
              </Text>
              {editMode && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setShowInterestSelector(true)}
                >
                  <FontAwesome5 name="plus" size={14} color={isDarkMode ? '#86efac' : '#10b981'} />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.interestsContainer}>
              {profile.interests.length > 0 ? (
                profile.interests.map((interest, index) => (
                  <View
                    key={index}
                    style={[
                      styles.interestChip,
                      {
                        backgroundColor: isDarkMode ? 'rgba(134, 239, 172, 0.1)' : 'rgba(134, 239, 172, 0.15)',
                        borderColor: isDarkMode ? '#86efac' : '#10b981',
                      }
                    ]}
                  >
                    <Text style={[
                      styles.interestText,
                      { color: isDarkMode ? '#86efac' : '#10b981' }
                    ]}>
                      {interest}
                    </Text>
                    {editMode && (
                      <TouchableOpacity
                        style={styles.removeInterest}
                        onPress={() => toggleInterest(interest)}
                      >
                        <FontAwesome5 name="times" size={10} color={isDarkMode ? '#86efac' : '#10b981'} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <Text style={[
                  styles.emptyText,
                  { color: isDarkMode ? '#888888' : '#666666' }
                ]}>
                  {editMode ? 'Tap + to add interests' : 'No interests added yet'}
                </Text>
              )}
            </View>
          </View>

          {/* Personality Type Section */}
          <View style={[
            styles.section,
            {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0, 0, 0, 0.1)',
            }
          ]}>
            <View style={styles.sectionHeader}>
              <Text style={[
                styles.sectionTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>
                Personality Type
              </Text>
              {editMode && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setShowPersonalitySelector(true)}
                >
                  <FontAwesome5 name="edit" size={14} color={isDarkMode ? '#86efac' : '#10b981'} />
                </TouchableOpacity>
              )}
            </View>
            
            {profile.personalityType ? (
              <View style={[
                styles.personalityContainer,
                {
                  backgroundColor: isDarkMode ? 'rgba(134, 239, 172, 0.1)' : 'rgba(134, 239, 172, 0.15)',
                  borderColor: isDarkMode ? '#86efac' : '#10b981',
                }
              ]}>
                <FontAwesome5 name="brain" size={16} color={isDarkMode ? '#86efac' : '#10b981'} />
                <Text style={[
                  styles.personalityText,
                  { color: isDarkMode ? '#86efac' : '#10b981' }
                ]}>
                  {profile.personalityType}
                </Text>
              </View>
            ) : (
              <Text style={[
                styles.emptyText,
                { color: isDarkMode ? '#888888' : '#666666' }
              ]}>
                {editMode ? 'Tap to select your personality type' : 'No personality type selected'}
              </Text>
            )}
          </View>

          {/* Privacy Settings */}
          <View style={[
            styles.section,
            {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0, 0, 0, 0.1)',
            }
          ]}>
            <Text style={[
              styles.sectionTitle,
              { color: isDarkMode ? '#ffffff' : '#000000' }
            ]}>
              Privacy Settings
            </Text>
            
            <View style={styles.privacyOptions}>
              {/* Public Profile Toggle */}
              <View style={styles.privacyOption}>
                <View style={styles.privacyOptionText}>
                  <Text style={[
                    styles.privacyOptionTitle,
                    { color: isDarkMode ? '#ffffff' : '#000000' }
                  ]}>
                    Public Profile
                  </Text>
                  <Text style={[
                    styles.privacyOptionDesc,
                    { color: isDarkMode ? '#888888' : '#666666' }
                  ]}>
                    Allow others to find and view your profile
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    {
                      backgroundColor: profile.isPublic 
                        ? (isDarkMode ? '#86efac' : '#10b981')
                        : (isDarkMode ? '#333333' : '#cccccc')
                    }
                  ]}
                  onPress={() => setProfile(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                  disabled={!editMode}
                >
                  <View style={[
                    styles.toggleKnob,
                    {
                      backgroundColor: '#ffffff',
                      transform: [{ translateX: profile.isPublic ? 20 : 2 }]
                    }
                  ]} />
                </TouchableOpacity>
              </View>

              {/* Show Emotional Insights Toggle */}
              <View style={styles.privacyOption}>
                <View style={styles.privacyOptionText}>
                  <Text style={[
                    styles.privacyOptionTitle,
                    { color: isDarkMode ? '#ffffff' : '#000000' }
                  ]}>
                    Show Emotional Insights
                  </Text>
                  <Text style={[
                    styles.privacyOptionDesc,
                    { color: isDarkMode ? '#888888' : '#666666' }
                  ]}>
                    Display AI-generated emotional compatibility
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    {
                      backgroundColor: profile.showEmotionalInsights 
                        ? (isDarkMode ? '#86efac' : '#10b981')
                        : (isDarkMode ? '#333333' : '#cccccc')
                    }
                  ]}
                  onPress={() => setProfile(prev => ({ ...prev, showEmotionalInsights: !prev.showEmotionalInsights }))}
                  disabled={!editMode}
                >
                  <View style={[
                    styles.toggleKnob,
                    {
                      backgroundColor: '#ffffff',
                      transform: [{ translateX: profile.showEmotionalInsights ? 20 : 2 }]
                    }
                  ]} />
                </TouchableOpacity>
              </View>

              {/* Show Activity Status Toggle */}
              <View style={styles.privacyOption}>
                <View style={styles.privacyOptionText}>
                  <Text style={[
                    styles.privacyOptionTitle,
                    { color: isDarkMode ? '#ffffff' : '#000000' }
                  ]}>
                    Show Activity Status
                  </Text>
                  <Text style={[
                    styles.privacyOptionDesc,
                    { color: isDarkMode ? '#888888' : '#666666' }
                  ]}>
                    Let others see when you're active
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    {
                      backgroundColor: profile.showActivityStatus 
                        ? (isDarkMode ? '#86efac' : '#10b981')
                        : (isDarkMode ? '#333333' : '#cccccc')
                    }
                  ]}
                  onPress={() => setProfile(prev => ({ ...prev, showActivityStatus: !prev.showActivityStatus }))}
                  disabled={!editMode}
                >
                  <View style={[
                    styles.toggleKnob,
                    {
                      backgroundColor: '#ffffff',
                      transform: [{ translateX: profile.showActivityStatus ? 20 : 2 }]
                    }
                  ]} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
                    borderColor: isDarkMode ? '#86efac' : '#10b981',
                  }
                ]}
                onPress={() => pickImage('camera')}
              >
                <FontAwesome5 name="camera" size={20} color={isDarkMode ? '#86efac' : '#10b981'} />
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
                    borderColor: isDarkMode ? '#86efac' : '#10b981',
                  }
                ]}
                onPress={() => pickImage('library')}
              >
                <FontAwesome5 name="image" size={20} color={isDarkMode ? '#86efac' : '#10b981'} />
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
                            ? (isDarkMode ? '#86efac' : '#10b981')
                            : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                        }
                      ]}
                      onPress={() => toggleInterest(interest)}
                    >
                      <Text style={[
                        styles.interestOptionText,
                        {
                          color: profile.interests.includes(interest)
                            ? (isDarkMode ? '#86efac' : '#10b981')
                            : (isDarkMode ? '#ffffff' : '#000000')
                        }
                      ]}>
                        {interest}
                      </Text>
                      {profile.interests.includes(interest) && (
                        <FontAwesome5 
                          name="check" 
                          size={14} 
                          color={isDarkMode ? '#86efac' : '#10b981'} 
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
                          ? (isDarkMode ? '#86efac' : '#10b981')
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
                        ? (isDarkMode ? '#86efac' : '#10b981')
                        : (isDarkMode ? '#888888' : '#666666')
                      } 
                    />
                    <Text style={[
                      styles.personalityOptionText,
                      {
                        color: profile.personalityType === type
                          ? (isDarkMode ? '#86efac' : '#10b981')
                          : (isDarkMode ? '#ffffff' : '#000000')
                      }
                    ]}>
                      {type}
                    </Text>
                    {profile.personalityType === type && (
                      <FontAwesome5 
                        name="check" 
                        size={16} 
                        color={isDarkMode ? '#86efac' : '#10b981'} 
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    zIndex: 1000,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
    paddingBottom: 40,
  },
  profileHeader: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 47,
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
    fontFamily: 'Inter_400Regular',
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
    fontFamily: 'Inter_400Regular',
  },
  joinDate: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  editInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  displayNameInput: {
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  bioInput: {
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  locationInput: {
    flex: 1,
    marginLeft: 4,
  },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
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
    fontFamily: 'Inter_600SemiBold',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  removeInterest: {
    marginLeft: 4,
  },
  personalityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  personalityText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
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
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  privacyOptionDesc: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 20,
    textAlign: 'center',
  },
  imagePickerOption: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 16,
  },
  imagePickerOptionText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  
  // Interest Selector Modal
  interestSelectorModal: {
    width: width * 0.9,
    maxHeight: '80%',
    borderRadius: 20,
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
    borderRadius: 16,
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
    borderRadius: 12,
    borderWidth: 1,
  },
  interestOptionText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  
  // Personality Selector Modal
  personalitySelectorModal: {
    width: width * 0.9,
    maxHeight: '70%',
    borderRadius: 20,
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
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  personalityOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
});
