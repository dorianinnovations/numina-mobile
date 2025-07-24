# Numina Mobile

> **Premium AI-Powered Personal Growth & Emotional Wellness Platform**

A  React Native mobile application featuring adaptive AI personality, real-time emotional analytics, holographic UI design system, and comprehensive wellness tools. Built with Expo SDK 53 and optimized for professional mobile experiences.

![React Native](https://img.shields.io/badge/React%20Native-0.74-blue.svg)
![Expo SDK](https://img.shields.io/badge/Expo%20SDK-53-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)
![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)

---

## 📁 Project Architecture

```
numina-mobile/
├── 📱 src/
│   ├── 🖥️  screens/                    # Navigation Endpoints (15 Screens)
│   │   ├── HeroLandingScreen.tsx       # App entry point with onboarding
│   │   ├── SignInScreen.tsx            # Authentication with biometric support
│   │   ├── SignUpScreen.tsx            # User registration & experience setup
│   │   ├── ChatScreen.tsx              # Main AI chat interface with 25+ tools
│   │   ├── TutorialScreen.tsx          # Interactive feature tutorial
│   │   ├── AnalyticsScreen.tsx         # Real-time emotional analytics dashboard
│   │   ├── CloudFind.tsx             # Social features & AI event matching
│   │   ├── WalletScreen.tsx            # Credits & subscription management
│   │   ├── LegacyWalletScreen.tsx      # Legacy wallet interface
│   │   ├── SettingsScreen.tsx          # App preferences & configurations
│   │   ├── AboutScreen.tsx             # Help & support center
│   │   ├── ProfileScreen.tsx           # User profile & personalization
│   │   ├── SentimentScreen.tsx         # Advanced sentiment analysis
│   │   ├── DataCleanupScreen.tsx       # Data management & privacy controls
│   │   ├── WelcomeScreen.tsx           # Welcome flow for new users
│   │   ├── SandboxScreen.tsx           # AI sandbox environment
│   │   ├── BorderThemeSettingsScreen.tsx # Premium theme customization
│   │   └── NuminaSensesV2.tsx          # Advanced AI senses interface
│   │
│   ├── 🔧 services/                    # Business Logic & API Layer (38 Services)
│   │   ├── 🔗 Core Services
│   │   │   ├── api.ts                  # Main API service with error handling
│   │   │   ├── cloudAuth.ts            # Authentication & JWT management
│   │   │   ├── optimizedChatService.ts # Chat functionality with streaming
│   │   │   ├── websocketService.ts     # Real-time WebSocket connections
│   │   │   └── appInitializer.ts       # App startup orchestration
│   │   │
│   │   ├── 🧠 AI & Analytics
│   │   │   ├── aiInsightEngine.ts      # AI-powered insights generation
│   │   │   ├── comprehensiveAnalytics.ts # Advanced analytics processing
│   │   │   ├── chainOfThoughtService.ts # AI reasoning visualization
│   │   │   ├── toolExecutionService.ts # AI tool execution & management
│   │   │   ├── emotionalAnalyticsAPI.ts # Emotion tracking & analysis
│   │   │   └── personalizedInsightsService.ts # Personalized recommendations
│   │   │
│   │   ├── 📁 File & Media
│   │   │   ├── fileUploadService.ts    # File upload with progress tracking
│   │   │   ├── optimizedStreamingService.ts # Streaming optimizations
│   │   │   └── autoPlaylistService.ts  # Music integration & playlists
│   │   │
│   │   ├── 💾 Data & Storage
│   │   │   ├── secureStorage.ts        # Encrypted local storage
│   │   │   ├── conversationStorage.ts  # Chat history management
│   │   │   ├── syncService.ts          # Data synchronization
│   │   │   ├── offlineQueue.ts         # Offline functionality
│   │   │   ├── dataManager.ts          # Data lifecycle management
│   │   │   └── dataAuditService.ts     # Data integrity & auditing
│   │   │
│   │   ├── ☁️  Cloud & Social
│   │   │   ├── cloudMatchingService.ts # AI-powered social matching
│   │   │   ├── cloudStorageService.ts  # Cloud data synchronization
│   │   │   ├── realTimeSync.ts         # Real-time data updates
│   │   │   └── userDataSync.ts         # Cross-device user data sync
│   │   │
│   │   ├── 🛡️  Security & Monitoring
│   │   │   ├── errorMonitoring.ts      # Comprehensive error tracking
│   │   │   ├── sslPinning.ts          # Network security enforcement
│   │   │   ├── analyticsNotificationService.ts # Analytics notifications
│   │   │   └── settingsService.ts      # App configuration management
│   │   │
│   │   └── 🔌 Integrations
│   │       ├── spotifyService.ts       # Spotify music integration
│   │       ├── weatherService.ts       # Weather data & context
│   │       ├── locationContextService.ts # Location-aware features
│   │       └── batchApiService.ts      # Mobile-optimized batch requests
│   │
│   ├── 🎨 components/                  # UI Components (60+ Premium Components)
│   │   ├── 💬 chat/                    # Chat Interface Components
│   │   │   ├── ChatInput.tsx           # Premium message input with attachments
│   │   │   ├── MessageBubble.tsx       # Animated message display
│   │   │   ├── AttachmentPicker.tsx    # File attachment selection
│   │   │   ├── AttachmentPreview.tsx   # File preview with progress tracking
│   │   │   └── PhotoPreview.tsx        # Image preview & editing
│   │   │
│   │   ├── 🎭 Premium UI Components
│   │   │   ├── ChromaticCard.tsx       # Tier-based cards with shine effects
│   │   │   ├── AnimatedGradientBorder.tsx # Dynamic gradient animations
│   │   │   ├── EnhancedSpinner.tsx     # Holographic loading spinner
│   │   │   ├── ShineEffect.tsx         # Premium shine animations
│   │   │   ├── InteractiveParticles.tsx # Particle effects system
│   │   │   ├── BlobBackground.tsx      # Animated blob backgrounds
│   │   │   └── WalletCard.tsx          # Premium wallet-style cards
│   │   │
│   │   ├── 📊 Analytics & Visualization
│   │   │   ├── LLMAnalyticsSection.tsx # AI-powered analytics display
│   │   │   ├── AnalyticsCard.tsx       # Interactive analytics cards
│   │   │   ├── ChainOfThoughtProgress.tsx # AI reasoning visualization
│   │   │   ├── charts/                 # Advanced chart components
│   │   │   │   ├── AnalyticsChartComponents.tsx
│   │   │   │   └── EnhancedCharts.tsx
│   │   │   └── CategoryAnalyticsCard.tsx
│   │   │
│   │   ├── 🏗️  Layout & Navigation
│   │   │   ├── Header.tsx              # Premium navigation header
│   │   │   ├── HeaderMenu.tsx          # Animated menu system
│   │   │   ├── ScreenWrapper.tsx       # Consistent screen layout
│   │   │   ├── PageBackground.tsx      # Dynamic background system
│   │   │   └── HeaderGradient.tsx      # Header gradient effects
│   │   │
│   │   ├── 🛠️  Specialized Components
│   │   │   ├── ConversationHistory.tsx # Premium conversation management
│   │   │   ├── ToolExecutionModal.tsx  # AI tool execution interface
│   │   │   ├── SubscriptionModal.tsx   # Subscription management UI
│   │   │   ├── StreamingMarkdown.tsx   # Real-time markdown rendering
│   │   │   ├── CascadingRecommendations.tsx # AI recommendations
│   │   │   ├── ExperienceLevelSelector.tsx # User onboarding
│   │   │   ├── SandboxModalManager.tsx # AI sandbox interface
│   │   │   └── DevTools.tsx            # Development utilities
│   │   │
│   │   └── 🎪 Interactive Elements
│   │       ├── AnimatedToolText.tsx    # Tool execution animations
│   │       ├── TypewriterText.tsx      # Typewriter text effects
│   │       ├── SequentialTypewriter.tsx # Sequential text animations
│   │       ├── CustomAlert.tsx         # Premium alert system
│   │       ├── LinkConfirmationModal.tsx # Link security confirmation
│   │       └── [25+ additional components] # Extended component library
│   │
│   ├── 🎣 hooks/                       # Custom React Hooks (12 Hooks)
│   │   ├── useEmotionalAnalytics.ts    # Emotion tracking & analysis
│   │   ├── useLLMAnalytics.ts          # LLM-powered analytics
│   │   ├── useCloudMatching.ts         # Social matching algorithms
│   │   ├── useRealTimeEvents.ts        # Real-time event handling
│   │   ├── useComprehensiveAnalytics.ts # Advanced analytics processing
│   │   ├── usePullToRefresh.ts         # Pull-to-refresh functionality
│   │   ├── useLocation.ts              # Location services integration
│   │   ├── useTypewriter.ts            # Typewriter animation effects
│   │   ├── useNodeAnimations.ts        # Node animation management
│   │   ├── useSandboxData.ts           # Sandbox data management
│   │   ├── useStableSandboxState.ts    # Stable sandbox state
│   │   └── useGhostTyping.ts           # Ghost typing effects
│   │
│   ├── 🎯 contexts/                    # React Context Providers
│   │   ├── SimpleAuthContext.tsx       # Authentication state management
│   │   ├── ThemeContext.tsx            # Premium theme system
│   │   ├── BorderThemeContext.tsx      # Border theme customization
│   │   ├── BorderSettingsContext.tsx   # Border settings management
│   │   └── RefreshContext.tsx          # Pull-to-refresh context
│   │
│   ├── 🗂️  types/                      # TypeScript Definitions
│   │   ├── message.ts                  # Message & attachment types
│   │   ├── theme.ts                    # Theme system types
│   │   └── sandbox.ts                  # Sandbox environment types
│   │
│   ├── 🛠️  utils/                      # Utility Functions
│   │   ├── colors.ts                   # Premium color system
│   │   ├── themes.ts                   # Theme configurations
│   │   ├── animations.ts               # Animation utilities
│   │   ├── fonts.ts                    # Typography system
│   │   ├── logger.ts                   # Development logging
│   │   ├── errorHandler.ts             # Error handling utilities
│   │   ├── neumorphic.ts               # Neumorphic design system
│   │   ├── extremeAnimationSystem.ts   # Advanced animation engine
│   │   ├── animationManager.ts         # Animation state management
│   │   ├── resourceManager.ts          # Resource optimization
│   │   └── nodePositioning.ts          # Node layout algorithms
│   │
│   ├── 🧭 navigation/                  # Navigation Configuration
│   │   └── AppNavigator.tsx            # Stack navigation with premium spinner
│   │
│   ├── ⚙️  config/                     # Application Configuration
│   │   ├── environment.ts              # Environment-specific settings
│   │   ├── productionDirect.ts         # Production configuration
│   │   └── eas-production.json         # EAS build configuration
│   │
│   ├── 📊 constants/                   # Application Constants
│   │   ├── borderThemes.ts             # Border theme definitions
│   │   └── sandbox.ts                  # Sandbox configuration
│   │
│   └── 🎨 assets/                      # Application Assets
│       └── images/                     # Image assets & branding
│           ├── NUMINALOGO.png          # Primary logo
│           ├── happynumina.png         # Happy state avatar
│           ├── numinasmile.png         # Smile state avatar
│           ├── numinacontent.png       # Content state avatar
│           ├── numinamoonface.png      # Moon face avatar
│           ├── numinapuzzled.png       # Puzzled state avatar
│           └── numinashades.png        # Cool state avatar
│
├── 🧪 tests/                           # Test Suites
│   └── e2e/                           # End-to-End Testing
│       ├── mobile-basic.test.ts        # Basic functionality tests
│       ├── mobile-user-journey.test.ts # User journey testing
│       └── mobile-backend-integration.test.ts # Backend integration tests
│
├── 📱 Platform Configuration
│   ├── App.tsx                         # Main application entry point
│   ├── app.json                        # Expo app configuration
│   ├── eas.json                        # EAS Build profiles
│   ├── package.json                    # Dependencies & scripts
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── babel.config.js                 # Babel transformation config
│   ├── metro.config.js                 # Metro bundler configuration
│   └── jest.setup.js                   # Jest testing configuration
│
└── 📚 Documentation
    ├── README.md                       # This comprehensive guide
    ├── CLAUDE.md                       # Development & architecture guide
    └── [Generated Documentation]       # Auto-generated documentation
```

---

## Core Platform Features

### **Advanced AI Integration**
- **Adaptive AI Personality**: Dynamic communication style adaptation based on user emotional state
- **25+ AI Tools**: Comprehensive tool ecosystem including web search, music recommendations, weather, calculations, and specialized utilities
- **Streaming Chat**: Real-time AI responses with markdown support and tool execution visualization
- **Chain of Thought**: Visual AI reasoning process with step-by-step thought visualization
- **Context Memory**: Intelligent conversation history with contextual awareness

### **Premium UI/UX Design**
- **Holographic Design System**: Sophisticated holographic effects with curved arc spinners and iridescent gradients
- **Premium Card System**: Wallet-inspired card hierarchy with tier-based visual differentiation (Core/Aether)
- **Smooth Animations**: 60fps animations using React Native Reanimated with physics-based motion
- **Interactive Particles**: Dynamic particle effects system for enhanced user engagement
- **Glassmorphism Effects**: Modern blur effects and translucent surfaces using Expo BlurView

### **Emotional Analytics & Wellness**
- **Real-time Emotion Tracking**: Advanced sentiment analysis with pattern recognition
- **Growth Insights**: Personal development progress tracking with AI-powered recommendations
- **Mood Visualization**: Interactive charts and emotional pattern analysis
- **Behavioral Analytics**: AI-driven behavioral pattern identification and insights
- **Wellness Metrics**: Comprehensive wellness tracking with personalized feedback

### **Mobile-First Architecture**
- **File Upload System**: Premium attachment handling with instant camera/gallery access, image compression, and GPT-4o vision integration
- **Offline-First Design**: Comprehensive offline functionality with intelligent sync queue
- **Performance Optimization**: Advanced resource management, memory optimization, and smooth 60fps animations
- **Haptic Feedback**: Enhanced tactile feedback throughout the application
- **Biometric Authentication**: Secure authentication with fingerprint/face recognition support

### **Cloud & Social Features**
- **AI-Powered Social Matching**: Emotional compatibility-based social connections
- **Event Matching**: Location-aware event recommendations based on mood and preferences
- **Real-time Sync**: Cross-device data synchronization with conflict resolution
- **Privacy Controls**: Granular privacy settings with secure data handling
- **Community Features**: Wellness-focused social interactions with privacy protection

### **Subscription & Monetization**
- **Credit System**: Usage-based credit tracking with transparent pricing
- **Subscription Tiers**: Multiple tier levels (Core/Aether) with feature differentiation
- **Stripe Integration**: Secure payment processing with PCI compliance
- **Usage Analytics**: Detailed usage insights and spending tracking
- **Premium Features**: Tier-based feature access with elegant upgrade flows

---

## Technology Stack

### **Core Framework**
- **React Native 0.74**: Cross-platform mobile development with native performance
- **Expo SDK 53**: Comprehensive development platform with managed workflow
- **TypeScript 5.3**: Strict type safety with comprehensive type definitions
- **React Navigation v7**: Advanced navigation with stack and drawer navigation

### **State Management & Architecture**
- **Context API**: Centralized state management with provider pattern
- **Custom Hooks**: Reusable business logic through specialized React hooks
- **Singleton Services**: Efficient resource management with singleton pattern
- **Event-Driven Architecture**: Real-time updates through WebSocket events

### **UI & Animation Framework**
- **React Native Reanimated v3**: High-performance 60fps animations with native driver
- **React Native Gesture Handler**: Advanced touch handling and gesture recognition
- **Expo Linear Gradient**: Premium gradient effects and color transitions
- **React Native SVG**: Vector graphics and premium UI effects

### **Communication & Real-time**
- **Socket.io Client**: Real-time WebSocket communication with auto-reconnection
- **Axios HTTP Client**: Robust API requests with retry logic and error handling
- **Streaming Technology**: Server-Sent Events for real-time AI responses
- **Batch API Service**: Mobile-optimized batch request processing

### **Security & Authentication**
- **Expo SecureStore**: Encrypted secure storage for sensitive data
- **JWT Token Management**: Secure authentication with automatic refresh
- **SSL Pinning**: Enhanced network security with certificate validation
- **Biometric Authentication**: Native biometric authentication integration

### **Media & File Processing**
- **Expo Image Picker**: Advanced image and file selection with compression
- **File Upload Service**: Comprehensive file handling with progress tracking
- **Image Optimization**: Automatic compression and format optimization
- **GPT-4o Vision**: Base64 image processing for AI vision capabilities

### **Development & Monitoring**
- **Error Monitoring**: Comprehensive error tracking and reporting
- **Performance Analytics**: Real-time performance metrics and optimization
- **Development Tools**: Integrated debugging and development utilities
- **Testing Framework**: Jest-based testing with E2E test coverage

---

## 🚀 Quick Start Guide

### **Prerequisites**
- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (macOS) or Android Studio
- Expo Go app for device testing

### **Installation**
```bash
# Clone the repository
git clone <repository-url>
cd numina-mobile

# Install dependencies
npm install

# Start development server
npx expo start

# For device testing with tunnel
npx expo start --tunnel
```

### **Development Commands**
```bash
# Platform-specific development
npm run android          # Android development build
npm run ios              # iOS development build
npm run web              # Web development build

# Testing
npm test                 # Run Jest test suite
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run end-to-end tests

# Building & Deployment
eas build --profile development   # Development build
eas build --profile production    # Production build
eas submit -p ios                 # Submit to App Store
eas submit -p android             # Submit to Google Play
```

### **Environment Configuration**
```bash
# Required environment variables
EXPO_PUBLIC_API_KEY=your_api_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
EXPO_PUBLIC_ENVIRONMENT=development
```

---

## 🏗️ Architecture & Design Patterns

### **Authentication-First Architecture**
```typescript
// Service initialization order ensures authentication state is ready
await CloudAuth.getInstance().initialize();
await ChatService.getInstance().initialize();
await WebSocketService.getInstance().connect();
```

### **Offline-First Design Pattern**
- **Local Storage Priority**: All data operations target local storage first
- **Sync Queue**: Actions queued when offline, automatically synced when online
- **Conflict Resolution**: Intelligent handling of data conflicts during sync
- **Optimistic Updates**: UI updates immediately with background sync

### **Component Architecture Pattern**
- **Screen-Service Separation**: Screens focus on UI, services handle business logic
- **Context Providers**: Centralized state management with React Context
- **Custom Hooks**: Reusable logic abstraction through specialized hooks
- **Error Boundaries**: Comprehensive error handling and graceful degradation

### **Premium UI Design Philosophy**
- **Holographic Aesthetics**: Thin curved arcs with iridescent gradients and dramatic timing
- **Wallet-Inspired Cards**: Consistent card hierarchy with premium shadows and borders
- **Physics-Based Motion**: Natural animations with proper easing and spring physics
- **Micro-Interactions**: Subtle haptic feedback and animation details

---

## 📊 Performance & Optimization

### **Mobile Performance**
- **Bundle Size Optimization**: Selective imports and code splitting
- **Memory Management**: Proper cleanup in useEffect hooks and singleton services
- **Image Optimization**: Automatic compression and efficient loading
- **Animation Performance**: Native driver usage for all transforms

### **Network Optimization**
- **Request Batching**: Mobile-specific batch API endpoints
- **Intelligent Caching**: Strategic caching with cache invalidation
- **Retry Logic**: Exponential backoff for failed requests
- **Offline Queue**: Priority-based offline request management

### **Real-time Features**
- **WebSocket Management**: Auto-reconnection with exponential backoff
- **Event Debouncing**: Efficient event handling to prevent spam
- **State Synchronization**: Optimistic updates with conflict resolution
- **Connection Resilience**: Graceful handling of connection failures

---

## 🔒 Security & Privacy

### **Data Protection**
- **End-to-End Encryption**: Sensitive data encrypted at rest and in transit
- **Secure Token Storage**: JWT tokens stored in Expo SecureStore
- **Input Validation**: Comprehensive validation and sanitization
- **Privacy Controls**: Granular user privacy settings

### **Network Security**
- **SSL Certificate Pinning**: Enhanced security for API communications
- **API Authentication**: Secure JWT-based authentication with refresh tokens
- **Request Signing**: API request integrity verification
- **Rate Limiting**: Protection against abuse and excessive usage

### **User Privacy**
- **Minimal Data Collection**: Only essential data collected and processed
- **Consent Management**: Clear consent flows for data usage
- **Data Portability**: User data export and deletion capabilities
- **Compliance**: GDPR and privacy regulation compliance

---

## 📱 Platform Support & Compatibility

### **Supported Platforms**
- **iOS**: 13.0+ (iPhone and iPad with full feature support)
- **Android**: API level 21+ (Android 5.0+ with optimized performance)
- **Web**: Modern browsers with progressive web app features

### **Device Compatibility**
- **Screen Sizes**: Responsive design supporting all device sizes
- **Performance Tiers**: Adaptive performance based on device capabilities
- **Accessibility**: Full accessibility support with screen readers
- **Offline Capability**: Complete offline functionality across all platforms

---

## 🚢 Deployment & Distribution

### **Build Profiles**
```bash
# Development builds for testing
eas build --profile development

# Preview builds for stakeholders
eas build --profile preview

# Production builds for app stores
eas build --profile production
```

### **Distribution Channels**
- **App Store**: iOS distribution through Apple App Store
- **Google Play**: Android distribution through Google Play Store
- **Direct Distribution**: Enterprise distribution for internal testing
- **OTA Updates**: Over-the-air updates for rapid deployment

---

## 🤝 Contributing & Development

### **Development Workflow**
1. **Fork Repository**: Create your feature branch from main
2. **Follow Standards**: Adhere to TypeScript and React Native best practices
3. **Test Coverage**: Include tests for new features and bug fixes
4. **Cross-Platform Testing**: Verify functionality on both iOS and Android
5. **Documentation**: Update documentation for new features
6. **Code Review**: Submit pull request with comprehensive description

### **Code Standards**
- **TypeScript**: Strict typing with comprehensive type definitions
- **ESLint**: Consistent code formatting and best practices
- **Component Structure**: Consistent component architecture patterns
- **Performance**: Memory management and optimization considerations

---

## 📄 License & Support

**Licensed under the Apache 2.0 License** - See [LICENSE](LICENSE) for details.

### **Support Channels**
- **Development**: Expo CLI and development tools for debugging
- **Device Testing**: `npx expo start --tunnel` for real device testing
- **Performance**: Built-in performance monitoring and error tracking
- **Community**: Active development community and contribution guidelines

---

<div align="center">

**Built with ❤️ for the Numina AI Platform**

*Empowering Personalized Mobile AI Experiences for Mental Wellness*

![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

</div>
