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
import { PageBackground } from '../components/ui/PageBackground';
import { Header } from '../components/ui/Header';
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
    // Fast entry animation sequence
    Animated.sequence([
      // Header animation first - much faster
      Animated.parallel([
        Animated.timing(headerAnim.fade, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(headerAnim.slide, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(headerAnim.scale, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
      // Main content animation - faster
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          delay: 50,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          delay: 50,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 10,
          delay: 50,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Much faster staggered card animations
    cardAnims.forEach((anim, index) => {
      const delay = 100 + (index * 60); // Much faster stagger
      
      Animated.parallel([
        Animated.timing(anim.fade, {
          toValue: 1,
          duration: 300,
          delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.slide, {
          toValue: 0,
          duration: 300,
          delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(anim.scale, {
          toValue: 1,
          tension: 80,
          friction: 10,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: 0,
          duration: 300,
          delay,
          easing: Easing.out(Easing.quad),
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
      type: 'brain',
      name: 'Your Second Brain, Supercharged',
      role: 'Central intelligence hub for brilliant minds',
      bio: 'Stop juggling scattered notes, forgotten bookmarks, and brilliant ideas that vanish. Numina is your central intelligence hub—a second brain that doesn\'t just store information, but understands it. It captures everything and instantly organizes the chaos, giving you the clarity and space to do your best thinking.',
      icon: 'brain',
    },
    {
      type: 'partner',
      name: 'An AI Partner That Truly Knows You',
      role: 'Beyond generic chatbots—true AI collaboration',
      bio: 'Generic chatbots are useless for deep work. Numina is different. It\'s a true AI partner that learns from every interaction, building a persistent memory of your projects, goals, and style. The result? A collaborator that anticipates your needs, offers deeply relevant insights, and becomes an indispensable extension of your own mind.',
      icon: 'handshake',
    },
    {
      type: 'execution',
      name: 'From Scattered Ideas to Finished Work',
      role: 'Close the gap between ideas and results',
      bio: 'The gap between a great idea and a finished product is where most projects die. Numina closes that gap. It transforms messy brainstorms, voice notes, and conversations into structured outlines, coherent drafts, and actionable plans. It\'s the most powerful tool you can have for turning creative sparks into tangible results, faster.',
      icon: 'rocket',
    },
    {
      type: 'privacy',
      name: 'A Private Sanctuary for Your Mind',
      role: 'We work for you, not advertisers',
      bio: 'Your best ideas require absolute privacy. Our business model is simple: we work for you, not advertisers. We will never sell your data. Numina is a fortified, private sanctuary for your thoughts, built on a subscription model that ensures our only focus is providing you with a world-class, secure, and confidential tool.',
      icon: 'shield-alt',
    },
    {
      type: 'connections',
      name: 'Discover Connections You\'d Otherwise Miss',
      role: 'AI that maps the relationships between your thoughts',
      bio: 'The most valuable insights lie in the connections between ideas. While you focus on the big picture, Numina\'s AI works in the background, mapping the relationships between your thoughts. It surfaces forgotten notes, links disparate concepts, and reveals hidden patterns, giving you a powerful intellectual advantage.',
      icon: 'project-diagram',
    },
    {
      type: 'craftsmanship',
      name: 'Built for the Discerning Mind',
      role: 'A precision instrument for demanding creators',
      bio: 'Numina isn\'t a mass-market product built by a committee. It\'s a precision instrument, crafted by a single developer obsessed with creating the ultimate tool for thought. Every detail is meticulously engineered to serve the needs of demanding creators, founders, and thinkers who refuse to settle for anything less than the best.',
      icon: 'user-circle',
      links: [
        { type: 'github', url: 'https://github.com/dorianinnovations', icon: 'github' },
        { type: 'linkedin', url: 'https://www.linkedin.com/in/isaiahpappas', icon: 'linkedin' },
        { type: 'twitter', url: 'https://twitter.com/numinaworks', icon: 'twitter' },
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
                  source={require('../../assets/icon.png')}
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
            </View>
          </View>

          {/* Bio text for all cards */}
          <Text style={[
            styles.cardBio,
            { color: isDarkMode ? '#bbbbbb' : '#666666' }
          ]}>
            {item.bio}
          </Text>

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
          subtitle="The story behind your AI companion"
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
                Made with care for people who want to understand themselves better
              </Text>
              <Text style={[
                styles.copyright,
                { color: isDarkMode ? '#444444' : '#cccccc' }
              ]}>
                © 2025 Numina • Version 1.0.0
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
    gap: 20,
    marginHorizontal: -8,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    minHeight: 60,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexShrink: 0,
  },
  cardTitleContainer: {
    flex: 1,
    paddingRight: 8,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 6,
    letterSpacing: -0.3,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  cardRole: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    letterSpacing: -0.1,
    lineHeight: 16,
    marginBottom: 2,
  },
  cardBio: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    lineHeight: 20,
    marginBottom: 20,
    letterSpacing: -0.05,
    textAlign: 'left',
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
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  copyright: {
    fontSize: 11,
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