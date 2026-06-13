import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, MessageSquare, RefreshCw, Star, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { AdminCard, PageHeader } from '../components/ui';

function adminHeaders() {
  return { 'X-Admin-Password': sessionStorage.getItem('proshivka-admin-api-key') || '' };
}

const TABS = [
  { id: 'all', label: 'Все' },
  { id: 'problematic', label: 'Проблемные' },
  { id: 'high-rating', label: 'Высокий рейтинг' },
  { id: 'published', label: 'Опубликованные' },
];

const STATUS_MAP = {
  new: { label: 'Новый', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  read: { label: 'Прочитан', cls: 'bg-[#6b7280]/10 text-[#9ca3af] border-[#6b7280]/20' },
  published: { label: 'Опубликован', cls: 'bg-[#84CC16]/10 text-[#84CC16] border-[#84CC16]/20' },
  hidden: { label: 'Скрыт', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

function StarRow({ rating, size = 16 }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-[#374151]'}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

function RatingBar({ distribution, total }) {
  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map(n => {
        const count = distribution?.[n] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={n} className="flex items-center gap-2">
            <span className="text-[11px] text-[#6b7280] w-3 shrink-0">{n}</span>
            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${n >= 4 ? 'bg-[#84CC16]' : n === 3 ? 'bg-amber-400' : 'bg-red-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] text-[#6b7280] w-6 text-right shrink-0">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewCard({ review, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  const statusInfo = STATUS_MAP[review.status] ?? STATUS_MAP.new;
  const isProblematic = review.rating <= 3;

  const setStatus = async (status) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PUT',
        headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) onStatusChange();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-[#14161a] border rounded-2xl p-5 ${isProblematic ? 'border-red-500/20' : 'border-white/[0.06]'}`}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[15px] font-bold ${isProblematic ? 'bg-red-500/10 text-red-400' : 'bg-[#84CC16]/10 text-[#84CC16]'}`}>
          {(review.clientName?.[0] || '?').toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className="text-[14px] font-semibold text-white">{review.clientName || 'Клиент'}</span>
            <StarRow rating={review.rating} size={13} />
            {isProblematic && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle className="w-3 h-3" /> Проблемный
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusInfo.cls}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-2">
            {review.device && (
              <span className="text-[12px] text-[#6b7280]">📱 {review.device}</span>
            )}
            {review.orderNumber && (
              <span className="text-[12px] text-[#6b7280] font-mono">№ {review.orderNumber}</span>
            )}
            {review.masterName && (
              <span className="text-[12px] text-[#6b7280]">Мастер: {review.masterName}</span>
            )}
            <span className="text-[12px] text-[#4b5563]">
              {new Date(review.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-[13px] text-[#d1d5db] leading-relaxed mb-3">{review.comment}</p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {review.status !== 'read' && review.status !== 'published' && (
              <button
                type="button"
                disabled={loading}
                onClick={() => setStatus('read')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-[#9ca3af] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Прочитан
              </button>
            )}
            {review.status !== 'published' && (
              <button
                type="button"
                disabled={loading}
                onClick={() => setStatus('published')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-[#84CC16] bg-[#84CC16]/[0.06] hover:bg-[#84CC16]/[0.12] border border-[#84CC16]/20 transition-colors disabled:opacity-50"
              >
                <ThumbsUp className="w-3.5 h-3.5" /> Опубликовать
              </button>
            )}
            {review.status !== 'hidden' && (
              <button
                type="button"
                disabled={loading}
                onClick={() => setStatus('hidden')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-red-400 bg-red-500/[0.06] hover:bg-red-500/[0.12] border border-red-500/20 transition-colors disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" /> Скрыть
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const [tab, setTab] = useState('all');
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [revRes, statRes] = await Promise.all([
        fetch(`/api/admin/reviews?tab=${tab}`, { headers: adminHeaders() }),
        fetch('/api/admin/reviews/stats', { headers: adminHeaders() }),
      ]);
      if (revRes.ok) setReviews((await revRes.json()).reviews ?? []);
      if (statRes.ok) setStats(await statRes.json());
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader
        title="Отзывы"
        description="Отзывы клиентов после выдачи заказов. Проблемные — 1–3 звезды, попадают только в эту панель."
        actions={
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.1] text-[#9ca3af] text-[13px] hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <AdminCard>
            <p className="text-[11px] text-[#6b7280] mb-1">Всего отзывов</p>
            <p className="text-[28px] font-bold text-white leading-none">{stats.total}</p>
          </AdminCard>
          <AdminCard>
            <p className="text-[11px] text-[#6b7280] mb-1">Средняя оценка</p>
            <div className="flex items-center gap-2">
              <p className="text-[28px] font-bold text-white leading-none">{stats.average || '—'}</p>
              {stats.average > 0 && <StarRow rating={Math.round(stats.average)} size={14} />}
            </div>
          </AdminCard>
          <AdminCard>
            <p className="text-[11px] text-[#6b7280] mb-2">Проблемных</p>
            <p className="text-[28px] font-bold text-red-400 leading-none">{stats.problematic}</p>
          </AdminCard>
          <AdminCard>
            <p className="text-[11px] text-[#6b7280] mb-2">Распределение</p>
            <RatingBar distribution={stats.distribution} total={stats.total} />
          </AdminCard>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#14161a] border border-white/[0.06] mb-6 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
              tab === t.id
                ? 'bg-white/[0.1] text-white'
                : 'text-[#6b7280] hover:text-[#9ca3af]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#6b7280]">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Загрузка…
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#4b5563]">
          <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-[14px]">Нет отзывов в этой категории</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <ReviewCard key={r.id} review={r} onStatusChange={load} />
          ))}
        </div>
      )}
    </>
  );
}
