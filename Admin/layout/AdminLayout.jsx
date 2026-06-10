import React, { createContext, useContext, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { ToastProvider } from '../components/ui';

const LayoutContext = createContext({ sidebarCollapsed: false });
export const useAdminLayout = () => useContext(LayoutContext);

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('admin-sb-collapsed') === '1'; } catch { return false; }
  });
  const location = useLocation();

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const toggleCollapse = () => {
    setSidebarCollapsed(c => {
      const next = !c;
      try { localStorage.setItem('admin-sb-collapsed', next ? '1' : '0'); } catch {}
      return next;
    });
  };

  return (
    <LayoutContext.Provider value={{ sidebarCollapsed }}>
      <ToastProvider>
      <div className="min-h-screen bg-[#0a0b0e] text-[#f3f4f6] font-sans">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar
          open={sidebarOpen}
          collapsed={sidebarCollapsed}
          onCollapse={toggleCollapse}
          onClose={() => setSidebarOpen(false)}
        />

        <div
          className={`flex flex-col min-h-screen transition-[margin] duration-300 ease-in-out ${
            sidebarCollapsed ? 'lg:ml-[64px]' : 'lg:ml-[260px]'
          }`}
        >
          <TopBar onMenuToggle={() => setSidebarOpen(o => !o)} />
          <main className="flex-1">
            <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      </ToastProvider>
    </LayoutContext.Provider>
  );
}
