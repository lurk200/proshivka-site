import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  ADMIN_API_KEY,
  ADMIN_AUTH_KEY,
  clearAdminSession,
} from '../../src/utils/adminSession';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'proshivka';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIsAuthenticated(sessionStorage.getItem(ADMIN_AUTH_KEY) === '1');
    setReady(true);
  }, []);

  const login = (password) => {
    if (password !== ADMIN_PASSWORD) return false;
    sessionStorage.setItem(ADMIN_AUTH_KEY, '1');
    sessionStorage.setItem(ADMIN_API_KEY, password);
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
    clearAdminSession();
    setIsAuthenticated(false);
  };

  const value = useMemo(
    () => ({ isAuthenticated, ready, login, logout }),
    [isAuthenticated, ready],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children ?? <Outlet />}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
