'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { roleHelpers } from '@/lib/utils/authStorage';

interface ConsortiumContextType {
  selectedConsortium: string;
  setSelectedConsortium: (consortiumId: string) => void;
  isOrganizationUser: boolean;
  isFacilitator: boolean;
  shouldShowConsortiumSelector: boolean;
}

const ConsortiumContext = createContext<ConsortiumContextType | undefined>(undefined);

export const ConsortiumProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [selectedConsortium, setSelectedConsortiumState] = useState<string>('');
  
  const isOrganizationUser = user?.role === 'Organization User';
  const isFacilitator = roleHelpers.isFacilitator();
  const shouldShowConsortiumSelector = isOrganizationUser || isFacilitator;

  // Load selected consortium from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && shouldShowConsortiumSelector) {
      const savedConsortium = localStorage.getItem('selectedConsortium');
      if (savedConsortium) {
        setSelectedConsortiumState(savedConsortium);
      }
    }
  }, [shouldShowConsortiumSelector]);

  const setSelectedConsortium = (consortiumId: string) => {
    setSelectedConsortiumState(consortiumId);
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedConsortium', consortiumId);
    }
  };

  const value: ConsortiumContextType = {
    selectedConsortium,
    setSelectedConsortium,
    isOrganizationUser,
    isFacilitator,
    shouldShowConsortiumSelector,
  };

  return (
    <ConsortiumContext.Provider value={value}>
      {children}
    </ConsortiumContext.Provider>
  );
};

export const useConsortium = () => {
  const context = useContext(ConsortiumContext);
  if (context === undefined) {
    throw new Error('useConsortium must be used within a ConsortiumProvider');
  }
  return context;
}; 