import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';

const AUTH_KEY = 'proshivka-admin-auth';
const API_KEY = 'proshivka-admin-api-key';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'proshivka';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIsAuthenticated(sessionStorage.getItem(AUTH_KEY) === '1');
    setReady(true);
  }, []);

  const login = (password) => {
    if (password !== ADMIN_PASSWORD) return false;
    sessionStorage.setItem(AUTH_KEY, '1');
    sessionStorage.setItem(API_KEY, password);
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(API_KEY);
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
