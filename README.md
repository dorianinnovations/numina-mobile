# Numina Mobile

A React Native Expo application for AI-powered personal growth and emotional wellness. Numina combines adaptive AI personality, real-time emotional analytics, cloud-based social matching, and comprehensive offline functionality to create a sophisticated mental wellness platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# For device testing with tunnel
npx expo start --tunnel

# Platform-specific development
npm run android    # Android development
npm run ios        # iOS development
```

## 📁 Project Structure

```
numina-mobile/
├── src/
│   ├── screens/                  # App screens (navigation endpoints)
│   │   ├── WelcomeScreen.tsx           # Initial welcome screen
│   │   ├── SignInScreen.tsx            # Authentication screen
│   │   ├── SignUpScreen.tsx            # User registration
│   │   ├── ChatScreen.tsx              # Main chat interface
│   │   ├── AnalyticsScreen.tsx         # Emotional analytics dashboard
│   │   ├── CloudScreen.tsx             # Social features & event matching
│   │   ├── WalletScreen.tsx            # Credits & subscription management
│   │   ├── SettingsScreen.tsx          # App settings & preferences
│   │   ├── ProfileScreen.tsx           # User profile management
│   │   ├── TutorialScreen.tsx          # Onboarding tutorial
│   │   ├── AboutScreen.tsx             # About & help
│   │   ├── SentimentScreen.tsx         # Sentiment analysis
│   │   ├── HeroLandingScreen.tsx       # Landing page
│   │   └── NuminaSensesV2.tsx          # Enhanced senses interface
│   ├── services/                 # API and business logic
│   │   ├── api.ts                      # Main API service
│   │   ├── authManager.ts              # Authentication management
│   │   ├── chatService.ts              # Chat functionality
│   │   ├── websocketService.ts         # Real-time WebSocket connection
│   │   ├── offlineQueue.ts             # Offline sync queue
│   │   ├── emotionalAnalyticsAPI.ts    # Emotional analytics service
│   │   ├── aiPersonalityService.ts     # AI personality adaptation
│   │   ├── cloudMatchingService.ts     # Social event matching
│   │   ├── fileUploadService.ts        # File upload handling
│   │   ├── batchApiService.ts          # Batch API requests
│   │   ├── syncService.ts              # Data synchronization
│   │   ├── appConfigService.ts         # App configuration
│   │   ├── secureStorage.ts            # Secure data storage
│   │   ├── settingsService.ts          # Settings management
│   │   ├── toolExecutionService.ts     # AI tool execution
│   │   ├── conversationStorage.ts      # Chat history storage
│   │   ├── errorMonitoring.ts          # Error tracking
│   │   ├── pushNotificationService.ts  # Push notifications
│   │   └── spotifyService.ts           # Music integration
│   ├── contexts/                 # React Context providers
│   │   ├── SimpleAuthContext.tsx       # Authentication state management
│   │   └── ThemeContext.tsx            # Theme & styling management
│   ├── components/               # Reusable UI components
│   │   ├── chat/                       # Chat-specific components
│   │   │   ├── ChatInput.tsx           # Message input with attachments
│   │   │   ├── MessageBubble.tsx       # Chat message display
│   │   │   ├── AttachmentPicker.tsx    # File attachment picker
│   │   │   ├── AttachmentPreview.tsx   # File preview component
│   │   │   └── index.ts                # Chat components export
│   │   ├── AnimatedToolText.tsx        # AI tool execution animations
│   │   ├── StreamingMarkdown.tsx       # Real-time markdown rendering
│   │   ├── Header.tsx                  # Navigation header
│   │   ├── HeaderMenu.tsx              # Header menu dropdown
│   │   ├── ThemeSelector.tsx           # Theme selection component
│   │   ├── SubscriptionModal.tsx       # Subscription management
│   │   ├── LLMAnalyticsSection.tsx     # Analytics display
│   │   ├── ConversationHistory.tsx     # Chat history component
│   │   ├── CascadingRecommendations.tsx # AI recommendations
│   │   ├── ReasoningTreeVisualization.tsx # AI reasoning display
│   │   ├── SearchThoughtIndicator.tsx  # Search status indicator
│   │   ├── ToolExecutionModal.tsx      # Tool execution UI
│   │   ├── ChatErrorBoundary.tsx       # Error boundary for chat
│   │   ├── OptimizedImage.tsx          # Optimized image component
│   │   ├── ScreenWrapper.tsx           # Screen layout wrapper
│   │   ├── PageBackground.tsx          # Background component
│   │   ├── FontProvider.tsx            # Font management
│   │   └── ShimmerText.tsx             # Loading shimmer effect
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAIPersonality.ts         # AI personality adaptation
│   │   ├── useEmotionalAnalytics.ts    # Emotion tracking hooks
│   │   ├── useCloudMatching.ts         # Social matching hooks
│   │   ├── useLLMAnalytics.ts          # LLM analytics hooks
│   │   ├── useNuminaPersonality.ts     # Numina personality hooks
│   │   ├── useRealTimeEvents.ts        # Real-time event hooks
│   │   └── useSearchIndicator.ts       # Search indicator hooks
│   ├── navigation/               # React Navigation setup
│   │   └── AppNavigator.tsx            # Main stack navigator
│   ├── config/                   # Configuration
│   │   └── environment.ts              # Environment configuration
│   ├── types/                    # TypeScript type definitions
│   │   ├── message.ts                  # Message type definitions
│   │   └── theme.ts                    # Theme type definitions
│   ├── utils/                    # Utility functions
│   │   ├── animations.ts               # Animation utilities
│   │   ├── colors.ts                   # Color definitions
│   │   ├── fonts.ts                    # Font configurations
│   │   ├── styling.ts                  # Styling utilities
│   │   ├── themes.ts                   # Theme definitions
│   │   ├── neumorphic.ts               # Neumorphic design utilities
│   │   ├── imagePreloader.ts           # Image preloading
│   │   ├── globalImagePreloader.ts     # Global image management
│   │   └── searchDataParser.ts         # Search data parsing
│   └── assets/                   # Static assets
│       ├── fonts/                      # Custom fonts
│       └── images/                     # App images & icons
│           ├── NUMINALOGO.png
│           ├── happynumina.png
│           ├── numinasmile.png
│           └── [other numina assets]
├── App.tsx                       # Main application entry point
├── index.ts                      # Expo entry point
├── app.json                      # Expo app configuration
├── eas.json                      # EAS Build configuration
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── babel.config.js               # Babel configuration
├── tests/                        # Test suites
│   └── e2e/                      # End-to-end tests
└── android/                      # Android-specific configuration
    └── app/src/main/res/xml/
        └── network_security_config.xml
