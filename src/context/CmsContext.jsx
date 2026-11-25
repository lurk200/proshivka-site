import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchSiteCms, saveSiteCms } from '../api/cmsApi.js'
import { normalizeCalculator } from '../calculator/defaults.js'
import { DEFAULT_SITE, getServiceById, normalizeCompany, normalizeWorks } from '../data/defaults.js'

const CmsContext = createContext(null)

function mergeContent(raw) {
  const base = structuredClone(DEFAULT_SITE)
  if (!raw) return base
  return {
    ...base,
    ...raw,
    company: normalizeCompany({ ...base.company, ...raw.company }),
    hero: { ...base.hero, ...raw.hero },
    calculator: normalizeCalculator(raw.calculator || base.calculator),
    services: Array.isArray(raw.services) && raw.services.length ? raw.services : base.services,
    works: normalizeWorks(raw.works),
    trust: Array.isArray(raw.trust) && raw.trust.length ? raw.trust : base.trust,
  }
}

export function CmsProvider({ children }) {
  const [content, setContent] = useState(() => mergeContent(null))
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      try {
        const data = await fetchSiteCms(controller.signal)
        if (data?.content) setContent(mergeContent(data.content))
      } catch {
        setContent(mergeContent(null))
      } finally {
        if (!controller.signal.aborted) setReady(true)
      }
    })()
    return () => controller.abort()
  }, [])

  const save = useCallback(async (next) => {
    const payload = typeof next === 'function' ? next(content) : next
    const normalized = mergeContent(payload)
    setSaving(true)
    try {
      const data = await saveSiteCms(normalized)
      setContent(mergeContent(data.content))
      return { ok: true }
    } finally {
      setSaving(false)
    }
  }, [content])

  const value = useMemo(
    () => ({
      ready,
      saving,
      content,
      company: content.company,
      hero: content.hero,
      services: content.services.filter((s) => s.published !== false),
      allServices: content.services,
      works: content.works.filter((w) => w.published !== false),
      allWorks: content.works,
      trust: content.trust,
      getService: (id) =>
        getServiceById(
          content.services.filter((s) => s.published !== false),
          id,
        ),
      setContent,
      save,
      reload: async () => {
        const data = await fetchSiteCms()
        setContent(mergeContent(data.content))
      },
    }),
    [ready, saving, content, save],
  )

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>
}

export function useCms() {
  const ctx = useContext(CmsContext)
  if (!ctx) throw new Error('useCms must be used within CmsProvider')
  return ctx
}
