import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import { SuggestionsSkeleton } from './SearchSkeleton';

export default function SmartSearch({
  query,
  onQueryChange,
  suggestions,
  suggestionsLoading,
  suggestionsError,
  dropdownOpen,
  onDropdownOpen,
  onSelect,
  onSubmit,
}) {
  const listId = useId();
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(-1);

  useEffect(() => {
    setActiveIdx(-1);
  }, [suggestions]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        onDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onDropdownOpen]);

  const showDropdown =
    dropdownOpen &&
    query.trim().length >= 2 &&
    (suggestionsLoading || suggestions.length > 0 || suggestionsError);

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      onSelect(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      onDropdownOpen(false);
      setActiveIdx(-1);
    }
  };

  return (
    <div ref={wrapRef} className="relative mx-auto max-w-lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.();
        }}
        className="group relative"
      >
        <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2">
          {suggestionsLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
          ) : (
            <Search
              className="h-5 w-5 text-[var(--text-muted)] transition-colors duration-300 group-focus-within:text-[var(--text-primary)]"
              strokeWidth={1.75}
            />
          )}
        </div>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            onDropdownOpen(true);
          }}
          onFocus={() => onDropdownOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="iPhone 15 Pro или замена аккумулятора на S24"
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIdx >= 0 ? `${listId}-${activeIdx}` : undefined}
          className="w-full rounded-2xl border border-[var(--border-medium)]/80 bg-[var(--bg-surface)] py-4 pl-12 pr-4 text-[17px] text-[var(--text-primary)] tracking-[-0.02em] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,var(--shadow-soft)] backdrop-blur-xl outline-none transition-all duration-300 placeholder:text-[var(--text-muted)] placeholder:font-normal focus:border-[var(--border-medium)] focus:ring-4 focus:ring-[var(--bg-elevated)]"
        />
      </form>

      <AnimatePresence>
        {showDropdown ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] backdrop-blur-2xl"
          >
            {suggestionsError ? (
              <p className="px-4 py-3.5 text-[14px] text-[var(--text-secondary)]">
                {suggestionsError}
              </p>
            ) : suggestionsLoading ? (
              <SuggestionsSkeleton />
            ) : suggestions.length === 0 ? (
              <p className="px-4 py-4 text-[14px] text-[var(--text-muted)]">
                Модель не найдена
              </p>
            ) : (
              <ul
                id={listId}
                role="listbox"
                className="max-h-[min(280px,45vh)] overflow-y-auto py-1"
              >
                {suggestions.map((item, idx) => (
                  <li key={item.id} id={`${listId}-${idx}`} role="option" aria-selected={idx === activeIdx}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => onSelect(item)}
                      className={`w-full px-4 py-3.5 text-left text-[15px] font-medium tracking-[-0.02em] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)] focus-visible:outline-none focus-visible:bg-[var(--bg-elevated)] ${idx === activeIdx ? 'bg-[var(--bg-elevated)]' : ''}`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
