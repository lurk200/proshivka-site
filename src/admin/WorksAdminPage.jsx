import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Plus, Trash2, X } from 'lucide-react'
import { useCms } from '../context/CmsContext.jsx'
import { normalizeWork } from '../data/defaults.js'
import GalleryPicker from './components/GalleryPicker.jsx'
import { Button, Field, Input, PageHeader, SaveBar, Textarea } from './components/ui.jsx'

function emptyWork() {
  return normalizeWork({
    id: `w-${Date.now()}`,
    title: 'Новая работа',
    model: '',
    category: '',
    status: 'Готово',
    published: true,
    image: '',
    images: [],
    description: '',
    highlights: [],
  })
}

export default function WorksAdminPage() {
  const { content, save, saving } = useCms()
  const [draft, setDraft] = useState(content.works)
  const [editId, setEditId] = useState(null)
  const [message, setMessage] = useState('')
  /** После выбора файла с телефона «призрачный» tap закрывал модалку — блокируем закрытие ~1с. */
  const ignoreBackdropCloseUntil = useRef(0)

  useEffect(() => {
    setDraft(content.works)
  }, [content.works])

  const dirty = JSON.stringify(draft) !== JSON.stringify(content.works)
  const editing = draft.find((w) => w.id === editId) || null
  const editIdx = editing ? draft.findIndex((w) => w.id === editId) : -1

  /** Во время ввода не нормализуем — иначе trim() съедает пробелы. */
  function update(idx, patch) {
    setDraft((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], ...patch }
      return next
    })
  }

  async function onSave() {
    setMessage('')
    try {
      await save({ ...content, works: draft.map((w) => normalizeWork(w)) })
      setMessage('Сохранено')
    } catch (e) {
      setMessage(e.message)
    }
  }

  function addWork() {
    const item = emptyWork()
    setDraft((prev) => [item, ...prev])
    setEditId(item.id)
  }

  return (
    <div>
      <PageHeader
        title="Работы"
        description="Кейсы ремонта с описанием и фотоотчётом. Нажмите карточку — откроется редактор."
        actions={
          <Button onClick={addWork}>
            <Plus className="h-4 w-4" />
            Добавить работу
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {draft.map((work, idx) => {
          const photos = work.images?.length || (work.image ? 1 : 0)
          return (
            <div
              key={work.id}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                editId === work.id ? 'border-lime-500 ring-2 ring-lime-500/20' : 'border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setEditId(work.id)}
                className="block w-full text-left"
              >
                <div className="relative aspect-[4/5] bg-slate-100">
                  {work.image ? (
                    <img src={work.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[12px] font-semibold text-slate-400">
                      Нет фото
                    </div>
                  )}
                  <span
                    className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      work.published !== false
                        ? 'bg-lime-500 text-slate-950'
                        : 'bg-slate-800/80 text-white'
                    }`}
                  >
                    {work.published !== false ? 'На сайте' : 'Скрыто'}
                  </span>
                  {photos > 1 ? (
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                      {photos} фото
                    </span>
                  ) : null}
                </div>
                <div className="p-2.5">
                  <p className="truncate text-[13px] font-bold text-slate-900">{work.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    {[work.category, work.model].filter(Boolean).join(' · ') || 'Без категории'}
                  </p>
                  {work.description ? (
                    <p className="mt-1 hidden line-clamp-2 text-[11px] leading-snug text-slate-400 sm:block">
                      {work.description}
                    </p>
                  ) : null}
                </div>
              </button>
              <div className="border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => update(idx, { published: work.published === false })}
                  className="flex w-full items-center justify-center gap-1 py-2 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                >
                  {work.published !== false ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" /> Скрыть
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" /> Показать
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {editing && editIdx >= 0 ? (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-slate-900/40 p-0 sm:p-4"
          onPointerDown={(e) => {
            // Только затемнение; после галереи телефона «призрачный» tap не закрывает
            if (e.target !== e.currentTarget) return
            if (Date.now() < ignoreBackdropCloseUntil.current) return
            setEditId(null)
          }}
        >
          <div
            className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl sm:rounded-2xl"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="font-display text-[15px] font-bold text-slate-900">Редактирование</p>
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-6">
              <GalleryPicker
                value={editing.images?.length ? editing.images : editing.image ? [editing.image] : []}
                onChange={(images) => {
                  const list = (images || []).filter(Boolean)
                  update(editIdx, { images: list, image: list[0] || '' })
                }}
                onFileDialogClose={() => {
                  ignoreBackdropCloseUntil.current = Date.now() + 1200
                }}
                label="Фотоотчёт"
              />

              <Field label="Название">
                <Input
                  value={editing.title}
                  onChange={(e) => update(editIdx, { title: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Модель">
                  <Input
                    value={editing.model}
                    onChange={(e) => update(editIdx, { model: e.target.value })}
                    placeholder="iPhone 13"
                  />
                </Field>
                <Field label="Категория">
                  <Input
                    value={editing.category}
                    onChange={(e) => update(editIdx, { category: e.target.value })}
                    placeholder="Дисплей"
                  />
                </Field>
              </div>
              <Field label="Статус на карточке">
                <Input
                  value={editing.status}
                  onChange={(e) => update(editIdx, { status: e.target.value })}
                  placeholder="Готово"
                />
              </Field>

              <Field label="Описание" hint="Что было с устройством и что сделали — текст для клиента.">
                <Textarea
                  rows={5}
                  value={editing.description || ''}
                  onChange={(e) => update(editIdx, { description: e.target.value })}
                  placeholder="Телефон не включался после обновления. Восстановили прошивку, проверили сенсор и камеры…"
                />
              </Field>

              <Field
                label="Что сделали"
                hint="По одному пункту на строку — список на странице работы."
              >
                <Textarea
                  rows={4}
                  value={(editing.highlights || []).join('\n')}
                  onChange={(e) =>
                    update(editIdx, {
                      highlights: e.target.value.split('\n'),
                    })
                  }
                  placeholder={'Диагностика\nЗамена дисплея\nПроверка Face ID'}
                />
              </Field>

              <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[13px] font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={editing.published !== false}
                  onChange={(e) => update(editIdx, { published: e.target.checked })}
                  className="accent-lime-600"
                />
                Показывать на сайте
              </label>
            </div>

            <div className="flex gap-2 border-t border-slate-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
              <Button
                variant="danger"
                className="min-h-11 flex-1"
                onClick={() => {
                  if (!confirm('Удалить эту работу?')) return
                  setDraft((prev) => prev.filter((w) => w.id !== editing.id))
                  setEditId(null)
                }}
              >
                <Trash2 className="h-4 w-4" />
                Удалить
              </Button>
              <Button className="min-h-11 flex-1" onClick={() => setEditId(null)}>
                Готово
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <SaveBar
        dirty={dirty}
        saving={saving}
        onSave={onSave}
        onReset={() => {
          setDraft(content.works)
          setEditId(null)
        }}
        message={message}
      />
    </div>
  )
}
