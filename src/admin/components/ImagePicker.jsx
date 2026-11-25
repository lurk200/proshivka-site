import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { uploadAdminImage } from '../../api/cmsApi.js'
import { fileToCompressedDataUrl } from '../utils/image.js'

/**
 * Удобная загрузка фото: клик / drag-drop / превью.
 * value — URL (/uploads/… или внешний).
 */
export default function ImagePicker({
  value,
  onChange,
  label = 'Фото',
  aspect = 'aspect-[4/5]',
  className = '',
}) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file) {
    if (!file) return
    setError('')
    setBusy(true)
    try {
      const compressed = await fileToCompressedDataUrl(file)
      const uploaded = await uploadAdminImage(compressed)
      onChange(uploaded.url)
    } catch (e) {
      setError(e.message || 'Ошибка загрузки')
    } finally {
      setBusy(false)
    }
  }

  function onInputChange(e) {
    const file = e.target.files?.[0] || null
    e.target.value = ''
    if (!file) return
    window.setTimeout(() => {
      void handleFile(file)
    }, 50)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label ? <p className="text-[12px] font-semibold text-slate-600">{label}</p> : null}

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition ${
          dragOver
            ? 'border-lime-500 bg-lime-50'
            : value
              ? 'border-slate-200 bg-slate-100'
              : 'border-slate-300 bg-slate-50'
        } ${aspect}`}
      >
        {value ? (
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <ImagePlus className="h-8 w-8 text-slate-400" />
            <p className="text-[13px] font-semibold text-slate-600">Нажмите «Выбрать» или перетащите</p>
            <p className="text-[12px] text-slate-400">с телефона — из галереи</p>
          </div>
        )}

        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <Loader2 className="h-7 w-7 animate-spin text-lime-600" />
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/55 to-transparent p-3 pt-8">
          <div className="relative flex-1">
            <div
              className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[12px] font-bold text-slate-900 shadow-sm ${
                busy ? 'opacity-50' : ''
              }`}
              aria-hidden
            >
              <Upload className="h-3.5 w-3.5" />
              {value ? 'Заменить' : 'Выбрать файл'}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              disabled={busy}
              onClick={(e) => e.stopPropagation()}
              onChange={onInputChange}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:pointer-events-none"
              aria-label={value ? 'Заменить фото' : 'Выбрать файл'}
            />
          </div>
          {value ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onChange('')}
              className="inline-flex items-center justify-center rounded-xl bg-white/90 px-3 py-2 text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-50"
              aria-label="Удалить фото"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}
