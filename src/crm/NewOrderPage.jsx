import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCrm } from '../context/CrmContext.jsx'
import { searchCrmDevices } from '../api/crmApi.js'
import { APPEARANCE_OPTIONS, KIT_OPTIONS, ORDER_TYPES } from './defaults.js'
import {
  BRANDS,
  ISSUE_PRESETS,
  formatPhoneLocalMask,
  formatRuPhoneInput,
  frequentModelsForBrand,
  fullPhoneFromLocal,
  isValidRuPhone,
  phoneLocalDigits,
} from './quickPresets.js'
import { Toast, formatMoney } from './components/ui.jsx'

function splitList(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function ChipGroup({ options, value, onChange, multi = false, variant = 'brand', exclude = [] }) {
  const selected = multi ? splitList(value) : [value].filter(Boolean)
  const list = options.filter((o) => !exclude.includes(o))

  function toggle(opt) {
    if (!multi) {
      onChange(value === opt ? '' : opt)
      return
    }
    const set = new Set(selected)
    if (set.has(opt)) set.delete(opt)
    else set.add(opt)
    onChange([...set].join(', '))
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((opt) => {
        const on = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`intake-chip intake-chip--${variant} ${on ? 'is-active' : ''}`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function endOfWorkDay(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  d.setHours(19, 0, 0, 0)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function NewOrderPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const presetDeviceId = params.get('deviceId') || ''
  const { createOrder, busy, getDevice } = useCrm()

  const modelRef = useRef(null)
  const phoneRef = useRef(null)
  const issueNoteRef = useRef(null)
  const formRef = useRef(null)

  const [type, setType] = useState('regular')
  const [clientName, setClientName] = useState('')
  const [phoneLocal, setPhoneLocal] = useState('')
  const [brand, setBrand] = useState('')
  const [brandCustom, setBrandCustom] = useState('')
  const [model, setModel] = useState('')
  const [imei, setImei] = useState('')
  const [issues, setIssues] = useState([])
  const [issueNote, setIssueNote] = useState('')
  const [screenPin, setScreenPin] = useState('')
  const [appearance, setAppearance] = useState('')
  const [kit, setKit] = useState('Телефон')
  const [promisedAt, setPromisedAt] = useState('')
  const [priceFrom, setPriceFrom] = useState('')
  const [deviceId, setDeviceId] = useState(presetDeviceId)
  const [matches, setMatches] = useState([])
  const [returningClient, setReturningClient] = useState(null)
  const [toast, setToast] = useState('')

  const frequentModels = useMemo(() => frequentModelsForBrand(brand), [brand])
  const resolvedBrand = brand === 'Другое' ? brandCustom.trim() : brand
  const clientPhone = fullPhoneFromLocal(phoneLocal)
  const issuesString = [...issues, issueNote.trim(), screenPin.trim() ? `PIN: ${screenPin.trim()}` : '']
    .filter(Boolean)
    .join(' · ')

  useEffect(() => {
    if (!presetDeviceId) return
    const d = getDevice(presetDeviceId)
    if (!d) return
    applyDevice(d, { visits: null })
  }, [presetDeviceId, getDevice])

  useEffect(() => {
    if (deviceId) return
    const local = phoneLocalDigits(phoneLocal)
    if (local.length < 10) {
      setMatches([])
      setReturningClient(null)
      return
    }
    const t = setTimeout(async () => {
      try {
        const res = await searchCrmDevices(`7${local}`)
        const rows = res.results || []
        setMatches(rows)
        if (rows.length) {
          const best = rows[0]
          const visits = rows.reduce((n, r) => n + (r.orders?.length || 0), 0)
          setReturningClient({
            name: best.device.clientName,
            visits: Math.max(visits, rows.length),
            device: best.device,
            rows,
          })
          setClientName((prev) => (prev.trim() ? prev : best.device.clientName || ''))
        } else {
          setReturningClient(null)
        }
      } catch {
        setMatches([])
        setReturningClient(null)
      }
    }, 220)
    return () => clearTimeout(t)
  }, [phoneLocal, deviceId])

  useEffect(() => {
    function onKey(e) {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'Enter') return
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function applyDevice(d, meta = {}) {
    setDeviceId(d.id)
    setClientName(d.clientName || '')
    setPhoneLocal(formatPhoneLocalMask(d.clientPhone || ''))
    if (d.brand && BRANDS.includes(d.brand)) {
      setBrand(d.brand)
      setBrandCustom('')
    } else if (d.brand) {
      setBrand('Другое')
      setBrandCustom(d.brand)
    }
    setModel(d.model || '')
    setImei(d.imei || '')
    setMatches([])
    if (meta.visits != null) {
      setReturningClient({ name: d.clientName, visits: meta.visits, device: d })
    }
  }

  function pickDevice(row) {
    const visits = (row.orders?.length || 0) + (matches.length > 1 ? matches.length - 1 : 0)
    applyDevice(row.device, { visits: Math.max(visits, row.orders?.length || 1) })
  }

  function selectBrand(next) {
    setBrand(next)
    setModel('')
    setBrandCustom('')
    if (next && next !== 'Другое') {
      requestAnimationFrame(() => modelRef.current?.focus())
    }
  }

  function pickModel(m) {
    setModel(m)
    requestAnimationFrame(() => modelRef.current?.focus())
  }

  function toggleIssue(opt) {
    if (opt === 'Другое') {
      setIssueNote((v) => v || '')
      requestAnimationFrame(() => issueNoteRef.current?.focus())
      return
    }
    setIssues((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]))
  }

  function validate() {
    if (!resolvedBrand && !model.trim()) {
      setToast('Укажите бренд или модель')
      return false
    }
    if (!resolvedBrand) {
      setToast('Выберите бренд')
      return false
    }
    if (!model.trim()) {
      setToast('Укажите модель')
      modelRef.current?.focus()
      return false
    }
    if (!issues.length && !issueNote.trim()) {
      setToast('Выберите неисправность или уточните')
      issueNoteRef.current?.focus()
      return false
    }
    if (!isValidRuPhone(clientPhone)) {
      setToast('Телефон: нужны 10 цифр после +7')
      phoneRef.current?.focus()
      return false
    }
    return true
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    try {
      const res = await createOrder({
        type,
        deviceId: deviceId || undefined,
        clientName: clientName.trim() || 'Клиент',
        clientPhone: formatRuPhoneInput(clientPhone),
        brand: resolvedBrand,
        model: model.trim(),
        imei,
        issue: issuesString,
        appearance,
        kit,
        promisedAt: promisedAt ? new Date(promisedAt).toISOString() : null,
        priceFrom: priceFrom === '' ? null : Number(priceFrom),
      })
      navigate(`/crm/orders/${res.order.id}`, { replace: true, state: { justCreated: true } })
    } catch (err) {
      setToast(err.message || 'Ошибка создания')
    }
  }

  const previewDevice = [resolvedBrand, model].filter(Boolean).join(' ') || 'Устройство не указано'
  const previewIssue = issuesString || 'Неисправность не указана'
  const typeLabel = ORDER_TYPES.find((t) => t.id === type)?.label || type

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      <form ref={formRef} onSubmit={onSubmit}>
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Link
            to="/crm"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--crm-radius-sm)] text-[var(--crm-brand)] hover:bg-[var(--crm-surface)]"
            title="На доску"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-[22px] font-bold tracking-[-0.02em] text-[var(--crm-text)]">
            Приёмка устройства
          </h1>
          <div className="ml-auto overflow-x-auto">
            <div className="intake-type-seg">
              {ORDER_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={type === t.id ? 'is-active' : ''}
                  onClick={() => setType(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          {/* Left 8 cols */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-5 shadow-[var(--crm-shadow-card)] sm:p-6">
              {/* Device */}
              <section>
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--crm-text-faint)]">
                  Устройство
                </p>
                <div className="mb-2">
                  <ChipGroup
                    options={BRANDS}
                    value={brand}
                    onChange={selectBrand}
                    variant="brand"
                  />
                </div>
                {brand === 'Другое' ? (
                  <input
                    className="crm-input mb-3"
                    value={brandCustom}
                    onChange={(e) => setBrandCustom(e.target.value)}
                    placeholder="Введите бренд"
                    autoFocus
                  />
                ) : null}

                {frequentModels.length ? (
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-[var(--crm-text-faint)]">
                      Частые:
                    </span>
                    {frequentModels.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => pickModel(m)}
                        className={`intake-chip intake-chip--model ${model === m ? 'is-active' : ''}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                ) : brand && brand !== 'Другое' ? (
                  <p className="mb-3 text-[12px] text-[var(--crm-text-faint)]">
                    Нет пресетов — введите модель вручную
                  </p>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                      Модель
                    </span>
                    <input
                      ref={modelRef}
                      className="crm-input"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder={brand ? `Модель ${brand}` : 'Например iPhone 13'}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                      IMEI / серийник
                    </span>
                    <input
                      className="crm-input tabular-nums"
                      value={imei}
                      onChange={(e) => setImei(e.target.value)}
                      placeholder="Необязательно"
                    />
                  </label>
                </div>
              </section>

              <hr className="my-5 border-[var(--crm-border)]" />

              {/* Issue */}
              <section>
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--crm-text-faint)]">
                  Неисправность
                </p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {ISSUE_PRESETS.filter((x) => x !== 'Другое').map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleIssue(opt)}
                      className={`intake-chip intake-chip--issue ${issues.includes(opt) ? 'is-active' : ''}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                      Уточнение
                    </span>
                    <input
                      ref={issueNoteRef}
                      className="crm-input"
                      value={issueNote}
                      onChange={(e) => setIssueNote(e.target.value)}
                      placeholder="Свои детали…"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                      Пароль / PIN экрана
                    </span>
                    <input
                      className="crm-input"
                      value={screenPin}
                      onChange={(e) => setScreenPin(e.target.value)}
                      placeholder="Если есть"
                    />
                  </label>
                </div>
              </section>

              <hr className="my-5 border-[var(--crm-border)]" />

              {/* Appearance + kit */}
              <section className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--crm-text-faint)]">
                    Внешний вид
                  </p>
                  <ChipGroup
                    options={APPEARANCE_OPTIONS}
                    value={appearance}
                    onChange={setAppearance}
                    multi
                    variant="appearance"
                  />
                </div>
                <div>
                  <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--crm-text-faint)]">
                    Комплектация
                  </p>
                  <ChipGroup
                    options={KIT_OPTIONS}
                    value={kit}
                    onChange={setKit}
                    multi
                    variant="bundle"
                  />
                </div>
              </section>
            </div>
          </div>

          {/* Right 4 cols sticky */}
          <div className="lg:col-span-4">
            <div className="space-y-4 lg:sticky lg:top-6">
              <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-5 shadow-[var(--crm-shadow-card)]">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--crm-text-faint)]">
                  Клиент
                </p>

                {deviceId ? (
                  <div className="mb-3 flex items-center justify-between rounded-[var(--crm-radius-md)] border border-[var(--crm-brand-border)] bg-[var(--crm-brand-soft)] px-3 py-2 text-[12px]">
                    <span className="font-semibold text-[var(--crm-brand-text)]">
                      Повторный заход · устройство привязано
                    </span>
                    <button
                      type="button"
                      className="font-bold text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]"
                      onClick={() => {
                        setDeviceId('')
                        setReturningClient(null)
                      }}
                    >
                      Сброс
                    </button>
                  </div>
                ) : null}

                <label className="mb-3 block">
                  <span className="mb-1 block text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                    Телефон
                  </span>
                  <div className="intake-phone">
                    <span className="intake-phone-prefix">+7</span>
                    <input
                      ref={phoneRef}
                      className="crm-input"
                      value={phoneLocal}
                      onChange={(e) => setPhoneLocal(formatPhoneLocalMask(e.target.value))}
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(999) 000-00-00"
                    />
                  </div>
                </label>

                {returningClient && !deviceId ? (
                  <div className="mb-3 rounded-[var(--crm-radius-md)] border border-[var(--crm-border)] bg-[var(--crm-subtle)] px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="crm-badge">
                        Постоянный клиент
                        {returningClient.visits ? ` · ${returningClient.visits}` : ''}
                      </span>
                      {matches[0] ? (
                        <button
                          type="button"
                          className="text-[12px] font-bold text-[var(--crm-brand)] hover:underline"
                          onClick={() => pickDevice(matches[0])}
                        >
                          Привязать устройство
                        </button>
                      ) : null}
                    </div>
                    {matches.length > 1 ? (
                      <ul className="mt-2 space-y-1">
                        {matches.slice(0, 4).map((row) => (
                          <li key={row.device.id}>
                            <button
                              type="button"
                              onClick={() => pickDevice(row)}
                              className="w-full rounded-md px-1.5 py-1 text-left text-[12px] hover:bg-[var(--crm-surface)]"
                            >
                              <span className="font-semibold text-[var(--crm-text)]">
                                {[row.device.brand, row.device.model].filter(Boolean).join(' ')}
                              </span>
                              <span className="text-[var(--crm-text-faint)]">
                                {' '}
                                · {row.orders?.length || 0} зах.
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                <label className="mb-3 block">
                  <span className="mb-1 block text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                    Имя
                  </span>
                  <input
                    className="crm-input"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Как обращаться"
                  />
                </label>

                <label className="mb-3 block">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                      Срок
                    </span>
                    <button
                      type="button"
                      className="crm-btn-ghost !px-2 !py-1 !text-[11px]"
                      onClick={() => setPromisedAt(endOfWorkDay(0))}
                    >
                      Сегодня
                    </button>
                    <button
                      type="button"
                      className="crm-btn-ghost !px-2 !py-1 !text-[11px]"
                      onClick={() => setPromisedAt(endOfWorkDay(1))}
                    >
                      +1д
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    className="crm-input"
                    value={promisedAt}
                    onChange={(e) => setPromisedAt(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-[var(--crm-text-secondary)]">
                    Ориентир цены, ₽
                  </span>
                  <input
                    type="number"
                    className="crm-input crm-input-num"
                    value={priceFrom}
                    onChange={(e) => setPriceFrom(e.target.value)}
                    placeholder="от"
                  />
                </label>
              </div>

              {/* Live receipt */}
              <div className="intake-receipt">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/45">
                  Квитанция · {typeLabel}
                </p>
                <p className="mt-2 text-[15px] font-bold leading-snug">{previewDevice}</p>
                <p className="mt-1.5 text-[12px] leading-snug text-white/70">{previewIssue}</p>
                <div className="mt-3 space-y-1 border-t border-white/10 pt-3 text-[12px] text-white/65">
                  <p>
                    <span className="text-white/40">Клиент</span>{' '}
                    <span className="text-white">
                      {clientName.trim() || '—'} ·{' '}
                      <span className="tabular-nums">
                        {phoneLocal ? `+7 ${phoneLocal}` : '+7 …'}
                      </span>
                    </span>
                  </p>
                  {appearance ? (
                    <p>
                      <span className="text-white/40">Вид</span> {appearance}
                    </p>
                  ) : null}
                  {kit ? (
                    <p>
                      <span className="text-white/40">Комплект</span> {kit}
                    </p>
                  ) : null}
                  {promisedAt ? (
                    <p>
                      <span className="text-white/40">Срок</span>{' '}
                      {new Date(promisedAt).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  ) : null}
                  {priceFrom !== '' ? (
                    <p>
                      <span className="text-white/40">от</span>{' '}
                      <span className="tabular-nums text-white">{formatMoney(priceFrom)}</span>
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="crm-btn-primary mt-4 w-full !py-3"
                >
                  {busy ? 'Создание…' : 'Принять и открыть'}
                </button>
                <p className="mt-2 text-center text-[10px] text-white/35">Ctrl + Enter</p>
              </div>
            </div>
          </div>
        </div>
      </form>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
