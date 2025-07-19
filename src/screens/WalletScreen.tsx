import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ShimmerText } from '../components/ShimmerText';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/SimpleAuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Header } from '../components/Header';
import { PageBackground } from '../components/PageBackground';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { RootStackParamList } from '../navigation/AppNavigator';
import ApiService from '../services/api';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

interface WalletScreenProps {
  onNavigateBack: () => void;
}

type WalletScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Wallet'>;

interface WalletData {
  balance: number;
  currency: string;
  todaySpent: number;
  remainingDailyLimit: number;
  isActive: boolean;
  isVerified: boolean;
  autoRechargeEnabled: boolean;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  timestamp: string;
  toolName?: string;
}

interface Tool {
  name: string;
  description: string;
  category: string;
  costPerExecution: number;
  requiresPayment: boolean;
  enabled: boolean;
}

interface SubscriptionData {
  numinaTrace: {
    isActive: boolean;
    plan: string | null;
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    nextBillingDate: string;
    hasActiveSubscription: boolean;
  };
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ onNavigateBack }) => {
  const { theme, isDarkMode } = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation<WalletScreenNavigationProp>();
  
  // Pull-to-refresh functionality
  const { refreshControl } = usePullToRefresh(async () => {
    await loadWalletData();
  });
  
  // Wallet State
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Subscription State
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // Add Funds State
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [addingFunds, setAddingFunds] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Load wallet data on mount
  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load balance, transaction history, tools, and subscription in parallel
      const [balanceResponse, transactionsResponse, toolsResponse, subscriptionResponse] = await Promise.all([
        ApiService.checkBalance(),
        ApiService.getTransactionHistory(),
        ApiService.getAvailableTools(),
        ApiService.getSubscriptionStatus()
      ]);

      // Handle balance response with proper error checking
      if (balanceResponse.success && balanceResponse.data) {
        // Handle both possible response structures
        const balanceData = balanceResponse.data;
        if (balanceData && typeof balanceData === 'object') {
          setWalletData(balanceData as WalletData);
        } else {
          setError('Invalid balance data format');
        }
      } else {
        setError('Failed to load wallet balance');
      }

      // Handle transactions response
      if (transactionsResponse.success && transactionsResponse.data) {
        const transactionData = transactionsResponse.data;
        if (transactionData && transactionData.transactions) {
          setTransactions(transactionData.transactions);
        } else if (Array.isArray(transactionData)) {
          setTransactions(transactionData);
        } else {
          setTransactions([]);
        }
      }

      // Handle tools response
      if (toolsResponse.success && toolsResponse.data) {
        const toolsData = toolsResponse.data.tools || toolsResponse.data;
        if (Array.isArray(toolsData)) {
          setTools(toolsData.filter((tool: Tool) => tool.enabled));
        } else {
          setTools([]);
        }
      }

      // Handle subscription response
      if (subscriptionResponse.success && subscriptionResponse.data) {
        setSubscriptionData(subscriptionResponse.data);
      }
    } catch (err) {
      console.error('Error loading wallet data:', err);
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: walletData?.currency || 'USD',
    }).format(amount);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSubscriptionDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCardNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  const formatExpiry = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Add slash after 2 digits
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleAddFunds = async () => {
    if (!cardNumber.trim() || !expiry.trim() || !cvc.trim() || !amount.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (cardNumber.replace(/\s/g, '').length < 12) {
      Alert.alert('Error', 'Invalid card number');
      return;
    }

    if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(expiry)) {
      Alert.alert('Error', 'Expiry must be MM/YY format');
      return;
    }

    if (cvc.length < 3) {
      Alert.alert('Error', 'Invalid CVC');
      return;
    }

    try {
      setAddingFunds(true);
      setError('');

      // First setup Stripe customer if needed
      const customerResponse = await ApiService.setupStripeCustomer();
      if (!customerResponse.success) {
        throw new Error('Failed to setup payment account');
      }

      // Add funds via Stripe
      const fundResponse = await ApiService.addFundsStripe(amountNum, 'pm_test_card_visa');
      
      if (fundResponse.success && fundResponse.data) {
        Alert.alert('Success', 'Funds added successfully!');
        setShowAddFunds(false);
        setCardNumber('');
        setExpiry('');
        setCvc('');
        setAmount('');
        setAddress('');
        
        // Refresh wallet data
        await loadWalletData();
      } else {
        throw new Error('Failed to add funds');
      }
    } catch (err) {
      console.error('Error adding funds:', err);
      Alert.alert('Error', 'Failed to add funds. Please try again.');
    } finally {
      setAddingFunds(false);
    }
  };

  const handleVerifyAccount = async () => {
    try {
      setLoading(true);
      const response = await ApiService.verifyAccount();
      
      if (response.success) {
        Alert.alert('Success', 'Account verified successfully!');
        await loadWalletData();
      } else {
        Alert.alert('Error', 'Failed to verify account');
      }
    } catch (err) {
      console.error('Error verifying account:', err);
      Alert.alert('Error', 'Failed to verify account');
    } finally {
      setLoading(false);
    }
  };


  const hasActiveSubscription = subscriptionData?.numinaTrace?.hasActiveSubscription || false;
  const subscriptionPlan = subscriptionData?.numinaTrace?.plan || '';
  const endDate = subscriptionData?.numinaTrace?.endDate || '';



  const renderAddFundsForm = () => (
    <View style={[
      styles.addFundsForm,
      {
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        borderColor: isDarkMode ? '#333' : '#e0e0e0',
      }
    ]}>
      <Text style={[styles.formTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
        Add Credits
      </Text>
      
      <View style={styles.inputGroup}>
        <TextInput
          style={[
            styles.input,
            {
              color: isDarkMode ? '#fff' : '#000',
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderColor: isDarkMode ? '#333' : '#e0e0e0',
            }
          ]}
          placeholder="Amount ($)"
          placeholderTextColor={isDarkMode ? '#666' : '#999'}
          keyboardAppearance={isDarkMode ? 'dark' : 'light'}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        
        <TextInput
          style={[
            styles.input,
            {
              color: isDarkMode ? '#fff' : '#000',
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderColor: isDarkMode ? '#333' : '#e0e0e0',
            }
          ]}
          placeholder="Card Number"
          placeholderTextColor={isDarkMode ? '#666' : '#999'}
          keyboardAppearance={isDarkMode ? 'dark' : 'light'}
          value={cardNumber}
          onChangeText={(text) => setCardNumber(formatCardNumber(text))}
          keyboardType="number-pad"
          maxLength={19}
        />
        
        <View style={styles.cardRow}>
          <TextInput
            style={[
              styles.input,
              styles.cardInput,
              {
                color: isDarkMode ? '#fff' : '#000',
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                borderColor: isDarkMode ? '#333' : '#e0e0e0',
              }
            ]}
            placeholder="MM/YY"
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            keyboardAppearance={isDarkMode ? 'dark' : 'light'}
            value={expiry}
            onChangeText={(text) => setExpiry(formatExpiry(text))}
            keyboardType="number-pad"
            maxLength={5}
          />
          <TextInput
            style={[
              styles.input,
              styles.cardInput,
              {
                color: isDarkMode ? '#fff' : '#000',
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                borderColor: isDarkMode ? '#333' : '#e0e0e0',
              }
            ]}
            placeholder="CVC"
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            keyboardAppearance={isDarkMode ? 'dark' : 'light'}
            value={cvc}
            onChangeText={setCvc}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>
        
        <TextInput
          style={[
            styles.input,
            {
              color: isDarkMode ? '#fff' : '#000',
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.178)' : 'rgba(0,0,0,0.02)',
              borderColor: isDarkMode ? '#333' : '#e0e0e0',
            }
          ]}
          placeholder="Billing Address"
          placeholderTextColor={isDarkMode ? '#666' : '#999'}
          keyboardAppearance={isDarkMode ? 'dark' : 'light'}
          value={address}
          onChangeText={setAddress}
          autoCapitalize="words"
        />
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.cancelButton,
            { borderColor: isDarkMode ? '#666' : '#ccc' }
          ]}
          onPress={() => setShowAddFunds(false)}
        >
          <Text style={[styles.buttonText, { color: isDarkMode ? '#fff' : '#000' }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.button,
            styles.addButton,
            { backgroundColor: isDarkMode ? '#65a8ff' : '#98c0ff' }
          ]}
          onPress={handleAddFunds}
          disabled={addingFunds}
        >
          <Text style={[styles.buttonText, { color: '#fff' }]}>
            {addingFunds ? 'Adding...' : 'Add Credits'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
    const renderSubscriptionCard = () => (
    <TouchableOpacity 
      style={[
        styles.subscriptionCard,
        {
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
          borderColor: isDarkMode ? '#333' : '#e0e0e0',
        }
      ]}
      onPress={() => setShowSubscriptionModal(true)}
      activeOpacity={0.8}
    >
      <View style={styles.subscriptionHeader}>
        <View style={styles.subscriptionTitleContainer}>
          <FontAwesome5 name="gem" size={16} color="#add5fa" />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.subscriptionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Numina{' '}
            </Text>
            <ShimmerText 
              style={[styles.subscriptionTitle, { color: isDarkMode ? '#fff' : '#000' }]}
            >
              Aether
            </ShimmerText>
          </View>
        </View>
        <FontAwesome5 name="chevron-right" size={14} color={isDarkMode ? '#666' : '#999'} />
      </View>
      {hasActiveSubscription ? (
        <View style={styles.subscriptionActive}>
          <Text style={[styles.subscriptionPlan, { color: isDarkMode ? '#86efac' : '#10b981' }]}>
            {subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)} Plan
          </Text>
          <Text style={[styles.subscriptionStatus, { color: isDarkMode ? '#aaa' : '#666' }]}>
            Active until {formatSubscriptionDate(endDate)}
          </Text>
        </View>
      ) : (
        <View style={styles.upgradePrompt}>
          <Text style={[styles.upgradeText, { color: isDarkMode ? '#86efac' : '#10b981' }]}>
            Tap to explore premium plans
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );


  const renderWalletCard = () => (
    <View style={[
      styles.walletCard,
      {
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        borderColor: isDarkMode ? '#333' : '#e0e0e0',
      }
    ]}>
      <View style={styles.balanceSection}>
        <Text style={[styles.balanceLabel, { color: isDarkMode ? '#888' : '#666' }]}>
          Current Balance
        </Text>
        <Text style={[styles.balanceAmount, { color: isDarkMode ? '#fff' : '#000' }]}>
          {walletData ? formatCurrency(walletData.balance) : '—'}
        </Text>
        <View style={styles.balanceInfo}>
          <Text style={[styles.balanceDetail, { color: isDarkMode ? '#aaa' : '#666' }]}>
            Today spent: {walletData ? formatCurrency(walletData.todaySpent) : '—'}
          </Text>
          <Text style={[styles.balanceDetail, { color: isDarkMode ? '#aaa' : '#666' }]}>
            Daily limit remaining: {walletData ? formatCurrency(walletData.remainingDailyLimit) : '—'}
          </Text>
        </View>
      </View>

      
      
      <View style={styles.statusSection}>
        <View style={styles.statusItem}>
          <FontAwesome5 
            name={walletData?.isActive ? 'check-circle' : 'exclamation-circle'} 
            size={16} 
            color={walletData?.isActive ? '#10b981' : '#f59e0b'} 
          />
          <Text style={[styles.statusText, { color: isDarkMode ? '#fff' : '#000' }]}>
            {walletData?.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <FontAwesome5 
            name={walletData?.isVerified ? 'shield-alt' : 'shield-alt'} 
            size={16} 
            color={walletData?.isVerified ? '#10b981' : '#f59e0b'} 
          />
          <Text style={[styles.statusText, { color: isDarkMode ? '#fff' : '#000' }]}>
            {walletData?.isVerified ? 'Verified' : 'Unverified'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTransactionItem = (transaction: Transaction) => (
    <View
      key={transaction.id}
      style={[
        styles.transactionItem,
        {
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
          borderColor: isDarkMode ? '#333' : '#e0e0e0',
        }
      ]}
    >
      <View style={styles.transactionIcon}>
        <FontAwesome5
          name={transaction.type === 'credit' ? 'plus' : 'minus'}
          size={14}
          color={transaction.type === 'credit' ? '#10b981' : '#f59e0b'}
        />
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={[styles.transactionDescription, { color: isDarkMode ? '#fff' : '#000' }]}>
          {transaction.description}
        </Text>
        {transaction.toolName && (
          <Text style={[styles.transactionTool, { color: isDarkMode ? '#888' : '#666' }]}>
            {transaction.toolName}
          </Text>
        )}
        <Text style={[styles.transactionDate, { color: isDarkMode ? '#aaa' : '#666' }]}>
          {formatDate(transaction.timestamp)}
        </Text>
      </View>
      
      <View style={styles.transactionAmount}>
        <Text style={[
          styles.transactionAmountText,
          { color: transaction.type === 'credit' ? '#10b981' : '#f59e0b' }
        ]}>
          {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Text>
        <Text style={[styles.transactionStatus, { color: isDarkMode ? '#888' : '#666' }]}>
          {transaction.status}
        </Text>
      </View>
    </View>
  );

  const renderToolsSection = () => {
    return (
      <View style={styles.toolsSection}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          
        </Text>
        
        {/* Investment/Support Section */}
        <View style={[
          styles.tierContainer,
          {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            borderColor: isDarkMode ? '#FFD700' : '#FFD700',
            borderWidth: 1,
          }
        ]}>
          <View style={styles.tierHeader}>
            <View style={styles.tierTitleContainer}>
              <FontAwesome5 name="rocket" size={20} color="#FFD700" />
              <Text style={[
                styles.tierTitle, 
                { color: isDarkMode ? '#FFD700' : '#FFD700' }
              ]}>
                Founding Member
              </Text>
            </View>
          </View>
          
          <View style={styles.developmentNotice}>
            <View style={styles.developmentIcon}>
              <FontAwesome5 name="handshake" size={24} color={isDarkMode ? '#80acff' : '#80acff'} />
            </View>
            <View style={styles.developmentText}>
              <Text style={[styles.developmentTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                You're Building the Future
              </Text>
              <Text style={[styles.developmentDescription, { color: isDarkMode ? '#aaa' : '#666' }]}>
                Your credits directly fund revolutionary AI that understands human emotion. Early supporters get lifetime access to premium features. 
              </Text>
            </View>
          </View>
          
          <View style={styles.featurePreview}>
            <Text style={[styles.featureTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Your Investment Unlocks:
            </Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <FontAwesome5 name="brain" size={16} color={isDarkMode ? '#80acff' : '#80acff'} />
                <Text style={[styles.featureText, { color: isDarkMode ? '#ccc' : '#666' }]}>
                  Advanced agentic behavior tied to personal trends
                </Text>
              </View>
              <View style={styles.featureItem}>
                <FontAwesome5 name="chart-line" size={16} color={isDarkMode ? '#80acff' : '#80acff'} />
                <Text style={[styles.featureText, { color: isDarkMode ? '#ccc' : '#666' }]}>
                  Deep emotional analytics for self-mastery
                </Text>
              </View>
              <View style={styles.featureItem}>
                <FontAwesome5 name="users" size={16} color={isDarkMode ? '#80acff' : '#80acff'} />
                <Text style={[styles.featureText, { color: isDarkMode ? '#ccc' : '#666' }]}>
                  Enhanced social matching algorithms
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
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
        <Header
          title="Wallet"
          showBackButton={true}
          showMenuButton={true}
          onBackPress={onNavigateBack}
          onMenuPress={(key: string) => {
            switch (key) {
              case 'chat':
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Chat' }],
                });
                break;
              case 'analytics':
                navigation.push('Analytics');
                break;
              case 'cloud':
                navigation.push('Cloud');
                break;
              case 'sentiment':
                navigation.push('Sentiment');
                break;
              case 'profile':
                navigation.push('Profile');
                break;
              case 'settings':
                navigation.push('Settings');
                break;
              case 'about':
                navigation.push('About');
                break;
              case 'signout':
                Alert.alert(
                  'Sign Out',
                  'Are you sure you want to sign out?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Sign Out', 
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await logout();
                        } catch (error) {
                          console.error('Logout error:', error);
                        }
                      }
                    }
                  ]
                );
                break;
            }
          }}
        />
        
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl {...refreshControl} />
            }
          >
            <Animated.View style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              }
            ]}>
              {/* Wallet Balance Card */}
              {renderWalletCard()}
              
              {/* Action Buttons */}
              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.primaryAction,
                    { backgroundColor: isDarkMode ? '#80acff' : '#80acff' }
                  ]}
                  onPress={() => {
                    // Heavy haptic for financial transaction
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setShowAddFunds(true);
                  }}
                >
                  <FontAwesome5 name="plus" size={16} color="#fff" />
                  <Text style={[styles.actionButtonText, { color: '#fff' }]}> 
                    Add Credits
                  </Text>
                </TouchableOpacity>
                
                {walletData && !walletData.isVerified && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: isDarkMode ? '#e6e6e6' : '#ffffff' }
                    ]}
                    onPress={() => {
                      // Medium haptic for account verification
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      handleVerifyAccount();
                    }}
                    disabled={loading}
                  >
                    <FontAwesome5 name="shield-alt" size={16} color="#414141" />
                    <Text style={[styles.actionButtonText, { color: '#333333' }]}> 
                      {loading ? 'Verifying...' : 'Verify Account'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Section Separator */}
              <View style={styles.sectionSeparator}>
                <View style={[styles.separatorLine, { backgroundColor: isDarkMode ? '#333' : '#e0e0e0' }]} />
                <Text style={[styles.separatorText, { color: isDarkMode ? '#666' : '#999' }]}>
                  Or
                </Text>
                <View style={[styles.separatorLine, { backgroundColor: isDarkMode ? '#333' : '#e0e0e0' }]} />
              </View>
              
              {/* Add Funds Form */}
              {showAddFunds && renderAddFundsForm()}
              
              {/* Subscription Status Card */}
              {renderSubscriptionCard()}
              
              {/* Available Tools */}
              {renderToolsSection()}
              
              {/* Transaction History */}
              <View style={styles.transactionSection}>
                <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                  Recent Transactions
                </Text>
                
                {transactions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <FontAwesome5 name="receipt" size={48} color={isDarkMode ? '#666' : '#ccc'} />
                    <Text style={[styles.emptyStateText, { color: isDarkMode ? '#888' : '#666' }]}>
                      No transactions yet
                    </Text>
                  </View>
                ) : (
                  <View style={styles.transactionList}>
                    {transactions.map(renderTransactionItem)}
                  </View>
                )}
              </View>
              
              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Subscription Modal */}
        <SubscriptionModal
          visible={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          onSubscribe={(plan) => {
            console.log('Subscribed to plan:', plan);
            loadWalletData(); // Refresh all data including subscription
          }}
        />
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 60,
    padding: 20,
  },
  walletCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    marginBottom: 50,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceSection: {
    marginBottom: 80,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '600',
    marginBottom: 12,
  },
  balanceInfo: {
    gap: 4,
  },
  balanceDetail: {
    fontSize: 14,
    fontWeight: '400',
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  primaryAction: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryAction: {
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
    paddingHorizontal: 8,
  },
  separatorLine: {
    flex: 1,
    height: 1,
  },
  separatorText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addFundsForm: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
    zIndex: 10,
    elevation: 5,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    gap: 12,
    marginBottom: 16,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '400',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardInput: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  addButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  toolsSection: {
    marginBottom: 20,
    marginTop: 40,
  },
  tierContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  upgradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  upgradeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tierTools: {
    gap: 12,
  },
  toolIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolIndicatorInfo: {
    flex: 1,
  },
  toolIndicatorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  toolIndicatorStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  developmentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 172, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(128, 172, 255, 0.3)',
  },
  developmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(128, 172, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  developmentText: {
    flex: 1,
  },
  developmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  developmentDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  featurePreview: {
    marginTop: 4,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  featureList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
  transactionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionTool: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '400',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Subscription Card Styles
  subscriptionCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subscriptionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  subscriptionActive: {
    gap: 4,
  },
  subscriptionPlan: {
    fontSize: 16,
    fontWeight: '600',
  },
  subscriptionStatus: {
    fontSize: 14,
    fontWeight: '400',
  },
  upgradePrompt: {
    paddingVertical: 8,
  },
  upgradeText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});