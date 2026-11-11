import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSetupStatus, getMe, login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(null);
  const [loading, setLoading] = useState(true);

  async function checkAuth() {
    try {
      const status = await getSetupStatus();
      setNeedsSetup(status.needsSetup);

      if (!status.needsSetup) {
        try {
          const currentUser = await getMe();
          setUser(currentUser);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  async function login(credentials) {
    const loggedUser = await apiLogin(credentials);
    setUser(loggedUser);
    setNeedsSetup(false);
    return loggedUser;
  }

  async function register(userData) {
    const registeredUser = await apiRegister(userData);
    setUser(registeredUser);
    setNeedsSetup(false);
    return registeredUser;
  }

  async function logout() {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }

  async function refreshUser() {
    try {
      const currentUser = await getMe();
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        needsSetup,
        setNeedsSetup,
        loading,
        login,
        register,
        logout,
        refreshUser,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
