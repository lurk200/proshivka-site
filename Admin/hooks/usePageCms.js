import { useEffect, useState } from 'react';
import { useCms } from '../../src/context/CmsContext';
import { useAdminPageKey } from './useAdminPageKey';
import { useAdminPersist } from './useAdminPersist';

export function usePageCms() {
  const pageKey = useAdminPageKey();
  const { content, updatePage, resetPage, defaults } = useCms();
  const pageContent = content[pageKey];
  const pageDefaults = defaults[pageKey];

  const updatePageContent = (updater) => updatePage(pageKey, updater);

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
  const { pageContent, pageDefaults, pageKey } = usePageCms();
  const { persist, saving, saved, saveError } = useAdminPersist();
  const selected = selector(pageContent);
  const [draft, setDraft] = useState(selected);

  useEffect(() => {
    setDraft(selector(pageContent));
  }, [pageKey, pageContent, ...deps]);

  const save = async (patch) => {
    await persist((prev) => ({
      ...prev,
      [pageKey]: (() => {
        const page = prev[pageKey];
        return typeof patch === 'function' ? patch(page) : { ...page, ...patch };
      })(),
    }));
  };

  const reset = () => {
    setDraft(structuredClone(selector(pageDefaults)));
  };

  return {
    draft,
    setDraft,
    save,
    reset,
    saved,
    saving,
    saveError,
    pageKey,
    pageContent,
    pageDefaults,
  };
}
