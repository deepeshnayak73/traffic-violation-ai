import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

export const ROLES = {
  ADMIN: 'admin',
  OFFICER: 'officer',
  VIEWER: 'viewer',
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncFromStorage = useCallback(() => {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    if (username && role) {
      return { username, role, email: localStorage.getItem('email') || null };
    }
    return null;
  }, []);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      const profile = {
        username: data.username,
        email: data.email,
        role: data.role,
      };
      localStorage.setItem('username', profile.username);
      localStorage.setItem('role', profile.role);
      if (profile.email) localStorage.setItem('email', profile.email);
      setUser(profile);
    } catch {
      const cached = syncFromStorage();
      setUser(cached);
      if (!cached) localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, [syncFromStorage]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });

    localStorage.setItem('token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('username', data.username);
    localStorage.setItem('role', data.role);
    localStorage.setItem('email', email);

    const profile = {
      username: data.username,
      role: data.role,
      email,
    };
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles) => {
      if (!user?.role || roles.length === 0) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      username: user?.username ?? null,
      isAuthenticated: Boolean(user),
      loading,
      login,
      logout,
      fetchUser,
      hasRole,
    }),
    [user, loading, login, logout, fetchUser, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
