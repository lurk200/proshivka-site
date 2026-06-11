import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchSiteCms, saveSiteCms } from '../api/cmsApi';
import { handleAdminApiError, hasAdminSession } from '../utils/adminSession';
import {
  buildCmsData,
  CMS_UPDATED_EVENT,
  getDefaultCmsContent,
  loadCmsContent,
  PAGE_KEYS,
  resetCmsContent,
  saveCmsContent,
} from '../data/cmsStore';

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
          setContent(data.content);
          setSource(data.persisted ? 'server' : 'server-defaults');
          saveCmsContent(data.content);
          return;
        }
      } catch {
        // fallback below
      }

      if (hasAdminSession()) {
        setContent(loadCmsContent());
        setSource('local');
        return;
      }

      setContent(getDefaultCmsContent());
      setSource('default');
    })().finally(() => {
      if (!controller.signal.aborted) setReady(true);
    });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const sync = () => {
      if (hasAdminSession()) {
        setContent(loadCmsContent());
      }
    };
    window.addEventListener(CMS_UPDATED_EVENT, sync);
    return () => window.removeEventListener(CMS_UPDATED_EVENT, sync);
  }, []);

  const cmsData = useMemo(() => buildCmsData(content), [content]);

  const updateContent = useCallback(async (next) => {
    const updated = typeof next === 'function' ? next(content) : next;
    setContent(updated);

    if (!hasAdminSession()) {
      saveCmsContent(updated);
      return { ok: false, skipped: true };
    }

    try {
      await saveSiteCms(updated);
      saveCmsContent(updated);
      return { ok: true };
    } catch (error) {
      handleAdminApiError(error);
      saveCmsContent(updated);
      return { ok: false, error };
    }
  }, [content]);

  const updatePage = useCallback(
    (pageKey, next) =>
      updateContent((prev) => {
        const pageUpdate = typeof next === 'function' ? next(prev[pageKey]) : next;
        return { ...prev, [pageKey]: pageUpdate };
      }),
    [updateContent],
  );

  const resetContent = useCallback(async () => {
    const defaults = resetCmsContent();
    setContent(defaults);

    if (!hasAdminSession()) {
      return { ok: false, skipped: true };
    }

    try {
      await saveSiteCms(defaults);
      return { ok: true };
    } catch (error) {
      handleAdminApiError(error);
      return { ok: false, error };
    }
  }, []);

  const resetPage = useCallback(
    (pageKey) => {
      const defaults = getDefaultCmsContent();
      return updatePage(pageKey, defaults[pageKey]);
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
