# Numina Mobile

A React Native Expo application for lifestyle well-being and AI-powered personal growth. Numina combines advanced AI personality adaptation, real-time emotional analytics, and cloud-based social matching to create a comprehensive mental wellness platform.

## 📁 Project Structure

```
numina-mobile/
├── 📱 App Entry Points
│   ├── App.tsx                    # Main app entry point
│   ├── index.ts                   # Expo entry point
│   └── src/SimpleApp.tsx         # Simplified app architecture
│
├── 🎨 Assets & Resources
│   ├── assets/                    # Static assets
│   │   ├── adaptive-icon.png
│   │   ├── favicon.png
│   │   ├── icon.png
│   │   ├── splash-icon.png
│   │   └── unknownuser.jpg
│   └── src/assets/
│       ├── fonts/                 # Custom fonts
│       └── images/                # App images
│           ├── happynumina.png
│           ├── numinacontent.png
│           ├── NUMINALOGO.png
│           ├── numinamoonface.png
│           ├── numinapuzzled.png
│           ├── numinashades.png
│           ├── numinasmile.png
│           └── [other numina assets]
│
├── 🧩 Core Components
│   └── src/components/
│       ├── chat/                  # Chat functionality
│       │   ├── ChatInput.tsx
│       │   ├── MessageBubble.tsx
│       │   └── index.ts
│       ├── AIToolExecutionStream.tsx
│       ├── AnimatedAuthStatus.tsx
│       ├── AnimatedBackArrow.tsx
│       ├── AnimatedHamburger.tsx
│       ├── AnimatedToolText.tsx
│       ├── CascadingRecommendations.tsx
│       ├── ChatErrorBoundary.tsx
│       ├── ConversationHistory.tsx
│       ├── FontProvider.tsx
│       ├── GradientBackground.tsx
│       ├── Header.tsx
│       ├── HeaderMenu.tsx
│       ├── LLMAnalyticsSection.tsx
│       ├── OptimizedImage.tsx
│       ├── PageBackground.tsx
│       ├── ReasoningTreeVisualization.tsx
│       ├── ScreenWrapper.tsx
│       ├── SearchThoughtIndicator.tsx
│       ├── StreamingMarkdown.tsx
│       ├── SubscriptionModal.tsx
│       └── ThemeSelector.tsx
│
├── ⚙️ Configuration
│   ├── src/config/
│   │   └── environment.ts         # Environment configuration
│   ├── babel.config.js
│   ├── eas.json                   # EAS Build configuration
│   ├── tsconfig.json
│   └── app.json                   # Expo app configuration
│
├── 🔄 Context Providers
│   └── src/contexts/
│       ├── SimpleAuthContext.tsx  # Authentication state management
│       ├── ThemeContext.tsx       # Theme management
│       └── AuthContext.tsx.backup # Backup auth context
│
├── 🎣 Custom Hooks
│   └── src/hooks/
│       ├── useAIPersonality.ts    # AI personality management
│       ├── useCloudMatching.ts    # Cloud event matching
│       ├── useEmotionalAnalytics.ts
│       ├── useLLMAnalytics.ts
│       ├── useNuminaPersonality.ts
│       ├── useRealTimeEvents.ts
│       └── useSearchIndicator.ts
│
├── 🧭 Navigation
│   └── src/navigation/
│       └── AppNavigator.tsx       # Main navigation structure
│
├── 📱 Screens
│   └── src/screens/
│       ├── AboutScreen.tsx
│       ├── AnalyticsScreen.tsx    # Emotional analytics dashboard
│       ├── ChatScreen.tsx         # Main chat interface
│       ├── CloudScreen.tsx        # Cloud matching interface
│       ├── EnhancedChatScreen.tsx
│       ├── HeroLandingScreen.tsx
│       ├── NuminaSensesV2.tsx
│       ├── ProfileScreen.tsx
│       ├── SentimentScreen.tsx
│       ├── SettingsScreen.tsx
│       ├── SignInScreen.tsx
│       ├── SignUpScreen.tsx
│       ├── TutorialScreen.tsx
│       ├── WalletScreen.tsx
│       └── WelcomeScreen.tsx
│
├── 🔧 Services
│   └── src/services/
│       ├── aiPersonalityService.ts # AI personality adaptation
│       ├── api.ts                 # Main API service
│       ├── appConfigService.ts
│       ├── appInitializer.ts
│       ├── authManager.ts         # Authentication management
│       ├── autoPlaylistService.ts
│       ├── batchApiService.ts
│       ├── chatService.ts         # Chat functionality
│       ├── cloudMatchingService.ts # Cloud event matching
│       ├── conversationStorage.ts
│       ├── emotionalAnalyticsAPI.ts # Emotional analytics
│       ├── errorMonitoring.ts
│       ├── offlineEmotionStorage.ts
│       ├── offlineQueue.ts
│       ├── realTimeSync.ts
│       ├── secureStorage.ts
│       ├── settingsService.ts
│       ├── simpleSecureStorage.ts
│       ├── spotifyService.ts
│       ├── sslPinning.ts
│       ├── syncService.ts
│       ├── toolExecutionService.ts
│       ├── userDataSync.ts
│       └── websocketService.ts
│
├── 📊 Types & Interfaces
│   └── src/types/
│       └── theme.ts               # Theme type definitions
│
├── 🛠️ Utilities
│   └── src/utils/
│       ├── animations.ts          # Animation utilities
│       ├── colors.ts              # Color definitions
│       ├── fonts.ts               # Font configurations
│       ├── globalImagePreloader.ts
│       ├── imagePreloader.ts
│       ├── neumorphic.ts          # Neumorphic design utilities
│       ├── searchDataParser.ts
│       ├── styling.ts             # Styling utilities
│       └── themes.ts              # Theme definitions
│
├── 🤖 Android Configuration
│   └── android/
│   └── app/
│   └── src/
│   └── main/
│   └── res/
│   └── xml/
│   └── network_security_config.xml
│
└── 📦 Build Outputs
    ├── dist-test/                 # Test build output
    └── dist-test2/                # Secondary test build
```

