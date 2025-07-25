import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Markdown from 'react-native-markdown-display';
// NOTE: Known moderate vulnerability in markdown-it dependency (DoS via resource consumption)
// Risk mitigated as we only process trusted AI responses, not user-generated content
import { useTheme } from '../../contexts/ThemeContext';
import { NuminaColors } from '../../utils/colors';

interface StreamingMarkdownProps {
  content: string;
  isComplete?: boolean;
  showCursor?: boolean;
  animationSpeed?: number;
}

interface ParsedContent {
  completeBlocks: string;
  partialBlock: string;
  isValid: boolean;
}

const StreamingMarkdownComponent: React.FC<StreamingMarkdownProps> = ({
  content,
  isComplete = false,
  showCursor = true,
  animationSpeed = 70
}) => {
  const { isDarkMode } = useTheme();
  const [parsedContent, setParsedContent] = useState<ParsedContent>({
    completeBlocks: '',
    partialBlock: '',
    isValid: false
  });
  
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  // Cached parsing to prevent expensive regex operations on every chunk
  const parseCache = useRef<Map<string, ParsedContent>>(new Map());
  
  // Ultra-optimized parseStreamingContent with caching
  const parseStreamingContent = React.useCallback((text: string): ParsedContent => {
    if (!text) return { completeBlocks: '', partialBlock: '', isValid: false };

    // Check cache first for performance
    const cached = parseCache.current.get(text);
    if (cached) return cached;
    
    // Limit cache size to prevent memory leaks
    if (parseCache.current.size > 100) {
      parseCache.current.clear();
    }

    // Fast split by double newlines
    const blocks = text.split(/\n\n/);
    
    if (blocks.length === 1) {
      // Single block - check if it looks complete
      const singleBlock = blocks[0];
      
      // Check for complete markdown patterns
      const hasCompleteHeading = /^#{1,6}\s+.*\n?$/.test(singleBlock);
      const hasCompleteList = /^[-*]\s+.*(\n[-*]\s+.*)*$/.test(singleBlock);
      const hasCompleteCodeBlock = /^```[\s\S]*?```$/.test(singleBlock);
      const hasCompleteBold = /\*\*[^*]+\*\*/.test(singleBlock) && singleBlock.split('**').length % 2 === 1;
      
      if (hasCompleteHeading || hasCompleteList || hasCompleteCodeBlock || hasCompleteBold) {
        const result = { completeBlocks: singleBlock, partialBlock: '', isValid: true };
        parseCache.current.set(text, result);
        return result;
      }
      
      const result = { completeBlocks: '', partialBlock: singleBlock, isValid: false };
      parseCache.current.set(text, result);
      return result;
    }

    // Multiple blocks - last one might be incomplete
    const completeBlocks = blocks.slice(0, -1).join('\n\n');
    const lastBlock = blocks[blocks.length - 1];
    
    // Check if last block looks complete
    const lastBlockComplete = 
      /^#{1,6}\s+.*$/.test(lastBlock) ||           // Complete heading
      /^```[\s\S]*?```$/.test(lastBlock) ||       // Complete code block
      /^\*\*[^*]+\*\*/.test(lastBlock) ||         // Complete bold
      lastBlock.includes('\n');                   // Has newlines (likely complete paragraph)

    if (lastBlockComplete && completeBlocks) {
      const result = { 
        completeBlocks: completeBlocks + '\n\n' + lastBlock, 
        partialBlock: '', 
        isValid: true 
      };
      parseCache.current.set(text, result);
      return result;
    }

    const result = { 
      completeBlocks: completeBlocks, 
      partialBlock: lastBlock, 
      isValid: completeBlocks.length > 0 
    };
    parseCache.current.set(text, result);
    return result;
  }, []);

  // Update parsed content when input changes - memoized
  useEffect(() => {
    const parsed = parseStreamingContent(content);
    setParsedContent(parsed);
  }, [content, parseStreamingContent]);

  // Cursor blinking animation - optimized cleanup
  useEffect(() => {
    if (!showCursor || isComplete) {
      cursorOpacity.setValue(0);
      return;
    }

    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    blinkAnimation.start();

    return () => {
      blinkAnimation.stop();
      cursorOpacity.stopAnimation();
    };
  }, [showCursor, isComplete, cursorOpacity]);

  // Memoized markdown styles to prevent recreation
  const markdownStyles = React.useMemo(() => StyleSheet.create({
    body: {
      color: isDarkMode ? NuminaColors.darkMode[200] : NuminaColors.darkMode[600],
      fontSize: 17,
      lineHeight: 26,
      fontFamily: 'Nunito_400Regular',
      letterSpacing: -0.2,
      fontWeight: '400',
      marginBottom: 8,
    },
    paragraph: {
      marginBottom: 12,
      marginTop: 4,
    },
    heading1: {
      color: isDarkMode ? NuminaColors.darkMode[100] : NuminaColors.darkMode[700],
      fontSize: 30,
      fontWeight: 'bold',
      marginBottom: 8,
      fontFamily: 'Nunito_700Bold',
    },
    heading2: {
      color: isDarkMode ? NuminaColors.darkMode[100] : NuminaColors.darkMode[700],
      fontSize: 25,
      fontWeight: 'bold',
      marginBottom: 6,
      fontFamily: 'Nunito_600SemiBold',
    },
    heading3: {
      color: isDarkMode ? NuminaColors.darkMode[100] : NuminaColors.darkMode[700],
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 4,
      fontFamily: 'Nunito_600SemiBold',
    },
    strong: {
      fontWeight: 'bold',
      color: isDarkMode ? NuminaColors.chatBlue[200] : NuminaColors.chatBlue[400],
      fontFamily: 'Nunito_700Bold',
    },
    em: {
      fontStyle: 'italic',
      color: isDarkMode ? NuminaColors.chatBlue[200] : NuminaColors.chatBlue[400],
    },
    code_inline: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      color: isDarkMode ? NuminaColors.chatBlue[200] : NuminaColors.chatBlue[400],
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, monospace',
    },
    code_block: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      borderRadius: 8,
      padding: 12,
      marginVertical: 8,
      borderLeftWidth: 3,
      borderLeftColor: isDarkMode ? NuminaColors.chatBlue[200] : NuminaColors.chatBlue[400],
    },
    fence: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      borderRadius: 8,
      padding: 12,
      marginVertical: 8,
      borderLeftWidth: 3,
      borderLeftColor: isDarkMode ? NuminaColors.chatBlue[200] : NuminaColors.chatBlue[400],
    },
    blockquote: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      borderLeftWidth: 4,
      borderLeftColor: isDarkMode ? NuminaColors.chatBlue[200] : NuminaColors.chatBlue[400],
      paddingLeft: 12,
      paddingVertical: 8,
      marginVertical: 6,
      fontStyle: 'italic',
      color: isDarkMode ? NuminaColors.chatBlue[200] : NuminaColors.chatBlue[400],
    },
    list_item: {
      marginBottom: 4,
    },
    bullet_list_icon: {
      color: isDarkMode ? NuminaColors.chatGreen[400] : NuminaColors.chatGreen[600],
      marginRight: 8,
    },
    table: {
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderRadius: 6,
      overflow: 'hidden',
      marginVertical: 8,
    },
    thead: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    },
    th: {
      fontWeight: 'bold',
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    td: {
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    },
  }), [isDarkMode]);

  return (
    <View style={styles.container}>
      {/* If message is complete, render all content as markdown */}
      {isComplete ? (
        <Markdown style={markdownStyles}>
          {content}
        </Markdown>
      ) : (
        <>
          {/* Render complete markdown blocks */}
          {parsedContent.completeBlocks && parsedContent.isValid && (
            <Markdown style={markdownStyles}>
              {parsedContent.completeBlocks}
            </Markdown>
          )}
          
          {/* Render partial content as plain text with streaming effect */}
          {parsedContent.partialBlock && (
            <View style={styles.streamingContainer}>
              <Text style={[
                styles.streamingText,
                { color: isDarkMode ? NuminaColors.darkMode[300] : NuminaColors.darkMode[600] }
              ]}>
                {parsedContent.partialBlock}
                {showCursor && (
                  <Animated.Text 
                    style={[
                      styles.cursor, 
                      { 
                        opacity: cursorOpacity,
                        color: isDarkMode ? NuminaColors.chatBlue[200] : NuminaColors.chatBlue[400]
                      }
                    ]}
                  >
                    ▋
                  </Animated.Text>
                )}
              </Text>
            </View>
          )}
          
          {/* Handle case where all content is incomplete and no partial block */}
          {!parsedContent.isValid && !parsedContent.completeBlocks && !parsedContent.partialBlock && content && (
            <View style={styles.streamingContainer}>
              <Text style={[
                styles.streamingText,
                { color: isDarkMode ? NuminaColors.darkMode[300] : NuminaColors.darkMode[600] }
              ]}>
                {content}
                {showCursor && (
                  <Animated.Text 
                    style={[
                      styles.cursor, 
                      { 
                        opacity: cursorOpacity,
                        color: isDarkMode ? NuminaColors.chatBlue[200] : NuminaColors.chatBlue[400]
                      }
                    ]}
                  >
                    ▋
                  </Animated.Text>
                )}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  streamingContainer: {
    marginTop: 4,
  },
  streamingText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Nunito_400Regular',
  },
  cursor: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Optimized memo with custom comparison
export const StreamingMarkdown = React.memo(StreamingMarkdownComponent, (prevProps, nextProps) => {
  // Only re-render if content, isComplete, or showCursor actually changed
  return (
    prevProps.content === nextProps.content &&
    prevProps.isComplete === nextProps.isComplete &&
    prevProps.showCursor === nextProps.showCursor &&
    prevProps.animationSpeed === nextProps.animationSpeed
  );
});

export default StreamingMarkdown;