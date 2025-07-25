import React from 'react';
import { AppNavigator } from './navigation/AppNavigator';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/SimpleAuthContext';
import { FontProvider } from './components/ui/FontProvider';

export const MainApp: React.FC = () => {
  return (
    <FontProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </FontProvider>
  );
};

export default MainApp;