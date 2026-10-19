'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, ShieldCheck } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'ورود ناموفق بود. لطفاً اطلاعات را بررسی کنید.');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('خطا در برقراری ارتباط با سرور احراز هویت.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="admin-email"
          className="block text-xs font-semibold text-[#1D1D1F]"
        >
          پست الکترونیک مدیر (Admin Email)
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="owner@parstech.example"
          className="w-full px-4 py-3 rounded-xl bg-white border border-black/15 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC]"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="admin-password"
          className="block text-xs font-semibold text-[#1D1D1F]"
        >
          رمز عبور (Password)
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          className="w-full px-4 py-3 rounded-xl bg-white border border-black/15 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC]"
        />
      </div>

      {error && (
        <div
          role="alert"
          data-testid="login-error-alert"
          className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        data-testid="admin-login-submit"
        className="w-full py-3.5 px-6 rounded-xl bg-[#1D1D1F] hover:bg-black/85 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        <Lock className="w-3.5 h-3.5" />
        <span>
          {loading ? 'در حال بررسی اعتبار نشست...' : 'ورود امن به پنل مدیریت (Sign In)'}
        </span>
      </button>

      <div className="pt-3 border-t border-black/[0.06] flex items-start gap-2 text-[11px] text-[#6E6E73]">
        <ShieldCheck className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
        <span>
          نشست‌های مدیریتی با کوکی HttpOnly در پایگاه داده PostgreSQL نگهداری می‌شوند و هیچ توکنی در localStorage ذخیره نمی‌گردد. ایجاد مالک اولیه فقط از طریق دستور CLI سرور (`npm run admin:create-owner`) امکان‌پذیر است.
        </span>
      </div>
    </form>
  );
};
