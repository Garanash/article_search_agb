/* eslint-disable no-undef */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  company: string;
  position: string;
  phone: string;
  department: string;
  force_password_change: boolean;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  patronymic: string;
  avatar_url: string;
}

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updatedUser: Partial<User>) => void;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  loading: boolean;
  forcePasswordChange: boolean;
  setForcePasswordChange: (force: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedUser });
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setForcePasswordChange(false);
    localStorage.removeItem('token');
  };

  useEffect(() => {
    if (token) {
      // Здесь можно добавить логику для проверки токена и получения данных пользователя
      setLoading(false);
    } else {
      // Для локальной разработки - автоматически устанавливаем мокового пользователя
      const mockUser: User = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        company: 'ООО "Компания"',
        position: 'Системный администратор',
        phone: '+7 (999) 123-45-67',
        department: 'IT',
        force_password_change: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        first_name: 'Администратор',
        last_name: 'Системы',
        patronymic: '',
        avatar_url: ''
      };
      
      setUser(mockUser);
      setToken('mock-token-for-development');
      setLoading(false);
    }
  }, [token]);

  const value: AuthContextType = {
    token,
    setToken,
    user,
    setUser,
    updateUser,
    logout,
    isAdmin,
    isManager,
    loading,
    forcePasswordChange,
    setForcePasswordChange
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 