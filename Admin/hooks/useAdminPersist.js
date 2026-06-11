import { useState } from 'react';
import { useCms } from '../../src/context/CmsContext';

/** Сохранение CMS на сервер с индикацией ошибок (для админки). */
export function useAdminPersist() {
  const { updateContent } = useCms();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  const persist = async (updater) => {
    setSaving(true);
    setSaveError('');

    try {
      const result = await updateContent(updater);

      if (result?.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        return true;
      }

      if (result?.skipped) {
        setSaveError(
          'Сессия админки истекла. Войдите снова — иначе изменения останутся только на этом устройстве.',
        );
        return false;
      }

      setSaveError(
        result?.error?.message ||
          'Не удалось сохранить на сервер. Изменения не видны другим пользователям.',
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { persist, saving, saved, saveError };
}
