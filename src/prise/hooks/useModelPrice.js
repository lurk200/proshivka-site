import { useEffect, useRef, useState } from 'react';

/**
 * Fetches pre-computed, public-safe pricing for a model from /api/repair-price/model-price.
 *
 * Returns a map { [partType]: { clientPrice, stockStatus } } — no raw supplier data.
 * The server aggregates supplier parts by partType, picks the best available item,
 * applies the shop's markup, and returns ONLY the resulting clientPrice and stockStatus.
 */
export function useModelPrice(modelLabel) {
  const [priceMap, setPriceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!modelLabel?.trim()) {
      setPriceMap({});
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    const params = new URLSearchParams({ label: modelLabel.trim() });
    fetch(`/api/repair-price/model-price?${params}`, { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : { items: [] }))
      .then(data => {
        if (ctrl.signal.aborted) return;
        const map = {};
        for (const item of data.items ?? []) {
          if (item.partType) map[item.partType] = item;
        }
        setPriceMap(map);
      })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });

    return () => ctrl.abort();
  }, [modelLabel]);

  return { priceMap, priceLoading: loading };
}
