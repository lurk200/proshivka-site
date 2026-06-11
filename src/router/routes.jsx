import React, { lazy, Suspense } from 'react';

import SiteLayout from '../layouts/SiteLayout';

const Home = lazy(() => import('../pages/Home'));
const SoftwareRepairHome = lazy(() => import('../pages/SoftwareRepairHome'));
const GlassReplacementPage = lazy(() => import('../pages/services/GlassReplacementPage'));
const BatteryReplacementPage = lazy(() => import('../pages/services/BatteryReplacementPage'));
const WaterDamagePage = lazy(() => import('../pages/services/WaterDamagePage'));
const ModularRepairPage = lazy(() => import('../pages/services/ModularRepairPage'));
const LegalDocumentPage = lazy(() => import('../pages/legal/LegalDocumentPage'));
const WorksPage = lazy(() => import('../pages/WorksPage'));
const WorkDetailPage = lazy(() => import('../pages/WorkDetailPage'));
const RepairPricePage = lazy(() => import('../prise/RepairPricePage'));
const SendRepairPage = lazy(() => import('../pages/SendRepairPage'));
const OrderStatusPage = lazy(() => import('../pages/OrderStatusPage'));

import { adminRoutes } from '../../Admin/routes';

function PageLoader() {
  return (
    <div className="flex-grow flex items-center justify-center min-h-[40vh]">
      <div className="w-6 h-6 rounded-full border-2 border-[#84CC16]/30 border-t-[#84CC16] animate-spin" />
    </div>
  );
}

function withSuspense(element) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

export const routes = [
  {
    path: "/",
    element: <SiteLayout />,
    children: [
      { index: true, element: withSuspense(<Home />) },
      { path: 'programmnyj-remont', element: withSuspense(<SoftwareRepairHome />) },
      { path: "services/glass-replacement", element: withSuspense(<GlassReplacementPage />) },
      { path: "services/battery-replacement", element: withSuspense(<BatteryReplacementPage />) },
      { path: "services/water-damage", element: withSuspense(<WaterDamagePage />) },
      { path: "services/modular-repair", element: withSuspense(<ModularRepairPage />) },
      { path: 'legal/:docId', element: withSuspense(<LegalDocumentPage />) },
      { path: 'nashi-raboty', element: withSuspense(<WorksPage />) },
      { path: 'nashi-raboty/:workId', element: withSuspense(<WorkDetailPage />) },
      { path: 'prise', element: withSuspense(<RepairPricePage />) },
      { path: 'otpravit-v-remont', element: withSuspense(<SendRepairPage />) },
      { path: 'status-zakaza', element: withSuspense(<OrderStatusPage />) },
    ]
  },
  ...adminRoutes,
];
