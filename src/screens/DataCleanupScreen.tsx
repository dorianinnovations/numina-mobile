import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dataAuditService } from '../services/dataAuditService';
import { useAuth } from '../contexts/SimpleAuthContext';
import { NuminaColors } from '../utils/colors';

/**
 * Data Cleanup Screen - Testing & Privacy Management
 * 
 * CRITICAL: This screen helps test and verify data cleanup
 * Use for development, testing, and user privacy management
 */
export const DataCleanupScreen: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [auditData, setAuditData] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

  // Load audit data on screen mount
  useEffect(() => {
    loadAuditData();
  }, []);

  const loadAuditData = async () => {
    try {
      setIsLoading(true);
      const data = await dataAuditService.performDataAudit();
      setAuditData(data);
    } catch (error) {
      console.error('Audit data load error:', error);
      Alert.alert('Error', 'Failed to load audit data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNuclearWipe = () => {
    Alert.alert(
      '☢️ NUCLEAR DATA WIPE',
      'This will permanently delete ALL app data from this device. This action cannot be undone.\n\nAre you sure you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'WIPE ALL DATA',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const result = await dataAuditService.performNuclearDataWipe();
              
              Alert.alert(
                result.success ? 'Success' : 'Partial Success',
                `Cleared: ${result.clearedItems.join(', ')}\n\n${
                  result.errors.length > 0 ? `Errors: ${result.errors.join(', ')}` : ''
                }`,
                [{ text: 'OK', onPress: () => loadAuditData() }]
              );
            } catch (error) {
              Alert.alert('Error', 'Nuclear wipe failed');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (!user?.id) {
      Alert.alert('Error', 'No user ID found');
      return;
    }

    Alert.alert(
      '🗑️ DELETE ACCOUNT',
      'This will permanently delete your account and all associated data from both the device and server. This action cannot be undone.\n\nAre you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE ACCOUNT',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const result = await dataAuditService.deleteUserAccount(user.id);
              
              Alert.alert(
                result.success ? 'Account Deleted' : 'Partial Deletion',
                `Server deletion: ${result.serverDeletion ? 'Success' : 'Failed'}\n` +
                `Local deletion: ${result.localDeletion ? 'Success' : 'Failed'}\n\n` +
                `${result.errors.length > 0 ? `Errors: ${result.errors.join(', ')}` : ''}`,
                [{ text: 'OK', onPress: () => loadAuditData() }]
              );
            } catch (error) {
              Alert.alert('Error', 'Account deletion failed');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleVerifyCleanup = async () => {
    try {
      setIsLoading(true);
      const result = await dataAuditService.verifyDataCleanup(user?.id);
      
      Alert.alert(
        result.isClean ? '✅ Data Clean' : '❌ Data Remaining',
        `${result.remainingData.length > 0 ? `Remaining: ${result.remainingData.join(', ')}\n\n` : ''}` +
        `${result.recommendations.length > 0 ? `Recommendations: ${result.recommendations.join(', ')}` : 'No data found'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacyCheck = async () => {
    try {
      setIsLoading(true);
      const result = await dataAuditService.checkPrivacyCompliance();
      
      Alert.alert(
        result.compliant ? '🔒 Privacy Compliant' : '⚠️ Privacy Issues',
        `${result.issues.length > 0 ? `Issues: ${result.issues.join(', ')}\n\n` : ''}` +
        `${result.recommendations.length > 0 ? `Recommendations: ${result.recommendations.join(', ')}` : 'No issues found'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Privacy check failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={NuminaColors.primary} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Data Cleanup & Privacy</Text>
        
        {/* Current User */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current User</Text>
          <Text style={styles.infoText}>
            {user ? `${user.email} (${user.id})` : 'No user logged in'}
          </Text>
        </View>

        {/* Audit Summary */}
        {auditData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Storage Summary</Text>
            <Text style={styles.infoText}>Total Items: {auditData.totalItems}</Text>
            <Text style={styles.infoText}>Estimated Size: {auditData.estimatedSize}</Text>
            <Text style={styles.infoText}>User IDs Found: {auditData.userIds.length}</Text>
            <Text style={styles.infoText}>
              AsyncStorage: {auditData.asyncStorage.length} items
            </Text>
            <Text style={styles.infoText}>
              SecureStore: {auditData.secureStore.length} items
            </Text>
            <Text style={styles.infoText}>
              Conversations: {auditData.conversations.length} items
            </Text>
            <Text style={styles.infoText}>
              Emotions: {auditData.emotions.length} items
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.button} onPress={loadAuditData}>
            <Text style={styles.buttonText}>🔄 Refresh Audit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleVerifyCleanup}>
            <Text style={styles.buttonText}>✅ Verify Cleanup</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handlePrivacyCheck}>
            <Text style={styles.buttonText}>🔒 Privacy Check</Text>
          </TouchableOpacity>
        </View>

        {/* Details Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <Text style={styles.sectionTitle}>Show Details</Text>
            <Switch
              value={showDetails}
              onValueChange={setShowDetails}
              trackColor={{ false: '#ccc', true: NuminaColors.primary }}
            />
          </View>

          {showDetails && auditData && (
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>User IDs:</Text>
              {auditData.userIds.map((id: string, index: number) => (
                <Text key={index} style={styles.detailsText}>• {id}</Text>
              ))}

              <Text style={styles.detailsTitle}>AsyncStorage Keys:</Text>
              {auditData.asyncStorage.slice(0, 10).map((item: any, index: number) => (
                <Text key={index} style={styles.detailsText}>• {item.key}</Text>
              ))}
              {auditData.asyncStorage.length > 10 && (
                <Text style={styles.detailsText}>... and {auditData.asyncStorage.length - 10} more</Text>
              )}

              <Text style={styles.detailsTitle}>SecureStore Keys:</Text>
              {auditData.secureStore.map((key: string, index: number) => (
                <Text key={index} style={styles.detailsText}>• {key}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
            <Switch
              value={showDangerZone}
              onValueChange={setShowDangerZone}
              trackColor={{ false: '#ccc', true: '#ff4444' }}
            />
          </View>

          {showDangerZone && (
            <View style={styles.dangerZone}>
              <Text style={styles.dangerText}>
                These actions are permanent and cannot be undone!
              </Text>

              <TouchableOpacity style={styles.dangerButton} onPress={handleNuclearWipe}>
                <Text style={styles.dangerButtonText}>☢️ NUCLEAR DATA WIPE</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
                <Text style={styles.dangerButtonText}>🗑️ DELETE ACCOUNT</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  button: {
    backgroundColor: NuminaColors.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    color: '#333',
  },
  detailsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff4444',
  },
  dangerZone: {
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  dangerText: {
    fontSize: 14,
    color: '#cc0000',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DataCleanupScreen;