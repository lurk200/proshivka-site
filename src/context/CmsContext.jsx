import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchSiteCms, saveSiteCms } from '../api/cmsApi';
import {
  buildCmsData,
  CMS_UPDATED_EVENT,
  getDefaultCmsContent,
  loadCmsContent,
  PAGE_KEYS,
  resetCmsContent,
  saveCmsContent,
} from '../data/cmsStore';

const STORAGE_KEY = 'proshivka-cms-content';

const CmsContext = createContext(null);

export function CmsProvider({ children }) {
  const [content, setContent] = useState(() => getDefaultCmsContent());
  const [ready, setReady] = useState(false);
  const [source, setSource] = useState('default');

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const data = await fetchSiteCms(controller.signal);
        if (data?.content) {
          if (!data.persisted && typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) {
            const local = loadCmsContent();
            setContent(local);
            setSource('migrated');
            saveSiteCms(local).catch(() => {});
            return;
          }
          setContent(data.content);
          setSource('server');
          return;
        }
      } catch {
        // fallback below
      }

      setContent(loadCmsContent());
      setSource('local');
    })().finally(() => {
      if (!controller.signal.aborted) setReady(true);
    });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const sync = () => setContent(loadCmsContent());
    window.addEventListener(CMS_UPDATED_EVENT, sync);
    return () => window.removeEventListener(CMS_UPDATED_EVENT, sync);
  }, []);

  const cmsData = useMemo(() => buildCmsData(content), [content]);

  const updateContent = useCallback((next) => {
    const updated = typeof next === 'function' ? next(content) : next;
    setContent(updated);
    saveCmsContent(updated);

    saveSiteCms(updated).catch(() => {
      // локальная копия уже сохранена; сервер недоступен только в dev/offline
    });
  }, [content]);

  const updatePage = useCallback(
    (pageKey, next) => {
      updateContent((prev) => {
        const pageUpdate = typeof next === 'function' ? next(prev[pageKey]) : next;
        return { ...prev, [pageKey]: pageUpdate };
      });
    },
    [updateContent],
  );

  const resetContent = useCallback(() => {
    const defaults = resetCmsContent();
    setContent(defaults);
    saveSiteCms(defaults).catch(() => {});
    return defaults;
  }, []);

  const resetPage = useCallback(
    (pageKey) => {
      const defaults = getDefaultCmsContent();
      updatePage(pageKey, defaults[pageKey]);
      return defaults[pageKey];
    },
    [updatePage],
  );

  const value = useMemo(
    () => ({
      content,
      cmsData,
      ready,
      source,
      updateContent,
      updatePage,
      resetContent,
      resetPage,
      defaults: getDefaultCmsContent(),
      PAGE_KEYS,
    }),
    [content, cmsData, ready, source, updateContent, updatePage, resetContent, resetPage],
  );

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
}

export function useCms() {
  const ctx = useContext(CmsContext);
  if (!ctx) throw new Error('useCms must be used within CmsProvider');
  return ctx;
}
