# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style Guidelines

- IMPORTANT: DO NOT ADD ANY COMMENTS to code unless explicitly requested by the user

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
├── screens/               # Navigation endpoints (15 screens)
│   ├── HeroLandingScreen.tsx     # App entry point
│   ├── SignInScreen.tsx          # Authentication
│   ├── SignUpScreen.tsx          # User registration
│   ├── ChatScreen.tsx            # Main chat interface
│   ├── TutorialScreen.tsx        # Feature tutorial
│   ├── AnalyticsScreen.tsx       # Emotional analytics
│   ├── CloudScreen.tsx           # Social features
│   ├── WalletScreen.tsx          # Credits/subscription
│   ├── SettingsScreen.tsx        # App settings
│   ├── AboutScreen.tsx           # About page
│   ├── ProfileScreen.tsx         # User profile
│   ├── SentimentScreen.tsx       # Sentiment analysis
│   ├── DataCleanupScreen.tsx     # Data management
│   ├── WelcomeScreen.tsx         # Welcome flow
│   └── NuminaSensesV2.tsx        # Advanced AI features
├── components/           # Reusable UI components (40+ components)
│   ├── chat/             # Chat-specific components
│   │   ├── ChatInput.tsx         # Message input
│   │   ├── MessageBubble.tsx     # Message display
│   │   ├── AttachmentPicker.tsx  # File attachments
│   │   ├── AttachmentPreview.tsx # Attachment preview
│   │   └── PhotoPreview.tsx      # Photo handling
│   ├── Header.tsx                # Navigation header
│   ├── PageBackground.tsx        # Background component
│   ├── ScreenWrapper.tsx         # Screen layout wrapper
│   ├── TermsOfService.tsx        # Terms of service modal
│   ├── SubscriptionModal.tsx     # Subscription management
│   ├── ToolExecutionModal.tsx    # AI tool execution
│   ├── StreamingMarkdown.tsx     # Markdown streaming
│   ├── AnimatedLightBeam.tsx     # UI animations
│   ├── CascadingRecommendations.tsx # AI recommendations
│   ├── LLMAnalyticsSection.tsx   # Analytics display
│   ├── QuickAnalyticsModal.tsx   # Quick analytics
│   └── [30+ more UI components]  # Additional components
├── contexts/             # React Context providers
│   ├── SimpleAuthContext.tsx     # Authentication state
│   ├── ThemeContext.tsx          # Theme management
│   └── RefreshContext.tsx        # Pull-to-refresh context
├── hooks/                # Custom React hooks (10+ hooks)
│   ├── useAIPersonality.ts       # AI personality management
│   ├── useCloudMatching.ts       # Social matching
│   ├── useEmotionalAnalytics.ts  # Emotion tracking
│   ├── useLLMAnalytics.ts        # LLM-powered analytics
│   ├── useNuminaPersonality.ts   # Numina personality
│   ├── useRealTimeEvents.ts      # Real-time features
│   ├── usePullToRefresh.ts       # Pull to refresh
│   └── useComprehensiveAnalytics.ts # Advanced analytics
├── services/             # API and business logic (25+ services)
│   ├── api.ts                    # Main API service
│   ├── cloudAuth.ts              # Authentication
│   ├── chatService.ts            # Chat functionality
│   ├── optimizedChatService.ts   # Optimized chat
│   ├── websocketService.ts       # WebSocket connections
│   ├── fileUploadService.ts      # File handling
│   ├── toolExecutionService.ts   # AI tool execution
│   ├── cloudMatchingService.ts   # Social matching
│   ├── emotionalAnalyticsAPI.ts  # Emotion analysis
│   ├── comprehensiveAnalytics.ts # Advanced analytics
│   ├── spotifyService.ts         # Spotify integration
│   ├── batchApiService.ts        # Batch operations
│   ├── offlineQueue.ts           # Offline support
│   ├── realTimeSync.ts           # Real-time sync
│   ├── secureStorage.ts          # Secure data storage
│   ├── settingsService.ts        # App settings
│   ├── syncService.ts            # Data synchronization
│   ├── userDataSync.ts           # User data sync
│   └── [10+ more services]       # Additional services
├── utils/                # Utility functions (15+ utilities)
│   ├── animations.ts             # Animation helpers
│   ├── colors.ts                 # Color definitions
│   ├── commonStyles.ts           # Shared styles
│   ├── fonts.ts                  # Font management
│   ├── themes.ts                 # Theme definitions
│   ├── logger.ts                 # Logging utilities
│   ├── errorHandler.ts           # Error handling
│   ├── imagePreloader.ts         # Image optimization
│   └── [7+ more utilities]       # Additional utilities
├── types/                # TypeScript type definitions
│   ├── message.ts                # Message types
│   └── theme.ts                  # Theme types
├── config/               # Configuration files
│   ├── environment.ts            # Environment config
│   ├── productionDirect.ts       # Production config
│   └── eas-production.json       # EAS build config
├── assets/               # Application assets
│   └── images/                   # Image assets
└── navigation/           # Navigation configuration
    └── AppNavigator.tsx          # Main navigation stack
