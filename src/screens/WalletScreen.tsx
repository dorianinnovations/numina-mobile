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
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/SimpleAuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Header } from '../components/Header';
import { PageBackground } from '../components/PageBackground';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { RootStackParamList } from '../navigation/AppNavigator';
import ApiService from '../services/api';

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

  const handleExecuteTool = async (toolName: string, toolCost: number) => {
    // Check if user can afford the tool
    if (walletData && walletData.balance < toolCost) {
      Alert.alert('Insufficient Funds', `You need ${formatCurrency(toolCost)} to use this tool. Your current balance is ${formatCurrency(walletData.balance)}.`);
      return;
    }

    Alert.alert(
      'Execute Tool',
      `Execute ${toolName} for ${formatCurrency(toolCost)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Execute', onPress: () => executeTool(toolName) }
      ]
    );
  };

  const executeTool = async (toolName: string) => {
    try {
      setLoading(true);
      
      // Get default arguments for different tools
      const getDefaultArgs = (tool: string) => {
        switch (tool) {
          case 'spotify_playlist':
            return {
              playlistName: 'My Numina Playlist',
              description: 'Generated via Numina mobile app',
              mood: 'happy',
              isPublic: false
            };
          case 'reservation_booking':
            return {
              restaurantName: 'Local Restaurant',
              date: new Date().toISOString().split('T')[0],
              time: '19:00',
              partySize: 2,
              specialRequests: 'Table for 2'
            };
          case 'itinerary_generator':
            return {
              destination: 'New York',
              duration: 2,
              budget: 500,
              startDate: new Date().toISOString().split('T')[0],
              interests: ['culture', 'food'],
              includeAccommodation: true,
              includeActivities: true,
              includeRestaurants: true
            };
          default:
            return {};
        }
      };

      const response = await ApiService.executeToolWithPayment(toolName, getDefaultArgs(toolName));
      
      if (response.success) {
        Alert.alert('Success', `${toolName} executed successfully!`);
        await loadWalletData(); // Refresh to show updated balance
      } else {
        Alert.alert('Error', response.error || 'Failed to execute tool');
      }
    } catch (err) {
      console.error('Error executing tool:', err);
      Alert.alert('Error', 'Failed to execute tool');
    } finally {
      setLoading(false);
    }
  };

  const hasActiveSubscription = subscriptionData?.numinaTrace?.hasActiveSubscription || false;
  const subscriptionPlan = subscriptionData?.numinaTrace?.plan || '';
  const endDate = subscriptionData?.numinaTrace?.endDate || '';

  const renderSubscriptionCard = () => (
    <View style={[
      styles.subscriptionCard,
      {
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        borderColor: isDarkMode ? '#333' : '#e0e0e0',
      }
    ]}>
      <View style={styles.subscriptionHeader}>
        <FontAwesome5 name="crown" size={16} color="#FFD700" />
        <Text style={[styles.subscriptionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          Numina Trace
        </Text>
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
        <TouchableOpacity 
          style={styles.upgradePrompt}
          onPress={() => setShowSubscriptionModal(true)}
        >
          <Text style={[styles.upgradeText, { color: isDarkMode ? '#86efac' : '#10b981' }]}>
            Upgrade to unlock all features →
          </Text>
        </TouchableOpacity>
      )}
    </View>
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

  const renderToolsSection = () => (
    <View style={styles.toolsSection}>
      <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
        Available Tools
      </Text>
      
      {tools.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome5 name="tools" size={48} color={isDarkMode ? '#666' : '#ccc'} />
          <Text style={[styles.emptyStateText, { color: isDarkMode ? '#888' : '#666' }]}>
            No tools available
          </Text>
        </View>
      ) : (
        <View style={styles.toolsList}>
          {tools.map((tool) => (
            <View
              key={tool.name}
              style={[
                styles.toolItem,
                {
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                  borderColor: isDarkMode ? '#333' : '#e0e0e0',
                }
              ]}
            >
              <View style={styles.toolInfo}>
                <Text style={[styles.toolName, { color: isDarkMode ? '#fff' : '#000' }]}>
                  {tool.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                <Text style={[styles.toolDescription, { color: isDarkMode ? '#888' : '#666' }]}>
                  {tool.description}
                </Text>
                <View style={styles.toolMeta}>
                  <Text style={[styles.toolCategory, { color: isDarkMode ? '#aaa' : '#666' }]}>
                    {tool.category}
                  </Text>
                  <Text style={[styles.toolCost, { color: isDarkMode ? '#80acff' : '#80acff' }]}>
                    {tool.requiresPayment ? formatCurrency(tool.costPerExecution) : 'Free'}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.toolExecuteButton,
                  {
                    backgroundColor: isDarkMode ? '#80acff' : '#80acff',
                    opacity: loading ? 0.5 : 1,
                  }
                ]}
                onPress={() => handleExecuteTool(tool.name, tool.costPerExecution)}
                disabled={loading}
              >
                <FontAwesome5 name="play" size={12} color="#fff" />
                <Text style={[styles.toolExecuteText, { color: '#fff' }]}>
                  Execute
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
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
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={isDarkMode ? '#fff' : '#000'}
              />
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
                  onPress={() => setShowAddFunds(true)}
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
                    onPress={handleVerifyAccount}
                    disabled={loading}
                  >
                    <FontAwesome5 name="shield-alt" size={16} color="#414141" />
                    <Text style={[styles.actionButtonText, { color: '#333333' }]}> 
                      {loading ? 'Verifying...' : 'Verify Account'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Subscription Status Card */}
              {renderSubscriptionCard()}
              
              {/* Add Funds Form */}
              {showAddFunds && renderAddFundsForm()}
              
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
  addFundsForm: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
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
  toolsList: {
    gap: 12,
  },
  toolItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  toolInfo: {
    flex: 1,
    marginRight: 12,
  },
  toolName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 8,
    lineHeight: 20,
  },
  toolMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolCategory: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  toolCost: {
    fontSize: 14,
    fontWeight: '600',
  },
  toolExecuteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  toolExecuteText: {
    fontSize: 12,
    fontWeight: '600',
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
    gap: 8,
    marginBottom: 12,
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