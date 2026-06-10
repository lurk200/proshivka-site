import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Field, Input } from '../components/ui';

export default function LoginPage() {
  const { isAuthenticated, ready, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const from = location.state?.from || '/admin';

  if (ready && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(password)) {
      navigate(from, { replace: true });
      return;
    }
    setError('Неверный пароль');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0b0e] px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#84CC16]/10 border border-[#84CC16]/20 mb-4">
            <Lock className="w-7 h-7 text-[#84CC16]" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Панель администратора</h1>
          <p className="text-[#9ca3af] text-[15px] mt-2">ПРОШИВКА — управление контентом сайта</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#14161a] border border-white/[0.06] rounded-2xl p-8 shadow-2xl"
        >
          <Field label="Пароль">
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Введите пароль"
              autoFocus
            />
          </Field>
          {error ? <p className="text-red-400 text-[13px] mt-3">{error}</p> : null}
          <button
            type="submit"
            className="w-full mt-6 px-5 py-3 rounded-xl bg-[#84CC16] text-[#0c0d10] font-semibold text-[15px] hover:bg-[#9be02a] transition-colors"
          >
            Войти
          </button>
        </form>

        <p className="text-center text-[#6b7280] text-[12px] mt-6">
          Пароль по умолчанию: <code className="text-[#9ca3af]">proshivka</code>
          <br />
          Задайте свой через <code className="text-[#9ca3af]">VITE_ADMIN_PASSWORD</code>
        </p>
      </div>
    </div>
  );
}