```

## API Integration

### Server Configuration
- **Production API**: `https://server-a7od.onrender.com` (Always used via tunnel)
- **WebSocket**: `wss://server-a7od.onrender.com` for real-time features
- **Authentication**: JWT tokens via CloudAuth service stored in SecureStore
- **Primary Chat Endpoint**: `/ai/adaptive-chat` (Production streaming)
- **Fallback Chat Endpoint**: `/completion` (Legacy support)

### Authentication Flow
```
Hero Landing → Tutorial (optional) → SignUp/SignIn → Chat
```

### VERIFIED API Endpoints (Based on Actual Implementation)

#### Core Authentication & User Management
- `POST /login` - User authentication via CloudAuth
- `POST /signup` - User registration with JWT token
- `POST /logout` - User logout
- `GET /profile` - Get user profile data
- `DELETE /user/delete` - Delete current user account
- `DELETE /user/delete/{userId}` - Admin delete specific user account

#### Primary Chat & AI System
- `POST /ai/adaptive-chat` - **PRIMARY streaming chat** with tool execution & personality adaptation
- `POST /completion` - Legacy fallback chat endpoint
- `POST /upload` - File upload with text extraction (images, PDFs, documents)

#### AI Personality & Emotional Intelligence (VERIFIED)
- `POST /ai/emotional-state` - Analyze user emotional context
- `POST /ai/personality-recommendations` - Get AI personality optimization
- `POST /ai/personalized-insights` - Generate deep personalized analytics
- `POST /ai/personality-feedback` - Submit personality interaction feedback
- `GET /numina-personality/current-state` - Get Numina's current emotional state
- `POST /numina-personality/continuous-updates` - Start continuous personality updates (8s intervals)
- `POST /numina-personality/start-rapid-updates` - Start rapid updates (5s intervals for active chat)
- `POST /numina-personality/react-to-interaction` - Process user interaction for personality adaptation

#### Advanced Analytics & LLM Integration (VERIFIED)
- `POST /analytics/llm` - Analytics processing with LLM integration
- `POST /analytics/llm/insights` - Generate AI-powered insights
- `POST /analytics/llm/weekly-digest` - Generate weekly analytics digest
- `POST /analytics/llm/recommendations` - AI-powered recommendations
- `POST /analytics/llm/patterns` - Deep pattern analysis with LLM
- `GET /personal-insights/growth-summary` - Personal growth summary with streaming support
- `GET /personal-insights/milestones` - User achievement milestones
- `POST /personal-insights/milestones/{id}/celebrate` - Celebrate milestone achievement

#### Emotional Analytics & Sentiment (VERIFIED)
- `POST /emotions` - Submit emotional data for tracking
- `GET /sentiment-data/insights` - Get sentiment analysis insights
- `GET /sentiment-data/aggregated` - Aggregated emotional data with filters
- `GET /sentiment-data/demographics` - Demographic sentiment patterns
- `GET /sentiment-data/realtime` - Real-time sentiment data
- `GET /sentiment-snapshots` - Sentiment snapshots with time range filters

#### Mobile-Specific Optimization (VERIFIED)
- `POST /mobile/batch` - Batch multiple API requests for efficiency
- `GET /mobile/sync` - Mobile data synchronization with timestamps
- `POST /mobile/offline-queue` - Process offline request queue
- `GET /mobile/app-config` - Get mobile app configuration & feature flags
- `POST /mobile/push-token` - Register push notification token (iOS/Android)
- `GET /mobile/realtime-status` - Real-time connection status

#### Cloud & Social Features (VERIFIED)
- `GET /cloud/events` - Get available cloud events
- `POST /cloud/events/match` - AI-powered event matching based on emotional state
- `POST /cloud/events/{id}/compatibility` - Analyze event compatibility
- `POST /cloud/events` - Create new cloud event
- `POST /cloud/events/{id}/join` - Join specific event
- `POST /cloud/events/{id}/leave` - Leave specific event
- `POST /cloud/compatibility/users` - Find compatible users via AI matching
- `POST /social/share-emotion` - Share emotional state with network
- `POST /social/request-support` - Request support from social network