```

## ✨ Core Features

### 🤖 AI & Personalization
- **Adaptive AI Personality**: AI communication style adapts to user's emotional state
- **Real-time Chat**: Streaming AI responses with markdown support
- **AI Tool Integration**: Access to 25+ specialized AI tools through chat
- **Contextual Suggestions**: Personalized prompts based on mood and context
- **Memory System**: Conversation history with intelligent context retention

### 📱 Mobile-First Experience
- **File Upload**: Support for images, text files, and PDFs with preview
- **Offline Functionality**: Full offline capability with intelligent sync queue
- **Push Notifications**: Smart notification system with user preferences
- **Haptic Feedback**: Enhanced user experience with tactile feedback
- **Biometric Auth**: Secure authentication with fingerprint/face recognition

### 🧠 Emotional Intelligence
- **Emotional Analytics**: Comprehensive mood tracking and pattern analysis
- **Sentiment Analysis**: Real-time emotional state detection
- **Growth Metrics**: Personal development progress tracking
- **Mood Visualization**: Interactive charts and insights
- **Pattern Recognition**: AI-driven emotional pattern identification

### ☁️ Social & Cloud Features
- **Event Matching**: AI-powered local event recommendations based on mood
- **Social Connections**: Emotional compatibility-based social matching
- **Cloud Sync**: Real-time data synchronization across devices
- **Community Features**: Wellness-focused social interactions
- **Privacy Controls**: Granular privacy settings for social features

### 💳 Subscription & Credits
- **Credit System**: Usage-based credit tracking and management
- **Subscription Tiers**: Multiple subscription levels with feature access
- **Stripe Integration**: Secure payment processing
- **Usage Analytics**: Detailed usage tracking and insights

### 🔒 Security & Privacy
- **Secure Storage**: Encrypted local data storage with Expo SecureStore
- **SSL Pinning**: Enhanced network security with certificate pinning
- **Token Management**: Secure JWT token handling and refresh
- **Data Encryption**: End-to-end encryption for sensitive data
- **Privacy First**: User data privacy and control prioritized

## 🛠️ Technology Stack

### Core Framework
- **React Native** (Latest) - Cross-platform mobile development
- **Expo SDK 53** - Development platform and build tools
- **TypeScript** - Type-safe development with strict typing
- **React Navigation v7** - Navigation framework with stack navigation

### State Management & Storage
- **Context API** - Centralized state management
- **AsyncStorage** - Local data persistence
- **Expo SecureStore** - Secure sensitive data storage
- **Offline Queue** - Custom offline sync system

### UI & Animations
- **React Native Reanimated v3** - High-performance animations
- **React Native Gesture Handler** - Advanced touch handling
- **Expo Linear Gradient** - Gradient effects and styling
- **React Native Markdown Display** - Rich text rendering

### Communication & Real-time
- **Socket.io Client** - Real-time WebSocket communication
- **Axios** - HTTP client for API requests
- **Batch API Service** - Mobile-optimized batch request system
- **WebSocket Service** - Real-time event handling

### Authentication & Security
- **Expo Auth Session** - OAuth authentication support
- **Expo Local Authentication** - Biometric authentication
- **Expo Crypto** - Cryptographic operations
- **JWT Token Management** - Secure token handling

### Media & Files
- **Expo Image Picker** - Image and file selection
- **Expo Media Library** - Media access and management
- **File Upload Service** - Secure file upload with progress tracking
- **Image Optimization** - Automatic image compression and optimization

### Development & Tools
- **Expo Haptics** - Haptic feedback integration
- **Expo Notifications** - Push notification handling
- **Error Monitoring** - Comprehensive error tracking
- **Performance Monitoring** - Real-time performance metrics

## 🚀 Development

### Environment Setup
```bash
# Required environment variables
EXPO_PUBLIC_API_URL=http://localhost:5001/api      # Development
EXPO_PUBLIC_API_URL=https://server-a7od.onrender.com/api  # Production
EXPO_PUBLIC_ENVIRONMENT=development
```

### Development Commands
```bash
npx expo start              # Start development server
npx expo start --tunnel     # Start with tunnel for device testing
npm run android             # Run on Android
npm run ios                 # Run on iOS
npm run web                 # Run on web browser
```

### Build Commands
```bash
# EAS Build (cloud builds)
eas build -p android        # Build Android APK/AAB
eas build -p ios           # Build iOS IPA
eas build -p all           # Build for all platforms

