import React, { createContext, useContext } from 'react';
import { translations } from '../constants/translations';

// Language Context
export const LanguageContext = createContext(null);

// Custom Hook
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (!context) {
    return { 
      language: 'tr', 
      t: translations.tr, 
      setLanguage: () => {} 
    };
  }
  
  return context;
};

