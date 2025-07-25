import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Feather, 
  MaterialCommunityIcons, 
  Ionicons,
  FontAwesome5 
} from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { PageBackground } from '../components/ui/PageBackground';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { BaseWalletCard } from '../components/cards/WalletCard';
import { EnhancedSpinner } from '../components/loaders/EnhancedSpinner';
import { 
  smartDataRetention, 
  RetentionPolicy, 
  DataAgeReport 
} from '../services/smartDataRetention';

const { width: screenWidth } = Dimensions.get('window');

interface DataManagementScreenProps {
  onNavigateBack: () => void;
}

export const DataManagementScreen: React.FC<DataManagementScreenProps> = ({
  onNavigateBack
}) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [dataReport, setDataReport] = useState<DataAgeReport | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<string>('balanced');
  const [applying, setApplying] = useState(false);
  const [archiving, setArchiving] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Progress animations
  const storageProgressAnim = useRef(new Animated.Value(0)).current;
  const conversationProgressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDataReport();
    
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadDataReport = async () => {
    try {
      setLoading(true);
      const report = await smartDataRetention.analyzeDataAge();
      setDataReport(report);
      
      // Animate progress bars
      const storagePercent = Math.min(report.storageUsedMB / 100, 1);
      const conversationPercent = Math.min(report.totalConversations / 50, 1);
      
      Animated.parallel([
        Animated.timing(storageProgressAnim, {
          toValue: storagePercent,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(conversationProgressAnim, {
          toValue: conversationPercent,
          duration: 1200,
          useNativeDriver: false,
        }),
      ]).start();
    } catch (error) {
      console.error('Failed to load data report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPolicy = async (dryRun: boolean = false) => {
    try {
      setApplying(true);
      
      const result = await smartDataRetention.applyRetentionPolicy(dryRun);
      
      if (dryRun) {
        Alert.alert(
          'Retention Policy Preview',
          `This action will remove:\n\n` +
          `• ${result.emotionsRemoved} emotion records\n` +
          `• ${result.conversationsRemoved} conversations\n` +
          `• ${result.messagesRemoved} messages\n\n` +
          `Freeing approximately ${result.storageFreedMB} MB of storage.\n\n` +
          `Do you want to proceed?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Apply', 
              style: 'destructive',
              onPress: () => handleApplyPolicy(false)
            }
          ]
        );
      } else {
        Alert.alert(
          'Success',
          `Retention policy applied successfully!\n\n` +
          `Removed ${result.emotionsRemoved} emotions and ${result.conversationsRemoved} conversations.\n` +
          `Freed ${result.storageFreedMB} MB of storage.`
        );
        loadDataReport();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to apply retention policy');
    } finally {
      setApplying(false);
    }
  };

  const handleArchiveData = async () => {
    try {
      setArchiving(true);
      
      const result = await smartDataRetention.archiveOldData();
      
      Alert.alert(
        'Archive Complete',
        `Successfully archived:\n\n` +
        `• ${result.emotionsArchived} emotion records\n` +
        `• ${result.conversationsArchived} conversations\n\n` +
        `Compression ratio: ${(result.compressionRatio * 100).toFixed(0)}%`
      );
      
      loadDataReport();
    } catch (error) {
      Alert.alert('Error', 'Failed to archive data');
    } finally {
      setArchiving(false);
    }
  };

  const presetPolicies = smartDataRetention.getPresetPolicies();

  const renderPolicyCard = (policyKey: string, policy: RetentionPolicy) => {
    const isSelected = selectedPolicy === policyKey;
    const policyInfo = {
      minimal: { icon: 'cloud-outline', color: '#3B82F6', description: 'Keep only recent essential data' },
      balanced: { icon: 'scale-balance', color: '#22C55E', description: 'Balance between history and performance' },
      comprehensive: { icon: 'database', color: '#8B5CF6', description: 'Keep extensive historical data' },
      performance: { icon: 'rocket-launch', color: '#F59E0B', description: 'Optimized for best performance' },
    };

    const info = policyInfo[policyKey as keyof typeof policyInfo];

    return (
      <TouchableOpacity
        key={policyKey}
        onPress={() => setSelectedPolicy(policyKey)}
        activeOpacity={0.8}
      >
        <BaseWalletCard style={styles.policyCard}>
          
          <View style={styles.policyHeader}>
            <View style={[styles.policyIconContainer, { backgroundColor: `${info.color}20` }]}>
              <MaterialCommunityIcons 
                name={info.icon as any} 
                size={24} 
                color={info.color}
              />
            </View>
            
            {isSelected && (
              <View style={styles.selectedBadge}>
                <Feather name="check" size={16} color="#fff" />
              </View>
            )}
          </View>
          
          <Text style={[styles.policyTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
            {policyKey.charAt(0).toUpperCase() + policyKey.slice(1)}
          </Text>
          
          <Text style={[styles.policyDescription, { color: isDarkMode ? '#999' : '#666' }]}>
            {info.description}
          </Text>
          
          <View style={styles.policyDetails}>
            <View style={styles.policyDetailRow}>
              <Text style={styles.policyDetailLabel}>Conversations:</Text>
              <Text style={styles.policyDetailValue}>
                {policy.conversationData.maxAge} days / {policy.conversationData.maxCount} items
              </Text>
            </View>
          </View>
        </BaseWalletCard>
      </TouchableOpacity>
    );
  };

  const renderStorageOverview = () => {
    if (!dataReport) return null;

    const storagePercent = Math.min((dataReport.storageUsedMB / 100) * 100, 100);
    const conversationPercent = Math.min((dataReport.totalConversations / 50) * 100, 100);

    return (
      <Animated.View style={[
        styles.storageOverviewContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          Storage Overview
        </Text>
        
        <BaseWalletCard style={styles.storageCard}>
          <View style={styles.storageItem}>
            <View style={styles.storageHeader}>
              <Text style={[styles.storageLabel, { color: isDarkMode ? '#ccc' : '#333' }]}>
                Total Storage
              </Text>
              <Text style={[styles.storageValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                {dataReport.storageUsedMB.toFixed(1)} MB
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  {
                    width: storageProgressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    }),
                    backgroundColor: storagePercent > 80 ? '#EF4444' : '#3B82F6'
                  }
                ]}
              />
            </View>
          </View>
          
          
          <View style={styles.storageItem}>
            <View style={styles.storageHeader}>
              <Text style={[styles.storageLabel, { color: isDarkMode ? '#ccc' : '#333' }]}>
                Conversations ({dataReport.totalConversations})
              </Text>
              <Text style={[styles.storageValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                {conversationPercent.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  {
                    width: conversationProgressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    }),
                    backgroundColor: '#8B5CF6'
                  }
                ]}
              />
            </View>
          </View>
        </BaseWalletCard>
        
        {dataReport.recommendedActions.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={[styles.recommendationsTitle, { color: isDarkMode ? '#F59E0B' : '#F97316' }]}>
              <Feather name="alert-circle" size={16} /> Recommendations
            </Text>
            {dataReport.recommendedActions.map((action, index) => (
              <Text key={index} style={[styles.recommendationText, { color: isDarkMode ? '#ccc' : '#333' }]}>
                • {action}
              </Text>
            ))}
          </View>
        )}
      </Animated.View>
    );
  };

  const renderActionButtons = () => (
    <Animated.View style={[
      styles.actionButtonsContainer,
      {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }
    ]}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => handleApplyPolicy(true)}
        disabled={applying || archiving}
      >
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6']}
          style={styles.actionButtonGradient}
        >
          {applying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="broom" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Apply Retention Policy</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleArchiveData}
        disabled={applying || archiving}
      >
        <LinearGradient
          colors={['#22C55E', '#10B981']}
          style={styles.actionButtonGradient}
        >
          {archiving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="archive" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Archive Old Data</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <ScreenWrapper onBackPress={onNavigateBack}>
      <PageBackground><></></PageBackground>
      
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
            Data Management
          </Text>
          <View style={{ width: 40 }} />
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <EnhancedSpinner type="holographic" color="#8B5CF6" size={60} />
            <Text style={[styles.loadingText, { color: isDarkMode ? '#999' : '#666' }]}>
              Analyzing your data...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderStorageOverview()}
            
            <Animated.View style={[
              styles.policiesSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                Retention Policies
              </Text>
              
              {Object.entries(presetPolicies).map(([key, policy]) => 
                renderPolicyCard(key, policy)
              )}
            </Animated.View>
            
            {renderActionButtons()}
          </ScrollView>
        )}
      </SafeAreaView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  storageOverviewContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  storageCard: {
    padding: 20,
    gap: 20,
  },
  storageItem: {
    gap: 8,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  storageValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  recommendationsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  recommendationsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  policiesSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  policyCard: {
    padding: 20,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  policyCardSelected: {
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  policyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  policyDescription: {
    fontSize: 13,
    marginBottom: 12,
  },
  policyDetails: {
    gap: 6,
  },
  policyDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  policyDetailLabel: {
    fontSize: 12,
    color: '#999',
  },
  policyDetailValue: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});