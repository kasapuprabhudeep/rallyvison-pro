import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserProfile, TokenResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string, code?: string) => Promise<TokenResponse>;
  verifyTwoFactor: (email: string, code: string) => Promise<TokenResponse>;
  register: (email: string, pass: string, name: string, role?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('rallyvision_token');
      if (!token) {
        setUser(null);
        return;
      }
      const me = await api.getMe();
      setUser(me);
    } catch {
      localStorage.removeItem('rallyvision_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string, code?: string): Promise<TokenResponse> => {
    const res = await api.login({ email, password: pass, two_factor_code: code });
    if (res.user && !res.requires_two_factor) {
      setUser(res.user);
    }
    return res;
  };

  const verifyTwoFactor = async (email: string, code: string): Promise<TokenResponse> => {
    const res = await api.verifyTwoFactor({ email, two_factor_code: code });
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  const register = async (email: string, pass: string, name: string, role = 'PLAYER') => {
    const res = await api.register({ email, password: pass, full_name: name, role });
    setUser(res.user);
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    const updated = await api.updateProfile(profileData);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyTwoFactor, register, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

