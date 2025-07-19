import { StyleSheet } from 'react-native';
import { ThemeHelpers } from './themeHelpers';



export const createCommonStyles = (isDarkMode: boolean) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ThemeHelpers.getOverlayBackground(isDarkMode),
    },
    
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: ThemeHelpers.getOverlayBackground(isDarkMode),
    },
    
    paddedContainer: {
      flex: 1,
      padding: 20,
      backgroundColor: ThemeHelpers.getOverlayBackground(isDarkMode),
    },

    card: {
      backgroundColor: ThemeHelpers.getCardBackground(isDarkMode),
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },

    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: ThemeHelpers.getTextColor(isDarkMode),
      marginBottom: 16,
    },

    subtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: ThemeHelpers.getTextColor(isDarkMode),
      marginBottom: 12,
    },

    bodyText: {
      fontSize: 16,
      color: ThemeHelpers.getTextColor(isDarkMode),
      lineHeight: 24,
    },

    secondaryText: {
      fontSize: 14,
      color: ThemeHelpers.getSecondaryTextColor(isDarkMode),
    },

    button: {
      backgroundColor: ThemeHelpers.getButtonBackground(isDarkMode),
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },

    primaryButton: {
      backgroundColor: '#4A90E2',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },

    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },

    input: {
      backgroundColor: ThemeHelpers.getInputBackground(isDarkMode),
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      color: ThemeHelpers.getTextColor(isDarkMode),
      borderWidth: 1,
      borderColor: ThemeHelpers.getBorderColor(isDarkMode),
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    spaceBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    center: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    marginBottom16: {
      marginBottom: 16,
    },

    marginBottom12: {
      marginBottom: 12,
    },

    marginBottom8: {
      marginBottom: 8,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    modalContent: {
      backgroundColor: ThemeHelpers.getModalBackground(isDarkMode),
      borderRadius: 12,
      padding: 20,
      marginHorizontal: 20,
      maxHeight: '80%',
    },

    shadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },

    strongShadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
  });
};

export const lightStyles = createCommonStyles(false);
export const darkStyles = createCommonStyles(true);