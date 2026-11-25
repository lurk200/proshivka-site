import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Star, Trash2, Upload } from 'lucide-react'
import { uploadAdminImage } from '../../api/cmsApi.js'
import { fileToCompressedDataUrl } from '../utils/image.js'

function isImageFile(file) {
  if (!file) return false
  if (file.type?.startsWith('image/')) return true
  // Android/iOS часто без MIME или application/octet-stream — имя/выбор из image/*
  if (!file.type || file.type === 'application/octet-stream') {
    if (!file.name || !file.name.includes('.')) return true
    return /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(file.name)
  }
  return false
}

/**
 * Фотоотчёт: несколько фото, первое — обложка карточки.
 * @param {{ value: string[], onChange: (urls: string[]) => void, label?: string, onFileDialogClose?: () => void }} props
 */
export default function GalleryPicker({ value = [], onChange, label = 'Фотоотчёт', onFileDialogClose }) {
  const inputRef = useRef(null)
  const listRef = useRef([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const list = Array.isArray(value) ? value.filter(Boolean) : []

  useEffect(() => {
    // Во время загрузки listRef ведёт цикл uploadFiles — не перезаписывать из props
    if (!busy) listRef.current = list
  }, [list, busy])

  async function uploadFiles(fileList) {
    const raw = Array.isArray(fileList) ? fileList : [...(fileList || [])]
    const files = raw.filter(isImageFile)
    if (!files.length) {
      setError('Выберите изображения (JPG, PNG, WebP…)')
      return
    }
    setError('')
    setBusy(true)
    // База на момент старта — не дублируем при пакетной загрузке
    const base = [...(listRef.current.length ? listRef.current : list)]
    listRef.current = base
    const added = []
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setProgress(`${i + 1} / ${files.length}`)
        const compressed = await fileToCompressedDataUrl(file)
        const res = await uploadAdminImage(compressed)
        if (res?.url) {
          added.push(res.url)
          const next = [...base, ...added]
          listRef.current = next
          // Сразу в стейт — не теряем уже загруженные, если следующее упадёт
          onChange(next)
        }
      }
      if (!added.length) setError('Не удалось загрузить фото')
    } catch (e) {
      setError(e.message || 'Ошибка загрузки')
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  function removeAt(idx) {
    onChange(list.filter((_, i) => i !== idx))
  }

  function move(idx, dir) {
    const next = [...list]
    const j = idx + dir
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j], next[idx]]
    onChange(next)
  }

  function makeCover(idx) {
    if (idx <= 0) return
    const next = [...list]
    const [item] = next.splice(idx, 1)
    next.unshift(item)
    onChange(next)
  }

  function onPickChange(e) {
    // ВАЖНО: FileList живёт на input — после value='' он пустеет.
    // Копируем File[] сразу, иначе кнопка «Выбрать» молча ничего не грузит
    // (а drag-and-drop работает — оттуда FileList не чистится).
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    onFileDialogClose?.()
    if (!files.length) return
    // Небольшой delay: на мобиле после закрытия галереи «призрачный» tap
    // может закрыть модалку — родитель блокирует закрытие на ~800мс.
    window.setTimeout(() => {
      void uploadFiles(files)
    }, 50)
  }

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-end justify-between gap-2">
          <p className="text-[12px] font-semibold text-slate-600">{label}</p>
          <p className="text-[11px] text-slate-400">{list.length ? `${list.length} фото` : 'Пока пусто'}</p>
        </div>
      ) : null}

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          uploadFiles(Array.from(e.dataTransfer.files || []))
        }}
        className={`rounded-2xl border-2 border-dashed p-3 transition ${
          dragOver ? 'border-lime-500 bg-lime-50' : 'border-slate-200 bg-slate-50'
        }`}
      >
        {list.length ? (
          <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {list.map((url, idx) => (
              <li key={`${url}-${idx}`} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-200">
                <img src={url} alt="" className="h-full w-full object-cover" />
                {idx === 0 ? (
                  <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-md bg-lime-500 px-1.5 py-0.5 text-[9px] font-bold text-slate-950">
                    <Star className="h-2.5 w-2.5" />
                    обложка
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 pt-6">
                  <button
                    type="button"
                    title="Влево"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0 || busy}
                    className="rounded-lg bg-white/95 p-2 text-slate-700 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {idx > 0 ? (
                    <button
                      type="button"
                      title="Сделать обложкой"
                      onClick={() => makeCover(idx)}
                      disabled={busy}
                      className="rounded-lg bg-white/95 p-2 text-slate-700"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    title="Вправо"
                    onClick={() => move(idx, 1)}
                    disabled={idx === list.length - 1 || busy}
                    className="rounded-lg bg-white/95 p-2 text-slate-700 disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Удалить"
                    onClick={() => removeAt(idx)}
                    disabled={busy}
                    className="rounded-lg bg-white/95 p-2 text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mb-3 flex flex-col items-center justify-center gap-1 py-6 text-center">
            <ImagePlus className="h-8 w-8 text-slate-400" />
            <p className="text-[13px] font-semibold text-slate-600">Нажмите «Выбрать» или перетащите</p>
            <p className="text-[12px] text-slate-400">с телефона — из галереи, можно сразу несколько</p>
          </div>
        )}

        {/* opacity-0 overlay над кнопкой — надёжнее sr-only на iOS/Android */}
        <div className="relative">
          <div
            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-[12px] font-bold text-slate-900 shadow-sm ring-1 ring-slate-200 ${
              busy ? 'opacity-50' : ''
            }`}
            aria-hidden
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {busy ? `Загрузка ${progress}…` : list.length ? 'Добавить ещё фото' : 'Выбрать файлы'}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            onClick={(e) => e.stopPropagation()}
            onChange={onPickChange}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:pointer-events-none"
            aria-label={list.length ? 'Добавить ещё фото' : 'Выбрать файлы'}
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
          {error}
        </p>
      ) : null}
      <p className="text-[11px] leading-snug text-slate-400">
        Первое фото — обложка в списке. Остальные — фотоотчёт на странице работы.
      </p>
    </div>
  )
}
