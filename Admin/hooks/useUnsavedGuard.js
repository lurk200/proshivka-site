import { useEffect } from 'react';

// NOTE: useBlocker (React Router) requires createBrowserRouter (data router).
// The app uses <BrowserRouter>, so we guard only browser-level navigation
// (refresh / close tab / navigate away). SPA link clicks are not blocked,
// but the SaveBar is always visible, keeping the UX clear enough.
export function useUnsavedGuard(isDirty) {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
