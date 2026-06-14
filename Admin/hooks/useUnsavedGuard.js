import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

export function useUnsavedGuard(isDirty) {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const blocker = useBlocker(isDirty);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm('Есть несохранённые изменения. Покинуть страницу?')) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker]);
}
