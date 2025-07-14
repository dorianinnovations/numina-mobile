import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Header } from './Header';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';

interface ScreenWrapperProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  title?: string;
  subtitle?: string;
}

type ScreenWrapperNavigationProp = StackNavigationProp<RootStackParamList>;

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  showHeader = false,
  showBackButton = false,
  showMenuButton = false,
  title,
  subtitle,
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
      case 'stratosphere':
        if (currentRoute !== 'Stratosphere') {
          navigation.push('Stratosphere');
        }
        break;
      case 'collective':
        if (currentRoute !== 'Collective') {
          navigation.push('Collective');
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
    if (navigation.canGoBack()) {
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
          onBackPress={handleBackPress}
          onMenuPress={handleMenuAction}
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