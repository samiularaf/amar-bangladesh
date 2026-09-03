import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  points: number;
  lifetimePoints: number;
  division: string;
  district: string;
  phone: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; division?: string; district?: string; phone?: string }) => Promise<{ requiresEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUser = (u: User) => setUserState(u);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.getMe();
      setUserState(userData);
    } catch {
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    setUserState(data.user);
    return data.user;
  };

  const register = async (formData: { name: string; email: string; password: string; division?: string; district?: string; phone?: string }) => {
    const data = await api.register(formData);
    if (!data.requiresEmailConfirmation) await refreshUser();
    return data;
  };

  const logout = async () => {
    try { await api.logout(); } catch {}
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
