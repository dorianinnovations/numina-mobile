import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import ApiService from '../services/api';

const { width } = Dimensions.get('window');

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe?: (plan: string) => void;
}

interface PricingPlan {
  name: string;
  displayName: string;
  price: number;
  currency: string;
  duration: string;
  savings?: string;
  features: string[];
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  visible,
  onClose,
  onSubscribe,
}) => {
  const { isDarkMode } = useTheme();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  useEffect(() => {
    if (visible) {
      loadPricing();
    }
  }, [visible]);

  const loadPricing = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getSubscriptionPricing();
      if (response.success && response.data?.plans) {
        setPlans(response.data.plans);
        // Default to yearly plan
        setSelectedPlan('yearly');
      }
    } catch (error) {
      console.error('Error loading pricing:', error);
      Alert.alert('Error', 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a plan');
      return;
    }

    try {
      setSubscribing(true);
      
      // For now, use a test payment method ID
      // In a real app, you would integrate with Stripe or another payment processor
      const testPaymentMethodId = 'pm_test_subscription';
      
      const response = await ApiService.subscribeToNuminaTrace(selectedPlan, testPaymentMethodId);
      
      if (response.success) {
        Alert.alert('Success!', 'Welcome to Numina Trace! You now have access to all premium features.', [
          {
            text: 'Get Started',
            onPress: () => {
              onSubscribe?.(selectedPlan);
              onClose();
            }
          }
        ]);
      } else {
        Alert.alert('Subscription Failed', response.error || 'Failed to process subscription');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const renderPlanCard = (plan: PricingPlan) => {
    const isSelected = selectedPlan === plan.name;
    const isPopular = plan.name === 'yearly';
    
    return (
      <TouchableOpacity
        key={plan.name}
        style={[
          styles.planCard,
          {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            borderColor: isSelected 
              ? (isDarkMode ? '#86efac' : '#10b981')
              : (isDarkMode ? '#333' : '#e0e0e0'),
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => setSelectedPlan(plan.name)}
      >
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <Text style={[
            styles.planName,
            { color: isDarkMode ? '#ffffff' : '#000000' }
          ]}>
            {plan.displayName}
          </Text>
          {plan.savings && (
            <Text style={[
              styles.planSavings,
              { color: isDarkMode ? '#86efac' : '#10b981' }
            ]}>
              {plan.savings}
            </Text>
          )}
        </View>
        
        <View style={styles.planPricing}>
          <Text style={[
            styles.planPrice,
            { color: isDarkMode ? '#ffffff' : '#000000' }
          ]}>
            {formatPrice(plan.price, plan.currency)}
          </Text>
          <Text style={[
            styles.planDuration,
            { color: isDarkMode ? '#888888' : '#666666' }
          ]}>
            {plan.duration}
          </Text>
        </View>
        
        <View style={styles.planFeatures}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <FontAwesome5 
                name="check" 
                size={12} 
                color={isDarkMode ? '#86efac' : '#10b981'} 
              />
              <Text style={[
                styles.featureText,
                { color: isDarkMode ? '#bbbbbb' : '#666666' }
              ]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
        
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <FontAwesome5 name="check-circle" size={20} color={isDarkMode ? '#86efac' : '#10b981'} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <BlurView style={styles.modalOverlay} intensity={20}>
        <View style={[
          styles.modalContainer,
          {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            borderColor: isDarkMode ? '#333333' : '#e5e7eb',
          }
        ]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitle}>
              <FontAwesome5 name="crown" size={20} color="#FFD700" />
              <Text style={[
                styles.modalTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>
                Upgrade to Numina Trace
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <FontAwesome5 name="times" size={18} color={isDarkMode ? '#888888' : '#666666'} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={[
              styles.modalDescription,
              { color: isDarkMode ? '#bbbbbb' : '#666666' }
            ]}>
              Unlock the full power of Numina with access to AI tools, advanced features, and premium support.
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={isDarkMode ? '#86efac' : '#10b981'} />
                <Text style={[
                  styles.loadingText,
                  { color: isDarkMode ? '#888888' : '#666666' }
                ]}>
                  Loading plans...
                </Text>
              </View>
            ) : (
              <View style={styles.plansContainer}>
                {plans.map(renderPlanCard)}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          {!loading && (
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  {
                    backgroundColor: selectedPlan 
                      ? (isDarkMode ? '#86efac' : '#10b981')
                      : (isDarkMode ? '#333333' : '#cccccc'),
                    opacity: subscribing ? 0.7 : 1,
                  }
                ]}
                onPress={handleSubscribe}
                disabled={!selectedPlan || subscribing}
              >
                {subscribing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.subscribeButtonText}>
                    {selectedPlan ? `Subscribe to ${plans.find(p => p.name === selectedPlan)?.displayName}` : 'Select a Plan'}
                  </Text>
                )}
              </TouchableOpacity>
              
              <Text style={[
                styles.footerNote,
                { color: isDarkMode ? '#888888' : '#666666' }
              ]}>
                Cancel anytime. No hidden fees.
              </Text>
            </View>
          )}
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: width * 0.95,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    paddingHorizontal: 20,
    maxHeight: 500,
  },
  modalDescription: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  planSavings: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 16,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  planDuration: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  planFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  modalFooter: {
    padding: 20,
    paddingTop: 16,
    gap: 12,
  },
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subscribeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  footerNote: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});