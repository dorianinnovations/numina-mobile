import { useState, useEffect, useRef, useCallback } from 'react';
import { SearchResult, SearchStateManager } from '../utils/searchDataParser';

interface UseSearchIndicatorResult {
  searchResults: SearchResult[];
  isSearching: boolean;
  updateFromStreamingContent: (content: string) => void;
  updateFromFinalResponse: (content: string) => void;
  resetSearchState: () => void;
  hasActiveSearches: boolean;
}

/**
 * Hook to manage search indicator state for the chat screen
 * This integrates with the SearchThoughtIndicator component
 */
export const useSearchIndicator = (): UseSearchIndicatorResult => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchManagerRef = useRef<SearchStateManager | null>(null);
  
  // Initialize search manager
  useEffect(() => {
    if (!searchManagerRef.current) {
      searchManagerRef.current = new SearchStateManager();
      
      // Subscribe to search state changes
      const unsubscribe = searchManagerRef.current.addListener((state) => {
        setSearchResults(state.searchResults);
        setIsSearching(state.isSearching);
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, []);
  
  const updateFromStreamingContent = useCallback((content: string) => {
    searchManagerRef.current?.updateFromStreamingContent(content);
  }, []);
  
  const updateFromFinalResponse = useCallback((content: string) => {
    searchManagerRef.current?.updateFromFinalResponse(content);
  }, []);
  
  const resetSearchState = useCallback(() => {
    searchManagerRef.current?.reset();
  }, []);
  
  const hasActiveSearches = searchResults.length > 0 || isSearching;
  
  return {
    searchResults,
    isSearching,
    updateFromStreamingContent,
    updateFromFinalResponse,
    resetSearchState,
    hasActiveSearches,
  };
};