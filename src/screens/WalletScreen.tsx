import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/SimpleAuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Header } from '../components/Header';
import { PageBackground } from '../components/PageBackground';
import { ChromaticCard, ChromaticText } from '../components/ChromaticCard';
import { BalanceCard, PackageCard, DiscountBanner } from '../components/WalletCard';
import { RootStackParamList } from '../navigation/AppNavigator';
import ApiService from '../services/api';

interface WalletScreenProps {
  onNavigateBack: () => void;
}

type WalletScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Wallet'>;

export const WalletScreen: React.FC<WalletScreenProps> = ({ onNavigateBack }) => {
  const { isDarkMode } = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation<WalletScreenNavigationProp>();
  
  const [balance, setBalance] = useState<number>(0);
  const [currentTier, setCurrentTier] = useState<'core' | 'aether'>('core');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadData = async () => {
    try {
      const [balanceRes, subRes] = await Promise.all([
        ApiService.checkBalance(),
        ApiService.getSubscriptionStatus()
      ]);

      if (balanceRes.success && balanceRes.data) {
        setBalance(balanceRes.data.balance || 0);
      }

      if (subRes.success && subRes.data?.numinaTrace?.hasActiveSubscription) {
        setCurrentTier('aether');
      }
    } catch (error) {
      console.log('Failed to load wallet data');
    }
  };

  const handleMenuPress = (key: string) => {
    switch (key) {
      case 'chat': navigation.reset({ index: 0, routes: [{ name: 'Chat' }] }); break;
      case 'analytics': navigation.push('Analytics'); break;
      case 'cloud': navigation.push('Cloud'); break;
      case 'sentiment': navigation.push('Sentiment'); break;
      case 'profile': navigation.push('Profile'); break;
      case 'settings': navigation.push('Settings'); break;
      case 'about': navigation.push('About'); break;
      case 'signout':
        Alert.alert('Sign Out', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: logout }
        ]);
        break;
    }
  };

  return (
    <PageBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <Header
          title="Wallet"
          showBackButton
          showMenuButton
          onBackPress={onNavigateBack}
          onMenuPress={handleMenuPress}
          disableAnimatedBorder={true}
        />
        
        <ScrollView 
          style={styles.scroll} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDarkMode ? '#6ec5ff' : '#add5fa'}
              colors={[isDarkMode ? '#6ec5ff' : '#add5fa']}
              progressBackgroundColor={isDarkMode ? '#202020' : '#f8fafc'}
            />
          }
        >
          <View style={styles.content}>
            
            {/* Credits */}
            <BalanceCard
              title="Credits"
              balance={balance}
              buttonText="Get Credits"
              onButtonPress={() => {}}
              style={styles.creditsContainer}
            />

            {/* Tiers */}
            <View style={styles.tiers}>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                Plans
              </Text>

              {/* Core */}
              <ChromaticCard tier="core" style={styles.chromaticCard} isActive={currentTier === 'core'}>
                <View style={styles.tierHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(148, 163, 184, 0.2)' }]}>
                    <FontAwesome5 name="heart" size={24} color="#94a3b8" />
                  </View>
                  <View style={styles.tierTitleContainer}>
                    <ChromaticText tier="core" variant="title" style={styles.tierName}>
                      Plan: Core
                    </ChromaticText>
                    {currentTier === 'core' && (
                      <View style={styles.activeIndicator}>
                        <View style={[styles.activeGradient, { backgroundColor: '#94a3b8' }]}>
                          <Text style={styles.activeText}>ACTIVE</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.tierDesc}>
                  Limited messaging and standard models
                </Text>
                <View style={styles.tierFeatures}>
                  <View style={styles.featureRow}>
                    <FontAwesome5 name="check" size={12} color="#94a3b8" />
                    <Text style={styles.featureText}>100 messages/month</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <FontAwesome5 name="check" size={12} color="#94a3b8" />
                    <Text style={styles.featureText}>GPT-3.5 & Claude-3</Text>
                  </View>
                </View>
              </ChromaticCard>

              {/* Aether */}
              <ChromaticCard tier="aether" style={styles.chromaticCard} isActive={currentTier === 'aether'}>
                <View style={styles.tierHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                    <FontAwesome5 name="gem" size={24} color="#a855f7" />
                  </View>
                  <View style={styles.tierTitleContainer}>
                    <ChromaticText tier="aether" variant="title" style={styles.tierName}>
                      Plan: Aether
                    </ChromaticText>
                    <ChromaticText tier="aether" variant="price" style={styles.tierPrice}>
                      $29.99/month
                    </ChromaticText>
                    {currentTier === 'aether' && (
                      <View style={styles.activeIndicator}>
                        <View style={[styles.activeGradient, { backgroundColor: '#a855f7' }]}>
                          <Text style={styles.activeText}>ACTIVE</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.tierDesc}>
                  Unlimited messaging, cutting-edge models, 50% credit discount
                </Text>
                <View style={styles.tierFeatures}>
                  <View style={styles.featureRow}>
                    <FontAwesome5 name="infinity" size={12} color="#a855f7" />
                    <Text style={styles.featureText}>Unlimited messages</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <FontAwesome5 name="rocket" size={12} color="#a855f7" />
                    <Text style={styles.featureText}>GPT-4o, Claude Opus 4, Grok 4</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <FontAwesome5 name="percentage" size={12} color="#a855f7" />
                    <Text style={styles.featureText}>50% credit discount</Text>
                  </View>
                </View>
                {currentTier !== 'aether' && (
                  <TouchableOpacity style={styles.upgradeContainer}>
                    <View style={styles.upgradeButton}>
                      <Text style={styles.upgradeText}>Upgrade to Aether</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </ChromaticCard>
            </View>

            {/* Credit Packages */}
            <View style={styles.packages}>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                Credit Packages
              </Text>
              <View style={styles.packageGrid}>
                {[
                  { amount: '500', price: '$5', popular: false },
                  { amount: '1,200', price: '$10', popular: true },
                  { amount: '2,500', price: '$20', popular: false },
                  { amount: '5,500', price: '$35', popular: false }
                ].map((pkg, i) => (
                  <PackageCard
                    key={i}
                    amount={pkg.amount}
                    price={pkg.price}
                    popular={pkg.popular}
                    bonusText={currentTier === 'aether' ? '+50%' : undefined}
                    currentTier={currentTier}
                    onPress={() => {}}
                  />
                ))}
              </View>
              {currentTier === 'aether' && (
                <DiscountBanner
                  icon="star"
                  text="Aether members receive 50% more credits on all purchases"
                />
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 80,
    padding: 20,
    gap: 32,
  },
  
  // Credits
  creditsContainer: {
    padding: 20,
  },

  // Sections
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  tiers: {
    gap: 16,
  },
  
  // Chromatic Cards
  chromaticCard: {
    marginBottom: 4,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierTitleContainer: {
    flex: 1,
    gap: 4,
  },
  tierName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tierPrice: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  activeIndicator: {
    marginTop: 8,
  },
  activeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  activeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tierDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  tierFeatures: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  upgradeContainer: {
    marginTop: 20,
  },
  upgradeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  upgradeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
  },

  // Packages
  packages: {
    gap: 16,
  },
  packageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});