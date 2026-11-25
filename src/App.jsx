import { Navigate, Route, Routes } from 'react-router-dom'
import SiteLayout from './layouts/SiteLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import WorksPage from './pages/WorksPage.jsx'
import ContactsPage from './pages/ContactsPage.jsx'
import ServicesPage from './pages/ServicesPage.jsx'
import CalcPage from './pages/CalcPage.jsx'
import TrackPage from './pages/TrackPage.jsx'
import AdminLayout from './admin/AdminLayout.jsx'
import ProtectedRoute from './admin/ProtectedRoute.jsx'
import LoginPage from './admin/LoginPage.jsx'
import DashboardPage from './admin/DashboardPage.jsx'
import CompanyPage from './admin/CompanyPage.jsx'
import HeroPage from './admin/HeroPage.jsx'
import ServicesAdminPage from './admin/ServicesAdminPage.jsx'
import WorksAdminPage from './admin/WorksAdminPage.jsx'
import CalculatorAdminPage from './admin/CalculatorAdminPage.jsx'
import BackupAdminPage from './admin/BackupAdminPage.jsx'
import CrmLayout from './crm/CrmLayout.jsx'
import BoardPage from './crm/BoardPage.jsx'
import NewOrderPage from './crm/NewOrderPage.jsx'
import OrderPage from './crm/OrderPage.jsx'
import SearchPage from './crm/SearchPage.jsx'
import DevicePage from './crm/DevicePage.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="services/:id" element={<ServicesPage />} />
        <Route path="works" element={<WorksPage />} />
        <Route path="works/:id" element={<WorksPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="calc" element={<CalcPage />} />
        <Route path="status-zakaza" element={<TrackPage />} />
      </Route>

      <Route path="/t/:token" element={<TrackPage />} />

      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="company" element={<CompanyPage />} />
        <Route path="hero" element={<HeroPage />} />
        <Route path="services" element={<ServicesAdminPage />} />
        <Route path="works" element={<WorksAdminPage />} />
        <Route path="calculator" element={<CalculatorAdminPage />} />
        <Route path="backup" element={<BackupAdminPage />} />
      </Route>
      <Route path="/admin/*" element={<Navigate to="/admin" replace />} />

      <Route
        path="/crm"
        element={
          <ProtectedRoute>
            <CrmLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<BoardPage />} />
        <Route path="new" element={<NewOrderPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="orders/:id" element={<OrderPage />} />
        <Route path="devices/:id" element={<DevicePage />} />
      </Route>
      <Route path="/crm/*" element={<Navigate to="/crm" replace />} />
    </Routes>
  )
}
