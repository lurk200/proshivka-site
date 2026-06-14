import { useEffect, useState } from 'react';
import { useCms } from '../../src/context/CmsContext';
import { logChange } from './useChangeHistory';
import { useAdminPersist } from './useAdminPersist';

/** Черновик произвольного раздела CMS (mainHome, legal, servicePages, …). */
export function useSiteDraft(sectionKey) {
  const { content, defaults } = useCms();
  const { persist, saving, saved, saveError } = useAdminPersist();
  const [draft, setDraftInternal] = useState(() => structuredClone(content[sectionKey]));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setDraftInternal(structuredClone(content[sectionKey]));
    setIsDirty(false);
  }, [sectionKey, content]);

  const setDraft = (v) => {
    setDraftInternal(v);
    setIsDirty(true);
  };

  const save = async () => {
    const ok = await persist((prev) => ({
      ...prev,
      [sectionKey]: structuredClone(draft),
    }));
    if (ok) logChange(sectionKey);
  };

  const reset = () => {
    setDraftInternal(structuredClone(defaults[sectionKey]));
    setIsDirty(true);
  };

  return { draft, setDraft, save, reset, saved, saving, saveError, isDirty };
}
