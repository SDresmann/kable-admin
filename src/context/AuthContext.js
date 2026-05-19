import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredAuth, setStoredAuth, clearStoredAuth } from '../api';

const AuthContext = createContext(null);

function loadUserFromStorage() {
  const auth = getStoredAuth();
  if (auth?.userId && auth?.token && auth?.email) {
    return { userId: auth.userId, token: auth.token, email: auth.email };
  }
  return null;
}

export function AuthProvider({ children }) {
  // Read localStorage on first render so new tabs don't flash-redirect before session restores.
  const [user, setUser] = useState(loadUserFromStorage);

  useEffect(() => {
    setUser(loadUserFromStorage());
  }, []);

  useEffect(() => {
    function onSessionLost() {
      setUser(null);
    }
    window.addEventListener('kable-admin-session-lost', onSessionLost);
    return () => window.removeEventListener('kable-admin-session-lost', onSessionLost);
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
