import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AccountView } from '../../components/AccountView';
import { buildCanonicalUrl } from '../../lib/seo';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return {
    title: 'حساب کاربری و پیگیری سفارش | Customer Account',
    description: 'وضعیت حساب کاربری مشتریان و پیگیری سفارش در سامانه پارس‌تک.',
    alternates: {
      canonical: buildCanonicalUrl('/account'),
    },
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export default function AccountPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFD] text-[#1D1D1F]">
      <header className="sticky top-0 z-30 bg-[#FBFBFD]/90 backdrop-blur-md border-b border-black/[0.07]">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight text-[#1D1D1F]">
            پارس‌تک | ParsTech
          </Link>
          <nav aria-label="Primary Navigation" className="flex items-center gap-6 text-xs sm:text-sm font-medium text-[#515154]">
            <Link href="/" className="hover:text-[#1D1D1F] transition-colors">
              فروشگاه (Store)
            </Link>
            <Link
              href="/account"
              className="text-[#1D1D1F] font-semibold underline underline-offset-8"
            >
              سفارش‌ها (Account)
            </Link>
            <Link href="/admin" className="hover:text-[#1D1D1F] transition-colors">
              مدیریت (Admin)
            </Link>
            <Link href="/blueprint" className="hover:text-[#1D1D1F] transition-colors">
              مستندات (Blueprint)
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <AccountView lang="fa" />
      </main>
    </div>
  );
}
