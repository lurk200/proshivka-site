import { useEffect, useRef, useState } from 'react';

/**
 * Fetches supplier stock for a given model label from /api/repair-price/supplier-parts.
 * Fires in parallel with the generic catalog — never blocks the service card render.
 * On error or empty → parts = [], partsLoading = false (silent fallback).
 */
export function useSupplierParts(modelLabel) {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!modelLabel?.trim()) {
      setParts([]);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    const params = new URLSearchParams({ label: modelLabel.trim() });
    fetch(`/api/repair-price/supplier-parts?${params}`, { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : { items: [] }))
      .then(data => {
        if (ctrl.signal.aborted) return;
        setParts(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });

    return () => ctrl.abort();
  }, [modelLabel]);

  return { parts, partsLoading: loading };
}
