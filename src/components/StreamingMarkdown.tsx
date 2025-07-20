import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';

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

export const StreamingMarkdown: React.FC<StreamingMarkdownProps> = ({
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

  // Parse content into complete and partial blocks
  const parseStreamingContent = (text: string): ParsedContent => {
    if (!text) return { completeBlocks: '', partialBlock: '', isValid: false };

    // Split by double newlines to identify potential complete blocks
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
        return { completeBlocks: singleBlock, partialBlock: '', isValid: true };
      }
      
      return { completeBlocks: '', partialBlock: singleBlock, isValid: false };
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
      return { 
        completeBlocks: completeBlocks + '\n\n' + lastBlock, 
        partialBlock: '', 
        isValid: true 
      };
    }

    return { 
      completeBlocks: completeBlocks, 
      partialBlock: lastBlock, 
      isValid: completeBlocks.length > 0 
    };
  };

  // Update parsed content when input changes
  useEffect(() => {
    const parsed = parseStreamingContent(content);
    setParsedContent(parsed);
  }, [content]);

  // Cursor blinking animation
  useEffect(() => {
    if (!showCursor || isComplete) return;

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

    return () => blinkAnimation.stop();
  }, [showCursor, isComplete, cursorOpacity]);

  // Markdown styles
  const markdownStyles = StyleSheet.create({
    body: {
      color: isDarkMode ? NuminaColors.darkMode[200] : NuminaColors.darkMode[600],
      fontSize: 17,
      lineHeight: 26,
      fontFamily: 'Inter_400Regular',
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
      fontFamily: 'Inter_700Bold',
    },
    heading2: {
      color: isDarkMode ? NuminaColors.darkMode[100] : NuminaColors.darkMode[700],
      fontSize: 25,
      fontWeight: 'bold',
      marginBottom: 6,
      fontFamily: 'Inter_600SemiBold',
    },
    heading3: {
      color: isDarkMode ? NuminaColors.darkMode[100] : NuminaColors.darkMode[700],
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 4,
      fontFamily: 'Inter_600SemiBold',
    },
    strong: {
      fontWeight: 'bold',
      color: isDarkMode ? NuminaColors.chatBlue[200] : NuminaColors.chatBlue[400],
      fontFamily: 'Inter_700Bold',
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
  });

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
    fontFamily: 'Inter_400Regular',
  },
  cursor: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StreamingMarkdown;