import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { Reveal } from '../ui';

function formatMonthYear(iso) {
  try {
    return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(iso));
  } catch {
    return '';
  }
}

function StarRow({ rating, size = 13 }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={n <= rating ? 'text-[#84CC16] fill-[#84CC16]' : 'text-[var(--border-medium)]'}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

function ReviewCard({ review, delay }) {
  return (
    <Reveal delay={delay}>
      <article className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 flex flex-col gap-3 h-full">
        <div className="flex items-center justify-between gap-2">
          <StarRow rating={review.rating} />
          {review.device && (
            <span className="text-[11px] text-[var(--text-muted)] font-mono truncate max-w-[120px]">
              {review.device}
            </span>
          )}
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
    </Reveal>
  );
}

export default function PublishedReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/reviews/published?limit=6').then(r => r.json()),
      fetch('/api/reviews/stats').then(r => r.json()),
    ])
      .then(([revData, statsData]) => {
        setReviews(revData.reviews ?? []);
        setStats(statsData);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || reviews.length === 0) return null;

  return (
    <section id="reviews" className="w-full min-w-0 pt-10 sm:pt-14 md:pt-16 border-t border-[var(--border-subtle)]">
      <Reveal className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[#84CC16] text-[10px] font-mono uppercase tracking-widest block mb-3">
            Отзывы клиентов
          </span>
          <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] font-medium text-[var(--text-primary)] tracking-tight">
            Что говорят о нас
          </h2>
        </div>

        {stats && stats.total > 0 && (
          <div className="flex items-center gap-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl px-4 py-2.5 w-fit shrink-0">
            <Star className="w-4 h-4 text-[#84CC16] fill-[#84CC16] shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-[15px] font-bold text-[var(--text-primary)] leading-none">
                {stats.average}
                <span className="text-[11px] font-normal text-[var(--text-muted)] ml-1">/ 5</span>
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                На основе {stats.total} {stats.total === 1 ? 'отзыва' : stats.total < 5 ? 'отзывов' : 'отзывов'}
              </p>
            </div>
          </div>
        )}
      </Reveal>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {reviews.slice(0, 6).map((r, i) => (
          <ReviewCard key={r.id} review={r} delay={i * 60} />
        ))}
      </div>

      <Reveal>
        <Link
          to="/reviews"
          className="inline-flex items-center gap-2 text-[13px] text-[#84CC16] hover:underline font-medium"
        >
          Все отзывы <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </Reveal>
    </section>
  );
}
