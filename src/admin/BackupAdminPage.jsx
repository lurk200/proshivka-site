import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  HardDriveDownload,
  Loader2,
  RefreshCw,
  Upload,
} from 'lucide-react'
import { downloadBackup, fetchBackupInfo, restoreBackup } from '../api/backupApi.js'
import { useCms } from '../context/CmsContext.jsx'
import { Button, Card, PageHeader } from './components/ui.jsx'

function formatBytes(n) {
  if (!n || n < 1024) return `${n || 0} Б`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`
  return `${(n / (1024 * 1024)).toFixed(1)} МБ`
}

export default function BackupAdminPage() {
  const { reload } = useCms()
  const fileRef = useRef(null)
  const [info, setInfo] = useState(null)
  const [infoError, setInfoError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [picked, setPicked] = useState(null)

  async function loadInfo() {
    setInfoError('')
    try {
      const manifest = await fetchBackupInfo()
      setInfo(manifest)
    } catch (e) {
      setInfoError(e.message || 'Ошибка')
    }
  }

  useEffect(() => {
    loadInfo()
  }, [])

  async function onDownload() {
    setError('')
    setMessage('')
    setDownloading(true)
    try {
      const res = await downloadBackup()
      setMessage(`Скачан ${res.filename} (${formatBytes(res.size)}). Сохраните файл на ПК или в облако.`)
      await loadInfo()
    } catch (e) {
      setError(e.message || 'Ошибка скачивания')
    } finally {
      setDownloading(false)
    }
  }

  function onPick(e) {
    const file = e.target.files?.[0] || null
    e.target.value = ''
    setPicked(file)
    setError('')
    setMessage('')
  }

  async function onRestore() {
    if (!picked) {
      setError('Сначала выберите ZIP-файл бэкапа')
      return
    }
    const ok = window.confirm(
      'Восстановление заменит ВСЕ работы, фото, услуги, калькулятор, контакты и CRM-заказы текущими данными из ZIP.\n\nПродолжить?',
    )
    if (!ok) return

    setError('')
    setMessage('')
    setRestoring(true)
    try {
      const res = await restoreBackup(picked)
      setPicked(null)
      const c = res.counts || {}
      setMessage(
        `Восстановлено: работ ${c.works ?? '—'}, фото ${c.uploads ?? '—'}, заказов ${c.orders ?? '—'}. Обновите страницы сайта при необходимости.`,
      )
      await reload?.()
      await loadInfo()
    } catch (e) {
      setError(e.message || 'Ошибка восстановления')
    } finally {
      setRestoring(false)
    }
  }

  const counts = info?.counts

  return (
    <div>
      <PageHeader
        title="Резервная копия"
        description="Скачайте полный архив сайта и CRM — или восстановите его на этом или новом сервере."
        actions={
          <Button variant="ghost" onClick={loadInfo} disabled={downloading || restoring}>
            <RefreshCw className="h-4 w-4" />
            Обновить
          </Button>
        }
      />

      {infoError ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {infoError}
        </p>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Работы', value: counts?.works },
          { label: 'Фото', value: counts?.uploads },
          { label: 'Заказы', value: counts?.orders },
          { label: 'Устройства', value: counts?.devices },
        ].map((item) => (
          <Card key={item.label} className="p-3 sm:p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
            <p className="mt-1 font-display text-[18px] font-bold text-slate-900">
              {item.value ?? '—'}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-500/15 text-lime-700">
              <HardDriveDownload className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[16px] font-bold text-slate-900">Скачать ZIP</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                В архиве: работы и фото, услуги, калькулятор, контакты и CRM (заказы, клиенты). Пароль
                админа в файл не входит.
              </p>
              <Button className="mt-4" onClick={onDownload} disabled={downloading || restoring}>
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {downloading ? 'Готовим архив…' : 'Скачать резервную копию'}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
              <Upload className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[16px] font-bold text-slate-900">Восстановить из ZIP</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                Полностью заменит текущие данные сайта и CRM. Перед заменой на сервере сохранится
                страховочный снимок.
              </p>

              <div className="relative mt-4">
                <div
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-bold text-slate-800 ${
                    restoring ? 'opacity-50' : ''
                  }`}
                  aria-hidden
                >
                  <Upload className="h-4 w-4" />
                  {picked ? picked.name : 'Выбрать ZIP-файл'}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".zip,application/zip"
                  disabled={restoring || downloading}
                  onChange={onPick}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:pointer-events-none"
                  aria-label="Выбрать ZIP-файл бэкапа"
                />
              </div>

              {picked ? (
                <p className="mt-2 text-[12px] text-slate-500">
                  {picked.name} · {formatBytes(picked.size)}
                </p>
              ) : null}

              <Button
                className="mt-3"
                variant="danger"
                onClick={onRestore}
                disabled={!picked || restoring || downloading}
              >
                {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                {restoring ? 'Восстановление…' : 'Восстановить'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {message ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-lime-200 bg-lime-50 px-3 py-2.5 text-[13px] text-lime-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
          {error}
        </p>
      ) : null}

      <Card className="mt-4 p-4 sm:p-5">
        <h2 className="font-display text-[15px] font-bold text-slate-900">Перенос на другой сервер</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-slate-600">
          <li>Скачайте ZIP здесь и сохраните на ПК / в облако (без него на новом сервере будет пустой сайт).</li>
          <li>
            В <code className="rounded bg-slate-100 px-1 py-0.5 text-[12px]">deploy.secrets</code> укажите IP
            нового VPS, root-пароль, домен и <code className="rounded bg-slate-100 px-1 py-0.5 text-[12px]">ADMIN_PASSWORD</code>.
            Переключите DNS A-запись на новый IP.
          </li>
          <li>
            С ПК в папке проекта:{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[12px]">
              npm run new-server -- --backup путь/к/proshivka-backup.zip
            </code>
            . Скрипт зальёт код и сам восстановит ZIP.
          </li>
          <li>Проверьте главную, работы и CRM — затем скачайте свежий ZIP на всякий случай.</li>
        </ol>
      </Card>
    </div>
  )
}
