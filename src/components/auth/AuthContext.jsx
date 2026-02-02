import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Auth Context
 * Manages global authentication state
 */

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setError(null);
    } catch (err) {
      setUser(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (redirectUrl = '/') => {
    try {
      await base44.auth.logout(redirectUrl);
      setUser(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateUser = async (data) => {
    try {
      await base44.auth.updateMe(data);
      setUser(prev => ({ ...prev, ...data }));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const login = async (redirectUrl) => {
    await base44.auth.redirectToLogin(redirectUrl);
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    logout,
    updateUser,
    login,
    refetch: loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default AuthContext;