# Local builds
npx expo export            # Export for web
npx expo run:android       # Run locally on Android
npx expo run:ios          # Run locally on iOS
```

### Testing
```bash
npm test                   # Run Jest tests
npm run test:e2e          # Run end-to-end tests
```

## 📱 Platform Support

- **iOS**: 13.0+ (iPhone and iPad)
- **Android**: API level 21+ (Android 5.0+)
- **Expo Go**: Full compatibility for development

## 🏗️ Architecture Patterns

### Authentication-First Design
1. **AuthManager Initialization**: Authentication state determined first
2. **Service Initialization**: Other services initialize after auth ready
3. **Single Source of Truth**: Centralized authentication state
4. **Race Condition Prevention**: No premature service initialization

### Offline-First Architecture
- **Local Storage Priority**: All data stored locally first
- **Sync Queue**: Actions queued when offline, synced when online
- **Conflict Resolution**: Smart handling of data conflicts
- **Real-time Updates**: Automatic sync when connection restored

### Component Architecture
- **Screen-Service Pattern**: Screens focus on UI, services handle logic
- **Context Providers**: Centralized state management with React Context
- **Custom Hooks**: Reusable logic through custom React hooks
- **Error Boundaries**: Comprehensive error handling and recovery

## 📊 Key App Flows

### Authentication Flow
```typescript
// AuthManager initializes first
await AuthManager.initialize();
// Then other services can safely initialize
await chatService.initialize();
await websocketService.connect();
```

### Chat Flow
1. User enters message in ChatInput
2. Message sent through chatService with streaming
3. AI response streamed back with real-time updates
4. Message stored locally and synced to server
5. UI updates with markdown rendering and animations

### File Upload Flow
1. User selects file through AttachmentPicker
2. File preview shown with AttachmentPreview
3. File uploaded through fileUploadService with progress
4. Server processes file (image compression, text extraction)
5. File data integrated into chat context

### Offline Sync Flow
1. Actions queued in offline queue when disconnected
2. Queue persisted in secure local storage
3. Automatic sync when connection restored
4. Conflict resolution for concurrent updates
5. UI updates reflect successful sync

## 🔧 Configuration

### Expo Configuration (app.json)
- App name, version, and metadata
- Platform-specific settings
- Build configurations
- Asset and icon configurations

### EAS Build Configuration (eas.json)
- Build profiles for development, preview, production
- Platform-specific build settings
- Distribution and deployment settings

### TypeScript Configuration
- Strict typing enabled
- Path mapping for clean imports
- React Native and Expo type support

## 🚢 Deployment

### Development Builds
```bash
eas build --profile development
```

### Production Builds
```bash
eas build --profile production
eas submit -p ios        # Submit to App Store
eas submit -p android    # Submit to Google Play
```

### Over-the-Air Updates
```bash
eas update --branch production  # Deploy OTA update
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow TypeScript and React Native best practices
4. Test on both iOS and Android platforms
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

Licensed under the Apache 2.0 License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- **Development**: Use Expo CLI for development and debugging
- **Device Testing**: Use `npx expo start --tunnel` for real device testing
- **Build Issues**: Check EAS Build logs and documentation
- **Performance**: Monitor using Expo dev tools and error tracking

---

Built with ❤️ for the Numina AI platform - Empowering personalized mobile AI experiences.