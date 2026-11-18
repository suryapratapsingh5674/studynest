import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, loginUser, registerUser, logoutUser } from '../../services/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('studynest_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Validate existing token on initial mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('studynest_token');
      if (storedToken) {
        try {
          const res = await getMe();
          if (res.success && res.data?.user) {
            setUser(res.data.user);
          } else {
            handleLogout();
          }
        } catch (error) {
          console.warn('[Auth] Session validation failed:', error.message);
          handleLogout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const handleLogin = async (credentials) => {
    const res = await loginUser(credentials);
    const { user: userData, token: jwtToken } = res.data;
    localStorage.setItem('studynest_token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const handleRegister = async (credentials) => {
    const res = await registerUser(credentials);
    const { user: userData, token: jwtToken } = res.data;
    localStorage.setItem('studynest_token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const handleLogout = async () => {
    try {
      if (token) await logoutUser();
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('studynest_token');
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

