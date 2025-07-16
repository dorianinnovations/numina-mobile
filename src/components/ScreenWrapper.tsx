import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Header } from './Header';
import { useAuth } from "../contexts/SimpleAuthContext";
import { RootStackParamList } from '../navigation/AppNavigator';

interface ScreenWrapperProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  showConversationsButton?: boolean;
  onConversationSelect?: (conversation: any) => void;
  currentConversationId?: string;
  title?: string;
  subtitle?: string;
  onBackPress?: () => void;
  headerProps?: {
    isVisible?: boolean;
    isStreaming?: boolean;
  };
}

type ScreenWrapperNavigationProp = StackNavigationProp<RootStackParamList>;

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  showHeader = false,
  showBackButton = false,
  showMenuButton = false,
  showConversationsButton = false,
  onConversationSelect,
  currentConversationId,
  title,
  subtitle,
  onBackPress,
  headerProps,
}) => {
  const navigation = useNavigation<ScreenWrapperNavigationProp>();
  const { logout } = useAuth();

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
        if (currentRoute !== 'Analytics') {
          navigation.push('Analytics');
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
                  // The AppNavigator will automatically redirect to Hero screen
                  // when isAuthenticated becomes false
                } catch (error) {
                  console.error('Logout error:', error);
                }
              }
            }
          ]
        );
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

  return (
    <View style={styles.container}>
      {showHeader && (
        <Header
          title={title}
          subtitle={subtitle}
          showBackButton={showBackButton}
          showMenuButton={showMenuButton}
          showConversationsButton={showConversationsButton}
          onBackPress={handleBackPress}
          onMenuPress={handleMenuAction}
          onConversationSelect={onConversationSelect}
          currentConversationId={currentConversationId}
          {...headerProps}
        />
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenWrapper;