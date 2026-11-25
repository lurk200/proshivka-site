import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createCrmOrder, fetchCrm, patchCrmOrder } from '../api/crmApi.js'
import { emptyCrmData } from '../crm/defaults.js'

const CrmContext = createContext(null)

export function CrmProvider({ children }) {
  const [data, setData] = useState(() => emptyCrmData())
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    const res = await fetchCrm()
    setData(res.data)
    return res.data
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetchCrm()
        if (!cancelled) setData(res.data)
      } catch {
        if (!cancelled) setData(emptyCrmData())
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const createOrder = useCallback(async (payload) => {
    setBusy(true)
    try {
      const res = await createCrmOrder(payload)
      setData(res.data)
      return res
    } finally {
      setBusy(false)
    }
  }, [])

  const updateOrder = useCallback(async (id, payload) => {
    setBusy(true)
    try {
      const res = await patchCrmOrder(id, payload)
      setData(res.data)
      return res
    } finally {
      setBusy(false)
    }
  }, [])

  const getDevice = useCallback(
    (id) => data.devices.find((d) => d.id === id) || null,
    [data.devices],
  )

  const getOrder = useCallback(
    (id) => data.orders.find((o) => o.id === id) || null,
    [data.orders],
  )

  const ordersForDevice = useCallback(
    (deviceId) => data.orders.filter((o) => o.deviceId === deviceId),
    [data.orders],
  )

  const value = useMemo(
    () => ({
      ready,
      busy,
      data,
      devices: data.devices,
      orders: data.orders,
      pipelines: data.pipelines,
      reload,
      createOrder,
      updateOrder,
      getDevice,
      getOrder,
      ordersForDevice,
    }),
    [
      ready,
      busy,
      data,
      reload,
      createOrder,
      updateOrder,
      getDevice,
      getOrder,
      ordersForDevice,
    ],
  )

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}

export function useCrm() {
  const ctx = useContext(CrmContext)
  if (!ctx) throw new Error('useCrm must be used within CrmProvider')
  return ctx
}
