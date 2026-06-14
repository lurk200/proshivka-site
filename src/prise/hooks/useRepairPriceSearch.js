import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchRepairModels, fetchRepairPrice } from '../api/repairPriceApi';
import { parseRepairQuery } from '../utils/repairQueryParser';
import { useDebounce } from './useDebounce';

export function useRepairPriceSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [result, setResult] = useState(null);
  const [resultIntent, setResultIntent] = useState(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 200);
  const abortRef = useRef(null);

  const cancelInFlight = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => {
    if (!dropdownOpen && !debouncedQuery.trim()) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setSuggestionsLoading(true);
    setSuggestionsError(null);

    fetchRepairModels(debouncedQuery, controller.signal)
      .then((models) => {
        if (controller.signal.aborted) return;
        setSuggestions(models);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err.name === 'AbortError') return;
        setSuggestionsError('Не удалось выполнить поиск');
        setSuggestions([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSuggestionsLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery, dropdownOpen]);

  const loadPrice = useCallback(
    async (modelRef) => {
      if (!modelRef) return;

      cancelInFlight();
      const controller = new AbortController();
      abortRef.current = controller;

      const id = typeof modelRef === 'object' ? modelRef.id : modelRef;
      const label =
        typeof modelRef === 'object' ? modelRef.label : query.trim();

      setSelectedId(id ?? null);
      setResultLoading(true);
      setResultError(null);
      setResult(null);
      setResultIntent(null);
      setDropdownOpen(false);

      try {
        const data = await fetchRepairPrice(id || label, controller.signal, {
          label: label || undefined,
        });
        if (controller.signal.aborted) return;
        if (!data?.categories?.length) {
          setResult(null);
          setResultIntent(data?.intent ?? null);
          setResultError({
            type: 'empty',
            message: data?.intent?.label
              ? `${data.intent.label}: нет запчастей в наличии в Ставрополе. Напишите нам — подберём вариант.`
              : 'Нет подходящих запчастей в наличии в Ставрополе. Напишите нам — подберём вариант.',
          });
          return;
        }
        setResult(data);
        setResultIntent(data.intent ?? null);
      } catch (err) {
        if (controller.signal.aborted || err.name === 'AbortError') return;
        setResult(null);
        if (err.status === 404 || err.code === 'NOT_IN_STOCK' || err.code === 'MODEL_NOT_FOUND') {
          const intent = parseRepairQuery(label);
          setResultIntent(
            intent.repairKind ? { kind: intent.repairKind, label: intent.repairLabel } : null,
          );
          setResultError({
            type: 'empty',
            message: intent.repairLabel
              ? `${intent.repairLabel}: нет запчастей в наличии в Ставрополе. Напишите нам — подберём вариант.`
              : 'Нет подходящих запчастей в наличии в Ставрополе. Напишите нам — подберём вариант.',
          });
        } else {
          setResultError({
            type: 'error',
            message: err.message || 'Не удалось получить стоимость',
          });
        }
      } finally {
        if (!controller.signal.aborted) setResultLoading(false);
      }
    },
    [cancelInFlight, query],
  );

  const selectModel = useCallback(
    (item) => {
      setQuery(item.label);
      loadPrice({ id: item.id, label: item.label });
    },
    [loadPrice],
  );

  const resetResult = useCallback(() => {
    cancelInFlight();
    setSelectedId(null);
    setResult(null);
    setResultIntent(null);
    setResultError(null);
    setResultLoading(false);
  }, [cancelInFlight]);

  return {
    query,
    setQuery,
    suggestions,
    suggestionsLoading,
    suggestionsError,
    dropdownOpen,
    setDropdownOpen,
    selectedId,
    result,
    resultIntent,
    resultLoading,
    resultError,
    loadPrice,
    selectModel,
    resetResult,
  };
}
