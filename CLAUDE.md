# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Numina Web** is a desktop-optimized web application built from the React Native codebase using React Native Web. This is the desktop/web version of the Numina AI-powered personal growth and emotional wellness platform. The app features adaptive AI personality, real-time emotional analytics, cloud-based social matching, and streaming chat functionality with 25+ AI tools - all optimized for desktop/web experiences.

## Development Commands

### Core Development
```bash
# Development server
npm start                         # Start web development server
npm run dev                       # Alternative development command

# Testing
npm test                          # Run Jest tests
npm run test:watch                # Run tests in watch mode  
npm run test:e2e                  # Run end-to-end tests

# Building
npm run build                     # Build for web production
npm run build:production          # Optimized production build
npm run serve                     # Serve built files locally
npm run deploy                    # Build and serve in one command

# Web-specific
npx expo start --web              # Direct Expo web start
expo export --platform web        # Export web build
```

### Environment Configuration
- **Production Server**: `https://server-a7od.onrender.com`
- **WebSocket**: `wss://server-a7od.onrender.com`
- **API Routes**: No `/api` prefix required
- **Auto-deploy**: Render handles production deployment

## Architecture Overview

### Cloud-First Authentication System
The app uses a simplified cloud-first authentication architecture:

#### CloudAuth Service (`src/services/cloudAuth.ts`)
- **Pure Cloud-Only**: No local storage, stateless authentication
- **Simple API**: `login(email, password)`, `logout()`, `isAuthenticated()`
- **User-Friendly Errors**: Emojis and clear messaging
- **Instant Initialization**: No complex session restoration

```typescript
// Simple CloudAuth usage
const cloudAuth = CloudAuth.getInstance();
const isAuthenticated = cloudAuth.isAuthenticated();
const token = cloudAuth.getToken();
const userId = cloudAuth.getCurrentUserId();
```

#### Authentication Flow
```
Hero → SignIn/SignUp → (Success) → Chat
Any Screen → Menu → Sign Out → Hero
```

### Key Services Layer
- **cloudAuth.ts**: Cloud-only authentication service
- **api.ts**: Main API service with authentication and network handling
- **chatService.ts**: Chat functionality with streaming support
- **websocketService.ts**: Real-time WebSocket communication
- **conversationStorage.ts**: Local chat history persistence
- **toolExecutionService.ts**: AI tool execution with progress tracking