## 🚀 Features

### 🤖 AI-Powered Emotional Wellness
- **Adaptive AI Personality**: AI that adapts communication style based on user's emotional state
- **Real-time Emotional Analytics**: Continuous monitoring and analysis of user emotional patterns
- **Contextual Suggestions**: Personalized prompts and recommendations based on mood and time
- **Emotional State Analysis**: Advanced AI analysis of conversation history and recent emotions

### 💬 Intelligent Chat System
- **Streaming Responses**: Real-time streaming of AI responses with markdown support
- **Personality Context**: Messages include AI personality context and emotional tone
- **Adaptive Placeholders**: Dynamic input placeholders based on emotional state
- **Feedback System**: User feedback collection for continuous AI improvement

### ☁️ Cloud Matching & Social Features
- **Event Matching**: AI-powered matching with local events based on emotional state
- **Compatibility Analysis**: Emotional compatibility scoring for events and activities
- **Community Integration**: Social features with emotional wellness focus
- **Real-time Sync**: Offline-capable with real-time synchronization

### 📊 Analytics & Insights
- **Emotional Dashboard**: Comprehensive analytics of emotional patterns
- **Mood Tracking**: Visual mood tracking with intensity levels
- **Pattern Recognition**: AI-driven pattern identification in emotional data
- **Growth Metrics**: Personal growth and wellness progress tracking

### 🔐 Security & Privacy
- **Secure Authentication**: Multi-layer authentication with secure storage
- **SSL Pinning**: Enhanced security with certificate pinning
- **Offline Support**: Full offline functionality with secure local storage
- **Data Privacy**: End-to-end encryption for sensitive data

## 🛠️ Tech Stack

### Core Framework
- **React Native** (0.79.5) - Cross-platform mobile development
- **Expo** (53.0.17) - Development platform and build tools
- **TypeScript** (5.8.3) - Type-safe development

### Navigation & UI
- **React Navigation** (7.1.14) - Navigation framework
- **React Native Reanimated** (3.17.4) - Smooth animations
- **React Native Gesture Handler** (2.24.0) - Touch handling
- **Expo Linear Gradient** (14.1.5) - Gradient effects

### State Management & Storage
- **AsyncStorage** (2.1.2) - Local data persistence
- **Expo Secure Store** (14.2.3) - Secure data storage
- **Context API** - State management

### AI & Analytics
- **Socket.io Client** (4.8.1) - Real-time communication
- **React Native Markdown Display** (7.0.2) - Rich text rendering
- **Custom AI Services** - Emotional analytics and personality adaptation

### Authentication & Security
- **Expo Auth Session** (6.2.1) - OAuth authentication
- **Expo Local Authentication** (16.0.0) - Biometric authentication
- **Expo Crypto** (14.1.5) - Cryptographic operations

### Development Tools
- **Expo Haptics** (14.1.4) - Haptic feedback
- **Expo Image Picker** (16.1.4) - Image selection
- **Expo Notifications** (0.31.4) - Push notifications
- **Expo Blur** (14.1.5) - Visual effects

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd numina-mobile

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Environment Setup

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_URL=your_api_url
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_AI_SERVICE_URL=your_ai_service_url
EXPO_PUBLIC_CLOUD_MATCHING_URL=your_cloud_matching_url
```

## 🏗️ Architecture

### Authentication-First Design
The app uses a simplified authentication-first architecture.

1. **AuthManager Initialization**: Authentication state is determined first
2. **Service Initialization**: Other services initialize only after auth is ready
3. **Single Source of Truth**: Centralized authentication state management
4. **No Premature Initialization**: Prevents race conditions and token issues

### AI Personality System
The AI personality system provides adaptive responses based on user emotional state:

- **Emotional State Analysis**: Real-time analysis of user mood and patterns
- **Communication Style Adaptation**: AI adapts tone based on emotional context
- **Contextual Suggestions**: Personalized prompts and recommendations
- **Feedback Integration**: Continuous learning from user interactions

### Offline-First Design

- **Local Storage**: All important data stored locally
- **Offline Queue**: Actions queued when offline, synced when online
- **Real-time Sync**: Automatic synchronization when connection restored
- **Conflict Resolution**: Smart conflict resolution for data consistency

## 📱 Platform Support

- **iOS**: 13.0+ (iPhone and iPad)
- **Android**: API level 21+ (Android 5.0+)
- **Web**: Modern browsers with React Native Web

## 🔧 Configuration

### EAS Build Configuration
The app uses EAS Build for cloud-based builds:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
