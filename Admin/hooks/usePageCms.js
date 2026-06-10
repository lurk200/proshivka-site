import { useEffect, useState } from 'react';
import { useCms } from '../../src/context/CmsContext';
import { useAdminPageKey } from './useAdminPageKey';

export function usePageCms() {
  const pageKey = useAdminPageKey();
  const { content, updatePage, resetPage, defaults } = useCms();
  const pageContent = content[pageKey];
  const pageDefaults = defaults[pageKey];

  const updatePageContent = (updater) => {
    updatePage(pageKey, updater);
  };

  const resetPageContent = () => resetPage(pageKey);

  return {
    pageKey,
    pageContent,
    pageDefaults,
    updatePageContent,
    resetPageContent,
  };
}

/** Локальный черновик секции страницы с синхронизацией при смене раздела. */
export function usePageDraft(selector, deps = []) {
  const { pageContent, pageDefaults, updatePageContent, resetPageContent, pageKey } = usePageCms();
  const selected = selector(pageContent);
  const [draft, setDraft] = useState(selected);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(selector(pageContent));
  }, [pageKey, pageContent, ...deps]);

  const save = (patch) => {
    updatePageContent((page) => {
      const next = typeof patch === 'function' ? patch(page) : { ...page, ...patch };
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const reset = () => {
    setDraft(structuredClone(selector(pageDefaults)));
  };

  return { draft, setDraft, save, reset, saved, pageKey, pageContent, pageDefaults };
}
