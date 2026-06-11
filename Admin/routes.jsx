import React from 'react';
import { Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CompanyPage from './pages/CompanyPage';
import HeroPage from './pages/HeroPage';
import ServicesPage from './pages/ServicesPage';
import CasesPage from './pages/CasesPage';
import PrinciplesPage from './pages/PrinciplesPage';
import CtaPage from './pages/CtaPage';
import SectionsPage from './pages/SectionsPage';
import LegalPage from './pages/LegalPage';
import ServicePagesPage from './pages/ServicePagesPage';
import ServiceTemplatePage from './pages/ServiceTemplatePage';
import NavigationPage from './pages/NavigationPage';
import MainBannersPage from './pages/main/MainBannersPage';
import MainAboutPage from './pages/main/MainAboutPage';
import WorksPage from './pages/WorksPage';
import SeoPage from './pages/SeoPage';
import RepairPricePage from './pages/RepairPricePage';
import OrdersPage from './pages/OrdersPage';
import SendRepairEditorPage from './pages/SendRepairEditorPage';
import NotificationsSettingsPage from './pages/settings/NotificationsSettingsPage';
import CompanySettingsPage from './pages/settings/CompanySettingsPage';
import DocumentSettingsPage from './pages/settings/DocumentSettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';

const softwareRepairEditors = [
  { path: 'hero', element: <HeroPage /> },
  { path: 'sections', element: <SectionsPage /> },
  { path: 'services', element: <ServicesPage /> },
  { path: 'cases', element: <CasesPage /> },
  { path: 'principles', element: <PrinciplesPage /> },
  { path: 'cta', element: <CtaPage /> },
];

const legacyRedirects = ['hero', 'services', 'cases', 'principles', 'cta'].map((path) => ({
  path,
  element: <Navigate to={`/admin/software-repair/${path}`} replace />,
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
          { path: 'main/banners', element: <MainBannersPage /> },
          { path: 'main/about', element: <MainAboutPage /> },
          { path: 'works', element: <WorksPage /> },
          { path: 'repair-price', element: <RepairPricePage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'send-repair', element: <SendRepairEditorPage /> },
          { path: 'settings/notifications', element: <NotificationsSettingsPage /> },
          { path: 'settings/company', element: <CompanySettingsPage /> },
          { path: 'settings/documents', element: <DocumentSettingsPage /> },
          { path: 'analytics', element: <AnalyticsPage /> },
          { path: 'main/works', element: <Navigate to="/admin/works" replace /> },
          { path: 'main/seo', element: <Navigate to="/admin/seo" replace /> },
          { path: 'software-repair/reviews', element: <Navigate to="/admin/software-repair/hero" replace /> },
          { path: 'reviews', element: <Navigate to="/admin/software-repair/hero" replace /> },
          ...legacyRedirects,
          {
            path: 'software-repair',
            children: softwareRepairEditors,
          },
        ],
      },
    ],
  },
  { path: '/admin/*', element: <Navigate to="/admin" replace /> },
];