#### AI Tools & Execution (VERIFIED - 25+ Tools)
- `POST /tools/execute` - Execute any of 25+ AI tools with credit management
- `GET /tools/registry` - Get available tools registry with pricing
- `GET /tools/stats` - Tool usage statistics and performance metrics

**Available Tools via `/tools/execute`:**
- `web_search`, `weather_check`, `calculator`, `academic_search`, `code_generator`
- `credit_management`, `crypto_lookup`, `currency_converter`, `email_assistant`, `fitness_tracker`
- `image_search`, `itinerary_generator`, `linkedin_helper`, `music_recommendations`, `news_search`
- `nutrition_lookup`, `password_generator`, `qr_generator`, `reservation_booking`, `social_search`
- `spotify_playlist`, `stock_lookup`, `text_generator`, `timezone_converter`, `translation`

#### Credit & Wallet System (VERIFIED via Tools)
- **All credit operations via `POST /tools/execute` with `credit_management` tool:**
  - `check_balance` - Get current balance & spending limits
  - `add_funds_stripe` - Add funds via Stripe payment
  - `setup_stripe_customer` - Setup Stripe customer account
  - `create_payment_intent` - Create Stripe payment intent
  - `get_transactions` - Get transaction history
  - `verify_account` - Verify user account for credit system
  - `set_limit` - Set spending limits (daily/weekly/monthly/per-transaction)
  - `check_spending` - Validate spending against limits

#### Subscription Management (VERIFIED)
- `GET /subscription/status` - Get Numina Trace subscription status
- `GET /subscription/pricing` - Get subscription pricing plans
- `POST /subscription/numina-trace/subscribe` - Subscribe to Numina Trace
- `POST /subscription/numina-trace/cancel` - Cancel Numina Trace subscription

#### Advanced Recommendation Engine (VERIFIED)
- `POST /cascading-recommendations/generate` - Generate cascading recommendations with reasoning trees
- `GET /cascading-recommendations/context` - Get user context for recommendations

#### Spotify Integration (VERIFIED)
- `POST /auth/spotify/connect` - Connect Spotify account with full profile data
- `POST /auth/spotify/disconnect` - Disconnect Spotify account
- `GET /integration/spotify/status` - Check Spotify connection status
- `POST /integration/spotify/refresh` - Refresh Spotify access tokens

#### Data Synchronization (VERIFIED)
- `POST /sync/process` - Process complete synchronization
- `GET /sync/incremental` - Get incremental sync data with timestamps
- `PUT /user/emotional-profile` - Update user emotional profile

#### System Health & Monitoring (VERIFIED)
- `GET /health` - Overall system health check
- `GET /api/docs` - API documentation endpoint
- `GET /api/stats` - Server statistics and metrics
- `GET /api/test` - API connectivity test

### Implementation Architecture (VERIFIED)

#### Streaming Technology
- **Primary Chat**: Server-Sent Events via XMLHttpRequest for `/ai/adaptive-chat`
- **Growth Insights**: Streaming support for `/personal-insights/growth-summary`
- **Cascading Recommendations**: Streaming support for recommendation generation

#### Tool Detection & Execution
- **25+ AI Tools**: Comprehensive tool ecosystem with emoji pattern recognition
- **Smart Detection**: Real-time tool execution detection from server responses
- **Progress Tracking**: Visual progress indicators with 1.5-second completion timing

#### Mobile Optimization
- **Batch Processing**: Mobile-specific endpoint for efficient API usage
- **Offline Queue**: Comprehensive offline support with priority-based queuing
- **Network Resilience**: Automatic retry with exponential backoff (3 attempts)

#### Security & Authentication
- **JWT Tokens**: Secure token storage via Expo SecureStore
- **CloudAuth Service**: Centralized authentication with automatic logout on 401
- **Security Headers**: X-API-Key, X-App-Version, X-Platform headers for all requests

#### Error Handling & Fallbacks
- **Graceful Degradation**: Automatic fallback to legacy endpoints when needed
- **Network Detection**: NetInfo integration for connection state management
- **Offline Support**: Intelligent queuing of POST/PUT/PATCH requests during network issues

## Mobile App Implementation (VERIFIED)

### Current Architecture Stack
```typescript
// Technology Stack (VERIFIED)
- React Native with Expo SDK 53
- TypeScript with strict typing
- React Navigation v7 for navigation  
- Context API for state management
- Socket.io for real-time features
- Expo SecureStore for token storage
- XMLHttpRequest for streaming chat
- NetInfo for network state management
```

