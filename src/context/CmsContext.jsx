import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  const [content, setContent] = useState(() => loadCmsContent());

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
      updateContent,
      updatePage,
      resetContent,
      resetPage,
      defaults: getDefaultCmsContent(),
      PAGE_KEYS,
    }),
    [content, cmsData, updateContent, updatePage, resetContent, resetPage],
  );

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
}

export function useCms() {
  const ctx = useContext(CmsContext);
  if (!ctx) throw new Error('useCms must be used within CmsProvider');
  return ctx;
}
