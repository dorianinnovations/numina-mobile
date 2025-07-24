// Animation constants - Optimized for 60fps
export const ANIMATION_DURATIONS = {
  FADE_IN: 600,
  CURSOR_BLINK_ON: 530,
  CURSOR_BLINK_OFF: 530,
  CURSOR_TYPING_ON: 80,
  CURSOR_TYPING_OFF: 80,
  CURSOR_BACKSPACE_ON: 50,
  CURSOR_BACKSPACE_OFF: 50,
  CURSOR_TYPO_ON: 30,
  CURSOR_TYPO_OFF: 30,
  SOLO_CURSOR_INVITE: 4000,
  GHOST_START_DELAY: 6000,
  PILLS_FADE: 150,
  INPUT_CONTAINER: 200,
  SEND_BUTTON_IN: 300,
  SEND_BUTTON_OUT: 150,
  BUTTON_CONTENT: 100,
  BUTTON_CONTENT_RESET: 150,
  KEYBOARD_SHOW: 250,
  KEYBOARD_HIDE: 250,
  HEADER_FADE: 100,
  NODE_ANIMATION: 300,
  NODE_SCALE: 500,
  NODE_STAGGER: 100,
  NODE_ENTRANCE_DELAY: 50,
  NODE_EXIT: 150,
} as const;

// Layout constants - Optimized for performance
export const LAYOUT = {
  SCREEN_PADDING: 40,
  INPUT_MAX_WIDTH: 600,
  INPUT_MIN_HEIGHT: 70,
  INPUT_PADDING: 20,
  SEND_BUTTON_SIZE: 44,
  SEND_BUTTON_HEIGHT: 32,
  SEND_BUTTON_RADIUS: 16,
  PILL_GAP: 8,
  PILL_PADDING_VERTICAL: 8,
  PILL_PADDING_HORIZONTAL: 12,
  PILL_RADIUS: 20,
  NODE_SIZE: 24,
  NODE_RADIUS: 12,
  NODE_TEXT_WIDTH: 28,
  NODE_TEXT_TOP: 28,
  NODE_TEXT_LEFT: -2,
  CONNECTION_HEIGHT: 2,
  INSIGHT_GLOW_SIZE: 50,
  INSIGHT_PULSE_SIZE: 48,
  // Constrained canvas for better performance
  CANVAS_MAX_WIDTH: 320,
  CANVAS_MAX_HEIGHT: 480,
  CANVAS_PADDING: 40,
  MAX_VISIBLE_NODES: 15,
  MAX_VISIBLE_CONNECTIONS: 10,
} as const;

// Typography constants
export const TYPOGRAPHY = {
  INPUT_FONT_SIZE: 24,
  INPUT_FONT_WEIGHT: '300',
  GHOST_FONT_SIZE: 20,
  GHOST_FONT_WEIGHT: '300',
  GHOST_LINE_HEIGHT: 26,
  GHOST_LETTER_SPACING: 0.2,
  PILL_LABEL_SIZE: 14,
  PILL_LABEL_WEIGHT: '500',
  PILL_TEXT_SIZE: 13,
  PILL_TEXT_WEIGHT: '500',
  NODE_TITLE_SIZE: 8,
  NODE_TITLE_WEIGHT: '600',
  NODE_TITLE_LINE_HEIGHT: 10,
  NODE_HOOK_SIZE: 7,
  NODE_HOOK_WEIGHT: '400',
  SEND_ICON_SIZE: 17,
  DUAL_ICON_SIZE: 12,
  MULTI_ICON_SIZE: 10,
  PLUS_ICON_SIZE: 8,
  ACTION_COUNT_SIZE: 9,
  ACTION_COUNT_WEIGHT: '700',
  INSIGHT_ICON_SIZE: 8,
  LOCK_ICON_SIZE: 8,
} as const;

// Color constants
export const COLORS = {
  SEND_BUTTON_DEFAULT: '#1a1a1a',
  SEND_BUTTON_MULTI: '#8B5CF6',
  GHOST_TEXT_DARK: 'rgba(255,255,255,0.4)',
  GHOST_TEXT_LIGHT: 'rgba(0,0,0,0.4)',
  PILL_LABEL_DARK: '#888',
  PILL_LABEL_LIGHT: '#666',
  NODE_TITLE_DARK: '#fff',
  NODE_TITLE_LIGHT: '#333',
  NODE_HOOK_DARK: '#ccc',
  NODE_HOOK_LIGHT: '#666',
  CONNECTION_PERSONAL: '#EC4899',
  CONNECTION_CATEGORICAL: '#3B82F6',
  CONNECTION_DEFAULT: '#10B981',
  INSIGHT_HIDDEN: '#C4B5FD',
  INSIGHT_BEHAVIORAL: '#A7F3D0',
  INSIGHT_EMOTIONAL: '#FBCFE8',
  INSIGHT_TEMPORAL: '#FDE68A',
  NODE_LOCKED: '#A7F3D0',
  NODE_PERSONAL: '#FBCFE8',
  NODE_DEFAULT: '#BFDBFE',
  INSIGHT_BORDER: '#8B5CF6',
  CONNECTION_INDICATOR: '#10B981',
  ACTION_COUNT: '#8B5CF6',
} as const;

// API constants
export const API_ENDPOINTS = {
  GENERATE_NODES: 'https://server-a7od.onrender.com/sandbox/generate-nodes',
} as const;

// WebSocket constants
export const WEBSOCKET_EVENTS = {
  INSIGHT_DISCOVERY: 'insight_discovery',
  PATTERN_ANALYSIS: 'pattern_analysis',
  PATTERN_TRIGGERED: 'pattern_triggered',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  AI_GENERATION_FAILED: '⚠️ AI node generation unavailable, using contextual fallback:',
  SAVE_SESSION_FAILED: '⚠️ Failed to save sandbox session:',
  SAVE_INSIGHT_FAILED: 'Failed to save insight node:',
  WEBSOCKET_SETUP_FAILED: 'Failed to setup WebSocket insight listener:',
  MODAL_PROCESS_FAILED: '❌ Modal process failed:',
  CHAIN_OF_THOUGHT_FAILED: '❌ Chain of thought process failed:',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  AI_NODES_GENERATED: '✅ AI nodes generated:',
  INSIGHT_NODE_ARRIVING: '🔮 Insight Node arriving:',
  PATTERN_ANALYSIS_RESULT: '🧠 Pattern analysis result:',
  PATTERN_ENGINE_TRIGGERED: 'Pattern Engine triggered insight creation',
} as const;

// Processing messages
export const PROCESSING_MESSAGES = {
  WEAVING_CONNECTIONS: 'Weaving connections through your consciousness...',
} as const; 