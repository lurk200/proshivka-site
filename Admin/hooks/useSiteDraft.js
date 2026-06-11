import { useEffect, useState } from 'react';
import { useCms } from '../../src/context/CmsContext';
import { logChange } from './useChangeHistory';
import { useAdminPersist } from './useAdminPersist';

/** Черновик произвольного раздела CMS (mainHome, legal, servicePages, …). */
export function useSiteDraft(sectionKey) {
  const { content, defaults } = useCms();
  const { persist, saving, saved, saveError } = useAdminPersist();
  const [draft, setDraft] = useState(() => structuredClone(content[sectionKey]));

  useEffect(() => {
    setDraft(structuredClone(content[sectionKey]));
  }, [sectionKey, content]);

  const save = async () => {
    const ok = await persist((prev) => ({
      ...prev,
      [sectionKey]: structuredClone(draft),
    }));
    if (ok) logChange(sectionKey);
  };

  const reset = () => {
    setDraft(structuredClone(defaults[sectionKey]));
  };

  return { draft, setDraft, save, reset, saved, saving, saveError };
}