### Navigation Implementation (VERIFIED)
```typescript
// AppNavigator.tsx - Actual implementation
const createMenuHandler = (navigation: any) => (key: string) => {
  switch (key) {
    case 'chat': navigation.navigate('Chat'); break;
    case 'analytics': navigation.navigate('Analytics'); break;
    case 'sentiment': navigation.navigate('Sentiment'); break;
    case 'cloud': navigation.navigate('Cloud'); break;
    case 'wallet': navigation.navigate('Wallet'); break;
    case 'profile': navigation.navigate('Profile'); break;
    case 'settings': navigation.navigate('Settings'); break;
    case 'about': navigation.navigate('About'); break;
    case 'signout': /* Auth routing handles this automatically */; break;
  }
};

// Authenticated routing (VERIFIED implementation)
useEffect(() => {
  if (isAuthenticated) {
    navigationRef.current.reset({
      index: 0,
      routes: [{ name: 'Chat' }],
    });
  } else {
    navigationRef.current.reset({
      index: 0,
      routes: [{ name: 'Hero' }],
    });
  }
}, [isAuthenticated, loading]);
```

### Authentication Implementation (VERIFIED)
```typescript
// CloudAuth service - Actual implementation
const cloudAuth = CloudAuth.getInstance();
const isAuthenticated = cloudAuth.isAuthenticated();
const token = cloudAuth.getToken();
const authHeaders = cloudAuth.getAuthHeaders();

// Authentication flow - VERIFIED
login(email, password) → CloudAuth.login() → JWT storage → Navigation reset
signup(email, password) → CloudAuth.signup() → JWT storage → Navigation reset
logout() → CloudAuth.logout() → Token cleared → Navigation to Hero
```

### Chat System Implementation (VERIFIED)
```typescript
// Primary chat flow via optimizedChatService.ts
1. User enters message in ChatInput component
2. Message sent via ApiService.sendAdaptiveChatMessage() 
3. XMLHttpRequest streaming to /ai/adaptive-chat endpoint
4. Server-Sent Events processed in real-time
5. Tool detection via emoji patterns (🔍, 🎵, 📰, etc.)
6. ToolExecutionService tracks 25+ tool executions
7. MessageBubble displays streaming content
8. Conversation stored in AsyncStorage with sync

// Streaming implementation (VERIFIED)
xhr.onreadystatechange = () => {
  const lines = newText.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const content = line.substring(6).trim();
      if (content !== '[DONE]') {
        onChunk(fullContent);
      }
    }
  }
};
```

### File Upload Implementation (VERIFIED)
```typescript
// File upload flow via fileUploadService.ts
1. User selects file via DocumentPicker/ImagePicker
2. File processed through FileUploadService.uploadFile()
3. FormData sent to POST /upload with JWT auth
4. Server extracts text from PDFs/images
5. File URL + extracted text returned
6. Integration into chat message with file context
7. GPT-4o vision support for image-only messages

// Upload implementation (VERIFIED)
const formData = new FormData();
formData.append('file', {
  uri: fileUri,
  type: mimeType,
  name: fileName,
} as any);

const response = await ApiService.uploadFile(formData);
```

## Mobile App Features (VERIFIED Implementation)

### AI Chat System (VERIFIED)
- **Adaptive Chat**: Primary endpoint `/ai/adaptive-chat` with personality adaptation
- **25+ AI Tools**: Full tool ecosystem via `/tools/execute` (web_search, weather_check, calculator, etc.)
- **Streaming Responses**: Real-time XMLHttpRequest streaming with Server-Sent Events
- **File Support**: Image, text, PDF uploads with GPT-4o vision and text extraction
- **Tool Detection**: Smart emoji pattern recognition (🔍, 🎵, 📰, 💻, etc.)
- **Progress Tracking**: Visual tool execution indicators with ToolExecutionService
- **Fallback System**: Automatic fallback to `/completion` endpoint for reliability

### Advanced Analytics (VERIFIED)
- **Growth Insights**: Personal growth tracking with streaming analytics
- **LLM Integration**: AI-powered analytics via `/analytics/llm/*` endpoints
- **Emotional Tracking**: Real-time emotion submission and analysis
- **Sentiment Analysis**: Demographic and aggregated sentiment data
- **Milestone Tracking**: Achievement system with celebration features
- **Pattern Recognition**: Behavioral pattern analysis with AI insights

