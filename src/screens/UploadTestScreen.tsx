import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import UploadTestComponent from '../components/dev/UploadTestComponent';
import ScreenWrapper from '../components/ui/ScreenWrapper';

const UploadTestScreen: React.FC = () => {
  return (
    <ScreenWrapper>
      <SafeAreaView style={styles.container}>
        <UploadTestComponent />
      </SafeAreaView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default UploadTestScreen;