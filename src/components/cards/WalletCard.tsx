import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface WalletCardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
}

interface BalanceCardProps extends WalletCardProps {
  title: string;
  balance: number;
  buttonText: string;
  onButtonPress?: () => void;
}

interface PackageCardProps extends WalletCardProps {
  amount: string;
  price: string;
  popular?: boolean;
  bonusText?: string;
  currentTier?: 'core' | 'aether';
}

export const BaseWalletCard: React.FC<WalletCardProps> = ({
  children,
  style,
  onPress,
  disabled = false,
}) => {
  const { isDarkMode } = useTheme();

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[
        styles.baseCard,
        {
          backgroundColor: isDarkMode ? '#0a0a0a' : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDarkMode ? '#333333' : '#e0e0e0',
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {children}
    </CardComponent>
  );
};

export const BalanceCard: React.FC<BalanceCardProps> = ({
  title,
  balance,
  buttonText,
  onButtonPress,
  style,
}) => {
  const { isDarkMode } = useTheme();

  return (
    <BaseWalletCard style={style}>
      <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
        {title}
      </Text>
      <Text style={[styles.balance, { color: isDarkMode ? '#fff' : '#000' }]}>
        ${balance.toFixed(2)}
      </Text>
      <TouchableOpacity style={styles.addButton} onPress={onButtonPress}>
        <Text style={styles.addButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    </BaseWalletCard>
  );
};

export const PackageCard: React.FC<PackageCardProps> = ({
  amount,
  price,
  popular = false,
  bonusText,
  currentTier,
  onPress,
  style,
}) => {
  const { isDarkMode } = useTheme();

  return (
    <BaseWalletCard onPress={onPress} style={[styles.packageCard, style]}>
      {popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>POPULAR</Text>
        </View>
      )}
      <Text style={[styles.packageAmount, { color: isDarkMode ? '#fff' : '#000' }]}>
        {amount}
      </Text>
      <Text style={[styles.packagePrice, { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#666' }]}>
        {price}
      </Text>
      {currentTier === 'aether' && bonusText && (
        <Text style={styles.bonusText}>{bonusText}</Text>
      )}
    </BaseWalletCard>
  );
};

export const DiscountBanner: React.FC<{
  icon: string;
  text: string;
  style?: ViewStyle;
}> = ({ icon, text, style }) => {
  const { isDarkMode } = useTheme();

  return (
    <BaseWalletCard style={[styles.discountBanner, style]}>
      <FontAwesome5 name={icon} size={16} color="#a855f7" />
      <Text style={[styles.discountText, { color: '#a855f7' }]}>
        {text}
      </Text>
    </BaseWalletCard>
  );
};

const styles = StyleSheet.create({
  baseCard: {
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  
  // Balance Card Styles
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  balance: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#bfdbfe',
  },
  addButtonText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '600',
  },

  // Package Card Styles
  packageCard: {
    width: '48%',
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    minHeight: 120,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.8,
  },
  packageAmount: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    marginTop: 8,
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bonusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 6,
    textAlign: 'center',
  },

  // Discount Banner Styles
  discountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginTop: 16,
  },
  discountText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});