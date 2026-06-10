import { useLocation } from 'react-router-dom';
import { PAGE_KEYS } from '../../src/data/cmsStore';

/** Контент страницы /programmnyj-remont (только маршруты /admin/software-repair/*). */
export function useAdminPageKey() {
  const { pathname } = useLocation();
  return pathname.includes('/admin/software-repair') ? PAGE_KEYS.SOFTWARE_REPAIR : PAGE_KEYS.HOME;
}

export function useAdminPageLabel() {
  return 'Программный ремонт';
}
