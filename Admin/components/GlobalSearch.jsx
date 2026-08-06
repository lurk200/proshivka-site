import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Command, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_SEARCH_ITEMS, SEARCH_GROUP_ORDER } from '../navigation';

function Highlight({ text, query }) {
  if (!query) return <>{text}</>;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return <>{text}</>;
  return <>{text.slice(0, index)}<mark className="bg-[#84CC16]/20 text-[#84CC16] rounded-[2px] not-italic">{text.slice(index, index + query.length)}</mark>{text.slice(index + query.length)}</>;
}

export default function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ADMIN_SEARCH_ITEMS;
    return ADMIN_SEARCH_ITEMS.filter(item => [item.label, item.description, item.group, ...(item.aliases ?? [])].some(value => value.toLowerCase().includes(needle)));
  }, [query]);

  const grouped = useMemo(() => {
    if (query.trim()) return results.map(item => ({ type: 'item', ...item }));
    return SEARCH_GROUP_ORDER.flatMap(group => {
      const items = results.filter(item => item.group === group);
      return items.length ? [{ type: 'group', label: group }, ...items.map(item => ({ type: 'item', ...item }))] : [];
    });
  }, [query, results]);
  const flatItems = grouped.filter(item => item.type === 'item');

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSelectedIdx(0); }, [query]);
  useEffect(() => { listRef.current?.querySelector('[data-selected]')?.scrollIntoView({ block: 'nearest' }); }, [selectedIdx]);

  const go = path => { navigate(path); onClose(); };
  const handleKey = event => {
    if (event.key === 'Escape') return onClose();
    if (event.key === 'ArrowDown') { event.preventDefault(); setSelectedIdx(index => Math.min(index + 1, flatItems.length - 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setSelectedIdx(index => Math.max(index - 1, 0)); }
    if (event.key === 'Enter' && flatItems[selectedIdx]) { event.preventDefault(); go(flatItems[selectedIdx].path); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true" aria-label="Поиск по админ-панели">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#131519] rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-[54px] border-b border-white/[0.06]">
          <Search className="w-4.5 h-4.5 text-[#4b5563] shrink-0" />
          <input ref={inputRef} value={query} onChange={event => setQuery(event.target.value)} onKeyDown={handleKey} placeholder="Найти раздел или настройку…" className="flex-1 bg-transparent text-[15px] text-white placeholder:text-[#4b5563] outline-none" />
          <div className="flex items-center gap-1">
            {query && <button type="button" onClick={() => setQuery('')} className="p-1 rounded text-[#6b7280] hover:text-white transition-colors" aria-label="Очистить поиск"><X className="w-4 h-4" /></button>}
            <button type="button" onClick={onClose} className="px-2 py-1 rounded-lg text-[11px] text-[#4b5563] hover:text-[#6b7280] hover:bg-white/[0.06] transition-colors font-mono">Esc</button>
          </div>
        </div>
        <div ref={listRef} className="max-h-[360px] overflow-y-auto py-1.5">
          {grouped.length === 0 && <p className="text-center text-[14px] text-[#6b7280] py-10">Ничего не найдено по «{query}»</p>}
          {grouped.map((item, groupIndex) => {
            if (item.type === 'group') return <p key={`${item.label}-${groupIndex}`} className="px-4 pt-3 pb-1.5 text-[10px] font-mono uppercase tracking-widest text-[#4b5563]">{item.label}</p>;
            const flatIndex = flatItems.findIndex(candidate => candidate.path === item.path);
            const selected = flatIndex === selectedIdx;
            return <button key={item.path} type="button" data-selected={selected ? '' : undefined} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${selected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`} onClick={() => go(item.path)} onMouseEnter={() => setSelectedIdx(flatIndex)}><div className="flex-1 min-w-0"><p className="text-[14px] text-white font-medium leading-snug"><Highlight text={item.label} query={query} /></p><p className="text-[12px] text-[#6b7280] truncate mt-0.5"><Highlight text={item.description} query={query} /></p></div><ArrowRight className={`w-4 h-4 shrink-0 transition-colors ${selected ? 'text-[#84CC16]' : 'text-[#2d3139]'}`} /></button>;
          })}
        </div>
        <div className="flex items-center gap-4 px-4 py-2 border-t border-white/[0.06] text-[11px] text-[#3d4047]"><span><kbd className="font-mono">↑↓</kbd> выбрать</span><span><kbd className="font-mono">↵</kbd> открыть</span><span><kbd className="font-mono">Esc</kbd> закрыть</span><span className="ml-auto flex items-center gap-0.5 opacity-50"><Command className="w-3 h-3" />K</span></div>
      </div>
    </div>
  );
}
