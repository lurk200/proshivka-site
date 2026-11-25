import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loginAdmin } from '../api/cmsApi.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginAdmin(password)
      const to = location.state?.from || '/crm'
      navigate(to, { replace: true })
    } catch (err) {
      setError(err.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-start justify-center bg-[#eef2f6] px-4 pt-10 sm:items-center sm:pt-0">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <p className="font-display text-[1.25rem] font-extrabold text-slate-900">
          <span className="text-lime-600">ПРО</span>ШИВКА
        </p>
        <p className="mt-1 text-[13px] text-slate-500">Вход в CRM и редактор сайта</p>

        <label className="mt-6 block space-y-1.5">
          <span className="text-[12px] font-semibold text-slate-600">Пароль</span>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[14px] text-slate-900 outline-none focus:border-lime-500/50 focus:bg-white focus:ring-2 focus:ring-lime-500/15"
            placeholder="Введите пароль"
          />
        </label>

        {error ? <p className="mt-3 text-[13px] text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading || !password}
          className="mt-5 w-full rounded-xl bg-lime-500 py-3 text-[14px] font-bold text-slate-950 hover:brightness-105 disabled:opacity-40"
        >
          {loading ? 'Вход…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
