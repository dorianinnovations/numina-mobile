# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style Guidelines

- IMPORTANT: DO NOT ADD ANY COMMENTS to code unless explicitly requested by the user

## Project Overview

**Numina Mobile** is a premium React Native mobile application for AI-powered personal growth and emotional wellness. The app features adaptive AI personality, real-time emotional analytics, cloud-based social matching, streaming chat functionality with 25+ AI tools, and a sophisticated holographic UI design system - all optimized for mobile experiences.

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
- **React Native SVG** for premium UI effects
- **React Native Reanimated** for smooth animations
- **Expo BlurView** for glassmorphism effects

### Component Architecture (Current Implementation)
```
src/
├── screens/               # Navigation endpoints (15 screens)
│   ├── HeroLandingScreen.tsx     # App entry point
│   ├── SignInScreen.tsx          # Authentication
│   ├── SignUpScreen.tsx          # User registration
│   ├── ChatScreen.tsx            # Main chat interface
│   ├── TutorialScreen.tsx        # Feature tutorial
│   ├── AnalyticsScreen.tsx       # Enhanced analytics with real-time charts
│   ├── CloudFind.tsx           # Social features
│   ├── WalletScreen.tsx          # Credits/subscription
│   ├── LegacyWalletScreen.tsx    # Legacy wallet view
│   ├── SettingsScreen.tsx        # App settings
│   ├── AboutScreen.tsx           # About page
│   ├── ProfileScreen.tsx         # User profile
│   ├── SentimentScreen.tsx       # Sentiment analysis
│   ├── DataCleanupScreen.tsx     # Data management
│   ├── WelcomeScreen.tsx         # Welcome flow
│   └── NuminaSensesV2.tsx        # Advanced AI features
├── components/           # Premium UI components (80+ components)
│   ├── ui/               # Core UI components
│   │   ├── Header.tsx            # Navigation header
│   │   ├── HeaderMenu.tsx        # Header menu system
│   │   ├── HeaderGradient.tsx    # Header gradient effects
│   │   ├── PageBackground.tsx    # Background component
│   │   ├── ScreenWrapper.tsx     # Screen layout wrapper
│   │   ├── CustomAlert.tsx       # Custom alert system
│   │   ├── SkeletonLoader.tsx    # Loading skeleton
│   │   ├── OptimizedImage.tsx    # Optimized image component
│   │   └── FontProvider.tsx      # Font management
│   ├── animations/       # Animation components
│   │   ├── AnimatedGradientBorder.tsx # Animated border effects
│   │   ├── AnimatedGlowEffects.tsx    # Glow animations
│   │   ├── AnimatedBackArrow.tsx      # Back arrow animation
│   │   ├── AnimatedHamburger.tsx      # Hamburger menu animation
│   │   ├── InteractiveParticles.tsx   # Particle effects
│   │   ├── BlobBackground.tsx         # Animated blob backgrounds
│   │   ├── FadeInDown.tsx             # Fade animation
│   │   └── StarField.tsx              # Star field effect
│   ├── loaders/          # Loading components
│   │   ├── EnhancedSpinner.tsx   # Holographic loading spinner
│   │   ├── NuminaSpinner.tsx     # Numina branded spinner
│   │   ├── ModernLoader.tsx      # Modern loading component
│   │   └── LiquidProgress.tsx    # Liquid progress indicator
│   ├── cards/            # Card components
│   │   ├── ChromaticCard.tsx     # Premium card with shine effects
│   │   ├── WalletCard.tsx        # Wallet card components
│   │   ├── AnalyticsCard.tsx     # Analytics display cards
│   │   └── TierBadge.tsx         # Tier indication badge
│   ├── modals/           # Modal components
│   │   ├── SubscriptionModal.tsx # Subscription management
│   │   ├── ToolExecutionModal.tsx # AI tool execution
│   │   ├── LinkConfirmationModal.tsx # Link confirmation
│   │   ├── SignOutModal.tsx      # Sign out confirmation
│   │   └── QuickAnalyticsModal.tsx # Quick analytics
│   ├── sandbox/          # Sandbox-related components
│   │   ├── SandboxInput.tsx      # Sandbox input interface
│   │   ├── SandboxModalManager.tsx # Modal management
│   │   ├── SandboxNodes.tsx      # Node components
│   │   └── SandboxNodeCanvas.tsx # Node canvas
│   ├── nodes/            # Node canvas components
│   │   ├── InfiniteNodeCanvas.tsx # Infinite scrolling canvas
│   │   ├── NodeCanvas.tsx        # Main node canvas
│   │   ├── StaticNodeCanvas.tsx  # Static node display
│   │   └── VirtualNodeRenderer.tsx # Virtual rendering
│   ├── analytics/        # Analytics components
│   │   ├── LLMAnalyticsSection.tsx # Analytics display
│   │   ├── CascadingRecommendations.tsx # AI recommendations
│   │   └── AIInsightDisplay.tsx  # AI insights
│   ├── ai/               # AI-related components
│   │   ├── AIToolExecutionStream.tsx # Tool execution streaming
│   │   ├── ChainOfThoughtProgress.tsx # CoT progress
│   │   ├── ReasoningTreeVisualization.tsx # Reasoning display
│   │   └── ToolStatusIndicator.tsx # Tool status
│   ├── text/             # Text components  
│   │   ├── StreamingMarkdown.tsx # Markdown streaming
│   │   ├── TypewriterText.tsx    # Typewriter effect
│   │   └── SimpleStreamingText.tsx # Simple text streaming
│   ├── selectors/        # Selector components
│   │   ├── ExperienceLevelSelector.tsx # User experience selection
│   │   ├── ThemeSelector.tsx     # Theme selection
│   │   └── BorderThemeSelector.tsx # Border theme selection
│   ├── effects/          # Visual effects
│   │   └── ShineEffect.tsx       # Premium shine animations
│   ├── legal/            # Legal components
│   │   ├── TermsOfService.tsx    # Terms of service modal
│   │   └── PrivacyPolicy.tsx     # Privacy policy modal
│   ├── dev/              # Development tools
│   │   ├── DevTools.tsx          # Development utilities
│   │   ├── ChatErrorBoundary.tsx # Error boundary
│   │   └── UpgradePrompt.tsx     # Upgrade prompts
│   ├── chat/             # Chat-specific components
│   │   ├── ChatInput.tsx         # Message input
│   │   ├── MessageBubble.tsx     # Message display
│   │   ├── AttachmentPreview.tsx # Attachment preview
│   │   └── PhotoPreview.tsx      # Photo handling
│   ├── charts/           # Chart components
│   │   ├── AnalyticsChartComponents.tsx # Chart components
│   │   └── EnhancedCharts.tsx    # Enhanced chart displays
│   ├── premium/          # Premium UI components
│   │   └── [Premium component examples] # Premium component demos
│   └── ConversationHistory.tsx   # Conversation management
├── contexts/             # React Context providers
│   ├── SimpleAuthContext.tsx     # Authentication state
│   ├── ThemeContext.tsx          # Theme management
│   └── RefreshContext.tsx        # Pull-to-refresh context
├── hooks/                # Custom React hooks (9+ hooks)
│   ├── useCloudMatching.ts       # Social matching
│   ├── useEmotionalAnalytics.ts  # Emotion tracking
│   ├── useLLMAnalytics.ts        # LLM-powered analytics
│   ├── useNuminaPersonality.ts   # Numina personality
│   ├── useRealTimeEvents.ts      # Real-time features
│   ├── usePullToRefresh.ts       # Pull to refresh
│   ├── useLocation.ts            # Location services
│   └── useComprehensiveAnalytics.ts # Advanced analytics
├── services/             # API and business logic (38 services)
│   ├── api.ts                    # Main API service
│   ├── cloudAuth.ts              # Authentication
│   ├── chatService.ts            # Chat functionality
│   ├── optimizedStreamingService.ts # Optimized streaming
│   ├── websocketService.ts       # WebSocket connections
│   ├── enhancedWebSocketService.ts # Enhanced WebSocket
│   ├── fileUploadService.ts      # File handling
│   ├── toolExecutionService.ts   # AI tool execution
│   ├── cloudMatchingService.ts   # Social matching
│   ├── emotionalAnalyticsAPI.ts  # Emotion analysis
│   ├── comprehensiveAnalytics.ts # Advanced analytics
│   ├── personalizedInsightsService.ts # Personalized insights
│   ├── spotifyService.ts         # Spotify integration
│   ├── autoPlaylistService.ts    # Auto playlist generation
│   ├── batchApiService.ts        # Batch operations
│   ├── offlineQueue.ts           # Offline support
│   ├── realTimeSync.ts           # Real-time sync
│   ├── secureStorage.ts          # Secure data storage
│   ├── secureCloudStorageService.ts # Cloud storage
│   ├── settingsService.ts        # App settings
│   ├── syncService.ts            # Data synchronization
│   ├── userDataSync.ts           # User data sync
│   ├── conversationStorage.ts    # Conversation storage
│   ├── dataManager.ts            # Data management
│   ├── dataAuditService.ts       # Data auditing
│   ├── errorMonitoring.ts        # Error monitoring
│   ├── weatherService.ts         # Weather services
│   ├── locationContextService.ts # Location context
│   ├── analyticsNotificationService.ts # Analytics notifications
│   ├── offlineEmotionStorage.ts  # Offline emotion storage
│   ├── appConfigService.ts       # App configuration
│   ├── appInitializer.ts         # App initialization
│   ├── aiInsightEngine.ts        # AI insight generation
│   └── [6+ more services]        # Additional services
├── utils/                # Utility functions
│   ├── animations.ts             # Animation helpers
│   ├── colors.ts                 # Color definitions
│   ├── commonStyles.ts           # Shared styles
│   ├── fonts.ts                  # Font management
│   ├── themes.ts                 # Theme definitions
│   ├── logger.ts                 # Logging utilities
│   └── errorHandler.ts           # Error handling
├── types/                # TypeScript type definitions
│   ├── message.ts                # Message types
│   └── theme.ts                  # Theme types
├── config/               # Configuration files
│   ├── environment.ts            # Environment config
│   └── productionDirect.ts       # Production config
├── assets/               # Application assets
│   └── images/                   # Image assets
└── navigation/           # Navigation configuration
    └── AppNavigator.tsx          # Main navigation stack with holographic spinner
```

