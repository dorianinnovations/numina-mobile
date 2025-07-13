import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { NuminaColors } from '../utils/colors';
import { PageBackground } from '../components/PageBackground';
import { RootStackParamList } from '../navigation/AppNavigator';

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsScreenProps {
  onNavigateBack: () => void;
}

type AnalyticsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Analytics'>;

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ onNavigateBack }) => {
  const { isDarkMode } = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation<AnalyticsScreenNavigationProp>();


  const analyticsCards = [
    {
      title: 'Emotional Insights',
      value: '87%',
      subtitle: 'Positive trend this week',
      icon: <Feather name="trending-up" size={24} color={NuminaColors.green} />,
      color: NuminaColors.green,
    },
    {
      title: 'Chat Sessions',
      value: '24',
      subtitle: 'This month',
      icon: <MaterialCommunityIcons name="chat-outline" size={24} color={NuminaColors.chatBlue[400]} />,
      color: NuminaColors.chatBlue[400],
    },
    {
      title: 'Mindful Minutes',
      value: '320',
      subtitle: 'Total this week',
      icon: <MaterialCommunityIcons name="meditation" size={24} color={NuminaColors.chatGreen[400]} />,
      color: NuminaColors.chatGreen[400],
    },
    {
      title: 'Wellness Score',
      value: '8.2',
      subtitle: 'Out of 10',
      icon: <Feather name="heart" size={24} color={NuminaColors.purple} />,
      color: NuminaColors.purple,
    },
  ];

  return (
    <PageBackground>
      <SafeAreaView style={styles.container}>
      

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[800] }]}>
            Your Analytics
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? NuminaColors.darkMode[300] : NuminaColors.darkMode[600] }]}>
            Track your emotional wellness journey
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {analyticsCards.map((card, index) => (
            <View 
              key={index}
              style={[
                styles.card,
                {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                }
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: `${card.color}20` }]}>
                  {card.icon}
                </View>
                <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[700] }]}>
                  {card.title}
                </Text>
              </View>
              
              <Text style={[styles.cardValue, { color: card.color }]}>
                {card.value}
              </Text>
              
              <Text style={[styles.cardSubtitle, { color: isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500] }]}>
                {card.subtitle}
              </Text>
            </View>
          ))}
        </View>

        <View style={[
          styles.insightsCard,
          {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          }
        ]}>
          <Text style={[styles.insightsTitle, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[800] }]}>
            Weekly Insights
          </Text>
          <Text style={[styles.insightsText, { color: isDarkMode ? NuminaColors.darkMode[300] : NuminaColors.darkMode[600] }]}>
            Your emotional wellness has shown consistent improvement this week. You've engaged in 
            meaningful conversations and maintained a positive outlook. Keep up the great work!
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
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  card: {
    width: (screenWidth - 50) / 2,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  insightsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  insightsText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
});