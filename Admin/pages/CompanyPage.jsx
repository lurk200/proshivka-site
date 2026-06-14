import { Navigate } from 'react-router-dom';

// Данные компании объединены в /admin/settings/company (единый источник).
export default function CompanyPage() {
  return <Navigate to="/admin/settings/company" replace />;
}
