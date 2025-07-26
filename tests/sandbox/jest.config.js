module.exports = {
  preset: 'react-native',
  roots: ['<rootDir>/tests/sandbox'],
  testMatch: [
    '<rootDir>/tests/sandbox/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/tests/sandbox/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/tests/sandbox/setupTests.js',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons|@expo/vector-icons|expo-haptics|lottie-react-native)/)',
  ],
  collectCoverageFrom: [
    'src/components/sandbox/**/*.{ts,tsx}',
    'src/services/sandboxDataService.ts',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: '<rootDir>/coverage/sandbox',
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/tests/__mocks__/fileMock.js',
  },
  verbose: true,
  testTimeout: 10000,
};