### Cloud & Social Features (VERIFIED)
- **Event Matching**: AI-powered event discovery via `/cloud/events/match`
- **Compatibility Analysis**: User and event compatibility scoring
- **Social Sharing**: Emotional state sharing and support requests
- **Community Events**: Create, join, leave events with AI recommendations
- **User Connections**: Find compatible users based on emotional profiles

### Wallet & Subscription System (VERIFIED)
- **Credit Management**: Full credit system via `credit_management` tool
- **Stripe Integration**: Payment processing with PaymentIntent creation
- **Numina Trace Subscription**: Premium subscription management
- **Transaction History**: Complete transaction tracking and reporting
- **Spending Limits**: Configurable daily/weekly/monthly limits
- **Balance Checking**: Real-time balance and limit monitoring

### Mobile Optimization Features (VERIFIED)
- **Batch Processing**: Mobile-specific `/mobile/batch` endpoint for efficiency
- **Offline Queue**: Intelligent offline request queuing with priority system
- **Network Resilience**: NetInfo integration with automatic retry (3 attempts)
- **Push Notifications**: Cross-platform push notification support
- **App Configuration**: Dynamic feature flags via `/mobile/app-config`
- **Incremental Sync**: Efficient data synchronization with timestamps

## Configuration & Environment (VERIFIED)

### Core Configuration Files (VERIFIED)
- **app.json**: Expo app configuration with SDK 53
- **eas.json**: EAS Build profiles (development, preview, production)
- **tsconfig.json**: TypeScript strict configuration 
- **babel.config.js**: Babel with React Native Reanimated plugin
- **src/config/environment.ts**: Production API configuration

### Environment Configuration (VERIFIED)
```typescript
// environment.ts - VERIFIED implementation
API_BASE_URL: 'https://server-a7od.onrender.com' // Always production
STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENVIRONMENT: 'development'
WALLET_FEATURES_ENABLED: true
SSL_PINNING_ENABLED: false (mobile app)
BIOMETRIC_AUTH_ENABLED: false
```

### Required Environment Variables (VERIFIED)
```bash
EXPO_PUBLIC_API_KEY=          # API authentication key for security headers
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Stripe payment processing key
```

### WebSocket Configuration (VERIFIED)
```typescript
// websocketService.ts - VERIFIED implementation
serverUrl: 'wss://server-a7od.onrender.com'
transports: ['polling', 'websocket'] // Polling first for Render.com
reconnectionDelay: 5000ms
maxReconnectionAttempts: 5
timeout: 30000ms
```

## Development Workflows (VERIFIED)

### Adding New Screen (VERIFIED Process)
```typescript
1. Create screen in `src/screens/` (e.g., NewScreen.tsx)
2. Add to RootStackParamList in AppNavigator.tsx:
   export type RootStackParamList = {
     NewScreen: undefined;
   };
3. Add Stack.Screen in AppNavigator.tsx:
   <Stack.Screen name="NewScreen">
     {({ navigation }) => (
       <NewScreen onNavigateBack={() => navigation.goBack()} />
     )}
   </Stack.Screen>
4. Use ScreenWrapper component for consistent layout
5. Add navigation to createMenuHandler if needed
```

### Adding New API Endpoint (VERIFIED Process)
```typescript
1. Add method to src/services/api.ts:
   static async newEndpoint(data: any): Promise<ApiResponse<any>> {
     return this.apiRequest('/new-endpoint', {
       method: 'POST',
       body: JSON.stringify(data),
     });
   }
2. Authentication handled automatically via CloudAuth.getToken()
3. Error handling with 3-attempt retry and offline queue
4. Add TypeScript interfaces in api.ts
5. Handle 401 errors with automatic logout
```

### Chat System Development (VERIFIED Process)
```typescript
1. Tool Detection: Add patterns to detectAndTriggerToolExecution()
2. Streaming: Modify sendAdaptiveChatMessage() for new features
3. UI Updates: Update MessageBubble for new message types
4. Tool Execution: Add to ToolExecutionService for progress tracking
5. Storage: Update conversationStorage for persistence
6. WebSocket: Add real-time events to websocketService.ts
```

### Mobile Optimization Development (VERIFIED Process)
```typescript
1. Offline Support: Add requests to offlineQueue.ts priority system
2. Batch Processing: Use batchApiService.ts for multiple requests
3. Network Resilience: NetInfo integration in api.ts
4. Caching: Implement response caching with similarity matching
5. Performance: Use React.memo, FlatList, and proper cleanup
```

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