## Premium UI Design System

### Holographic Effects
- **EnhancedSpinner**: Premium holographic loading spinner with curved arcs
- **ShineEffect**: Dual-layer shine animations for premium card effects
- **ChromaticCard**: Tier-based cards with luxury shine effects (Core/Aether)

### Animation System
- **AnimatedGradientBorder**: Dynamic gradient border animations
- **AnimatedGlowEffects**: Sophisticated glow and particle effects
- **InteractiveParticles**: Interactive particle system for engagement

### Card Design System
- **BaseWalletCard**: Foundation card with premium shadows and borders
- **WalletCard**: Specialized wallet components (Balance, Package, Discount)
- **ChromaticCard**: Tier-based premium cards with holographic effects

### Loading & Feedback
- **EnhancedSpinner**: Multiple types (ring, morphing, holographic, particle)
- **ToolExecutionModal**: AI tool execution progress with visual feedback
- **ConversationHistory**: Premium conversation management with wallet-style cards

## API Integration

### Server Configuration
- **Production API**: `https://server-a7od.onrender.com` (Always used)
- **WebSocket**: `wss://server-a7od.onrender.com` for real-time features
- **Authentication**: JWT tokens via CloudAuth service stored in SecureStore
- **Primary Chat Endpoint**: `/ai/adaptive-chat` (Production streaming)
- **Fallback Chat Endpoint**: `/completion` (Legacy support)

