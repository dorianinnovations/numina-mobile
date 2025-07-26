import 'react-native-gesture-handler/jestSetup';

// Mock react-native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(),
  notificationAsync: jest.fn().mockResolvedValue(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('lottie-react-native', () => {
  const React = require('react');
  return React.forwardRef((props, ref) => null);
});

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

// Mock Dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({ width: 400, height: 600 })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(),
}));

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('mock-token'),
  setItemAsync: jest.fn().mockResolvedValue(),
  deleteItemAsync: jest.fn().mockResolvedValue(),
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock timers for better test control
jest.useFakeTimers({
  doNotFake: ['nextTick', 'setImmediate'],
});

// Silence warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || 
     args[0].includes('React Native:') ||
     args[0].includes('Animated:'))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Global test utilities
global.testUtils = {
  // Helper to wait for animations
  waitForAnimations: async (duration = 100) => {
    await new Promise(resolve => setTimeout(resolve, duration));
  },
  
  // Helper to advance all timers
  flushAllTimers: () => {
    jest.runAllTimers();
  },
  
  // Helper to create mock animated values
  createMockAnimatedValue: (initialValue = 0) => ({
    setValue: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    interpolate: jest.fn(() => ({ setValue: jest.fn() })),
  }),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});