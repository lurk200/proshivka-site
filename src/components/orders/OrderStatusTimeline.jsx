import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

function formatDateTime(iso) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export default function OrderStatusTimeline({ timeline }) {
  const [expanded, setExpanded] = useState(false);
  if (!timeline?.length) return null;

  const items = [...timeline].reverse();
  const latest = items[0];
  const rest = items.slice(1);
  const showToggle = rest.length > 0;

  return (
    <div className="h-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-2.5">
        <p className="text-[12px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
          История
        </p>
        {showToggle ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-0.5 text-[11px] text-[#84CC16] hover:underline"
          >
            {expanded ? 'Свернуть' : `+${rest.length}`}
            <ChevronDown className={`h-3.5 w-3.5 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        ) : null}
      </div>

      <div className="flex-1 px-3 py-2.5 min-h-0">
        <div className="flex gap-2">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#84CC16]" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-[var(--text-primary)]">{latest.label}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{formatDateTime(latest.at)}</p>
            {latest.note ? (
              <p className="mt-0.5 text-[12px] text-[var(--text-secondary)] line-clamp-2">{latest.note}</p>
            ) : null}
          </div>
        </div>

        {expanded && rest.length ? (
          <ol className="mt-2 max-h-32 overflow-y-auto space-y-1.5 border-t border-[var(--border-subtle)] pt-2">
            {rest.map((item, idx) => (
              <li key={`${item.at}-${idx}`} className="text-[11px] text-[var(--text-secondary)]">
                <span className="font-medium">{item.label}</span>
                <span className="text-[var(--text-muted)]"> · {formatDateTime(item.at)}</span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  );
}
