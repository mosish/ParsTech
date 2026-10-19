import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BlueprintSpecView } from '../../components/BlueprintSpecView';
import { BreadcrumbNav } from '../../components/BreadcrumbNav';
import { buildCanonicalUrl } from '../../lib/seo';

export function generateMetadata(): Metadata {
  const canonical = buildCanonicalUrl('/blueprint');
  const title = 'معماری سیستم و مستندات فنی پارس‌تک | System Architecture Blueprint';
  const description =
    'مستندات مهندسی، طرحواره پایگاه داده PostgreSQL، معماری امنیتی و نقشه راه فنی پارس‌تک (Bilingual Engineering & PostgreSQL Architecture Specification).';

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
    },
  };
}

export default function BlueprintPage() {
  const breadcrumbs = [
    { name: 'فروشگاه پارس‌تک (Store)', path: '/' },
    { name: 'مستندات معماری و فنی (Blueprint)', path: '/blueprint' },
  ];

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
            <Link href="/account" className="hover:text-[#1D1D1F] transition-colors">
              سفارش‌ها (Account)
            </Link>
            <Link href="/admin" className="hover:text-[#1D1D1F] transition-colors">
              مدیریت (Admin)
            </Link>
            <Link
              href="/blueprint"
              className="text-[#1D1D1F] font-semibold underline underline-offset-8"
            >
              مستندات (Blueprint)
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto w-full">
        <BreadcrumbNav items={breadcrumbs} />
      </div>

      <main className="flex-1">
        <BlueprintSpecView lang="fa" />
      </main>
    </div>
  );
}