### Authentication Flow
```
Hero Landing → Tutorial (optional) → SignUp/SignIn → Experience Level → Chat
```

### Core API Endpoints

#### Authentication & User Management
- `POST /login` - User authentication via CloudAuth
- `POST /signup` - User registration with JWT token
- `POST /logout` - User logout
- `GET /profile` - Get user profile data
- `DELETE /user/delete` - Delete current user account

#### Primary Chat & AI System
- `POST /ai/adaptive-chat` - **PRIMARY streaming chat** with tool execution
- `POST /completion` - Legacy fallback chat endpoint
- `POST /upload` - File upload with text extraction (images, PDFs, documents)

#### AI Tools & Execution (25+ Tools)
- `POST /tools/execute` - Execute any of 25+ AI tools with credit management
- `GET /tools/registry` - Get available tools registry with pricing
- `GET /tools/stats` - Tool usage statistics

**Available Tools via `/tools/execute`:**
- `web_search`, `weather_check`, `calculator`, `academic_search`, `code_generator`
- `credit_management`, `crypto_lookup`, `currency_converter`, `email_assistant`
- `fitness_tracker`, `image_search`, `itinerary_generator`, `linkedin_helper`
- `music_recommendations`, `news_search`, `nutrition_lookup`, `password_generator`
- `qr_generator`, `reservation_booking`, `social_search`, `spotify_playlist`
- `stock_lookup`, `text_generator`, `timezone_converter`, `translation`

#### Wallet & Credit System
- **All credit operations via `POST /tools/execute` with `credit_management` tool:**
  - `check_balance` - Get current balance & spending limits
  - `add_funds_stripe` - Add funds via Stripe payment
  - `setup_stripe_customer` - Setup Stripe customer account
  - `create_payment_intent` - Create Stripe payment intent
  - `get_transactions` - Get transaction history
  - `verify_account` - Verify user account for credit system
  - `set_limit` - Set spending limits

