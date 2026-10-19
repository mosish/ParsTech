import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentAdminSessionFromCookies } from '../../server/auth';
import {
  getPublicCatalogProducts,
  getRecentAuditLogs,
  importCatalogIdempotent,
} from '../../server/catalog';
import { AdminView } from '../../components/AdminView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'پنل مدیریت موجودی و قیمت | Admin Console',
  description: 'کنسول مدیریت امن موجودی و قیمت تنوع محصولات پارس‌تک.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminPage() {
  const auth = await getCurrentAdminSessionFromCookies();
  if (!auth) {
    redirect('/admin/login');
  }

  let products = await getPublicCatalogProducts();
  if (products.length === 0 && process.env.APP_ENV !== 'production') {
    await importCatalogIdempotent();
    products = await getPublicCatalogProducts();
  }

  const auditLogs = await getRecentAuditLogs(40);
  const serializedLogs = auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    ipAddress: log.ipAddress,
    actorEmail: log.actor?.email ?? null,
    actorRole: log.actor?.role ?? null,
    createdAt: log.createdAt.toISOString(),
    metadata: (log.metadata as Record<string, unknown> | null) ?? null,
  }));

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
            <Link
              href="/admin"
              className="text-[#1D1D1F] font-semibold underline underline-offset-8"
            >
              مدیریت (Admin)
            </Link>
            <Link href="/blueprint" className="hover:text-[#1D1D1F] transition-colors">
              مستندات (Blueprint)
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <AdminView
          currentUser={{
            id: auth.user.id,
            email: auth.user.email,
            fullName: auth.user.fullName,
            role: auth.user.role,
          }}
          csrfToken={auth.session.csrfToken}
          initialProducts={products}
          initialAuditLogs={serializedLogs}
        />
      </main>
    </div>
  );
}
