import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Header } from './Header';
import { SignOutModal } from '../modals/SignOutModal';
import { useAuth } from "../../contexts/SimpleAuthContext";
import { RootStackParamList } from '../../navigation/AppNavigator';

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
        if (isAuthenticated && currentRoute !== 'Chat') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Chat' }],
          });
        }
        break;
      case 'analytics':
        if (isAuthenticated && currentRoute !== 'Analytics') {
          navigation.push('Analytics');
        }
        break;
      case 'sandbox':
        if (isAuthenticated && currentRoute !== 'Sandbox') {
          navigation.push('Sandbox');
        }
        break;
      case 'cloud':
        if (isAuthenticated && currentRoute !== 'Cloud') {
          navigation.push('Cloud');
        }
        break;
      case 'wallet':
        if (isAuthenticated && currentRoute !== 'Wallet') {
          navigation.push('Wallet');
        }
        break;
      case 'sentiment':
        if (isAuthenticated && currentRoute !== 'Sentiment') {
          navigation.push('Sentiment');
        }
        break;
      case 'profile':
        if (isAuthenticated && currentRoute !== 'Profile') {
          navigation.push('Profile');
        }
        break;
      case 'settings':
        // Settings always accessible
        if (currentRoute !== 'Settings') {
          navigation.push('Settings');
        }
        break;
      case 'about':
        // About always accessible  
        if (currentRoute !== 'About') {
          navigation.push('About');
        }
        break;
      case 'signout':
        if (isAuthenticated) {
          setShowSignOutModal(true);
        }
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

  const handleSignOutConfirm = () => {
    try {
      logout();
      setShowSignOutModal(false);
      // Explicitly navigate to Hero screen after logout
      navigation.reset({
        index: 0,
        routes: [{ name: 'Hero' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      setShowSignOutModal(false);
      // Still navigate to Hero even if logout fails
      navigation.reset({
        index: 0,
        routes: [{ name: 'Hero' }],
      });
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
          showAuthOptions={isAuthenticated}
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