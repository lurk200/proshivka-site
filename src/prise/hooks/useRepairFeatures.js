import { useEffect, useState } from 'react';

/**
 * Fetches public feature flags for the /prise page.
 * Returns { features, loading } where features.modelCalculatorEnabled
 * controls whether the "Рассчитать по модели" tab is visible to clients.
 */
export function useRepairFeatures() {
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/repair-price/features')
      .then(r => (r.ok ? r.json() : { modelCalculatorEnabled: false }))
      .then(data => setFeatures(data))
      .catch(() => setFeatures({ modelCalculatorEnabled: false }))
      .finally(() => setLoading(false));
  }, []);

  return { features, loading };
}
