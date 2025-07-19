import React, { useState, useEffect, useRef } from 'react';
import { View } from 'react-native';
import StreamingMarkdown from './StreamingMarkdown';
import FadeInDown from './FadeInDown';

interface WordByWordStreamingProps {
  content: string;
  isStreaming: boolean;
  isComplete: boolean;
  style?: any;
  textStyle?: any;
  showCursor?: boolean;
}

export const WordByWordStreaming: React.FC<WordByWordStreamingProps> = ({
  content,
  isStreaming,
  isComplete,
  style,
  textStyle,
  showCursor = true,
}) => {
  const [streamedContent, setStreamedContent] = useState('');
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousContentRef = useRef('');

  // Parse content into word chunks for streaming
  const parseIntoChunks = (text: string): string[] => {
    if (!text) return [];
    // Split by word boundaries but preserve markdown syntax
    return text.split(/(\s+)/).filter(part => part.length > 0);
  };

  // Streaming effect - builds content word by word
  useEffect(() => {
    if (isStreaming && content) {
      const chunks = parseIntoChunks(content);
      let currentChunkIndex = 0;
      let currentContent = '';

      // Clear any existing interval
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }

      // Start streaming chunks one by one
      streamingIntervalRef.current = setInterval(() => {
        if (currentChunkIndex < chunks.length) {
          currentContent += chunks[currentChunkIndex];
          setStreamedContent(currentContent);
          currentChunkIndex++;
        } else {
          // Streaming complete
          if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
            streamingIntervalRef.current = null;
          }
        }
      }, 200); // Stream a new chunk every 200ms for natural reading pace
    }

    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, [isStreaming, content]);

  // Complete all content when streaming is done
  useEffect(() => {
    if (isComplete) {
      // Clear streaming interval
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
      }
      
      // Show full content immediately
      setStreamedContent(content);
    }
  }, [isComplete, content]);

  // Update displayed content when content changes (new chunks arrive)
  useEffect(() => {
    if (content !== previousContentRef.current) {
      if (!isStreaming) {
        // If not streaming, show content immediately
        setStreamedContent(content);
      }
      previousContentRef.current = content;
    }
  }, [content, isStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  return (
    <FadeInDown delay={0} duration={3000} distance={-20}>
      <View style={style}>
        <StreamingMarkdown
          content={streamedContent}
          isComplete={isComplete}
          showCursor={isStreaming && showCursor}
        />
      </View>
    </FadeInDown>
  );
};

