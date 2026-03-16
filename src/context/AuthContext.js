import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredAuth, setStoredAuth, clearStoredAuth } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getStoredAuth();
    if (auth?.userId && auth?.token && auth?.email) {
      setUser({ userId: auth.userId, token: auth.token, email: auth.email });
    }
  }, []);

  function login(userData) {
    const { userId, token, email } = userData;
    setStoredAuth({ userId, token, email });
    setUser({ userId, token, email });
  }

  function logout() {
    clearStoredAuth();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