#### Subscription Management
- `GET /subscription/status` - Get Numina Trace subscription status
- `GET /subscription/pricing` - Get subscription pricing plans
- `POST /subscription/numina-trace/subscribe` - Subscribe to Numina Trace
- `POST /subscription/numina-trace/cancel` - Cancel subscription

#### Analytics & Insights
- `POST /analytics/llm` - Analytics processing with LLM integration
- `POST /analytics/llm/insights` - Generate AI-powered insights
- `POST /analytics/llm/recommendations` - AI-powered recommendations
- `GET /personal-insights/growth-summary` - Personal growth summary
- `POST /emotions` - Submit emotional data for tracking
- `GET /sentiment-data/insights` - Get sentiment analysis insights

#### Cloud & Social Features
- `GET /cloud/events` - Get available cloud events
- `POST /cloud/events/match` - AI-powered event matching
- `POST /cloud/compatibility/users` - Find compatible users
- `POST /social/share-emotion` - Share emotional state

#### Mobile Optimization
- `POST /mobile/batch` - Batch multiple API requests for efficiency
- `GET /mobile/sync` - Mobile data synchronization with timestamps
- `POST /mobile/offline-queue` - Process offline request queue
- `GET /mobile/app-config` - Get mobile app configuration

## Implementation Architecture

### Streaming Technology
- **Primary Chat**: Server-Sent Events via XMLHttpRequest for `/ai/adaptive-chat`
- **Tool Execution**: Real-time progress tracking with visual indicators
- **Enhanced Spinner**: Holographic loading with perfect timing (700ms rotation)

### Premium Loading Experience
- **First Loading Message**: "Tip: Swipe down to refresh a view"
- **Holographic Spinner**: Thin curved arc with dual-layer iridescent gradient
- **Dramatic Timing**: 200ms pause + smooth 700ms rotation for premium feel

### Authentication Implementation
```typescript
// CloudAuth service - Singleton pattern
const cloudAuth = CloudAuth.getInstance();
const isAuthenticated = cloudAuth.isAuthenticated();
const token = cloudAuth.getToken();

// Authentication flow
login(email, password) → CloudAuth.login() → JWT storage → Navigation reset
signup(email, password) → CloudAuth.signup() → Experience Level → Chat
logout() → CloudAuth.logout() → Token cleared → Navigation to Hero
```

### Chat System Implementation
```typescript
// Primary chat flow via optimizedStreamingService.ts
1. User enters message in ChatInput component
2. Message sent via ApiService.sendAdaptiveChatMessage() 
3. XMLHttpRequest streaming to /ai/adaptive-chat endpoint
4. Server-Sent Events processed in real-time
5. Tool detection via emoji patterns (🔍, 🎵, 📰, etc.)
6. ToolExecutionService tracks 25+ tool executions
7. MessageBubble displays streaming content
8. Conversation stored via conversationStorage.ts
```

### Premium Card System
```typescript
// Wallet-style cards throughout app
import { BaseWalletCard, BalanceCard, PackageCard } from '../components/cards/WalletCard';

// Usage in ConversationHistory with premium styling
<BaseWalletCard
  onPress={() => onSelectConversation(item)}
  style={conversationCardStyles}
>
  {/* Conversation content with premium shadows & borders */}
</BaseWalletCard>
```

## Mobile App Features

### AI Chat System
- **Adaptive Chat**: Primary streaming endpoint with personality adaptation
- **25+ AI Tools**: Full tool ecosystem with emoji pattern recognition
- **File Support**: Image, text, PDF uploads with GPT-4o vision
- **Tool Detection**: Smart emoji pattern recognition and execution
- **Progress Tracking**: Premium visual indicators with holographic spinner

### Premium UI Features
- **Holographic Loading**: Curved arc spinner with iridescent gradients
- **Shine Effects**: Dual-layer card animations for tier differentiation
- **Wallet-Style Cards**: Consistent premium card design throughout app
- **Smooth Animations**: 60fps animations with React Native Reanimated
- **Glassmorphism**: Blur effects and translucent surfaces

### Advanced Analytics
- **LLM Integration**: AI-powered analytics processing
- **Emotional Tracking**: Real-time emotion submission and analysis
- **Growth Insights**: Personal growth tracking with streaming analytics
- **Pattern Recognition**: Behavioral pattern analysis with AI insights

