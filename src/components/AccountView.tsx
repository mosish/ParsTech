'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import type { Language } from '../utils/commerce';

interface AccountViewProps {
  lang: Language;
}

/**
 * Customer Account & Order Lookup View (Phase 1)
 * Per Phase 1 security & truthfulness requirements:
 * - Never exposes sample customer profiles or sample order histories publicly.
 * - Clearly informs users that customer OTP authentication and live order tracking
 *   are scheduled for a future phase and are currently disabled.
 */
export const AccountView: React.FC<AccountViewProps> = ({ lang }) => {
  const isFa = lang === 'fa';

  return (
    <div className="max-w-[960px] mx-auto px-6 py-12 space-y-8">
      <div className="border-b border-black/[0.08] pb-6 space-y-2">
        <p className="text-xs text-[#6E6E73]">
          {isFa ? 'حساب کاربری مشتریان و پیگیری سفارش' : 'Customer Account & Order Tracking'}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F]">
          {isFa ? 'ورود مشتریان و پیگیری سفارش‌ها' : 'Customer Sign-In & Order History'}
        </h1>
      </div>

      <div className="bg-[#F5F5F7] rounded-3xl p-8 border border-black/[0.06] space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-[#1D1D1F]">
              {isFa
                ? 'احراز هویت مشتریان (OTP) و ثبت سفارش آنلاین در حال حاضر غیرفعال است'
                : 'Customer OTP Sign-In & Online Order Lookup Are Currently Disabled'}
            </h2>
            <p className="text-xs sm:text-sm text-[#515154] leading-relaxed">
              {isFa
                ? 'در فاز اول سامانه پارس‌تک، ورود پیامکی مشتریان (OTP)، پروفایل کاربری و درگاه پرداخت آنلاین هنوز راه‌اندازی نشده‌اند. به منظور حفظ امنیت و حریم خصوصی، هیچ پروفایل نمونه یا سابقه سفارش آزمایشی به صورت عمومی نمایش داده نمی‌شود.'
                : 'Customer OTP authentication, customer profiles, and online checkout are not enabled in Phase 1. No sample customer profiles or order histories are exposed publicly.'}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.06] flex items-center gap-3 text-xs text-[#515154]">
          <AlertCircle className="w-4 h-4 text-[#0066CC] shrink-0" />
          <span>
            {isFa
              ? 'مشاهده کاتالوگ محصولات، بررسی مشخصات فنی و ابزار مقایسه هم‌اکنون در فروشگاه در دسترس هستند.'
              : 'You can browse the full hardware catalog, inspect specifications, and compare models side-by-side.'}
          </span>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold transition-colors"
          >
            <span>{isFa ? 'بازگشت به کاتالوگ محصولات' : 'Return to Hardware Catalog'}</span>
            {isFa ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Link>
        </div>
      </div>
    </div>
  );
};
