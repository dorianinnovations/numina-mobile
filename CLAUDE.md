# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Numina Mobile** is a React Native mobile application for AI-powered personal growth and emotional wellness. The app features adaptive AI personality, real-time emotional analytics, cloud-based social matching, and streaming chat functionality with 25+ AI tools - all optimized for mobile experiences.

## Development Commands

### Core Development
```bash
# Mobile Development
npm start                         # Start Expo development server
npx expo start                    # Direct Expo start
npx expo start --tunnel           # Tunnel for device testing

# Platform-specific
npm run android                   # Android development
npm run ios                       # iOS development

# Testing
npm test                          # Run Jest tests
npm run test:watch                # Run tests in watch mode

# Building
npm run build                     # Build for production
eas build --profile development   # Development build
eas build --profile production    # Production build
```

## Architecture Overview

### Technology Stack
- **React Native** with **Expo SDK 53**
- **TypeScript** with strict typing enabled
- **React Navigation v7** for navigation
- **Context API** for state management
- **Socket.io** for real-time features
- **Expo SecureStore** for secure token storage

### Key Services
- **CloudAuth** (`src/services/cloudAuth.ts`): Cloud-only authentication service
- **API Service** (`src/services/api.ts`): Main API communication with authentication
- **Chat Service** (`src/services/chatService.ts`): Chat functionality with streaming
- **WebSocket Service** (`src/services/websocketService.ts`): Real-time communication
- **File Upload Service** (`src/services/fileUploadService.ts`): File handling and upload

### Component Architecture
```
src/
├── screens/               # Navigation endpoints
│   ├── HeroLandingScreen.tsx     # App entry point
│   ├── SignInScreen.tsx          # Authentication
│   ├── SignUpScreen.tsx          # User registration
│   ├── ChatScreen.tsx            # Main chat interface
│   ├── TutorialScreen.tsx        # Feature tutorial
│   ├── AnalyticsScreen.tsx       # Emotional analytics
│   ├── CloudScreen.tsx           # Social features
│   ├── WalletScreen.tsx          # Credits/subscription
│   └── SettingsScreen.tsx        # App settings
├── components/           # Reusable UI components
│   ├── chat/             # Chat-specific components
│   ├── Header.tsx        # Navigation header
│   ├── PageBackground.tsx # Background component
│   └── ScreenWrapper.tsx # Screen layout wrapper
├── contexts/             # React Context providers
│   ├── SimpleAuthContext.tsx     # Authentication state
│   └── ThemeContext.tsx          # Theme management
├── hooks/                # Custom React hooks
├── services/             # API and business logic
├── utils/                # Utility functions
└── navigation/           # Navigation configuration
    └── AppNavigator.tsx  # Main navigation stack
```

## API Integration

### Server Configuration
- **Production API**: `https://server-a7od.onrender.com`
- **Development API**: `http://localhost:5001`
- **WebSocket**: Real-time features via Socket.io

### Authentication Flow
```
Hero Landing → Tutorial (optional) → SignUp/SignIn → Chat
```

### Key API Endpoints
- **Authentication**: `POST /login`, `POST /signup`
- **Chat**: `POST /ai/adaptive-chat` - Main chat with tool execution
- **User Profile**: `GET /user/profile`
- **File Upload**: `POST /mobile/upload`
- **Health Check**: `GET /health`

## Development Patterns

### Navigation Pattern
```typescript
// AppNavigator uses createMenuHandler for consistent navigation
const createMenuHandler = (navigation: any) => (key: string) => {
  switch (key) {
    case 'chat': navigation.navigate('Chat'); break;
    case 'analytics': navigation.navigate('Analytics'); break;
    case 'signout': /* CloudAuth handles logout */; break;
  }
};
```

### Authentication Pattern
```typescript
// CloudAuth service usage
const cloudAuth = CloudAuth.getInstance();
const isAuthenticated = cloudAuth.isAuthenticated();
const token = cloudAuth.getToken();
```