### Wallet & Subscription System
- **Credit Management**: Full Stripe integration with PaymentIntent creation
- **Numina Trace Subscription**: Premium tier with enhanced features
- **Transaction History**: Complete tracking with spending limits
- **Premium Cards**: Tier-based cards (Core/Aether) with shine effects

### Mobile Optimization
- **Offline Queue**: Intelligent request queuing with priority system
- **Network Resilience**: NetInfo integration with automatic retry
- **Batch Processing**: Mobile-specific endpoints for efficiency
- **Conversation Storage**: Local storage with cloud sync

## Configuration & Environment

### Core Configuration Files
- **app.json**: Expo app configuration with SDK 53
- **eas.json**: EAS Build profiles (development, preview, production)
- **tsconfig.json**: TypeScript strict configuration 
- **babel.config.js**: Babel with React Native Reanimated plugin

### Environment Configuration
```typescript
// environment.ts
API_BASE_URL: 'https://server-a7od.onrender.com' // Always production
STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENVIRONMENT: 'development'
WALLET_FEATURES_ENABLED: true
```

### Required Environment Variables
```bash
EXPO_PUBLIC_API_KEY=          # API authentication key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Stripe payment processing
```

## Development Workflows

### Adding New Screen
```typescript
1. Create screen in `src/screens/` (e.g., NewScreen.tsx)
2. Add to RootStackParamList in AppNavigator.tsx
3. Add Stack.Screen with proper navigation props
4. Use ScreenWrapper for consistent layout
5. Add to createMenuHandler if needed for navigation menu
```

### Adding Premium UI Component
```typescript
1. Create component in appropriate `src/components/` subfolder (ui/, cards/, modals/, etc.)
2. Use BaseWalletCard for card-style components
3. Import ShineEffect for premium shine animations
4. Use EnhancedSpinner for loading states
5. Follow holographic design system patterns
```

### Chat System Development
```typescript
1. Tool Detection: Add patterns to toolExecutionService.ts
2. Streaming: Modify optimizedStreamingService.ts
3. UI Updates: Update MessageBubble for new message types
4. Tool Execution: Add progress tracking with premium spinners
5. Storage: Update conversationStorage.ts for persistence
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
- Cloud-only authentication - no local credential storage
- Proper authentication flow with automatic logout on 401
- SSL pinning for production builds

### Data Protection
- Input validation and sanitization
- Secure file upload handling
- No hardcoded secrets in source code
- Proper error handling without data exposure

## Performance Optimization

### Animation Performance
- React Native Reanimated for 60fps animations
- Native driver usage for all transforms
- Proper animation cleanup in useEffect hooks
- Hardware acceleration for premium effects

### Memory Management
- React.memo for expensive components
- Proper cleanup in useEffect hooks
- FlatList for large data sets
- Efficient image handling and preloading

### Network Optimization
- WebSocket for real-time features
- Request caching and retry logic
- Offline queue for network resilience
- Batch processing for mobile efficiency

## Premium Design Philosophy

### Holographic Aesthetics
- Thin curved arcs with iridescent gradients
- Dual-layer depth effects for sophistication
- Dramatic timing (200ms pause + 700ms rotation)
- Premium color palettes with temperature shifts

### Card Design System
- Wallet-inspired card hierarchy throughout app
- Consistent shadows, borders, and spacing
- Tier-based visual differentiation (Core vs Aether)
- Smooth hover and interaction states

### Animation Principles
- Physics-based motion with proper easing
- Layered effects for depth perception
- Respectful timing that feels premium
- Micro-interactions that enhance usability

## Current Status

### Core Functionality
- ✅ Authentication system with experience level selection
- ✅ Chat system with streaming and 25+ AI tools
- ✅ Premium holographic loading spinner
- ✅ Wallet-style card design system throughout app
- ✅ Navigation with sophisticated menu system
- ✅ File upload with GPT-4o vision support
- ✅ Real-time features via WebSocket

### Premium UI Implementation
- ✅ Holographic spinner with curved arc design
- ✅ Dual-layer shine effects on tier cards
- ✅ Wallet-style cards in conversation history
- ✅ Animated gradient borders and glow effects
- ✅ Premium loading messages with helpful tips

### In Development
- 🔄 Advanced social matching algorithms
- 🔄 Enhanced subscription tier features
- 🔄 Additional premium animation effects
- 🔄 Performance optimizations for complex animations

This mobile app serves as a premium interface for the Numina AI platform, providing sophisticated AI-powered personal growth tools with a luxury mobile experience featuring holographic UI elements and wallet-inspired design consistency.