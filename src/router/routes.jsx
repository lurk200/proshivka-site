import React from 'react';

import SiteLayout from '../layouts/SiteLayout';
import Home from '../pages/Home';
import SoftwareRepairHome from '../pages/SoftwareRepairHome';

// Hardware Service Pages
import GlassReplacementPage from '../pages/services/GlassReplacementPage';
import BatteryReplacementPage from '../pages/services/BatteryReplacementPage';
import WaterDamagePage from '../pages/services/WaterDamagePage';
import ModularRepairPage from '../pages/services/ModularRepairPage';
import LegalDocumentPage from '../pages/legal/LegalDocumentPage';
import WorksPage from '../pages/WorksPage';
import WorkDetailPage from '../pages/WorkDetailPage';
import RepairPricePage from '../prise/RepairPricePage';
import SendRepairPage from '../pages/SendRepairPage';
import OrderStatusPage from '../pages/OrderStatusPage';
import { adminRoutes } from '../../Admin/routes';

export const routes = [
  {
    path: "/",
    element: <SiteLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'programmnyj-remont', element: <SoftwareRepairHome /> },
      { path: "services/glass-replacement", element: <GlassReplacementPage /> },
      { path: "services/battery-replacement", element: <BatteryReplacementPage /> },
      { path: "services/water-damage", element: <WaterDamagePage /> },
      { path: "services/modular-repair", element: <ModularRepairPage /> },
      { path: 'legal/:docId', element: <LegalDocumentPage /> },
      { path: 'nashi-raboty', element: <WorksPage /> },
      { path: 'nashi-raboty/:workId', element: <WorkDetailPage /> },
      { path: 'prise', element: <RepairPricePage /> },
      { path: 'otpravit-v-remont', element: <SendRepairPage /> },
      { path: 'status-zakaza', element: <OrderStatusPage /> },
    ]
  },
  ...adminRoutes,
];