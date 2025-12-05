import React, { createContext, useContext } from 'react';

// Database Context
export const DatabaseContext = createContext(null);

// Custom Hook
export const useDatabase = () => {
  return useContext(DatabaseContext);
};

