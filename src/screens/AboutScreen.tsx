import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Linking,
  Animated,
  Dimensions,
  Easing,
  Image,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { PageBackground } from '../components/PageBackground';
import { Header } from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');

interface AboutScreenProps {
  onNavigateBack: () => void;
}

type AboutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'About'>;

export const AboutScreen: React.FC<AboutScreenProps> = ({
  onNavigateBack,
}) => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation<AboutScreenNavigationProp>();

  // Animation refs - more professional timing
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Individual card animations with staggered professional timing
  const cardAnims = useRef(
    Array.from({ length: 6 }, () => ({
      fade: new Animated.Value(0),
      slide: new Animated.Value(40),
      scale: new Animated.Value(0.92),
      rotate: new Animated.Value(-2),
    }))
  ).current;

  // Header animation
  const headerAnim = useRef({
    fade: new Animated.Value(0),
    slide: new Animated.Value(60),
    scale: new Animated.Value(0.85),
  }).current;

  useEffect(() => {
    // Professional entry animation sequence
    Animated.sequence([
      // Header animation first
      Animated.parallel([
        Animated.timing(headerAnim.fade, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(headerAnim.slide, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(headerAnim.scale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Main content animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          delay: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          delay: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          delay: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Staggered card animations with professional timing
    cardAnims.forEach((anim, index) => {
      const delay = 400 + (index * 120); // More sophisticated stagger timing
      
      Animated.parallel([
        Animated.timing(anim.fade, {
          toValue: 1,
          duration: 700,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(anim.slide, {
          toValue: 0,
          duration: 700,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(anim.scale, {
          toValue: 1,
          tension: 55,
          friction: 8,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: 0,
          duration: 700,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const onTitlePress = () => {
    navigation.navigate('Chat');
  };

  const creatorData = [
    {
      type: 'app',
      name: 'Numina',
      role: 'Advanced AI Emotional Intelligence Platform',
      bio: 'A sophisticated AI-powered platform designed to enhance emotional awareness, provide personalized wellness insights, and facilitate deeper self-understanding through intelligent analysis.',
      icon: 'brain',
      version: '1.0.0',
      build: '2025.01.001',
    },
    {
      type: 'creator',
      name: 'Creator',
      role: 'Isaiah C. - San Diego, CA',
      bio: 'A passionate independent developer dedicated to creating thoughtful technology that enhances emotional well-being and facilitates deeper understanding between humans and AI systems.',
      icon: 'user-circle',
      links: [
        { type: 'github', url: 'https://github.com/dorianinnovations', icon: 'github' },
        { type: 'linkedin', url: 'https://www.linkedin.com/in/isaiahpappas', icon: 'linkedin' },
        { type: 'twitter', url: 'https://twitter.com/numinaworks', icon: 'twitter' },
      ],
    },
    {
      type: 'vision',
      name: 'Innovation Mission',
      role: 'Democratizing Emotional Intelligence',
      bio: 'Committed to making advanced emotional intelligence tools accessible to everyone, empowering individuals to cultivate resilience, self-awareness, and meaningful human connections.',
      icon: 'eye',
    },
    {
      type: 'technology',
      name: 'Engineering Excellence',
      role: 'State-of-the-Art Technology',
      bio: 'Built with modern React Native, TypeScript, advanced AI/ML models, and robust cloud infrastructure to deliver a seamless, intelligent user experience.',
      icon: 'code',
    },
    {
      type: 'community',
      name: 'Open Innovation',
      role: 'Collaborative Development',
      bio: 'Numina embraces open-source principles, fostering a collaborative ecosystem where innovation thrives and community feedback drives continuous improvement.',
      icon: 'users',
    },
    {
      type: 'contact',
      name: 'Connect & Collaborate',
      role: 'Partnership & Support',
      bio: 'Interested in collaboration, technical discussions, or providing feedback? Let\'s explore opportunities to advance emotional intelligence technology together.',
      icon: 'envelope',
      links: [
        { type: 'email', url: 'mailto:numinaworks@gmail.com', icon: 'envelope' },
        { type: 'website', url: 'https://numinaai.netlify.app', icon: 'globe' },
      ],
    },
  ];

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  const handleCardPress = (index: number) => {
    const anim = cardAnims[index];
    
    // Professional press animation
    Animated.sequence([
      Animated.timing(anim.scale, {
        toValue: 0.96,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(anim.scale, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderCard = (item: any, index: number) => {
    const anim = cardAnims[index];
    const isNumina = item.type === 'app';
    
    return (
      <TouchableOpacity
        key={index}
        activeOpacity={0.95}
        onPress={() => handleCardPress(index)}
      >
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: isDarkMode ? '#111111' : 'rgba(255, 255, 255, 0.25)',
              borderColor: isDarkMode ? '#222222' : 'rgba(255, 255, 255, 0.3)',
              opacity: anim.fade,
              transform: [
                { translateY: anim.slide },
                { scale: anim.scale },
                { rotate: anim.rotate.interpolate({
                  inputRange: [-2, 0],
                  outputRange: ['-2deg', '0deg'],
                }) },
              ],
            },
          ]}
        >
          <View style={isNumina ? styles.numinaCardHeader : styles.cardHeader}>
            <View style={isNumina ? styles.numinaCardIcon : styles.cardIcon}>
              {isNumina ? (
                <Image 
                  source={require('../assets/images/NUMINALOGO.png')}
                  style={styles.numinaLogoImage}
                  resizeMode="contain"
                />
              ) : item.type === 'creator' ? (
                <Image 
                  source={require('../../assets/unknownuser.jpg')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              ) : (
                <FontAwesome5 
                  name={item.icon as any} 
                  size={24} 
                  color={isDarkMode ? '#add5fa' : '#6ba3d0'} 
                />
              )}
            </View>
            <View style={isNumina ? styles.numinaCardTitleContainer : styles.cardTitleContainer}>
              <Text style={[
                styles.cardName,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>
                {item.name}
              </Text>
              <Text style={[
                styles.cardRole,
                { color: isDarkMode ? '#add5fa' : '#6ba3d0' }
              ]}>
                {item.role}
              </Text>
              <Text style={[
                styles.cardBio,
                { color: isDarkMode ? '#bbbbbb' : '#666666' }
              ]}>
                {item.bio}
              </Text>
            </View>
          </View>

          {/* Only for non-Numina cards: bio and links */}
          {!isNumina && (
            <>
              <Text style={[
                styles.cardBio,
                { color: isDarkMode ? '#bbbbbb' : '#666666' }
              ]}>
                {item.bio}
              </Text>
            </>
          )}

          {item.links && (
            <View style={styles.cardLinks}>
              {item.links.map((link: any, linkIndex: number) => (
                <TouchableOpacity
                  key={linkIndex}
                  style={[
                    styles.linkButton,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0, 0, 0, 0.05)',
                      borderColor: isDarkMode ? '#333' : 'rgba(0, 0, 0, 0.1)',
                    }
                  ]}
                  onPress={() => handleLinkPress(link.url)}
                  activeOpacity={0.8}
                >
                  <FontAwesome5
                    name={link.icon as any}
                    size={16}
                    color={isDarkMode ? '#add5fa' : '#6ba3d0'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <PageBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />
        
        {/* Header Component */}
        <Header
          onTitlePress={onTitlePress}
          onMenuPress={() => {}}
          onBackPress={onNavigateBack}
          title="About"
          subtitle="Learn more about Numina"
          showBackButton={true}
          showMenuButton={false}
        />
        
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
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Creator & Team Cards */}
            <View style={styles.cardsContainer}>
              {creatorData.map((item, index) => renderCard(item, index))}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[
                styles.footerText,
                { color: isDarkMode ? '#666666' : '#999999' }
              ]}>
                Engineered with precision for advancing emotional intelligence
              </Text>
              <Text style={[
                styles.copyright,
                { color: isDarkMode ? '#444444' : '#cccccc' }
              ]}>
                © 2025 Numina. All rights reserved.
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
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
    paddingTop: 80,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  appHeader: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 40,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  appIcon: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -1.5,
  },
  appTagline: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  cardsContainer: {
    gap: 28,
    marginHorizontal: -8,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  cardRole: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    letterSpacing: -0.2,
  },
  cardBio: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    lineHeight: 22,
    marginBottom: 20,
    letterSpacing: -0.1,
  },
  appInfo: {
    marginBottom: 20,
  },
  appVersion: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  cardLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  linkButton: {
    width: 100,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 48,
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 8,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  copyright: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  logoImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f4f4f4',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  numinaCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  numinaCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: 'rgba(173, 213, 250, 0.15)',
  },
  numinaLogoImage: {
    width: 56,
    height: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#9898980',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  numinaCardTitleContainer: {
    flex: 1,
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
});