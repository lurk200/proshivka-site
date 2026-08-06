import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle2,
  Circle,
  ExternalLink,
  RefreshCw,
  Search,
  TriangleAlert,
} from 'lucide-react';
import { STAVROPOL_SEO_QUERY_GROUPS } from '../../src/data/seoContent';
import { AdminCard, Field, Input, Textarea } from './ui';

function normaliseUrl(value) {
  return value?.trim().replace(/\/$/, '') || '';
}

function CheckRow({ complete, title, detail, action }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/[0.06] last:border-0">
      {complete ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#84CC16] shrink-0" /> : <Circle className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-white">{title}</p>
        <p className="text-[12px] text-[#6b7280] mt-0.5 break-all">{detail}</p>
      </div>
      {action}
    </div>
  );
}

export function SearchReadiness({ global }) {
  const siteUrl = normaliseUrl(global.siteUrl);
  const checklist = [
    {
      title: 'Адрес сайта',
      complete: Boolean(siteUrl && /^https:\/\//i.test(siteUrl)),
      detail: siteUrl || 'Укажите полный адрес с https:// — он используется в canonical и sitemap.',
    },
    {
      title: 'Sitemap доступен поисковикам',
      complete: Boolean(siteUrl),
      detail: siteUrl ? `${siteUrl}/sitemap.xml` : 'Адрес появится после заполнения поля «Адрес сайта».',
    },
    {
      title: 'Google Search Console',
      complete: Boolean(global.googleSiteVerification?.trim()),
      detail: global.googleSiteVerification?.trim() ? 'Код проверки добавлен в метатеги сайта.' : 'Скопируйте только значение content из метатега проверки.',
      href: 'https://search.google.com/search-console',
    },
    {
      title: 'Яндекс Вебмастер',
      complete: Boolean(global.yandexVerification?.trim()),
      detail: global.yandexVerification?.trim() ? 'Код проверки добавлен в метатеги сайта.' : 'Скопируйте только значение content из метатега проверки.',
      href: 'https://webmaster.yandex.ru/',
    },
  ];
  const completed = checklist.filter(item => item.complete).length;

  return (
    <AdminCard>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-[12px] font-mono text-[#84CC16]">ГОТОВНОСТЬ К ПОИСКУ</p>
          <h2 className="text-[16px] font-semibold text-white mt-1">Проверка перед отправкой сайта</h2>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${completed === checklist.length ? 'bg-[#84CC16]/15 text-[#84CC16]' : 'bg-amber-500/15 text-amber-400'}`}>{completed} из {checklist.length}</span>
      </div>
      <p className="text-[13px] text-[#9ca3af] mb-2">Сначала заполните адрес сайта, затем подтвердите права в обеих системах и отправьте sitemap.</p>
      <div>{checklist.map(item => <CheckRow key={item.title} complete={item.complete} title={item.title} detail={item.detail} action={item.href ? <a href={item.href} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-[#6b7280] hover:text-[#84CC16] hover:bg-white/[0.04]" title={`Открыть ${item.title}`}><ExternalLink className="w-3.5 h-3.5" /></a> : null} />)}</div>
    </AdminCard>
  );
}

export function LocalSeoPanel({ localSeo, onChange, onApplyPreset }) {
  const settings = localSeo ?? { city: 'Ставрополь', region: 'Ставропольский край', queryGroups: STAVROPOL_SEO_QUERY_GROUPS };
  const groups = settings.queryGroups?.length ? settings.queryGroups : STAVROPOL_SEO_QUERY_GROUPS;
  const updateGroup = (index, queries) => {
    const nextGroups = groups.map((group, groupIndex) => groupIndex === index ? { ...group, queries: queries.split('\n').map(value => value.trim()).filter(Boolean) } : group);
    onChange({ ...settings, queryGroups: nextGroups });
  };

  return (
    <AdminCard>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-[12px] font-mono text-[#84CC16]">ЛОКАЛЬНОЕ SEO</p>
          <h2 className="text-[16px] font-semibold text-white mt-1">Ставрополь: город и план запросов</h2>
          <p className="text-[13px] text-[#9ca3af] mt-1">Это рабочий список тем. Вносите фактические частотности и приоритеты после проверки в Wordstat.</p>
        </div>
        <button type="button" onClick={onApplyPreset} className="px-3.5 py-2 rounded-xl bg-[#84CC16] text-[#0c0d10] text-[13px] font-semibold hover:bg-[#9be02a] transition-colors">Применить SEO для Ставрополя</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-5">
        <Field label="Город"><Input value={settings.city ?? ''} onChange={event => onChange({ ...settings, city: event.target.value })} placeholder="Ставрополь" /></Field>
        <Field label="Регион"><Input value={settings.region ?? ''} onChange={event => onChange({ ...settings, region: event.target.value })} placeholder="Ставропольский край" /></Field>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group, index) => (
          <Field key={group.id} label={group.label} hint="Один запрос в строке">
            <Textarea rows={3} value={(group.queries ?? []).join('\n')} onChange={event => updateGroup(index, event.target.value)} />
          </Field>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 text-[12px]">
        <a href="https://wordstat.yandex.ru/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#84CC16] hover:underline">Проверить спрос в Wordstat <ExternalLink className="w-3.5 h-3.5" /></a>
        <a href="https://webmaster.yandex.ru/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#84CC16] hover:underline">Собрать рекомендации в Вебмастере <ExternalLink className="w-3.5 h-3.5" /></a>
      </div>
      <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-4 py-3 text-[12px] text-[#bfdbfe]">
        После публикации укажите «Ставрополь» в Яндекс Вебмастере: «Представление в поиске → Региональность». Также заполните фактические адрес и телефон в{' '}
        <Link to="/admin/settings/company" className="text-[#84CC16] hover:underline">настройках компании</Link> — они попадут в локальную структурированную разметку.
      </div>
    </AdminCard>
  );
}

export function SearchPreview({ title, description, url }) {
  const displayUrl = url || 'https://ваш-сайт.ru/страница';
  const displayTitle = title || 'Заголовок страницы';
  const displayDescription = description || 'Краткое описание страницы для результата поиска. Объясните пользу страницы и важную услугу для клиента.';

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[
        { name: 'Google', titleClass: 'text-[#8ab4f8]' },
        { name: 'Яндекс', titleClass: 'text-[#79aaf8]' },
      ].map(engine => (
        <div key={engine.name} className="rounded-xl border border-white/[0.08] bg-[#0c0d10] p-4">
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#6b7280] mb-3">Превью в {engine.name}</p>
          <p className={`text-[18px] leading-snug truncate ${engine.titleClass}`}>{displayTitle}</p>
          <p className="text-[13px] text-[#84CC16] mt-0.5 truncate">{displayUrl}</p>
          <p className="text-[13px] text-[#9aa0a6] mt-1 line-clamp-2">{displayDescription}</p>
        </div>
      ))}
    </div>
  );
}

export function SeoQuality({ title, description, canonical, noindex }) {
  const titleLength = title?.trim().length ?? 0;
  const descriptionLength = description?.trim().length ?? 0;
  const checks = [
    { label: 'Заголовок', complete: titleLength >= 30 && titleLength <= 60, detail: `${titleLength} из рекомендуемых 30–60 символов` },
    { label: 'Описание', complete: descriptionLength >= 120 && descriptionLength <= 160, detail: `${descriptionLength} из рекомендуемых 120–160 символов` },
    { label: 'Canonical', complete: Boolean(canonical), detail: canonical ? 'Адрес будет указан в canonical.' : 'Соберётся автоматически после заполнения адреса сайта.' },
    { label: 'Индексация', complete: !noindex, detail: noindex ? 'Страница закрыта от индексации.' : 'Страница доступна для индексации.' },
  ];
  const completed = checks.filter(item => item.complete).length;

  return (
    <AdminCard>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div><p className="text-[12px] font-mono text-[#84CC16]">ПРОВЕРКА СТРАНИЦЫ</p><p className="text-[13px] text-[#9ca3af] mt-1">Минимальный набор для понятного сниппета.</p></div>
        <span className="text-[18px] font-semibold text-white">{completed}/4</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">{checks.map(item => <div key={item.label} className={`rounded-xl border px-3 py-2.5 ${item.complete ? 'border-[#84CC16]/20 bg-[#84CC16]/[0.04]' : 'border-amber-500/20 bg-amber-500/[0.04]'}`}><div className="flex items-center gap-2">{item.complete ? <CheckCircle2 className="w-3.5 h-3.5 text-[#84CC16]" /> : <TriangleAlert className="w-3.5 h-3.5 text-amber-400" />}<p className="text-[12px] font-medium text-white">{item.label}</p></div><p className="text-[11px] text-[#6b7280] mt-1">{item.detail}</p></div>)}</div>
    </AdminCard>
  );
}

function sourceCount(sources, expression) {
  return sources.filter(item => expression.test(item.source || '')).reduce((sum, item) => sum + (item.count || 0), 0);
}

export function SearchTrafficMonitor() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/analytics', { headers: { 'X-Admin-Password': sessionStorage.getItem('proshivka-admin-api-key') || '' } });
      if (!response.ok) throw new Error('Не удалось получить данные о трафике.');
      setData(await response.json());
    } catch (loadError) {
      setError(loadError.message || 'Не удалось получить данные о трафике.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const sources = data?.trafficSources ?? [];
  const yandex = useMemo(() => sourceCount(sources, /яндекс|yandex/i), [sources]);
  const google = useMemo(() => sourceCount(sources, /google/i), [sources]);
  const total = yandex + google;

  return (
    <div className="space-y-6">
      <AdminCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-[12px] font-mono text-[#84CC16]">ПОИСКОВЫЙ ТРАФИК</p><h2 className="text-[16px] font-semibold text-white mt-1">Переходы из поиска за последние 30 дней</h2><p className="text-[13px] text-[#9ca3af] mt-1">По переходам, которые браузер передал как источник. Это не данные о показах и позициях.</p></div>
          <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.1] text-[13px] text-[#9ca3af] hover:text-white hover:bg-white/[0.04] disabled:opacity-50"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Обновить</button>
        </div>
        {error ? <p className="mt-4 text-[13px] text-amber-400">{error}</p> : <div className="grid gap-3 sm:grid-cols-3 mt-5"><TrafficMetric label="Всего из поиска" value={total} icon={Search} accent /><TrafficMetric label="Яндекс" value={yandex} icon={BarChart3} /><TrafficMetric label="Google" value={google} icon={BarChart3} /></div>}
      </AdminCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminCard><h3 className="text-[14px] font-semibold text-white">Яндекс: что смотреть еженедельно</h3><p className="text-[13px] text-[#9ca3af] mt-2">Показы, клики, CTR, среднюю позицию, страницы и поисковые фразы в Яндекс Вебмастере.</p><a href="https://webmaster.yandex.ru/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-4 text-[13px] text-[#84CC16] hover:underline">Открыть Яндекс Вебмастер <ExternalLink className="w-3.5 h-3.5" /></a></AdminCard>
        <AdminCard><h3 className="text-[14px] font-semibold text-white">Google: что смотреть еженедельно</h3><p className="text-[13px] text-[#9ca3af] mt-2">Показы, клики, CTR и позицию по запросам и страницам в отчёте Performance.</p><a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-4 text-[13px] text-[#84CC16] hover:underline">Открыть Search Console <ExternalLink className="w-3.5 h-3.5" /></a></AdminCard>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] p-4"><BarChart3 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" /><p className="text-[13px] text-[#bfdbfe]">Для автоматической загрузки показов, CTR и позиций нужны отдельные доступы к API Яндекс Вебмастера и Google Search Console. Пока они не подключены, панель честно показывает только переходы, которые фиксирует сайт.</p></div>
      <Link to="/admin/analytics?tab=sources" className="inline-flex items-center gap-2 text-[13px] text-[#84CC16] hover:underline">Все источники трафика в аналитике <ExternalLink className="w-3.5 h-3.5" /></Link>
    </div>
  );
}

function TrafficMetric({ label, value, icon: Icon, accent = false }) {
  return <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"><div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${accent ? 'text-[#84CC16]' : 'text-[#6b7280]'}`} /><p className="text-[12px] text-[#9ca3af]">{label}</p></div><p className={`text-[28px] font-semibold mt-2 ${accent ? 'text-[#84CC16]' : 'text-white'}`}>{value.toLocaleString('ru-RU')}</p></div>;
}
