'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, AlertCircle, ShieldCheck } from 'lucide-react';

export const LoginFormClient: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(
          data.error || 'ایمیل یا رمز عبور نادرست است. / Invalid email or password.'
        );
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setErrorMessage('خطای ارتباط با سرور / Network error during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FBFBFD] text-[#1D1D1F]">
      <header className="border-b border-black/[0.07] px-6 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-[#1D1D1F]">
            پارس‌تک (ParsTech)
          </Link>
          <Link href="/" className="text-xs font-semibold text-[#0066CC] hover:underline">
            بازگشت به فروشگاه / Storefront
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-black/[0.08] shadow-xs space-y-6">
          <div className="space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-[#1D1D1F] pt-2">
              ورود به پنل مدیریت پارس‌تک
            </h1>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              احراز هویت امن سرور با هش Argon2id، نشست HttpOnly و محافظت در برابر حملات Brute-Force.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-[#B91C1C]/10 border border-[#B91C1C]/30 text-xs text-[#B91C1C] flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label htmlFor="admin-login-email" className="block font-medium text-[#1D1D1F] mb-1">
                ایمیل مدیر (Admin Email)
              </label>
              <input
                id="admin-login-email"
                type="email"
                dir="ltr"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@parstech.example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/10 font-mono text-xs focus:outline-none focus:border-[#0066CC]"
              />
            </div>

            <div>
              <label htmlFor="admin-login-password" className="block font-medium text-[#1D1D1F] mb-1">
                رمز عبور (Password)
              </label>
              <input
                id="admin-login-password"
                type="password"
                dir="ltr"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/10 text-xs focus:outline-none focus:border-[#0066CC]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-5 rounded-xl bg-[#1D1D1F] hover:bg-black/80 disabled:bg-black/30 text-white text-xs font-semibold transition-colors"
            >
              {loading ? 'در حال بررسی اعتبار...' : 'ورود امن به پنل مدیریت / Sign In'}
            </button>
          </form>

          <div className="pt-4 border-t border-black/[0.06] flex items-start gap-2 text-[11px] text-[#6E6E73]">
            <ShieldCheck className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
            <span>
              ایجاد مدیر ارشد اولیه (OWNER) صرفاً از طریق دستور خط فرمان سرور (<code>npm run admin:create-owner</code>) امکان‌پذیر است و هیچ حساب پیش‌فرضی وجود ندارد.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};
