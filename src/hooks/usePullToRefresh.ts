import { useRefresh } from '../contexts/RefreshContext';
import { useTheme } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

export const usePullToRefresh = (onRefresh?: () => Promise<void>) => {
  const { isRefreshing, triggerRefresh } = useRefresh();
  const { isDarkMode } = useTheme();

  const handleRefresh = async () => {
    // Premium haptic feedback on refresh start
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Trigger the header animation
    await triggerRefresh();
    
    // Execute custom refresh logic if provided
    if (onRefresh) {
      await onRefresh();
    }
    
    // Success haptic feedback
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 300);
  };

      // Refresh control with premium styling
  const refreshControlProps = {
    refreshing: isRefreshing,
    onRefresh: handleRefresh,
    tintColor: '#6ec5ff', // Consistent light blue
    colors: ['#6ec5ff', '#87ceeb'], // Multiple colors for Android
    progressBackgroundColor: isDarkMode ? '#202020' : '#f8fafc',
    titleColor: isDarkMode ? '#6ec5ff' : '#4a90e2',
    size: 1,
  };

  return {
    refreshControl: refreshControlProps,
    isRefreshing,
    triggerRefresh: handleRefresh,
  };
};