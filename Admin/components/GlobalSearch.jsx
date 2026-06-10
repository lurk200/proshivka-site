import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Command, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ALL_ITEMS = [
  { path: '/admin', label: 'Обзор', desc: 'Статистика, быстрые действия, история изменений', group: 'Навигация' },
  { path: '/admin/company', label: 'Компания', desc: 'Контакты, телефон, адрес, соцсети', group: 'Контент' },
  { path: '/admin/seo', label: 'SEO и продвижение', desc: 'Мета-теги, заголовки, описания страниц', group: 'Продвижение' },
  { path: '/admin/main/banners', label: 'Баннеры главной', desc: 'Баннеры услуг на главной странице', group: 'Главная /' },
  { path: '/admin/main/about', label: 'О нас и карта', desc: 'Блок «О нас», Яндекс.Карта', group: 'Главная /' },
  { path: '/admin/software-repair/hero', label: 'Hero — прог. ремонт', desc: 'Заголовок и подзаголовок страницы', group: 'Прог. ремонт' },
  { path: '/admin/software-repair/sections', label: 'Заголовки секций', desc: 'Заголовки разделов страницы прог. ремонта', group: 'Прог. ремонт' },
  { path: '/admin/software-repair/services', label: 'Услуги — прог. ремонт', desc: 'Карточки услуг программного ремонта', group: 'Прог. ремонт' },
  { path: '/admin/software-repair/cases', label: 'Кейсы', desc: 'Примеры выполненных работ программного ремонта', group: 'Прог. ремонт' },
  { path: '/admin/software-repair/principles', label: 'О лаборатории', desc: 'Принципы работы, описание лаборатории', group: 'Прог. ремонт' },
  { path: '/admin/software-repair/cta', label: 'Блок CTA', desc: 'Призыв к действию на странице прог. ремонта', group: 'Прог. ремонт' },
  { path: '/admin/send-repair', label: 'Отправить в ремонт', desc: 'Редактор формы отправки устройства', group: 'Сайт' },
  { path: '/admin/orders', label: 'Заказы', desc: 'Управление заказами, архив, гарантия', group: 'Сайт' },
  { path: '/admin/repair-price', label: 'Калькулятор цен', desc: 'Настройки расчёта стоимости ремонта', group: 'Сайт' },
  { path: '/admin/works', label: 'Наши работы', desc: 'Портфолио выполненных работ', group: 'Сайт' },
  { path: '/admin/service-pages', label: 'Аппаратные услуги', desc: 'Страницы аппаратного ремонта', group: 'Сайт' },
  { path: '/admin/service-template', label: 'Шаблон услуги', desc: 'Редактор шаблона страницы услуги', group: 'Сайт' },
  { path: '/admin/navigation', label: 'Меню и футер', desc: 'Ссылки навигации, пункты меню, футер', group: 'Сайт' },
  { path: '/admin/legal', label: 'Документы', desc: 'Юридические документы, политика конфиденциальности', group: 'Сайт' },
  { path: '/admin/settings/notifications', label: 'Уведомления', desc: 'Шаблоны и каналы автоматических уведомлений клиентам', group: 'Настройки' },
];

const GROUP_ORDER = ['Навигация', 'Контент', 'Продвижение', 'Главная /', 'Прог. ремонт', 'Сайт', 'Настройки'];

function Highlight({ text, query }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#84CC16]/20 text-[#84CC16] rounded-[2px] not-italic">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const results = query.trim()
    ? ALL_ITEMS.filter(item => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.group.toLowerCase().includes(q)
        );
      })
    : ALL_ITEMS;

  const grouped = query.trim()
    ? results.map(i => ({ type: 'item', ...i }))
    : GROUP_ORDER.flatMap(g => {
        const items = results.filter(r => r.group === g);
        return items.length
          ? [{ type: 'group', label: g }, ...items.map(i => ({ type: 'item', ...i }))]
          : [];
      });

  const flatItems = grouped.filter(g => g.type === 'item');

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSelectedIdx(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-selected]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  const go = (path) => { navigate(path); onClose(); };

  const handleKey = (e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIdx]) go(flatItems[selectedIdx].path);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-[#131519] rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 h-[54px] border-b border-white/[0.06]">
          <Search className="w-4.5 h-4.5 text-[#4b5563] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Поиск по разделам панели..."
            className="flex-1 bg-transparent text-[15px] text-white placeholder:text-[#4b5563] outline-none"
          />
          <div className="flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded text-[#6b7280] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1 rounded-lg text-[11px] text-[#4b5563] hover:text-[#6b7280] hover:bg-white/[0.06] transition-colors font-mono"
            >
              Esc
            </button>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto py-1.5">
          {grouped.length === 0 && (
            <p className="text-center text-[14px] text-[#6b7280] py-10">
              Ничего не найдено по «{query}»
            </p>
          )}

          {grouped.map((item, gi) => {
            if (item.type === 'group') {
              return (
                <p
                  key={`g-${item.label}-${gi}`}
                  className="px-4 pt-3 pb-1.5 text-[10px] font-mono uppercase tracking-widest text-[#4b5563]"
                >
                  {item.label}
                </p>
              );
            }

            const flatIdx = flatItems.findIndex(f => f.path === item.path);
            const isSelected = flatIdx === selectedIdx;

            return (
              <button
                key={item.path}
                type="button"
                data-selected={isSelected ? '' : undefined}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  isSelected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                }`}
                onClick={() => go(item.path)}
                onMouseEnter={() => setSelectedIdx(flatIdx)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-white font-medium leading-snug">
                    <Highlight text={item.label} query={query} />
                  </p>
                  <p className="text-[12px] text-[#6b7280] truncate mt-0.5">
                    <Highlight text={item.desc} query={query} />
                  </p>
                </div>
                <ArrowRight
                  className={`w-4 h-4 shrink-0 transition-colors ${isSelected ? 'text-[#84CC16]' : 'text-[#2d3139]'}`}
                />
              </button>
            );
          })}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-white/[0.06] text-[11px] text-[#3d4047]">
          <span><kbd className="font-mono">↑↓</kbd> навигация</span>
          <span><kbd className="font-mono">↵</kbd> перейти</span>
          <span><kbd className="font-mono">Esc</kbd> закрыть</span>
          <span className="ml-auto flex items-center gap-0.5 opacity-50">
            <Command className="w-3 h-3" />K
          </span>
        </div>
      </div>
    </div>
  );
}
