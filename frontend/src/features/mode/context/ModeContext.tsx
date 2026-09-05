'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserMode = 'hire' | 'work';

interface ModeContextType {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  toggleMode: () => void;
  isHiring: boolean;
  isWorking: boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<UserMode>('hire');

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('baxio_user_mode') as UserMode;
      if (savedMode === 'hire' || savedMode === 'work') {
        setModeState(savedMode);
      }
    } catch {
      // Ignore if localStorage not accessible
    }
  }, []);

  const setMode = (newMode: UserMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem('baxio_user_mode', newMode);
    } catch {
      // Ignore
    }
  };

  const toggleMode = () => {
    setMode(mode === 'hire' ? 'work' : 'hire');
  };

  return (
    <ModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        isHiring: mode === 'hire',
        isWorking: mode === 'work',
      }}
    >
      {children}
    </ModeContext.Provider>
  );
};

export const useUserMode = () => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useUserMode debe ser utilizado dentro de un ModeProvider');
  }
  return context;
};
