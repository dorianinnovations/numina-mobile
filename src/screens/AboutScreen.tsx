import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { PageBackground } from '../components/PageBackground';
import { Header } from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

interface AboutScreenProps {
  onNavigateBack: () => void;
}

type AboutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'About'>;

export const AboutScreen: React.FC<AboutScreenProps> = ({
  onNavigateBack,
}) => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation<AboutScreenNavigationProp>();

  const onTitlePress = () => {
    navigation.navigate('Chat');
  };

  const aboutSections = [
    {
      title: 'App Information',
      items: [
        { icon: 'info-circle', title: 'Version', value: '1.0.0', type: 'info' },
        { icon: 'calendar-alt', title: 'Release Date', value: 'January 2025', type: 'info' },
        { icon: 'code', title: 'Build', value: '2025.01.001', type: 'info' },
      ]
    },
    {
      title: 'Legal & Privacy',
      items: [
        { icon: 'file-contract', title: 'Terms of Service', desc: 'View our terms and conditions', type: 'link' },
        { icon: 'shield-alt', title: 'Privacy Policy', desc: 'How we protect your data', type: 'link' },
        { icon: 'balance-scale', title: 'License', desc: 'Open source licenses', type: 'link' },
      ]
    },
    {
      title: 'Connect With Us',
      items: [
        { icon: 'globe', title: 'Website', value: 'numina.ai', type: 'link' },
        { icon: 'envelope', title: 'Support', value: 'support@numina.ai', type: 'link' },
        { icon: 'twitter', title: 'Twitter', value: '@numina_ai', type: 'link' },
        { icon: 'github', title: 'GitHub', value: 'github.com/numina', type: 'link' },
      ]
    },
  ];

  const handleLinkPress = (item: any) => {
    if (item.type === 'link') {
      // Handle different types of links
      if (item.title === 'Support') {
        Linking.openURL(`mailto:${item.value}`);
      } else if (item.title === 'Website') {
        Linking.openURL(`https://${item.value}`);
      } else if (item.title === 'Twitter') {
        Linking.openURL(`https://twitter.com/${item.value.replace('@', '')}`);
      } else if (item.title === 'GitHub') {
        Linking.openURL(`https://${item.value}`);
      }
    }
  };

  const renderAboutItem = (item: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.aboutItem,
        {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.02)',
          borderColor: isDarkMode ? '#23272b' : 'rgba(0, 0, 0, 0.05)',
        }
      ]}
      activeOpacity={item.type === 'link' ? 0.7 : 1}
      onPress={() => handleLinkPress(item)}
    >
      <View style={[
        styles.aboutIcon,
        {
          backgroundColor: isDarkMode ? 'rgba(134, 239, 172, 0.1)' : 'rgba(134, 239, 172, 0.15)',
        }
      ]}>
        <FontAwesome5 
          name={item.icon as any} 
          size={16} 
          color={isDarkMode ? '#86efac' : '#10b981'} 
        />
      </View>
      <View style={styles.aboutText}>
        <Text style={[
          styles.aboutTitle,
          { color: isDarkMode ? '#ffffff' : '#000000' }
        ]}>
          {item.title}
        </Text>
        {item.value && (
          <Text style={[
            styles.aboutValue,
            { 
              color: item.type === 'link' 
                ? (isDarkMode ? '#86efac' : '#10b981')
                : (isDarkMode ? '#bbbbbb' : '#666666')
            }
          ]}>
            {item.value}
          </Text>
        )}
        {item.desc && (
          <Text style={[
            styles.aboutDesc,
            { color: isDarkMode ? '#888888' : '#666666' }
          ]}>
            {item.desc}
          </Text>
        )}
      </View>
      {item.type === 'link' && (
        <FontAwesome5 
          name="external-link-alt" 
          size={12} 
          color={isDarkMode ? '#666666' : '#999999'} 
        />
      )}
    </TouchableOpacity>
  );

  return (
    <PageBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* App Header */}
          <View style={[
            styles.appHeader,
            {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.02)',
              borderColor: isDarkMode ? '#23272b' : 'rgba(0, 0, 0, 0.05)',
            }
          ]}>
            <View style={[
              styles.appIcon,
              {
                backgroundColor: isDarkMode ? '#86efac' : '#10b981',
              }
            ]}>
              <FontAwesome5 
                name="brain" 
                size={32} 
                color="#ffffff" 
              />
            </View>
            <Text style={[
              styles.appName,
              { color: isDarkMode ? '#ffffff' : '#000000' }
            ]}>
              Numina
            </Text>
            <Text style={[
              styles.appTagline,
              { color: isDarkMode ? '#bbbbbb' : '#666666' }
            ]}>
              Your AI-powered emotional wellness companion
            </Text>
          </View>

          {/* About Sections */}
          {aboutSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={[
                styles.sectionTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>
                {section.title}
              </Text>
              <View style={styles.sectionItems}>
                {section.items.map((item, itemIndex) => renderAboutItem(item, itemIndex))}
              </View>
            </View>
          ))}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[
              styles.footerText,
              { color: isDarkMode ? '#666666' : '#999999' }
            ]}>
              Made with ❤️ for emotional wellness
            </Text>
            <Text style={[
              styles.copyright,
              { color: isDarkMode ? '#444444' : '#cccccc' }
            ]}>
              © 2025 Numina. All rights reserved.
            </Text>
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
  content: {
    flex: 1,
    paddingTop: 120,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  appHeader: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  appTagline: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  sectionItems: {
    gap: 12,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    minHeight: 38 * 1.6, // Thin brick style
  },
  aboutIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  aboutText: {
    flex: 1,
  },
  aboutTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  aboutValue: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
  aboutDesc: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
    textAlign: 'center',
  },
  copyright: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});