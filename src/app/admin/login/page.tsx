import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentAdminSessionFromCookies } from '../../../server/auth';
import { LoginForm } from '../LoginForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ورود مدیران سیستم | Admin Sign-In',
  description: 'احراز هویت امن مدیران سامانه پارس‌تک.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminLoginPage() {
  const auth = await getCurrentAdminSessionFromCookies();
  if (auth) {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFD] text-[#1D1D1F]">
      <header className="border-b border-black/[0.07] bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-[#1D1D1F]">
            پارس‌تک | ParsTech
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-[#0066CC] hover:underline"
          >
            بازگشت به فروشگاه عمومی (Storefront)
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full bg-[#F5F5F7] rounded-3xl p-8 border border-black/[0.07] space-y-6 shadow-xs">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[#0066CC]">
              احراز هویت سرور (Argon2id + HttpOnly Session)
            </p>
            <h1 className="text-2xl font-bold text-[#1D1D1F]">
              ورود به کنسول مدیریت پارس‌تک
            </h1>
            <p className="text-xs text-[#6E6E73]">
              برای مدیریت موجودی و قیمت تنوع محصولات، با حساب کاربری مدیریتی خود وارد شوید.
            </p>
          </div>

          <LoginForm />
        </div>
      </main>
    </div>
  );
}
