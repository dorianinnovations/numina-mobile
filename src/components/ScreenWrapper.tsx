import React from 'react';
import { View, StyleSheet } from 'react-native';
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
    switch (key) {
      case 'chat':
        navigation.navigate('Chat');
        break;
      case 'analytics':
        navigation.navigate('Analytics');
        break;
      case 'cloud':
        navigation.navigate('Cloud');
        break;
      case 'stratosphere':
        navigation.navigate('Stratosphere');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
      case 'about':
        navigation.navigate('About');
        break;
      case 'signout':
        logout();
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