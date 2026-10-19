import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'صفحه مورد نظر یافت نشد (۴۰۴) | Page Not Found',
  description: 'آدرس واردشده در سامانه پارس‌تک وجود ندارد.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBFBFD] text-[#1D1D1F] px-6 py-16">
      <div className="max-w-lg w-full bg-[#F5F5F7] rounded-3xl p-8 sm:p-10 border border-black/[0.06] text-center space-y-5">
        <span className="inline-block px-3 py-1 rounded-full bg-[#1D1D1F] text-white text-xs font-mono font-semibold">
          HTTP 404
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F]">
          صفحه مورد نظر یافت نشد | Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
          مسیر درخواستی شما در کاتالوگ پارس‌تک وجود ندارد یا جابه‌جا شده است. از طریق لینک‌های زیر می‌توانید به بخش‌های اصلی دسترسی داشته باشید.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold transition-colors"
          >
            بازگشت به فروشگاه (Storefront)
          </Link>
          <Link
            href="/blueprint"
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#E8E8ED] text-[#1D1D1F] border border-black/10 text-xs font-semibold transition-colors"
          >
            مستندات معماری (Blueprint)
          </Link>
        </div>
      </div>
    </div>
  );
}
