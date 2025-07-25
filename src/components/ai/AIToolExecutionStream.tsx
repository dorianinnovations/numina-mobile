import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { NuminaColors } from '../../utils/colors';
import { log } from '../../utils/logger';
import { LinkConfirmationModal, shouldShowLinkConfirmation } from '../modals/LinkConfirmationModal';

const { width } = Dimensions.get('window');

interface ToolExecution {
  id: string;
  toolName: string;
  status: 'starting' | 'executing' | 'completed' | 'error';
  startTime: number;
  endTime?: number;
  details: {
    action?: string;
    query?: string;
    searchType?: string;
    location?: string;
    parameters?: any;
    results?: any;
    error?: string;
    message?: string;
  };
  progress?: number; // 0-100
}

interface UBPMInsight {
  id: string;
  type: 'ubpm_insight';
  significance: number; // 0-1
  summary: string;
  patterns: Array<{
    type: string;
    pattern: string;
    description: string;
    confidence: number;
  }>;
  timestamp: Date;
  status: 'new' | 'acknowledged';
}

interface AIToolExecutionStreamProps {
  executions: ToolExecution[];
  ubpmInsights?: UBPMInsight[];
  isVisible: boolean;
  onToggleVisibility: () => void;
  currentMessage?: string;
  onAcknowledgeUBPM?: (insightId: string) => void;
}

