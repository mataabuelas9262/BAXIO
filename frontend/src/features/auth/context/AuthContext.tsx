'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '@/types/common.types';
import { authApi } from '@/services/api/endpoints';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    location?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Evita que una comprobación de sesión antigua sobrescriba un login o logout reciente.
  const authVersion = useRef(0);

  const refreshUser = async () => {
    const requestVersion = authVersion.current;
    try {
      const currentUser = await authApi.getMe();
      if (requestVersion === authVersion.current) {
        setUser(currentUser);
      }
    } catch {
      if (requestVersion === authVersion.current) {
        setUser(null);
      }
    } finally {
      if (requestVersion === authVersion.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const result = await authApi.login(credentials);
    authVersion.current += 1;
    setUser(result.user);
    setIsLoading(false);
  };

  const register = async (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    location?: string;
  }) => {
    const result = await authApi.register(data);
    authVersion.current += 1;
    setUser(result.user);
    setIsLoading(false);
  };

  const logout = async () => {
    authVersion.current += 1;
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
