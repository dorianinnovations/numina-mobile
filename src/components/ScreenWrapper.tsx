import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Header } from './Header';
import { SignOutModal } from './SignOutModal';
import { useAuth } from "../contexts/SimpleAuthContext";
import { RootStackParamList } from '../navigation/AppNavigator';

interface ScreenWrapperProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  showConversationsButton?: boolean;
  showQuickAnalyticsButton?: boolean;
  onConversationSelect?: (conversation: any) => void;
  onStartNewChat?: () => void;
  onQuickAnalyticsPress?: () => void;
  currentConversationId?: string;
  title?: string;
  subtitle?: string;
  onBackPress?: () => void;
  headerProps?: {
    isVisible?: boolean;
    isStreaming?: boolean;
    onRestoreHeader?: () => void;
    style?: any;
  };
}

type ScreenWrapperNavigationProp = StackNavigationProp<RootStackParamList>;

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  showHeader = false,
  showBackButton = false,
  showMenuButton = false,
  showConversationsButton = false,
  showQuickAnalyticsButton = false,
  onConversationSelect,
  onStartNewChat,
  onQuickAnalyticsPress,
  currentConversationId,
  title,
  subtitle,
  onBackPress,
  headerProps,
}) => {
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const navigation = useNavigation<ScreenWrapperNavigationProp>();
  const { logout, isAuthenticated } = useAuth();

  const handleTitlePress = () => {
    // Navigate to Chat if authenticated, Hero if not authenticated
    if (isAuthenticated) {
      navigation.navigate('Chat');
    } else {
      navigation.navigate('Hero');
    }
  };

  const handleMenuAction = (key: string) => {
    const currentRoute = navigation.getState()?.routes[navigation.getState().index]?.name;
    
    switch (key) {
      case 'chat':
        if (currentRoute !== 'Chat') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Chat' }],
          });
        }
        break;
      case 'analytics':
        if (currentRoute !== 'AdvancedAnalytics') {
          navigation.push('AdvancedAnalytics');
        }
        break;
      case 'sandbox':
        if (currentRoute !== 'Sandbox') {
          navigation.push('Sandbox');
        }
        break;
      case 'cloud':
        if (currentRoute !== 'Cloud') {
          navigation.push('Cloud');
        }
        break;
      case 'wallet':
        if (currentRoute !== 'Wallet') {
          navigation.push('Wallet');
        }
        break;
      case 'sentiment':
        if (currentRoute !== 'Sentiment') {
          navigation.push('Sentiment');
        }
        break;
      case 'profile':
        if (currentRoute !== 'Profile') {
          navigation.push('Profile');
        }
        break;
      case 'settings':
        if (currentRoute !== 'Settings') {
          navigation.push('Settings');
        }
        break;
      case 'about':
        if (currentRoute !== 'About') {
          navigation.push('About');
        }
        break;
      case 'signout':
        setShowSignOutModal(true);
        break;
      default:
        break;
    }
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Chat');
    }
  };

  const handleSignOutConfirm = async () => {
    try {
      await logout();
      setShowSignOutModal(false);
      // The AppNavigator will automatically redirect to Hero screen
      // when isAuthenticated becomes false
    } catch (error) {
      console.error('Logout error:', error);
      setShowSignOutModal(false);
    }
  };

  const handleSignOutCancel = () => {
    setShowSignOutModal(false);
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <Header
          title={title}
          subtitle={subtitle}
          showBackButton={showBackButton}
          showMenuButton={showMenuButton}
          showConversationsButton={showConversationsButton}
          showQuickAnalyticsButton={showQuickAnalyticsButton}
          onBackPress={handleBackPress}
          onMenuPress={handleMenuAction}
          onTitlePress={handleTitlePress}
          onConversationSelect={onConversationSelect}
          onStartNewChat={onStartNewChat}
          onQuickAnalyticsPress={onQuickAnalyticsPress}
          currentConversationId={currentConversationId}
          {...headerProps}
          onRestoreHeader={headerProps?.onRestoreHeader}
        />
      )}
      {children}
      
      <SignOutModal
        visible={showSignOutModal}
        onConfirm={handleSignOutConfirm}
        onCancel={handleSignOutCancel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenWrapper;