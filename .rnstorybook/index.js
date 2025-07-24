import { getStorybookUI } from '@storybook/react-native';

import './storybook.requires';

const StorybookUIRoot = getStorybookUI({
  // Enable asyncStorage for Storybook state persistence
  asyncStorage: require('@react-native-async-storage/async-storage').default || null,
  // Enable on-device story switching
  enableWebsockets: true,
  // Configure host for dev server
  host: 'localhost',
  port: 7007,
  // Show navigator panel by default
  shouldPersistSelection: true,
  // Show Storybook immediately
  shouldDisableKeyboardAvoidingView: false,
  // Initialize with stories open
  initialSelection: null,
});

export default StorybookUIRoot;