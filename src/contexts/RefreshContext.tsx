import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RefreshContextType {
  isRefreshing: boolean;
  setIsRefreshing: (refreshing: boolean) => void;
  triggerRefresh: () => Promise<void>;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};

interface RefreshProviderProps {
  children: ReactNode;
}

export const RefreshProvider: React.FC<RefreshProviderProps> = ({ children }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerRefresh = async () => {
    setIsRefreshing(true);
    
    // Let the animation run for a minimum time to be visible
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsRefreshing(false);
  };

  const value = {
    isRefreshing,
    setIsRefreshing,
    triggerRefresh,
  };

  return (
    <RefreshContext.Provider value={value}>
      {children}
    </RefreshContext.Provider>
  );
};