### Chat Message Flow
1. User enters message in ChatInput
2. Message sent through chatService with streaming
3. AI response streamed back with real-time updates
4. Tool execution with progress indicators
5. Message stored locally and synced to server

### File Upload Flow
1. User selects file via AttachmentPicker
2. File preview with AttachmentPreview
3. Upload through fileUploadService with progress
4. Server processing and integration into chat

## Key Features

### AI Chat System
- **Adaptive Chat**: Uses `/ai/adaptive-chat` endpoint for intelligent responses
- **Tool Integration**: 25+ AI tools (web search, weather, calculator, etc.)
- **Streaming Responses**: Real-time AI response streaming
- **File Support**: Image, text, and PDF file uploads

### Emotional Analytics
- **Real-time Tracking**: Emotion detection and analysis
- **Historical Data**: Emotion trends and insights
- **Mood Patterns**: Behavioral pattern recognition

### Social Features
- **Cloud Matching**: AI-powered social connections
- **Event Discovery**: Local events based on interests
- **Community Features**: Social interaction capabilities

### Subscription System
- **Credit System**: Usage-based credit management
- **Stripe Integration**: Payment processing
- **Wallet Features**: Credit purchase and tracking

## Configuration Files

### Critical Configuration
- **app.json**: Expo app configuration
- **eas.json**: EAS Build profiles
- **tsconfig.json**: TypeScript configuration
- **babel.config.js**: Babel configuration with Reanimated plugin

### Environment Variables
```bash
EXPO_PUBLIC_API_KEY=          # API authentication key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Stripe payment key
```

## Common Development Tasks

### Adding New Screen
1. Create screen component in `src/screens/`
2. Add to RootStackParamList type in AppNavigator
3. Add Stack.Screen in AppNavigator with proper navigation props
4. Use ScreenWrapper for consistent layout

### Adding New API Endpoint
1. Add method to `src/services/api.ts`
2. Handle authentication with `cloudAuth.getAuthHeaders()`
3. Implement error handling and retry logic
4. Add TypeScript interfaces for requests/responses

### Updating Chat Features
1. Extend Message interface in types
2. Update MessageBubble component for display
3. Modify ChatInput for user input handling
4. Update conversationStorage for persistence

## Testing

### Running Tests
```bash
npm test                          # Run all tests
npm test -- --watch               # Watch mode
npm test -- ChatScreen.test.tsx   # Specific test file
```

### Testing on Devices
```bash
npx expo start --tunnel           # Best for device testing
eas build --profile development   # Development builds
```

## Build and Deployment

### Development Builds
```bash
eas build --profile development    # Development build
eas build --profile preview        # Preview build for testing
```

### Production Deployment
```bash
eas build --profile production     # Production build
eas submit -p ios                  # Submit to App Store
eas submit -p android              # Submit to Google Play
```

## Security Considerations

### Authentication Security
- JWT tokens stored in Expo SecureStore
- Cloud-only authentication - no local storage of credentials
- Proper authentication flow enforcement
- SSL pinning for production builds

### Data Protection
- Input validation and sanitization
- Secure file upload handling
- No hardcoded secrets in source code
- Proper error handling without data exposure

## Performance Optimization

### Animation Performance
- React Native Reanimated for 60fps animations
- Native driver usage where possible
- Proper animation cleanup in useEffect

### Memory Management
- React.memo for expensive components
- Proper cleanup in useEffect hooks
- FlatList for large data sets

### Network Optimization
- WebSocket for real-time features
- Image compression before upload
- Request caching and retry logic
- Graceful network failure handling

## Current Status

### Core Functionality
- ✅ Authentication system fully functional
- ✅ Chat system with streaming and tool execution
- ✅ Navigation and routing properly configured
- ✅ File upload and processing working
- ✅ Real-time features via WebSocket

### In Development
- 🔄 Advanced analytics features
- 🔄 Enhanced social matching algorithms
- 🔄 Subscription system improvements
- 🔄 Performance optimizations

This mobile app serves as the primary user interface for the Numina AI platform, providing a seamless and intuitive experience for personal growth and AI-powered assistance.