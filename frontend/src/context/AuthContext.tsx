import React, { createContext, useState, useContext, useEffect } from "react";
import { getUserProfile } from "../api/userApi";

export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'admin' | 'manager' | 'user';
  company?: string;
  position?: string;
  phone?: string;
  department?: string;
  force_password_change?: boolean;
  created_at?: string;
  updated_at?: string;
  first_name?: string;
  last_name?: string;
  patronymic?: string;
  avatar_url?: string;
}

type AuthContextType = {
  token: string | null;
  setToken: (token: string | null) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updatedUser: User) => void;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  loading: boolean;
  forcePasswordChange: boolean;
  setForcePasswordChange: (force: boolean) => void;
};

const AuthContext = createContext<AuthContextType>({ 
  token: null, 
  setToken: () => {}, 
  user: null, 
  setUser: () => {},
  updateUser: () => {},
  logout: () => {},
  isAdmin: false,
  isManager: false,
  loading: false,
  forcePasswordChange: false,
  setForcePasswordChange: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);

  // Загружаем данные пользователя при инициализации
  useEffect(() => {
    let firstLoad = true;
    const loadUserProfile = async () => {
      console.log('AuthContext: loadUserProfile called with token:', token ? 'present' : 'missing');
      if (token) {
        try {
          console.log('AuthContext: Loading user profile...');
          const userData = await getUserProfile(token); // Передаем токен напрямую
          console.log('AuthContext: User profile loaded:', userData);
          setUser(userData);
          // Показываем модалку только при первом входе, если force_password_change
          if (firstLoad && userData.force_password_change) {
            setForcePasswordChange(true);
          }
          firstLoad = false;
        } catch (error) {
          console.error('AuthContext: Error loading user profile:', error);
          // Если не удалось загрузить профиль, очищаем токен
          setTokenAndStore(null);
          setUser(null);
        }
      } else {
        console.log('AuthContext: No token, clearing user');
        setUser(null);
      }
      setLoading(false);
    };

    loadUserProfile();
    // eslint-disable-next-line
  }, [token]);

  const setTokenAndStore = (t: string | null) => {
    console.log('AuthContext: setTokenAndStore called with token:', t ? 'present' : 'null');
    setToken(t);
    if (t) {
      localStorage.setItem("token", t);
      console.log('AuthContext: Token saved to localStorage');
    } else {
      localStorage.removeItem("token");
      console.log('AuthContext: Token removed from localStorage');
    }
  };

  const setUserAndStore = (u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem("user", JSON.stringify(u));
    else localStorage.removeItem("user");
  };

  const updateUser = (updatedUser: User) => {
    setUserAndStore(updatedUser);
    setForcePasswordChange(updatedUser.force_password_change || false);
  };

  const logout = () => {
    setTokenAndStore(null);
    setUserAndStore(null);
    setForcePasswordChange(false);
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      token, 
      setToken: setTokenAndStore, 
      user, 
      setUser: setUserAndStore,
      updateUser,
      logout,
      isAdmin,
      isManager,
      loading,
      forcePasswordChange,
      setForcePasswordChange
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 

export default AuthContext; 