const STORAGE_KEY = 'proshivka-admin-changes';
const MAX_ENTRIES = 50;

const SECTION_LABELS = {
  mainHome: 'Главная страница',
  legal: 'Документы',
  servicePages: 'Аппаратные услуги',
  works: 'Наши работы',
  softwareRepair: 'Прог. ремонт',
  navigation: 'Навигация',
  company: 'Компания',
  siteSeo: 'SEO',
  sendRepair: 'Форма отправки',
  repairPrice: 'Калькулятор цен',
};

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function logChange(sectionKey, customLabel) {
  try {
    const history = readHistory();
    const entry = {
      id: Date.now(),
      sectionKey,
      label: customLabel || SECTION_LABELS[sectionKey] || sectionKey,
      at: new Date().toISOString(),
    };
    const updated = [entry, ...history].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function useChangeHistory() {
  function getHistory(limit = 20) {
    return readHistory().slice(0, limit);
  }

  function clearHistory() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  return { getHistory, clearHistory };
}
