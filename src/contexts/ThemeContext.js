import React, { createContext, useContext } from 'react';
import { themes } from '../constants/themes';

// Theme Context
export const ThemeContext = createContext(null);

// Custom Hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  // Default tema değerleri - Context henüz sağlanmamışsa veya null ise
  const defaultTheme = {
    theme: 'gold',
    setTheme: () => {},
    themes: themes,
  };
  
  // Context yoksa veya geçersizse default döndür
  if (!context) {
    return defaultTheme;
  }
  
  // Context var ama theme property'si yoksa default döndür
  if (typeof context.theme === 'undefined' || context.theme === null) {
    return defaultTheme;
  }
  
  // Context geçerli ama themes yoksa ekle
  if (!context.themes) {
    return {
      ...context,
      themes: themes,
    };
  }
  
  return context;
};

