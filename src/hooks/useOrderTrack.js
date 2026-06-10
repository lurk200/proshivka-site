import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchOrderTrack } from '../api/ordersApi';

/** Автообновление на публичной странице — раз в 30 минут; чаще — кнопка «Обновить» */
const POLL_MS = 30 * 60 * 1000;

/**
 * @param {string | null} orderNumber — если null, не загружать
 * @param {{ poll?: boolean }} [options]
 */
export function useOrderTrack(orderNumber, options = {}) {
  const { poll = true } = options;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const orderRef = useRef(order);

  orderRef.current = order;

  const load = useCallback(
    async (silent = false) => {
      const num = orderNumber?.trim();
      if (!num) return;

      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const data = await fetchOrderTrack(num);
        setOrder(data.order);
        setError(null);
        setLastUpdated(new Date());
      } catch (err) {
        if (!silent) {
          setOrder(null);
          setError(err);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [orderNumber],
  );

  useEffect(() => {
    if (!orderNumber?.trim()) {
      setOrder(null);
      setError(null);
      return undefined;
    }

    load(false);

    if (!poll) return undefined;

    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        load(true);
      }
    }, POLL_MS);

    return () => clearInterval(id);
  }, [orderNumber, load, poll]);

  return { order, loading, error, lastUpdated, reload: () => load(false) };
}
