import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { isEmbeddableYandexMapUrl, resolveYandexMapConfig } from '../../utils/yandexMap';

const LOAD_TIMEOUT_MS = 12000;

export default function YandexMapBlock({
  map,
  embedUrl,
  orgUrl,
  routeUrl,
  routeLabel,
  fallbackLabel,
  title = 'Яндекс Карты',
  className = '',
}) {
  const resolved = useMemo(
    () =>
      resolveYandexMapConfig(
        map ?? {
          embedUrl,
          orgUrl,
          openUrl: routeUrl,
          routeLabel,
          label: fallbackLabel,
        },
      ),
    [map, embedUrl, orgUrl, routeUrl, routeLabel, fallbackLabel],
  );

  const [frameReady, setFrameReady] = useState(false);
  const [frameFailed, setFrameFailed] = useState(false);

  useEffect(() => {
    setFrameReady(false);
    setFrameFailed(false);
  }, [resolved.embedUrl]);

  useEffect(() => {
    if (frameReady || !resolved.embedUrl) return undefined;

    const timer = window.setTimeout(() => setFrameFailed(true), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [resolved.embedUrl, frameReady]);

  const showFallback = frameFailed || !isEmbeddableYandexMapUrl(resolved.embedUrl);

  return (
    <div
      className={`flex w-full min-w-0 flex-col overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)] ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FC3F1D]/15 text-[11px] font-bold text-[#FC3F1D]">
          Я
        </span>
        <span className="truncate text-[14px] font-medium text-[var(--text-primary)]">{title}</span>
      </div>

      <div className="relative w-full min-h-[500px] bg-[var(--bg-elevated)]">
        {!showFallback ? (
          <iframe
            title="Карта — сервисный центр ПРОШИВКА"
            src={resolved.embedUrl}
            className="absolute inset-0 block h-full min-h-[500px] w-full border-0 p-0 m-0"
            loading="eager"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setFrameReady(true)}
          />
        ) : null}

        {showFallback ? (
          <div className="absolute inset-0 flex min-h-[500px] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <MapPin className="h-7 w-7 text-[#84CC16]" strokeWidth={1.5} />
            </div>
            <p className="max-w-xs text-[14px] leading-relaxed text-[var(--text-secondary)]">
              Не удалось загрузить карту на этой странице. Откройте сервис в приложении Яндекс Карт.
            </p>
            <a
              href={resolved.orgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#84CC16] px-5 py-3 text-[14px] font-medium text-[#0a0a0a] transition-colors hover:bg-[#9ae022]"
            >
              {resolved.fallbackLabel}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ) : null}
      </div>

      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3">
        <a
          href={resolved.routeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#84CC16]/30 bg-[#84CC16]/10 px-4 py-3 text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[#84CC16]/20 sm:w-auto"
        >
          {resolved.routeLabel}
          <ExternalLink className="h-4 w-4 shrink-0 text-[#84CC16]" />
        </a>
      </div>
    </div>
  );
}
