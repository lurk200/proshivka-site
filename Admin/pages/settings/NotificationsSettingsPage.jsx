import React, { useCallback, useEffect, useState } from 'react';
import {
  Bell, Check, ChevronDown, ChevronRight, Eye, EyeOff,
  Loader2, Mail, MessageCircle, Phone, RefreshCw,
  Save, Send, Smartphone, ToggleLeft, ToggleRight, X,
} from 'lucide-react';
import { PageHeader } from '../../components/ui';
import {
  fetchNotificationTemplates,
  updateNotificationTemplate,
  fetchNotificationLog,
} from '../../../src/api/ordersApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDt(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch { return '—'; }
}

const CHANNEL_ICONS = {
  email:    { icon: Mail,          label: 'Email' },
  telegram: { icon: MessageCircle, label: 'Telegram' },
  whatsapp: { icon: Phone,         label: 'WhatsApp' },
  sms:      { icon: Smartphone,    label: 'SMS' },
};

const STATUS_COLORS = {
  sent:    'text-[#84CC16] bg-[#84CC16]/10 border-[#84CC16]/20',
  queued:  'text-amber-300 bg-amber-500/10 border-amber-500/20',
  error:   'text-red-300 bg-red-500/10 border-red-500/20',
  pending: 'text-[#6b7280] bg-white/[0.04] border-white/[0.08]',
};

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-[#0c0d10] border border-white/[0.08] text-[#f3f4f6] text-[13.5px] placeholder:text-[#4b5563] focus:outline-none focus:border-[#84CC16]/50 focus:ring-1 focus:ring-[#84CC16]/20 transition-colors';

// ─── TemplateEditor ───────────────────────────────────────────────────────────

function TemplateEditor({ template, variables, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!template) return;
    setForm({
      enabled: template.enabled,
      subject: template.subject,
      body: template.body,
      channels: { ...template.channels },
    });
    setSaved(false);
  }, [template?.id]);

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
  const toggleChannel = ch => setForm(f => ({
    ...f,
    channels: { ...f.channels, [ch]: !f.channels[ch] },
  }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateNotificationTemplate(template.id, form);
      setSaved(true);
      onSaved?.();
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const previewBody = form?.body?.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    const sample = { orderNumber: '260610-01', device: 'iPhone 14 Pro', statusLabel: 'В работе', clientName: 'Иван', cost: '3 500 ₽', managerName: 'Алексей', clientComment: 'Ожидаем запчасть до пятницы', trackUrl: 'https://example.com/status-zakaza?number=260610-01' };
    return sample[k] ?? `{{${k}}}`;
  }) ?? '';

  if (!template || !form) {
    return (
      <div className="flex items-center justify-center h-48 text-[#6b7280]">
        <p className="text-[13px]">Выберите шаблон слева</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Enable toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div>
          <p className="text-[14px] font-semibold text-white">{template.name}</p>
          <p className="text-[12px] text-[#6b7280] mt-0.5">{template.description}</p>
        </div>
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
          className="flex items-center gap-2 text-[13px] font-medium transition-colors"
        >
          {form.enabled
            ? <ToggleRight className="w-8 h-8 text-[#84CC16]" />
            : <ToggleLeft className="w-8 h-8 text-[#4b5563]" />}
          <span className={form.enabled ? 'text-[#84CC16]' : 'text-[#6b7280]'}>
            {form.enabled ? 'Включён' : 'Выключен'}
          </span>
        </button>
      </div>

      {/* Channels */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-[#4b5563] mb-2">Каналы отправки</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CHANNEL_ICONS).map(([ch, { icon: Icon, label }]) => {
            const active = form.channels[ch];
            return (
              <button
                key={ch}
                type="button"
                onClick={() => toggleChannel(ch)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12.5px] font-medium transition-colors ${
                  active
                    ? 'border-[#84CC16]/30 bg-[#84CC16]/10 text-[#84CC16]'
                    : 'border-white/[0.08] bg-white/[0.02] text-[#6b7280] hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {active && <Check className="w-3 h-3 ml-1" />}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-[#4b5563] mt-2">
          Для реальной отправки настройте VITE_NOTIFY_WEBHOOK_URL в .env
        </p>
      </div>

      {/* Subject */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-[#4b5563] mb-1.5">Тема письма / заголовок</p>
        <input className={inputCls} value={form.subject} onChange={set('subject')} />
      </div>

      {/* Body */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#4b5563]">Текст сообщения</p>
          <button
            type="button"
            onClick={() => setPreviewOpen(o => !o)}
            className="inline-flex items-center gap-1 text-[11px] text-[#84CC16] hover:underline"
          >
            {previewOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {previewOpen ? 'Скрыть' : 'Превью'}
          </button>
        </div>
        <textarea
          className={`${inputCls} min-h-[140px] resize-y font-mono text-[12.5px]`}
          value={form.body}
          onChange={set('body')}
          rows={7}
        />
      </div>

      {/* Preview */}
      {previewOpen && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#4b5563] mb-2">Превью (тестовые данные)</p>
          <p className="text-[12px] font-semibold text-white mb-2">{
            form.subject.replace(/\{\{(\w+)\}\}/g, (_, k) => {
              const s = { orderNumber: '260610-01', device: 'iPhone 14 Pro', clientName: 'Иван', cost: '3 500 ₽' };
              return s[k] ?? `{{${k}}}`;
            })
          }</p>
          <p className="text-[12.5px] text-[#e5e7eb] whitespace-pre-line leading-relaxed">{previewBody}</p>
        </div>
      )}

      {/* Variables reference */}
      <details className="group">
        <summary className="flex items-center gap-1.5 text-[12px] text-[#6b7280] cursor-pointer hover:text-white list-none">
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
          Переменные шаблона
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-1.5 pl-5">
          {variables.map(({ key, desc }) => (
            <div key={key} className="flex items-baseline gap-2">
              <code className="text-[11px] font-mono text-[#84CC16] bg-[#84CC16]/10 px-1.5 py-0.5 rounded shrink-0">{key}</code>
              <span className="text-[11px] text-[#6b7280] truncate">{desc}</span>
            </div>
          ))}
        </div>
      </details>

      {/* Error */}
      {error && (
        <p className="text-[13px] text-red-400 flex items-center gap-1.5">
          <X className="w-4 h-4" />{error}
        </p>
      )}

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#84CC16] text-[#0c0d10] font-semibold text-[13.5px] hover:bg-[#9be02a] disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Сохранение…' : 'Сохранить шаблон'}
        </button>
        {saved && (
          <span className="text-[#84CC16] text-[12px] flex items-center gap-1">
            <Check className="w-4 h-4" /> Сохранено
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Notification Log ─────────────────────────────────────────────────────────

function NotificationLog({ events, loading, onRefresh }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-[#84CC16]" />
      </div>
    );
  }

  if (!events?.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <Bell className="w-8 h-8 text-[#4b5563] mb-2" />
        <p className="text-[14px] text-[#9ca3af]">Уведомлений ещё не отправлялось</p>
        <p className="text-[12px] text-[#6b7280] mt-1">
          Они появятся здесь при смене статуса заказа
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {['Статус', 'Заказ', 'Шаблон', 'Тема', 'Отправлено', 'Клиент'].map(h => (
              <th key={h} className="px-3 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-[#4b5563]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map(ev => (
            <tr key={ev.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
              <td className="px-3 py-2.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase border ${STATUS_COLORS[ev.status] ?? STATUS_COLORS.pending}`}>
                  {ev.status}
                </span>
              </td>
              <td className="px-3 py-2.5 font-mono text-[12px] text-white">{ev.orderNumber}</td>
              <td className="px-3 py-2.5 text-[12px] text-[#9ca3af]">{ev.templateId}</td>
              <td className="px-3 py-2.5 text-[12px] text-[#e5e7eb] max-w-[200px] truncate">{ev.subject}</td>
              <td className="px-3 py-2.5 text-[11px] text-[#6b7280] whitespace-nowrap">{formatDt(ev.createdAt)}</td>
              <td className="px-3 py-2.5 text-[12px] text-[#9ca3af]">{ev.clientName || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NotificationsSettingsPage() {
  const [templates, setTemplates] = useState([]);
  const [variables, setVariables] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingLog, setLoadingLog] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const data = await fetchNotificationTemplates();
      setTemplates(data.templates ?? []);
      setVariables(data.variables ?? []);
      if (!selectedId && data.templates?.length) {
        setSelectedId(data.templates[0].id);
      }
    } catch { /* ignore */ }
    finally { setLoadingTemplates(false); }
  }, []);

  const loadLog = useCallback(async () => {
    setLoadingLog(true);
    try {
      const data = await fetchNotificationLog(100);
      setEvents(data.events ?? []);
    } catch { /* ignore */ }
    finally { setLoadingLog(false); }
  }, []);

  useEffect(() => {
    loadTemplates();
    loadLog();
  }, [loadTemplates, loadLog]);

  const selectedTemplate = templates.find(t => t.id === selectedId) ?? null;

  const enabledCount = templates.filter(t => t.enabled).length;
  const anyChannels = templates.some(t => Object.values(t.channels ?? {}).some(Boolean));

  return (
    <>
      <PageHeader
        title="Уведомления"
        description="Шаблоны и каналы автоматических уведомлений при изменении статуса заказа."
        actions={
          <div className="flex items-center gap-2 text-[12px] text-[#6b7280]">
            <span className="px-2 py-1 rounded-lg bg-[#84CC16]/10 border border-[#84CC16]/20 text-[#84CC16]">
              {enabledCount} из {templates.length} включено
            </span>
            {!anyChannels && (
              <span className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                Каналы не настроены
              </span>
            )}
          </div>
        }
      />

      {/* Webhook notice */}
      <div className="mb-5 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] text-[12.5px] text-[#9ca3af] leading-relaxed">
        <p className="font-medium text-white mb-1">Настройка доставки</p>
        Установите переменную <code className="text-[#84CC16] bg-[#84CC16]/10 px-1 rounded">VITE_NOTIFY_WEBHOOK_URL</code> в{' '}
        <code className="text-[#84CC16] bg-[#84CC16]/10 px-1 rounded">.env</code> для получения событий на вашем сервере.
        Без неё уведомления логируются со статусом <code className="text-amber-300 bg-amber-500/10 px-1 rounded">queued</code>.
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-white/[0.06] pb-0">
        {[{ id: 'templates', label: 'Шаблоны' }, { id: 'log', label: `Лог отправок${events.length ? ` (${events.length})` : ''}` }].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-[13.5px] font-medium border-b-2 transition-colors ${
              activeTab === t.id ? 'border-[#84CC16] text-[#84CC16]' : 'border-transparent text-[#6b7280] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'templates' && (
        <div className="grid lg:grid-cols-[240px_1fr] gap-5">
          {/* Template list */}
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#4b5563] mb-2">Шаблоны</p>
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[#84CC16]" />
              </div>
            ) : (
              templates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    selectedId === t.id
                      ? 'bg-[#84CC16]/10 border border-[#84CC16]/20'
                      : 'border border-transparent hover:bg-white/[0.04]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${t.enabled ? 'bg-[#84CC16]' : 'bg-[#4b5563]'}`} />
                  <div className="min-w-0">
                    <p className={`text-[13px] font-medium truncate ${selectedId === t.id ? 'text-white' : 'text-[#9ca3af]'}`}>
                      {t.name}
                    </p>
                    <p className="text-[10px] text-[#4b5563] truncate">{t.description}</p>
                  </div>
                  {selectedId === t.id && <ChevronRight className="w-4 h-4 text-[#84CC16] ml-auto shrink-0" />}
                </button>
              ))
            )}
          </div>

          {/* Template editor */}
          <div className="bg-[#14161a] rounded-2xl border border-white/[0.06] p-5">
            <TemplateEditor
              template={selectedTemplate}
              variables={variables}
              onSaved={loadTemplates}
            />
          </div>
        </div>
      )}

      {activeTab === 'log' && (
        <div className="bg-[#14161a] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <p className="text-[13px] font-semibold text-white">Лог уведомлений</p>
            <button
              type="button"
              onClick={loadLog}
              disabled={loadingLog}
              className="p-2 rounded-lg text-[#6b7280] hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingLog ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <NotificationLog events={events} loading={loadingLog} onRefresh={loadLog} />
        </div>
      )}
    </>
  );
}
