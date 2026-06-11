export const ADMIN_AUTH_KEY = 'proshivka-admin-auth';
export const ADMIN_API_KEY = 'proshivka-admin-api-key';

export function hasAdminSession() {
  if (typeof window === 'undefined') return false;
  return (
    sessionStorage.getItem(ADMIN_AUTH_KEY) === '1' &&
    Boolean(sessionStorage.getItem(ADMIN_API_KEY))
  );
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_AUTH_KEY);
  sessionStorage.removeItem(ADMIN_API_KEY);
}

export function handleAdminApiError(error) {
  if (error?.status === 401) {
    clearAdminSession();
  }
}