export const AIToolExecutionStream: React.FC<AIToolExecutionStreamProps> = ({
  executions,
  ubpmInsights = [],
  isVisible,
  onToggleVisibility,
  currentMessage,
  onAcknowledgeUBPM,
}) => {
  const { isDarkMode } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const heightAnim = useRef(new Animated.Value(isVisible ? 200 : 0)).current;
  const chevronRotation = useRef(new Animated.Value(0)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedExecutions, setExpandedExecutions] = useState<Set<string>>(new Set());
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string>('');
  const [pendingHostname, setPendingHostname] = useState<string>('');

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: isVisible ? (isExpanded ? 300 : 100) : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isVisible, isExpanded]);

  useEffect(() => {
    // Auto-scroll to bottom when new executions are added
    if (executions.length && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [executions]);

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'web_search': return '🌐';
      case 'news_search': return '📰';
      case 'weather_check': return '🌤️';
      case 'social_search': return '📱';
      case 'academic_search': return '📚';
      case 'image_search': return '🖼️';
      case 'music_recommendations': return '🎵';
      case 'spotify_playlist': return '🎧';
      case 'reservation_booking': return '🍽️';
      case 'itinerary_generator': return '✈️';
      case 'credit_management': return '💳';
      case 'ubmp_analysis': return '🧠';
      case 'calculator': return '🔢';
      case 'translation': return '🌍';
      case 'stock_lookup': return '📈';
      case 'crypto_lookup': return '₿';
      case 'currency_converter': return '💱';
      case 'timezone_converter': return '🕐';
      case 'code_generator': return '💻';
      case 'text_generator': return '📝';
      case 'email_assistant': return '📧';
      case 'linkedin_helper': return '💼';
      case 'fitness_tracker': return '💪';
      case 'nutrition_lookup': return '🥗';
      case 'qr_generator': return '📱';
      case 'password_generator': return '🔐';
      default: return '🔧';
    }
  };

  const getUBPMIcon = (significance: number) => {
    if (significance > 0.9) return '🧠';
    if (significance > 0.7) return '💡';
    if (significance > 0.5) return '📊';
    return '🔍';
  };

  const getUBPMColor = (significance: number) => {
    if (significance > 0.9) return isDarkMode ? '#67ff7b' : '#4fff4f'; 
    if (significance > 0.7) return isDarkMode ? '#2563eb' : '#3b82f6'; 
    if (significance > 0.5) return isDarkMode ? '#059669' : '#10b981'; 
    return isDarkMode ? '#6b7280' : '#9ca3af'; 
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'starting': return isDarkMode ? NuminaColors.chatPurple[200] : NuminaColors.chatGreen[300];
      case 'executing': return isDarkMode ? NuminaColors.chatPurple[200] : NuminaColors.chatGreen[300];
      case 'completed': return isDarkMode ? NuminaColors.success[200] : NuminaColors.success[300];
      case 'error': return isDarkMode ? NuminaColors.error[200] : NuminaColors.error[300];
      default: return isDarkMode ? NuminaColors.chatPurple[200] : NuminaColors.chatGreen[300];
    }
  };

  const formatExecutionTime = (execution: ToolExecution) => {
    if (!execution.endTime) {
      return `${((Date.now() - execution.startTime) / 1000).toFixed(1)}s`;
    }
    return `${((execution.endTime - execution.startTime) / 1000).toFixed(1)}s`;
  };

  const getExecutionDetails = (execution: ToolExecution) => {
    const { details } = execution;
    switch (execution.toolName) {
      case 'web_search':
        return `Searching: "${details.query || details.parameters?.query || 'web'}"`;
      case 'news_search':
        return `Searching news: "${details.query || details.parameters?.query || 'latest news'}"`;
      case 'weather_check':
        return `Checking weather: ${details.location || details.parameters?.location || 'current location'}`;
      case 'social_search':
        return `Searching social: "${details.query || details.parameters?.query || 'social media'}"`;
      case 'academic_search':
        return `Academic search: "${details.query || details.parameters?.query || 'research'}"`;
      case 'ubpm_analysis':
        return `Analyzing behavioral patterns...`;
      case 'music_recommendations':
        return `Finding ${details.parameters?.mood || 'music'} recommendations`;
      case 'spotify_playlist':
        return `Creating playlist: "${details.parameters?.playlistName || 'New Playlist'}"`;
      case 'reservation_booking':
        return `Booking: ${details.parameters?.restaurantName || 'restaurant'}`;
      case 'itinerary_generator':
        return `Planning: ${details.parameters?.destination || 'trip'}`;
      case 'calculator':
        return `Calculating: ${details.query || details.parameters?.expression || 'calculation'}`;
      case 'translation':
        return `Translating: "${details.query || details.parameters?.text || 'text'}"`;
      case 'stock_lookup':
        return `Stock data: ${details.parameters?.symbol || 'market'}`;
      case 'crypto_lookup':
        return `Crypto prices: ${details.parameters?.symbol || 'cryptocurrency'}`;
      default:
        return details.action || details.query || details.message || 'Processing...';
    }
  };

  const toggleExecutionExpansion = (executionId: string) => {
    setExpandedExecutions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(executionId)) {
        newSet.delete(executionId);
      } else {
        newSet.add(executionId);
      }
      return newSet;
    });
  };

  const renderWebSearchResults = (results: any) => {
    log.debug('Raw results data', { results }, 'AIToolExecutionStream');
    
    let searchResults = null;
    let serverResponse = '';
    
    // Check if results has serverResponse (from our tool execution system)
    if (results && typeof results === 'object' && results.serverResponse) {
      serverResponse = results.serverResponse;
      log.debug('Found serverResponse', { preview: serverResponse.substring(0, 200) }, 'AIToolExecutionStream');
      
      // Try to parse URLs first (including bracketed URLs from server)
      const urlRegex = /https?:\/\/[^\s\]]+/g;
      const urls = serverResponse.match(urlRegex) || [];
      
      if (urls.length) {
        // Create searchResults from parsed URLs
        searchResults = urls.map((url, index) => {
          // Try to extract title from surrounding context
          const urlIndex = serverResponse.indexOf(url);
          const contextBefore = serverResponse.substring(Math.max(0, urlIndex - 100), urlIndex);
          const contextAfter = serverResponse.substring(urlIndex + url.length, urlIndex + url.length + 100);
          
          // Look for title patterns
          let title = `Search Result ${index + 1}`;
          const titleMatch = contextBefore.match(/\*\*([^*]+)\*\*\s*$/);
          if (titleMatch) {
            title = titleMatch[1];
          } else {
            // Try to extract domain as title
            const domain = url.match(/https?:\/\/([^\/]+)/);
            if (domain) {
              title = domain[1];
            }
          }
          
          return {
            url: url,
            title: title,
            snippet: contextAfter.substring(0, 50) + '...'
          };
        });
        
        log.debug('Parsed search results from URLs', { count: searchResults.length }, 'AIToolExecutionStream');
      } else {
        // Parse search result entries with new server format: • **Title** - snippet [URL]
        const resultPattern = /•\s*\*\*([^*]+)\*\*\s*-\s*([^\[]+)(?:\s*\[([^\]]+)\])?/g;
        const matches = [];
        let match;
        
        while ((match = resultPattern.exec(serverResponse)) !== null) {
          const title = match[1].trim();
          const snippet = match[2].trim();
          const extractedUrl = match[3] ? match[3].trim() : null;
          
          // Use actual URL from server if available, otherwise generate smart URL
          let url = extractedUrl;
          
          if (!url) {
            // Fallback: Generate URLs based on platform detection (legacy support)
            const titleLower = title.toLowerCase();
            const snippetLower = snippet.toLowerCase();
            
            if (titleLower.includes('twitch') || snippetLower.includes('twitch')) {
              const usernameMatch = title.match(/(\w+)\s*-\s*twitch/i) || 
                                    snippet.match(/twitch\.tv\/(\w+)/i) ||
                                    title.match(/^([^-]+)/);
              if (usernameMatch && usernameMatch[1]) {
                const username = usernameMatch[1].trim().toLowerCase();
                url = `https://www.twitch.tv/${username}`;
              } else {
                url = 'https://www.twitch.tv';
              }
            } else if (titleLower.includes('instagram') || snippetLower.includes('instagram')) {
              const handleMatch = snippet.match(/@(\w+)/) || 
                                 title.match(/(\w+)\s*.*instagram/i);
              if (handleMatch && handleMatch[1]) {
                url = `https://www.instagram.com/${handleMatch[1]}`;
              } else {
                url = 'https://www.instagram.com';
              }
            } else if (titleLower.includes('kick') || snippetLower.includes('kick')) {
              const usernameMatch = title.match(/^([^-\s]+)/);
              if (usernameMatch && usernameMatch[1]) {
                const username = usernameMatch[1].trim().toLowerCase();
                url = `https://kick.com/${username}`;
              } else {
                url = 'https://kick.com';
              }
            } else if (titleLower.includes('youtube') || snippetLower.includes('youtube')) {
              url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(title);
            } else if (titleLower.includes('spotify') || snippetLower.includes('spotify')) {
              url = 'https://open.spotify.com/search/' + encodeURIComponent(title);
            } else if (titleLower.includes('reddit') || snippetLower.includes('reddit')) {
              url = 'https://www.reddit.com/search/?q=' + encodeURIComponent(title);
            } else if (titleLower.includes('twitter') || titleLower.includes('x.com') || snippetLower.includes('twitter')) {
              url = 'https://twitter.com/search?q=' + encodeURIComponent(title);
            } else if (titleLower.includes('facebook') || snippetLower.includes('facebook')) {
              url = 'https://www.facebook.com/search/top/?q=' + encodeURIComponent(title);
            } else {
              // Generic Google search for the title
              url = 'https://www.google.com/search?q=' + encodeURIComponent(title);
            }
          }
          
          matches.push({
            title: title,
            snippet: snippet,
            url: url
          });
        }
        
        if (matches.length) {
          searchResults = matches;
          log.debug('Parsed search results from text pattern', { count: searchResults.length, sampleResult: searchResults[0] }, 'AIToolExecutionStream');
        }
      }
    }
    
    // Fallback to original parsing logic for structured data
    if (!searchResults) {
      if (Array.isArray(results)) {
        searchResults = results;
      } else if (results && results.results && Array.isArray(results.results)) {
        searchResults = results.results;
      } else if (results && results.data && Array.isArray(results.data)) {
        searchResults = results.data;
      } else if (results && results.links && Array.isArray(results.links)) {
        searchResults = results.links;
      } else if (results && results.items && Array.isArray(results.items)) {
        searchResults = results.items;
      } else if (results && typeof results === 'object') {
        // Check for any array property that might contain results
        for (const [key, value] of Object.entries(results)) {
          if (Array.isArray(value) && value.length && value[0].url) {
            searchResults = value;
            break;
          }
        }
      }
    }
    
    if (!searchResults || !Array.isArray(searchResults) || searchResults.length === 0) {
      log.warn('No valid search results found', null, 'AIToolExecutionStream');
      return (
        <View style={styles.searchResultsContainer}>
          <Text style={[
            styles.searchResultsTitle,
            { color: isDarkMode ? '#9ca3af' : '#6b7280' }
          ]}>
            No results available
          </Text>
        </View>
      );
    }
    
    log.debug('Found search results', { count: searchResults.length }, 'AIToolExecutionStream');
    
    return (
      <View style={styles.searchResultsContainer}>
        <Text style={[
          styles.searchResultsTitle,
          { color: isDarkMode ? '#71c9fc' : '#4a90e2' }
        ]}>
          Search Results ({searchResults.length})
        </Text>
        {searchResults.slice(0, 5).map((result: any, index: number) => {
          // Handle different URL field names
          const url = result.url || result.link || result.href || result.websiteUrl;
          const title = result.title || result.name || result.displayName || 'Search Result';
          const snippet = result.snippet || result.description || result.summary || result.body;
          
          console.log(`🔍 DEBUG: Result ${index}:`, { url, title: title.substring(0, 50) });
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.searchResultItem,
                {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
                !url && { opacity: 0.6 }
              ]}
              onPress={async () => {
                if (url) {
                  // Security: Validate URL before opening
                  try {
                    const parsed = new URL(url);
                    
                    // Only allow HTTP/HTTPS protocols
                    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                      console.warn('🚨 Blocked non-HTTP URL:', url);
                      return;
                    }
                    
                    // Block suspicious domains
                    const suspiciousDomains = ['localhost', '127.0.0.1', '0.0.0.0'];
                    if (suspiciousDomains.some(domain => parsed.hostname.includes(domain))) {
                      console.warn('🚨 Blocked suspicious domain:', url);
                      return;
                    }
                    
                    console.log('🔍 Opening validated URL:', url);
                    
                    // Check if user wants to skip confirmation
                    const shouldShow = await shouldShowLinkConfirmation();
                    if (!shouldShow) {
                      // Open directly if user chose "Don't show again"
                      Linking.openURL(url).catch(err => 
                        console.error('Failed to open URL:', err)
                      );
                    } else {
                      // Show custom confirmation modal for external links
                      setPendingUrl(url);
                      setPendingHostname(parsed.hostname);
                      setLinkModalVisible(true);
                    }
                  } catch (error) {
                    console.warn('🚨 Invalid URL blocked:', url);
                  }
                } else {
                  console.log('🔍 No URL available for this result:', title);
                }
              }}
              activeOpacity={url ? 0.7 : 1}
              disabled={!url}
            >
              <View style={styles.searchResultContent}>
                <Text style={[
                  styles.searchResultTitle,
                  { color: isDarkMode ? '#e5e7eb' : '#1f2937' }
                ]} numberOfLines={2}>
                  {title}
                </Text>
                {snippet && (
                  <Text style={[
                    styles.searchResultSnippet,
                    { color: isDarkMode ? '#9ca3af' : '#6b7280' }
                  ]} numberOfLines={3}>
                    {snippet}
                  </Text>
                )}
                {url && (
                  <Text style={[
                    styles.searchResultUrl,
                    { color: isDarkMode ? '#71c9fc' : '#4a90e2' }
                  ]} numberOfLines={1}>
                    {url}
                  </Text>
                )}
              </View>
              <FontAwesome5
                name={url ? "external-link-alt" : "info-circle"}
                size={12}
                color={url ? (isDarkMode ? '#71c9fc' : '#4a90e2') : (isDarkMode ? '#6b7280' : '#9ca3af')}
                style={styles.externalLinkIcon}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderExecutionItem = (execution: ToolExecution) => {
    const isActive = execution.status === 'executing' || execution.status === 'starting';
    const statusColor = getStatusColor(execution.status);
    const isExecutionExpanded = expandedExecutions.has(execution.id);
    const hasResults = execution.status === 'completed' && execution.details.results;
    const canExpand = execution.toolName === 'web_search' && hasResults;

    // Debug logging for chevron visibility
    if (execution.toolName === 'web_search') {
      console.log(`🔍 WEB_SEARCH DEBUG:`, {
        id: execution.id,
        status: execution.status,
        hasResults: !!execution.details.results,
        canExpand: canExpand,
        resultsType: typeof execution.details.results,
        resultsKeys: execution.details.results ? Object.keys(execution.details.results) : 'null'
      });
    }

    return (
      <View key={execution.id} style={[styles.executionItem, isDarkMode ? styles.executionItemDark : styles.executionItemLight]}>
        <TouchableOpacity
          style={styles.executionHeader}
          onPress={() => canExpand ? toggleExecutionExpansion(execution.id) : undefined}
          activeOpacity={canExpand ? 0.7 : 1}
        >
          {/* Status Indicator */}
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
            {isActive && (
              <Animated.View style={styles.pulseIndicator} />
            )}
          </View>

          {/* Tool Icon & Name */}
          <View style={styles.toolInfo}>
            <Text style={styles.toolIcon}>{getToolIcon(execution.toolName)}</Text>
            <View style={styles.toolDetails}>
              <Text style={[styles.toolName, isDarkMode ? styles.textDark : styles.textLight]}>
                {execution.toolName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <Text style={[styles.executionDetails, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                {getExecutionDetails(execution)}
              </Text>
            </View>
          </View>

          {/* Status & Timing */}
          <View style={styles.statusInfo}>
            <View style={styles.statusRow}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {execution.status.toUpperCase()}
              </Text>
              {canExpand && (
                <Animated.View
                  style={[
                    styles.chevronContainer,
                    {
                      transform: [{
                        rotate: isExecutionExpanded ? '180deg' : '0deg'
                      }]
                    }
                  ]}
                >
                  <FontAwesome5
                    name="chevron-down"
                    size={10}
                    color={isDarkMode ? '#71c9fc' : '#4a90e2'}
                  />
                </Animated.View>
              )}
            </View>
            <Text style={[styles.timingText, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
              {formatExecutionTime(execution)}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Expanded Results */}
        {isExecutionExpanded && canExpand && (
          <View style={styles.expandedContent}>
            {renderWebSearchResults(execution.details.results)}
          </View>
        )}
      </View>
    );
  };

  const renderUBPMInsight = (insight: UBPMInsight) => {
    const ubpmColor = getUBPMColor(insight.significance);
    const isNew = insight.status === 'new';

    return (
      <TouchableOpacity
        key={insight.id}
        style={[
          styles.executionItem, 
          isDarkMode ? styles.executionItemDark : styles.executionItemLight,
          isNew && styles.ubpmInsightNew
        ]}
        onPress={() => onAcknowledgeUBPM?.(insight.id)}
        activeOpacity={0.8}
      >
        {/* UBPM Indicator */}
        <View style={[styles.statusIndicator, { backgroundColor: ubpmColor }]}>
          {isNew && (
            <Animated.View style={[styles.pulseIndicator, { backgroundColor: ubpmColor }]} />
          )}
        </View>

        {/* UBPM Icon & Details */}
        <View style={styles.toolInfo}>
          <Text style={styles.toolIcon}>{getUBPMIcon(insight.significance)}</Text>
          <View style={styles.toolDetails}>
            <Text style={[styles.toolName, isDarkMode ? styles.textDark : styles.textLight]}>
              UBPM Pattern Insight
            </Text>
            <Text style={[styles.executionDetails, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
              {insight.summary}
            </Text>
            {insight.patterns.length > 0 && (
              <Text style={[styles.ubpmPatternText, { color: ubpmColor }]}>
                {insight.patterns[0].description}
              </Text>
            )}
          </View>
        </View>

        {/* Significance & Status */}
        <View style={styles.statusInfo}>
          <Text style={[styles.statusText, { color: ubpmColor }]}>
            {isNew ? 'NEW' : 'SEEN'}
          </Text>
          <Text style={[styles.timingText, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
            {Math.round(insight.significance * 100)}%
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const activeExecutions = executions.filter(e => e.status === 'executing' || e.status === 'starting');
  const newUBPMInsights = ubpmInsights.filter(i => i.status === 'new');
  const hasActiveTools = activeExecutions.length > 0;
  const hasNewUBPM = newUBPMInsights.length > 0;

  const handleConfirmLink = () => {
    setLinkModalVisible(false);
    if (pendingUrl) {
      Linking.openURL(pendingUrl).catch(err => 
        console.error('Failed to open URL:', err)
      );
    }
    setPendingUrl('');
    setPendingHostname('');
  };

  const handleCancelLink = () => {
    setLinkModalVisible(false);
    setPendingUrl('');
    setPendingHostname('');
  };


  return (
    <>
      <Animated.View style={[
        styles.container, 
        { 
          height: heightAnim, 
          backgroundColor: isDarkMode ? '#121212' : '#ffffff',
          borderColor: isDarkMode
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)',
        }
      ]}>
        <LinearGradient
          colors={isDarkMode ? ['#121212', '#0f0f0f'] : ['#ffffff', '#f8fafc']}
          style={styles.gradient}
        >
          {/* Header with Toggle */}
          <TouchableOpacity 
            style={styles.header} 
            onPress={() => {
              setIsExpanded(!isExpanded);
              Animated.timing(chevronRotation, {
                toValue: isExpanded ? 0 : 1,
                duration: 300,
                useNativeDriver: true,
              }).start();
            }}
            activeOpacity={0.8}
          >
            <View style={styles.headerLeft}>
              <View style={[
                styles.activityIndicator, 
                (hasActiveTools || hasNewUBPM) && styles.activityIndicatorActive
              ]}>
                <Text style={styles.activityIcon}>
                  {hasNewUBPM ? '🧠' : hasActiveTools ? '⚡' : '🔧'}
                </Text>
              </View>
              <Text style={[styles.headerTitle, isDarkMode ? { color: '#FFFFFF' } : { color: NuminaColors.darkMode[500] }]}>
                {hasNewUBPM ? 'UBPM Insights' : 'Numina Tools'}
                {hasActiveTools && <Text> ({activeExecutions.length} active)</Text>}
                {hasNewUBPM && <Text> ({newUBPMInsights.length} new)</Text>}
              </Text>
            </View>
            <View style={styles.chevronContainer}>
              <Animated.View style={[
                styles.chevron,
                { transform: [{ rotate: chevronRotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg']
                })}] }
              ]}>
                <FontAwesome5 
                  name="chevron-up" 
                  size={14} 
                  color={isDarkMode ? '#FFFFFF' : NuminaColors.chatBlue[400]} 
                />
              </Animated.View>
            </View>
          </TouchableOpacity>

          {/* Current AI Message */}
          {currentMessage && (
            <View style={styles.currentMessage}>
              <Text style={[styles.currentMessageText, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                💭 {currentMessage}
              </Text>
            </View>
          )}

          {/* Executions & UBPM List */}
          {isExpanded && (
            <ScrollView 
              ref={scrollViewRef}
              style={styles.executionsList}
              showsVerticalScrollIndicator={false}
            >
              {executions.length === 0 && ubpmInsights.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: NuminaColors.chatBlue[400] }]}>
                    Tool executions, search links, and more will appear here
                  </Text>
                </View>
              ) : (
                <>
                  {/* Show new UBPM insights first */}
                  {newUBPMInsights.map((insight) => renderUBPMInsight(insight))}
                  
                  {/* Show active tool executions */}
                  {executions.map((execution) => renderExecutionItem(execution))}
                  
                  {/* Show acknowledged UBPM insights at bottom */}
                  {ubpmInsights.filter(i => i.status === 'acknowledged').map((insight) => renderUBPMInsight(insight))}
                </>
              )}
            </ScrollView>
          )}

          {/* Quick Stats */}
          {!isExpanded && (executions.length > 0 || ubpmInsights.length > 0) && (
            <View style={styles.quickStats}>
              <Text style={[styles.quickStatsText, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                {executions.filter(e => e.status === 'completed').length} completed • {activeExecutions.length} active
                {ubpmInsights.length > 0 && <Text> • {ubpmInsights.length} UBPM insights</Text>}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
      
      {/* Link Confirmation Modal */}
      <LinkConfirmationModal
        visible={linkModalVisible}
        url={pendingUrl}
        hostname={pendingHostname}
        onConfirm={handleConfirmLink}
        onCancel={handleCancelLink}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 44,
    marginHorizontal: 1,
    marginVertical: 18,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
  },
  gradient: {
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  activityIndicatorActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  activityIcon: {
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito',
  },
  currentMessage: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 8,
  },
  currentMessageText: {
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: 'Nunito',
  },
  executionsList: {
    marginTop: 8,
    maxHeight: 180,
  },
  executionItem: {
    marginBottom: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  executionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  executionItemLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  executionItemDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  pulseIndicator: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.6)',
    // Add pulse animation here if needed
  },
  toolInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  toolDetails: {
    flex: 1,
  },
  toolName: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Nunito',
  },
  executionDetails: {
    fontSize: 10,
    marginTop: 1,
    fontFamily: 'Nunito',
  },
  statusInfo: {
    alignItems: 'flex-end',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Nunito',
  },
  timingText: {
    fontSize: 9,
    marginTop: 1,
    fontFamily: 'Nunito',
  },
  quickStats: {
    marginTop: 8,
    alignItems: 'center',
  },
  quickStatsText: {
    fontSize: 10,
    fontFamily: 'Nunito',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: 'Nunito',
  },
  textDark: {
    color: NuminaColors.chatPurple[100],
  },
  textLight: {
    color: NuminaColors.chatGreen[800],
  },
  textSecondaryDark: {
    color: NuminaColors.chatPurple[300],
  },
  textSecondaryLight: {
    color: NuminaColors.chatGreen[600],
  },
  chevronContainer: {
    padding: 8,
    borderRadius: 6,
  },
  chevron: {
  },
  ubpmInsightNew: {
    borderLeftWidth: 3,
    borderLeftColor: '#3aa6ffff',
  },
  ubpmPatternText: {
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: 2,
    fontFamily: 'Nunito',
  },
  expandedContent: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchResultsContainer: {
    marginTop: 8,
  },
  searchResultsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Nunito',
  },
  searchResultItem: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  searchResultContent: {
    flex: 1,
    marginRight: 8,
  },
  searchResultTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Nunito',
  },
  searchResultSnippet: {
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 2,
    fontFamily: 'Nunito',
  },
  searchResultUrl: {
    fontSize: 9,
    fontWeight: '500',
    fontFamily: 'Nunito',
  },
  externalLinkIcon: {
    marginTop: 1,
  },
});