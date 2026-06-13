import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';
import { Reveal } from '../components/ui';
import { useCms } from '../context/CmsContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMonthYear(iso) {
  try {
    return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(iso));
  } catch {
    return '';
  }
}

function StarRow({ rating, size = 14 }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating} из 5`}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={n <= rating ? 'text-[#84CC16] fill-[#84CC16]' : 'text-[var(--border-medium)]'}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

// ─── Schema.org JSON-LD ───────────────────────────────────────────────────────

function ReviewsSchema({ reviews, stats, companyName }) {
  if (!stats?.total) return null;

  const aggregateRating = {
    '@type': 'AggregateRating',
    ratingValue: stats.average,
    reviewCount: stats.total,
    bestRating: 5,
    worstRating: 1,
  };

  const reviewItems = reviews.slice(0, 10).map(r => ({
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: { '@type': 'Person', name: r.clientName || 'Клиент' },
    reviewBody: r.comment || '',
    datePublished: r.createdAt?.slice(0, 10) || '',
    itemReviewed: {
      '@type': 'LocalBusiness',
      name: companyName || 'ПРОШИВКА',
    },
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: companyName || 'ПРОШИВКА',
    aggregateRating,
    review: reviewItems,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

const RATING_FILTERS = [
  { id: 'all', label: 'Все' },
  { id: '5', label: '5 ★' },
  { id: '4', label: '4 ★' },
];

function FilterBar({ active, onChange, devices, activeDevice, onDeviceChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
        {RATING_FILTERS.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
              active === f.id
                ? 'bg-[#84CC16] text-[#0a0b0e]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {devices.length > 0 && (
        <select
          value={activeDevice}
          onChange={e => onDeviceChange(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[13px] text-[var(--text-primary)] outline-none"
        >
          <option value="">Все устройства</option>
          {devices.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      )}
    </div>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({ review }) {
  return (
    <article className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#84CC16]/10 flex items-center justify-center shrink-0 text-[14px] font-bold text-[#84CC16]">
            {(review.clientName?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">
              {review.clientName || 'Клиент'}
            </p>
            {review.device && (
              <p className="text-[11px] text-[var(--text-muted)]">{review.device}</p>
            )}
          </div>
        </div>
        <StarRow rating={review.rating} />
      </div>

      {review.comment && (
        <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed flex-1">
          «{review.comment}»
        </p>
      )}

      <p className="text-[11px] text-[var(--text-muted)] capitalize">
        {formatMonthYear(review.createdAt)}
      </p>
    </article>
  );
}

// ─── Aggregate rating display ─────────────────────────────────────────────────

function AggregateRatingBlock({ stats }) {
  if (!stats || stats.total === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-6 mb-10 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] w-fit">
      <div className="text-center">
        <p className="text-[48px] font-bold text-[var(--text-primary)] leading-none">{stats.average}</p>
        <StarRow rating={Math.round(stats.average)} size={16} />
        <p className="text-[12px] text-[var(--text-muted)] mt-1">Средняя оценка</p>
      </div>
      <div>
        {[5, 4, 3, 2, 1].map(n => {
          const count = stats.distribution?.[n] ?? 0;
          const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
          return (
            <div key={n} className="flex items-center gap-2 mb-1">
              <span className="text-[11px] text-[var(--text-muted)] w-2">{n}</span>
              <div className="w-24 h-1.5 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#84CC16]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[11px] text-[var(--text-muted)] w-4">{count}</span>
            </div>
          );
        })}
        <p className="text-[11px] text-[var(--text-muted)] mt-1.5">На основе {stats.total} отзывов</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewsPublicPage() {
  const { cmsData } = useCms();
  const companyName = cmsData.company?.name || 'ПРОШИВКА';

  const [allReviews, setAllReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [deviceFilter, setDeviceFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/reviews/published').then(r => r.json()),
      fetch('/api/reviews/stats').then(r => r.json()),
    ])
      .then(([revData, statsData]) => {
        setAllReviews(revData.reviews ?? []);
        setStats(statsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const devices = useMemo(() => {
    const set = new Set(allReviews.map(r => r.device).filter(Boolean));
    return [...set].sort();
  }, [allReviews]);

  const filtered = useMemo(() => {
    return allReviews.filter(r => {
      if (ratingFilter !== 'all' && r.rating !== Number(ratingFilter)) return false;
      if (deviceFilter && r.device !== deviceFilter) return false;
      return true;
    });
  }, [allReviews, ratingFilter, deviceFilter]);

  return (
    <PageTransition>
      <Helmet>
        <title>Отзывы клиентов — {companyName}</title>
        <meta
          name="description"
          content={`Отзывы клиентов сервисного центра ${companyName}. ${stats?.total ? `Средняя оценка ${stats.average} на основе ${stats.total} отзывов.` : ''}`}
        />
      </Helmet>

      {stats && (
        <ReviewsSchema reviews={allReviews} stats={stats} companyName={companyName} />
      )}

      <section className="relative min-h-[60vh] bg-[var(--bg-base)] pt-24 pb-16 md:pt-32">
        <div
          className="pointer-events-none absolute inset-0 bg-diagnostic-grid"
          style={{ opacity: 'var(--grid-opacity)' }}
        />
        <div className="container relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <Link
              to="/"
              className="group mb-4 inline-flex items-center text-[12px] text-[var(--text-muted)] hover:text-[#84CC16]"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
              На главную
            </Link>
            <h1 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium tracking-tight text-[var(--text-primary)] mb-2">
              Отзывы клиентов
            </h1>
            <p className="text-[14px] text-[var(--text-secondary)] mb-8">
              Реальные отзывы после выдачи отремонтированных устройств
            </p>
          </Reveal>

          <Reveal delay={40}>
            <AggregateRatingBlock stats={stats} />
          </Reveal>

          {!loading && allReviews.length > 0 && (
            <FilterBar
              active={ratingFilter}
              onChange={setRatingFilter}
              devices={devices}
              activeDevice={deviceFilter}
              onDeviceChange={setDeviceFilter}
            />
          )}

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] h-36 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-[var(--text-muted)]">
              {allReviews.length === 0
                ? 'Пока нет опубликованных отзывов'
                : 'Нет отзывов по выбранному фильтру'}
            </div>
          ) : (
            <Reveal delay={60}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(r => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
