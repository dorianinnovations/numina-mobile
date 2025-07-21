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
import { CustomAlert, AlertButton } from '../components/CustomAlert';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { log } from '../utils/logger';

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

type UserTier = 'core' | 'pro' | 'aether';

interface TierFeatures {
  tier: UserTier;
  name: string;
  description: string;
  icon: string;
  color: string;
  price?: string;
  features: string[];
  limitations?: string[];
  isCurrentTier: boolean;
  canUpgrade: boolean;
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
  
  // Tier State
  const [currentTier, setCurrentTier] = useState<UserTier>('core');
  const [tierFeatures, setTierFeatures] = useState<TierFeatures[]>([]);
  
  // Custom Alert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title?: string;
    message?: string;
    buttons?: AlertButton[];
  }>({ visible: false });
  
  // Helper function to show custom alert
  const showAlert = (title?: string, message?: string, buttons?: AlertButton[]) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: 'OK' }]
    });
  };
  
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
    initializeTierFeatures();
  }, []);

  const initializeTierFeatures = () => {
    const features: TierFeatures[] = [
      {
        tier: 'core',
        name: 'Core',
        description: 'The hook. Generous enough to be magical and demonstrate the app\'s core value.',
        icon: 'heart',
        color: '#10b981',
        features: [
          'Core AI Chat with standard models',
          'Standard UBPM updates (24 hours)',
          'Analytics Overview tab access',
          'Teaser analytics (1 trait, 1 pattern)',
          'Limited tool use (10/month)',
          'Basic social discovery',
          '7-day conversation history'
        ],
        limitations: [
          'Locked advanced analytics charts',
          'No premium AI models',
          'Limited tool usage'
        ],
        isCurrentTier: currentTier === 'core',
        canUpgrade: true
      },
      {
        tier: 'pro',
        name: 'Pro',
        description: 'The power-up. For users who are invested and want to go deeper.',
        icon: 'rocket',
        color: '#6366f1',
        price: '$9.99/month',
        features: [
          'Premier AI Models (GPT-4o)',
          'Unlimited tool use (fair use)',
          'Full advanced analytics unlock',
          'Accelerated UBPM updates',
          'Advanced social matching',
          'Unlimited conversation history',
          'Monthly credit allotment (500)'
        ],
        isCurrentTier: currentTier === 'pro',
        canUpgrade: currentTier === 'core'
      },
      {
        tier: 'aether',
        name: 'Aether',
        description: 'The ultimate edge. For power users who want predictive, real-time insights.',
        icon: 'gem',
        color: '#a855f7',
        price: '$29.99/month',
        features: [
          'All Pro features included',
          'Advanced psychological profiling',
          'Real-time insights & monitoring',
          'Predictive analytics engine',
          'Priority access to beta features',
          'Large credit allotment (2,500)',
          'First access to experimental AI'
        ],
        isCurrentTier: currentTier === 'aether',
        canUpgrade: currentTier !== 'aether'
      }
    ];
    setTierFeatures(features);
  };

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
        
        // Determine current tier based on subscription
        const subscription = subscriptionResponse.data.numinaTrace;
        if (subscription.hasActiveSubscription) {
          const plan = subscription.plan?.toLowerCase() || '';
          if (plan.includes('aether') || plan.includes('premium')) {
            setCurrentTier('aether');
          } else if (plan.includes('pro') || plan.includes('trace')) {
            setCurrentTier('pro');
          } else {
            setCurrentTier('core');
          }
        } else {
          setCurrentTier('core');
        }
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
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showAlert('Error', 'Please enter a valid amount');
      return;
    }

    if (cardNumber.replace(/\s/g, '').length < 12) {
      showAlert('Error', 'Invalid card number');
      return;
    }

    if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(expiry)) {
      showAlert('Error', 'Expiry must be MM/YY format');
      return;
    }

    if (cvc.length < 3) {
      showAlert('Error', 'Invalid CVC');
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

  const renderTierCard = (tierData: TierFeatures) => (
    <View 
      key={tierData.tier}
      style={[
        styles.tierContainer,
        {
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
          borderColor: tierData.isCurrentTier ? tierData.color : (isDarkMode ? '#333' : '#e0e0e0'),
          borderWidth: tierData.isCurrentTier ? 2 : 1,
        }
      ]}
    >
      <View style={styles.tierHeader}>
        <View style={styles.tierTitleContainer}>
          <FontAwesome5 name={tierData.icon} size={20} color={tierData.color} />
          <Text style={[
            styles.tierTitle, 
            { color: isDarkMode ? '#fff' : '#000' }
          ]}>
            {tierData.name}
          </Text>
          {tierData.price && (
            <Text style={[styles.tierPrice, { color: tierData.color }]}>
              {tierData.price}
            </Text>
          )}
        </View>
        {tierData.isCurrentTier && (
          <View style={[styles.currentBadge, { backgroundColor: tierData.color }]}>
            <Text style={[styles.currentBadgeText, { color: '#fff' }]}>
              Current
            </Text>
          </View>
        )}
      </View>
      
      <Text style={[styles.tierDescription, { color: isDarkMode ? '#aaa' : '#666' }]}>
        {tierData.description}
      </Text>
      
      <View style={styles.tierFeatures}>
        <Text style={[styles.featuresTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          What's included:
        </Text>
        {tierData.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <FontAwesome5 name="check" size={14} color={tierData.color} />
            <Text style={[styles.featureText, { color: isDarkMode ? '#ccc' : '#666' }]}>
              {feature}
            </Text>
          </View>
        ))}
        
        {tierData.limitations && tierData.limitations.length > 0 && (
          <>
            <Text style={[styles.limitationsTitle, { color: isDarkMode ? '#888' : '#888' }]}>
              Limitations:
            </Text>
            {tierData.limitations.map((limitation, index) => (
              <View key={index} style={styles.limitationItem}>
                <FontAwesome5 name="times" size={14} color="#f59e0b" />
                <Text style={[styles.limitationText, { color: isDarkMode ? '#888' : '#888' }]}>
                  {limitation}
                </Text>
              </View>
            ))}
          </>
        )}
      </View>
      
      {tierData.canUpgrade && !tierData.isCurrentTier && (
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: tierData.color }]}
          onPress={() => {
            if (tierData.tier === 'pro' || tierData.tier === 'aether') {
              setShowSubscriptionModal(true);
            }
          }}
        >
          <Text style={[styles.upgradeButtonText, { color: '#fff' }]}>
            Upgrade to {tierData.name}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCreditSystem = () => (
    <View style={styles.creditSystemSection}>
      <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
        Credit System
      </Text>
      
      <View style={[
        styles.creditCard,
        {
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
          borderColor: isDarkMode ? '#333' : '#e0e0e0',
        }
      ]}>
        <View style={styles.creditHeader}>
          <FontAwesome5 name="coins" size={20} color="#f59e0b" />
          <Text style={[styles.creditTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
            Pay-as-you-go Credits
          </Text>
        </View>
        
        <Text style={[styles.creditDescription, { color: isDarkMode ? '#aaa' : '#666' }]}>
          Perfect for non-subscribers or to exceed your tier limits. Credits never expire.
        </Text>
        
        <View style={styles.creditFeatures}>
          <View style={styles.creditFeatureItem}>
            <Text style={[styles.creditFeatureLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
              Advanced Psychological Profile
            </Text>
            <Text style={[styles.creditFeaturePrice, { color: '#f59e0b' }]}>
              400 credits
            </Text>
          </View>
          
          <View style={styles.creditFeatureItem}>
            <Text style={[styles.creditFeatureLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
              Real-time Insight (1 hour)
            </Text>
            <Text style={[styles.creditFeaturePrice, { color: '#f59e0b' }]}>
              100 credits
            </Text>
          </View>
          
          <View style={styles.creditFeatureItem}>
            <Text style={[styles.creditFeatureLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
              Full Analytics Unlock (24h)
            </Text>
            <Text style={[styles.creditFeaturePrice, { color: '#f59e0b' }]}>
              250 credits
            </Text>
          </View>
        </View>
        
        <View style={styles.creditPurchaseOptions}>
          <Text style={[styles.purchaseOptionsTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
            Credit Packages:
          </Text>
          <View style={styles.packageGrid}>
            {[
              { amount: 500, price: '$5' },
              { amount: 1200, price: '$10' },
              { amount: 2500, price: '$20' },
              { amount: 5000, price: '$35' }
            ].map((pkg) => (
              <TouchableOpacity
                key={pkg.amount}
                style={[
                  styles.packageOption,
                  { 
                    backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
                    borderColor: '#f59e0b'
                  }
                ]}
                onPress={() => {
                  // Handle credit purchase
                  setAmount(pkg.price.replace('$', ''));
                  setShowAddFunds(true);
                }}
              >
                <Text style={[styles.packageAmount, { color: '#f59e0b' }]}>
                  {pkg.amount.toLocaleString()}
                </Text>
                <Text style={[styles.packagePrice, { color: isDarkMode ? '#fff' : '#000' }]}>
                  {pkg.price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderTierSystem = () => (
    <View style={styles.tierSystemSection}>
      <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
        Choose Your Journey
      </Text>
      
      <Text style={[styles.tierSystemDescription, { color: isDarkMode ? '#aaa' : '#666' }]}>
        From discovery to mastery to optimization - find the perfect plan for your personal growth journey.
      </Text>
      
      {tierFeatures.map(renderTierCard)}
      
      {renderCreditSystem()}
    </View>
  );

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
              
              {/* Tier System */}
              {renderTierSystem()}
              
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
            log.info('Subscribed to plan', { plan }, 'WalletScreen');
            loadWalletData(); // Refresh all data including subscription
          }}
        />
        
        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onDismiss={() => setAlertConfig({ visible: false })}
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
  
  // Tier System Styles
  tierSystemSection: {
    marginBottom: 20,
    marginTop: 20,
  },
  tierSystemDescription: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  tierDescription: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 16,
    lineHeight: 20,
  },
  tierPrice: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  tierFeatures: {
    marginTop: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  limitationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  limitationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  limitationText: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
  upgradeButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Credit System Styles
  creditSystemSection: {
    marginTop: 32,
    marginBottom: 20,
  },
  creditCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  creditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  creditTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  creditDescription: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 20,
    lineHeight: 20,
  },
  creditFeatures: {
    marginBottom: 20,
  },
  creditFeatureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  creditFeatureLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  creditFeaturePrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  creditPurchaseOptions: {
    marginTop: 16,
  },
  purchaseOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  packageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  packageOption: {
    flex: 1,
    minWidth: '22%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 12,
    fontWeight: '500',
  },
});