### Component Architecture
- **screens/**: Navigation endpoints (ChatScreen, AnalyticsScreen, etc.)
- **components/**: Reusable UI components with chat/ subdirectory
- **contexts/**: React Context providers for state management
- **hooks/**: Custom React hooks for business logic
- **services/**: API and business logic services
- **utils/**: Utility functions and styling helpers

## API Integration

### Server Routes
- **Health**: `GET /health`
- **Authentication**: 
  - `POST /signup` - Create user account
  - `POST /login` - User login
- **Chat**: `POST /ai/adaptive-chat` - Main chat endpoint with tool execution
- **Tools**: `GET /tools/available` - Get available AI tools
- **User**: `GET /user/profile` - User profile data

### Authentication Headers
```bash
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Response Format
```javascript
// SUCCESS: {"status": "success", "token": "...", "data": {"user": {...}}}
// ERROR: {"status": "error", "message": "Incorrect email or password."}
```

## Key Development Patterns

### Chat Message Flow
1. User enters message in ChatInput
2. Message sent through chatService with streaming
3. AI response streamed back with real-time updates
4. Tool execution with progress indicators
5. Message stored locally and synced to server
6. UI updates with markdown rendering and animations

### File Upload Flow
1. User selects file via AttachmentPicker
2. File preview shown with AttachmentPreview
3. Upload through fileUploadService with progress tracking
4. Server processing (compression, text extraction)
5. Integration into chat context

### Navigation Pattern
```typescript
// AppNavigator uses createMenuHandler for consistent signout
const createMenuHandler = (navigation: any) => (key: string) => {
  switch (key) {
    case 'signout': logout(); break; // Returns to Hero automatically
    case 'chat': navigation.navigate('Chat'); break;
    // ... other cases
  }
};
```

## Technology Stack

### Core Framework
- **React Native** with **Expo SDK 53**
- **TypeScript** with strict typing enabled
- **React Navigation v7** for navigation
- **Context API** for state management

### Key Dependencies
- **@react-navigation/native** + **@react-navigation/stack**: Navigation
- **@react-native-async-storage/async-storage**: Local storage
- **socket.io-client**: WebSocket communication
- **react-native-reanimated**: High-performance animations
- **expo-image-picker**: File and image selection
- **react-native-markdown-display**: Markdown rendering

### Package Versions
- React Native: 0.79.5
- Expo: ~53.0.17
- TypeScript: ~5.8.3
- React Navigation: ^7.x
- Socket.io Client: ^4.8.1

## Configuration Files

### Critical Configuration
- **app.json**: Expo app configuration with bundle identifiers
- **eas.json**: EAS Build profiles (development, preview, production)
- **tsconfig.json**: TypeScript with strict mode enabled
- **babel.config.js**: Babel with Reanimated plugin (must be last)

### Environment Variables
- `EXPO_PUBLIC_API_KEY`: API authentication key
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe payment key

## Common Development Tasks

### Adding New Screen
1. Create screen component in `src/screens/`
2. Add to navigation stack in `AppNavigator.tsx`
3. Use `createMenuHandler(navigation)` for consistent menu behavior
4. Follow existing screen patterns (Header, PageBackground, etc.)

### Adding New API Service
1. Add methods to `src/services/api.ts`
2. Handle authentication with `cloudAuth.getAuthHeaders()`
3. Implement error handling and retry logic
4. Add TypeScript interfaces for request/response

### Adding New Chat Feature
1. Extend Message interface in `src/types/message.ts`
2. Update MessageBubble component for display
3. Modify ChatInput for user input
4. Update conversationStorage for persistence

## Debugging Common Issues

### Authentication Issues
- Use `CloudAuth.getInstance().getToken()` for tokens
- Use `CloudAuth.getInstance().isAuthenticated()` for auth status
- Verify API_BASE_URL points to `https://server-a7od.onrender.com`
- CloudAuth works immediately, no initialization needed

### Chat Streaming Issues
- Verify WebSocket connection status
- Check adaptive chat endpoint (`/ai/adaptive-chat`) is responding
- Monitor tool execution patterns in server response chunks
- Verify `toolExecutionService.processStreamingToolResponse()` calls

### Tool Execution Issues
- Check server logs for "25 tools loaded"
- Monitor `AIToolExecutionStream` component for tool updates
- Verify tool execution detection in streaming responses

## Performance Considerations

### Memory Management
- Use `React.memo` for expensive components
- Implement proper cleanup in useEffect hooks
- Use FlatList for large lists with proper keyExtractor

### Network Optimization
- Use WebSocket for real-time features
- Compress images before upload
- Handle network failures gracefully

### Animation Performance
- Use react-native-reanimated for 60fps animations
- Avoid animating layout properties
- Use native driver when possible

## Security Considerations

### Authentication Security
- Pure cloud-only JWT tokens - no local storage
- Stateless authentication - tokens exist only in memory
- User-friendly error handling with input validation
- SSL pinning enabled for production builds

### Data Protection
- No sensitive data stored locally
- No hardcoded secrets in source code
- Input validation and sanitization

## Build and Deployment

### Development Builds
```bash
eas build --profile development    # Development build
eas build --profile preview        # Preview build for testing
```

### Production Builds
```bash
eas build --profile production     # Production build for stores
eas submit -p ios                  # Submit to App Store
eas submit -p android              # Submit to Google Play
```

## Testing

```bash
npm test                           # Run all tests
npm test -- ChatScreen.test.tsx   # Run specific test
npm test -- --coverage            # Run with coverage
npm run test:e2e                   # Run E2E tests
```

## Current System Status

### Authentication System
- **CloudAuth**: Production-ready cloud-only authentication
- **Hero Landing**: Direct routing to SignIn/SignUp screens
- **Consistent Logout**: All screens route back to Hero via menu
- **Error Handling**: User-friendly messages with emojis

### Chat System
- **Adaptive Chat**: Uses `/ai/adaptive-chat` endpoint
- **Tool System**: 25+ tools with streaming execution
- **Real-time Features**: WebSocket connections for live updates
- **Personality Context**: AI adaptation based on user behavior

### Production Readiness
- **API Integration**: All endpoints working correctly
- **State Management**: Clean authentication state handling
- **Error Boundaries**: Comprehensive error handling
- **Performance**: Optimized for mobile with proper caching