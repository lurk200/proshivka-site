import React from 'react';
import { Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CompanyPage from './pages/CompanyPage';
import LegalPage from './pages/LegalPage';
import ServicePagesPage from './pages/ServicePagesPage';
import ServiceTemplatePage from './pages/ServiceTemplatePage';
import NavigationPage from './pages/NavigationPage';
import MainPageEditorPage from './pages/main/MainPageEditorPage';
import WorksPage from './pages/WorksPage';
import SeoPage from './pages/SeoPage';
import RepairPricePage from './pages/RepairPricePage';
import OrdersPage from './pages/OrdersPage';
import SoftwareRepairEditorPage from './pages/SoftwareRepairEditorPage';
import SendRepairEditorPage from './pages/SendRepairEditorPage';
import NotificationsSettingsPage from './pages/settings/NotificationsSettingsPage';
import CompanySettingsPage from './pages/settings/CompanySettingsPage';
import DocumentSettingsPage from './pages/settings/DocumentSettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ReviewsPage from './pages/ReviewsPage';

// Deep-link redirects: /admin/software-repair/hero → /admin/software-repair?tab=hero
const softwareRepairTabRedirects = ['hero', 'sections', 'services', 'cases', 'principles', 'cta'].map((tab) => ({
  path: `software-repair/${tab}`,
  element: <Navigate to={`/admin/software-repair?tab=${tab}`} replace />,
}));

export const adminRoutes = [
  {
    path: '/admin',
    element: <AdminAuthProvider />,
    children: [
      { path: 'login', element: <LoginPage /> },
      {
        element: (
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'company', element: <CompanyPage /> },
          { path: 'seo', element: <SeoPage /> },
          { path: 'navigation', element: <NavigationPage /> },
          { path: 'legal', element: <LegalPage /> },
          { path: 'service-pages', element: <ServicePagesPage /> },
          { path: 'service-template', element: <ServiceTemplatePage /> },
          { path: 'works', element: <WorksPage /> },
          { path: 'repair-price', element: <RepairPricePage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'send-repair', element: <SendRepairEditorPage /> },
          { path: 'settings/notifications', element: <NotificationsSettingsPage /> },
          { path: 'settings/company', element: <CompanySettingsPage /> },
          { path: 'settings/documents', element: <DocumentSettingsPage /> },
          { path: 'analytics', element: <AnalyticsPage /> },
          { path: 'software-repair', element: <SoftwareRepairEditorPage /> },
          { path: 'main', element: <MainPageEditorPage /> },
          { path: 'main/banners', element: <Navigate to="/admin/main?tab=banners" replace /> },
          { path: 'main/about', element: <Navigate to="/admin/main?tab=about" replace /> },
          { path: 'reviews', element: <ReviewsPage /> },
          ...softwareRepairTabRedirects,
        ],
      },
    ],
  },
  { path: '/admin/*', element: <Navigate to="/admin" replace /> },
];
