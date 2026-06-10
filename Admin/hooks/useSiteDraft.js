import { useEffect, useState } from 'react';
import { useCms } from '../../src/context/CmsContext';
import { logChange } from './useChangeHistory';

/** Черновик произвольного раздела CMS (mainHome, legal, servicePages, …). */
export function useSiteDraft(sectionKey) {
  const { content, updateContent, defaults } = useCms();
  const [draft, setDraft] = useState(() => structuredClone(content[sectionKey]));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(structuredClone(content[sectionKey]));
  }, [sectionKey, content]);

  const save = () => {
    updateContent((prev) => ({ ...prev, [sectionKey]: structuredClone(draft) }));
    logChange(sectionKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const reset = () => {
    setDraft(structuredClone(defaults[sectionKey]));
  };

  return { draft, setDraft, save, reset, saved };
}
