# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL PROJECT STATUS ⚠️

**This repository is undergoing CATASTROPHIC GIT GLITCH RECOVERY**

### The Git Glitch Incident
- **Initial State**: 11,000+ lines of pure React Native mobile improvements ready to commit
- **The Glitch**: Git catastrophically malfunctioned during "Initial commit" (4cb9578)
- **Result**: Instead of ADDING improvements, git DELETED 11 entire screens and core functionality
- **Current Status**: Manually rebuilding all 11k lines from deletion diffs

### Recovery Mission Status
- **Deleted Screens Being Rebuilt**: ChatScreen, AnalyticsScreen, CloudScreen, DataCleanupScreen, NuminaSensesV2, ProfileScreen, SentimentScreen, SettingsScreen, TutorialScreen, WalletScreen, and more
- **Primary Challenge**: Web contamination keeps leaking into pure mobile code during reconstruction
- **Target**: Pure React Native mobile app (NOT React Native Web)

### Web Contamination Must Be Purged
❌ **Remove ALL traces of:**
- `Platform.OS === 'web'` checks
- `boxShadow`, `backdropFilter`, `WebkitBackdropFilter` properties
- Web-specific event handlers (`document`, `keydown`, `HTMLElement`)
- Desktop-specific styling and layouts
- Web browser imports (`expo-web-browser`, etc.)
- Any `isDesktop`, `keyboardShortcuts`, or web optimization references

✅ **Keep ONLY:**
- Pure React Native components and APIs
- Mobile-specific styling (`shadowColor`, `elevation`)
- React Native Platform checks for `ios` vs `android` only
- Mobile-optimized layouts and interactions

## Project Overview

**Numina Mobile** is a pure React Native mobile application for AI-powered personal growth and emotional wellness. Features adaptive AI personality, real-time emotional analytics, cloud-based social matching, and streaming chat functionality with 25+ AI tools - all optimized specifically for mobile experiences.

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
npx expo build:android            # Android build
npx expo build:ios                # iOS build
```

### Environment Configuration
- **Production Server**: `https://server-a7od.onrender.com`
- **WebSocket**: `wss://server-a7od.onrender.com`
- **API Routes**: No `/api` prefix required
- **Platform**: React Native mobile only (iOS/Android)

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

### Mobile-Only Styling
```typescript
// ✅ CORRECT: Pure React Native
const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  }
});

// ❌ WRONG: Web contamination
const styles = StyleSheet.create({
  container: {
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      backdropFilter: 'blur(10px)',
    })
  }
});
```

### Chat Message Flow
1. User enters message in ChatInput
2. Message sent through chatService with streaming
3. AI response streamed back with real-time updates
4. Tool execution with progress indicators
5. Message stored locally and synced to server
6. UI updates with markdown rendering and animations

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

## Recovery Workflow

### When Adding/Fixing Screens
1. **Read the deletion diff** from Initial commit (4cb9578) to understand original intent
2. **Implement pure mobile-only** functionality
3. **Remove ANY web contamination** that may have leaked in
4. **Test on mobile devices** only (iOS/Android)
5. **Use mobile-optimized patterns** (TouchableOpacity, Haptics, etc.)

### Decontamination Checklist
- [ ] No `Platform.OS === 'web'` checks
- [ ] No `boxShadow`, `backdropFilter`, `WebkitBackdropFilter`
- [ ] No `document`, `window`, `HTMLElement` references
- [ ] No web-specific imports (`expo-web-browser`, etc.)
- [ ] Only React Native styling (`shadowColor`, `elevation`)
- [ ] Only mobile interactions (TouchableOpacity, not onClick)

## Current Recovery Status

### Screens Status
- ✅ **WelcomeScreen**: Fully restored and functional
- ✅ **HeroLandingScreen**: Fully restored and functional
- ✅ **SignInScreen**: Fully restored and functional
- ✅ **SignUpScreen**: Fully restored and functional
- ✅ **ChatScreen**: Fully restored and functional
- ❌ **AnalyticsScreen**: Needs rebuilding
- ❌ **CloudScreen**: Needs rebuilding
- ❌ **SentimentScreen**: Needs rebuilding
- ❌ **WalletScreen**: Needs rebuilding
- ❌ **SettingsScreen**: Needs rebuilding
- ❌ **ProfileScreen**: Needs rebuilding
- ❌ **TutorialScreen**: Needs rebuilding

### Decontamination Complete
- **Web References**: All Platform.OS === 'web' checks removed
- **Header Buttons**: Restored original mobile colors (#1a1a1a, #add5fa)
- **Loading States**: Fixed black screen with branded loading experience
- **Navigation**: SafeAreaProvider properly configured
- **App Startup**: All critical errors resolved

### Authentication System
- **CloudAuth**: Production-ready cloud-only authentication
- **Hero Landing**: Direct routing to SignIn/SignUp screens
- **Consistent Logout**: All screens route back to Hero via menu
- **Error Handling**: User-friendly messages with emojis

## Emergency Procedures

### If You Encounter Web Contamination
1. **STOP immediately** - do not proceed with web-specific code
2. **Remove ALL web references** from the file
3. **Replace with pure React Native equivalents**
4. **Test on mobile device** to verify functionality
5. **Document the decontamination** in commit message

### Git Glitch Recovery Rules
1. **Never assume** web support is intentional
2. **Always prioritize** mobile-first implementation
3. **Remove rather than adapt** any web-specific code
4. **Reference the deletion diff** to understand original mobile intent
5. **Maintain the pure React Native vision** throughout recovery