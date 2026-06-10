import React from 'react';

function Bone({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--bg-elevated)] ${className}`}
    />
  );
}

export function SuggestionsSkeleton() {
  return (
    <ul className="py-1" aria-hidden>
      {[1, 2, 3].map((i) => (
        <li key={i} className="px-4 py-3.5">
          <Bone className="h-4 w-2/3" />
        </li>
      ))}
    </ul>
  );
}

export default function ResultSkeleton() {
  return (
    <div className="w-full space-y-4" aria-busy="true" aria-label="Загрузка">
      <div className="space-y-2 px-0.5">
        <Bone className="h-7 w-48" />
        <Bone className="h-4 w-36" />
      </div>
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-4">
        <Bone className="mb-3 h-5 w-40" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <Bone key={i} className="h-[132px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
