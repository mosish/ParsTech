'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Package,
  LogOut,
  KeyRound,
  Save,
  Check,
  AlertCircle,
  FileText,
  Lock,
} from 'lucide-react';
import {
  formatToman,
  formatNumber,
  tomanToRial,
  type Language,
} from '../utils/commerce';
import type { SerializedCatalogProduct } from '../server/serialization';

export interface AdminUserInfo {
  id: string;
  email: string;
  fullName: string;
  role: 'OWNER' | 'STAFF';
}

export interface SerializedAuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

interface AdminViewProps {
  lang?: Language;
  currentUser: AdminUserInfo;
  csrfToken: string;
  initialProducts: SerializedCatalogProduct[];
  initialAuditLogs: SerializedAuditLogEntry[];
}

export const AdminView: React.FC<AdminViewProps> = ({
  lang: initialLang = 'fa',
  currentUser,
  csrfToken,
  initialProducts,
  initialAuditLogs,
}) => {
  const router = useRouter();
  const [lang, setLang] = useState<Language>(initialLang);
  const isFa = lang === 'fa';
  const isOwner = currentUser.role === 'OWNER';

  const [activeTab, setActiveTab] = useState<'inventory' | 'audit' | 'security'>('inventory');
  const [products, setProducts] = useState<SerializedCatalogProduct[]>(initialProducts);
  const [auditLogs, setAuditLogs] = useState<SerializedAuditLogEntry[]>(initialAuditLogs);
  const [searchQuery, setSearchQuery] = useState('');

  // Track edited variant fields by variant ID
  const [edits, setEdits] = useState<
    Record<string, { priceToman: string; stockCount: string }>
  >({});
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null);
  const [savedVariantId, setSavedVariantId] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.nameFa.toLowerCase().includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
    );
  });

  const getVariantEdit = (
    variantId: string,
    defaultPrice: number,
    defaultStock: number
  ) => {
    return (
      edits[variantId] ?? {
        priceToman: String(defaultPrice),
        stockCount: String(defaultStock),
      }
    );
  };

  const handleEditChange = (
    variantId: string,
    defaultPrice: number,
    defaultStock: number,
    field: 'priceToman' | 'stockCount',
    value: string
  ) => {
    const existing = getVariantEdit(variantId, defaultPrice, defaultStock);
    setEdits((prev) => ({
      ...prev,
      [variantId]: {
        ...existing,
        [field]: value,
      },
    }));
  };

  const handleSaveVariant = async (
    variantId: string,
    defaultPrice: number,
    defaultStock: number
  ) => {
    setErrorBanner(null);
    const currentEdit = getVariantEdit(variantId, defaultPrice, defaultStock);
    const parsedPrice = Number(currentEdit.priceToman);
    const parsedStock = Number(currentEdit.stockCount);

    if (!Number.isInteger(parsedPrice) || parsedPrice < 0) {
      setErrorBanner(
        isFa
          ? 'قیمت باید یک عدد صحیح نامنفی (به تومان) باشد.'
          : 'Price must be a nonnegative integer in Tomans.'
      );
      return;
    }

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setErrorBanner(
        isFa
          ? 'موجودی انبار باید یک عدد صحیح نامنفی باشد.'
          : 'Stock count must be a nonnegative integer.'
      );
      return;
    }

    setSavingVariantId(variantId);
    try {
      const payload: {
        variantId: string;
        stockCount: number;
        priceToman?: number;
      } = {
        variantId,
        stockCount: parsedStock,
      };

      // Only OWNER is permitted to send price changes; if STAFF tries or if OWNER changes price:
      if (isOwner || parsedPrice !== defaultPrice) {
        payload.priceToman = parsedPrice;
      }

      const res = await fetch('/api/admin/variants', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorBanner(
          data.error ||
            (isFa ? 'خطا در بروزرسانی تنوع محصول' : 'Failed to update product variant.')
        );
        return;
      }

      if (data.products) {
        setProducts(data.products);
      }
      if (data.auditLogs) {
        setAuditLogs(data.auditLogs);
      }

      setSavedVariantId(variantId);
      setTimeout(() => setSavedVariantId(null), 2000);
    } catch {
      setErrorBanner(
        isFa ? 'خطای ارتباط با سرور هنگام ذخیره تغییرات.' : 'Network error while saving changes.'
      );
    } finally {
      setSavingVariantId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      });
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    setChangingPassword(true);
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordStatus({
          type: 'error',
          message:
            data.error ||
            (isFa ? 'خطا در تغییر رمز عبور.' : 'Failed to update password.'),
        });
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setPasswordStatus({
        type: 'success',
        message: isFa
          ? 'رمز عبور با موفقیت تغییر یافت و تمامی نشست‌های قبلی باطل شدند. در حال انتقال به صفحه ورود...'
          : 'Password updated and all active sessions revoked. Redirecting to login...',
      });
      setTimeout(() => {
        router.push('/admin/login');
        router.refresh();
      }, 1200);
    } catch {
      setPasswordStatus({
        type: 'error',
        message: isFa ? 'خطا در برقراری ارتباط با سرور.' : 'Server communication error.',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-8">
      {/* Authenticated Server Session Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.08] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#0066CC] font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isFa
                ? 'پنل مدیریت امن (نشست سرور PostgreSQL)'
                : 'Authenticated Admin Console (Server Session)'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">
            {isFa ? 'مدیریت موجودی و قیمت تنوع محصولات' : 'Variant Inventory & Pricing Administration'}
          </h1>
          <p className="text-xs text-[#6E6E73]">
            {isFa
              ? `کاربر متصل: ${currentUser.fullName} (${currentUser.email}) — نقش سرور: ${
                  isOwner ? 'مالک (OWNER - دسترسی کامل قیمت و موجودی)' : 'کارشناس انبار (STAFF - فقط ویرایش موجودی)'
                }`
              : `Signed in as ${currentUser.fullName} (${currentUser.email}) — Server Role: ${currentUser.role}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span
            data-testid="admin-server-role-badge"
            className="px-3 py-1.5 rounded-xl bg-[#F5F5F7] border border-black/10 text-xs font-semibold text-[#1D1D1F]"
          >
            {isFa ? `نقش: ${currentUser.role}` : `Role: ${currentUser.role}`}
          </span>
          <button
            type="button"
            onClick={() => setLang(isFa ? 'en' : 'fa')}
            className="px-3 py-1.5 rounded-xl border border-black/10 text-xs font-semibold text-[#1D1D1F] hover:bg-[#F5F5F7]"
          >
            {isFa ? 'EN' : 'فارسی'}
          </button>
          <button
            type="button"
            data-testid="admin-logout-btn"
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-[#1D1D1F] hover:bg-black/80 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isFa ? 'خروج امن و ابطال نشست' : 'Sign Out'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.08] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'inventory'
              ? 'bg-[#1D1D1F] text-white'
              : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>
            {isFa ? 'تنوع‌ها، موجودی و قیمت (PostgreSQL)' : 'Variants, Stock & Pricing (PostgreSQL)'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'audit'
              ? 'bg-[#1D1D1F] text-white'
              : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isFa ? 'گزارش ممیزی امنیتی (AuditLog)' : 'Security & Audit Logs'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'security'
              ? 'bg-[#1D1D1F] text-white'
              : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>{isFa ? 'تغییر رمز عبور (Argon2id)' : 'Change Password'}</span>
        </button>
      </div>

      {errorBanner && (
        <div
          role="alert"
          data-testid="admin-error-banner"
          className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* TAB 1: PostgreSQL Variant Inventory & Pricing */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F5F5F7] p-4 rounded-2xl border border-black/[0.05]">
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-[#1D1D1F]">
                {isFa
                  ? 'واحد پولی پایگاه داده: مبالغ به صورت عدد صحیح ۶۴ بیتی (BigInt) بر حسب تومان ایران ذخیره می‌شوند (۱ تومان = ۱۰ ریال).'
                  : 'Monetary Unit Convention: Stored as 64-bit integer (BigInt) in whole Iranian Tomans (1 Toman = 10 IRR).'}
              </p>
              <p className="text-[#6E6E73]">
                {isOwner
                  ? isFa
                    ? 'شما با نقش OWNER وارد شده‌اید و مجاز به ویرایش قیمت (تومان) و تعداد موجودی هر رنگ/حافظه هستید.'
                    : 'Signed in as OWNER: authorized to update both variant prices (Toman) and stock counts.'
                  : isFa
                    ? 'شما با نقش STAFF وارد شده‌اید: فقط مجاز به بروزرسانی موجودی انبار هستید (تغییر قیمت در سرور مسدود است).'
                    : 'Signed in as STAFF: authorized to update variant stock counts only (price updates are restricted on the server).'}
              </p>
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isFa ? 'جستجوی نام مدل یا کد SKU...' : 'Filter by product name or SKU...'}
              className="px-3.5 py-2 rounded-xl bg-white border border-black/15 text-xs text-[#1D1D1F] w-full sm:w-64"
            />
          </div>

          <div className="space-y-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-black/[0.08] overflow-hidden shadow-2xs"
              >
                <div className="bg-[#F5F5F7] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06]">
                  <div>
                    <h2 className="text-sm font-bold text-[#1D1D1F]">
                      {isFa ? product.nameFa : product.nameEn}
                    </h2>
                    <p className="text-[11px] text-[#6E6E73] font-mono">
                      Product ID: {product.id} · Base SKU: {product.sku}
                    </p>
                  </div>
                  <div className="text-xs text-[#515154]">
                    {isFa
                      ? `مجموع موجودی کل رنگ‌ها: ${formatNumber(product.stockCount, 'fa')} عدد`
                      : `Total Stock Across Variants: ${product.stockCount}`}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-black/[0.06] text-[#6E6E73]">
                        <th className="py-3 px-4 font-semibold text-start">
                          {isFa ? 'کد تنوع (SKU)' : 'Variant SKU'}
                        </th>
                        <th className="py-3 px-4 font-semibold text-start">
                          {isFa ? 'رنگ و حافظه' : 'Color / Storage'}
                        </th>
                        <th className="py-3 px-4 font-semibold text-start">
                          {isFa ? 'قیمت نقدی (تومان)' : 'Price (Toman)'}
                        </th>
                        <th className="py-3 px-4 font-semibold text-start">
                          {isFa ? 'معادل ریالی' : 'Rial Equivalent'}
                        </th>
                        <th className="py-3 px-4 font-semibold text-start">
                          {isFa ? 'موجودی انبار' : 'Stock Count'}
                        </th>
                        <th className="py-3 px-4 font-semibold text-end">
                          {isFa ? 'عملیات' : 'Action'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.06]">
                      {product.variants.map((variant) => {
                        const edit = getVariantEdit(
                          variant.id,
                          variant.priceToman,
                          variant.stockCount
                        );
                        const isSaving = savingVariantId === variant.id;
                        const isSaved = savedVariantId === variant.id;

                        return (
                          <tr key={variant.id} data-testid={`variant-row-${variant.sku}`}>
                            <td className="py-3 px-4 font-mono text-[11px] text-[#515154]">
                              {variant.sku}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                                  style={{ backgroundColor: variant.colorHex }}
                                />
                                <span className="font-medium text-[#1D1D1F]">
                                  {isFa ? variant.colorNameFa : variant.colorNameEn}
                                </span>
                                <span className="text-[11px] text-[#6E6E73]">
                                  ({variant.storageLabel})
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  step={1000}
                                  disabled={!isOwner}
                                  data-testid={`price-input-${variant.sku}`}
                                  aria-label={`Price Toman for ${variant.sku}`}
                                  value={edit.priceToman}
                                  onChange={(e) =>
                                    handleEditChange(
                                      variant.id,
                                      variant.priceToman,
                                      variant.stockCount,
                                      'priceToman',
                                      e.target.value
                                    )
                                  }
                                  className="w-36 px-2.5 py-1.5 rounded-lg border border-black/15 text-xs tabular-nums bg-white disabled:bg-[#F5F5F7] disabled:text-[#86868B]"
                                />
                                {!isOwner && (
                                  <Lock
                                    className="w-3.5 h-3.5 text-[#86868B]"
                                    aria-label="Owner only"
                                  />
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[#6E6E73] tabular-nums">
                              {formatNumber(
                                tomanToRial(Number(edit.priceToman) || 0),
                                lang
                              )}{' '}
                              {isFa ? 'ریال' : 'IRR'}
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                min={0}
                                step={1}
                                data-testid={`stock-input-${variant.sku}`}
                                aria-label={`Stock count for ${variant.sku}`}
                                value={edit.stockCount}
                                onChange={(e) =>
                                  handleEditChange(
                                    variant.id,
                                    variant.priceToman,
                                    variant.stockCount,
                                    'stockCount',
                                    e.target.value
                                  )
                                }
                                className="w-24 px-2.5 py-1.5 rounded-lg border border-black/15 text-xs tabular-nums bg-white"
                              />
                            </td>
                            <td className="py-3 px-4 text-end">
                              <button
                                type="button"
                                disabled={isSaving}
                                data-testid={`save-variant-${variant.sku}`}
                                onClick={() =>
                                  handleSaveVariant(
                                    variant.id,
                                    variant.priceToman,
                                    variant.stockCount
                                  )
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                                  isSaved
                                    ? 'bg-[#1D7D3F] text-white'
                                    : 'bg-[#0066CC] hover:bg-[#0055B3] text-white disabled:opacity-50'
                                }`}
                              >
                                {isSaved ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{isFa ? 'ذخیره شد' : 'Saved'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-3.5 h-3.5" />
                                    <span>
                                      {isSaving
                                        ? isFa
                                          ? 'در حال ثبت...'
                                          : 'Saving...'
                                        : isFa
                                          ? 'ثبت در پایگاه داده'
                                          : 'Save'}
                                    </span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Sanitized Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-black/[0.08] overflow-hidden">
          <div className="px-6 py-4 bg-[#F5F5F7] border-b border-black/[0.06]">
            <h2 className="text-sm font-bold text-[#1D1D1F]">
              {isFa
                ? 'گزارش رویدادهای امنیتی و تغییرات مدیریتی (بدون رمز عبور یا توکن نشست)'
                : 'Security Events & Administrative Audit Log (Sanitized)'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="border-b border-black/[0.06] text-[#6E6E73]">
                  <th className="py-3 px-4 font-semibold text-start">{isFa ? 'زمان' : 'Timestamp'}</th>
                  <th className="py-3 px-4 font-semibold text-start">{isFa ? 'عملیات' : 'Action'}</th>
                  <th className="py-3 px-4 font-semibold text-start">{isFa ? 'کاربر' : 'Actor'}</th>
                  <th className="py-3 px-4 font-semibold text-start">{isFa ? 'موجودیت' : 'Entity'}</th>
                  <th className="py-3 px-4 font-semibold text-start">{isFa ? 'آدرس IP' : 'IP'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#6E6E73]">
                      {log.createdAt.slice(0, 19).replace('T', ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#1D1D1F]">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-[#515154]">
                      {log.actorEmail ? `${log.actorEmail} (${log.actorRole})` : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#515154]">
                      {log.entityType} {log.entityId ? `(${log.entityId})` : ''}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#6E6E73]">
                      {log.ipAddress || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Change Password & Revoke Sessions */}
      {activeTab === 'security' && (
        <div className="max-w-lg bg-[#F5F5F7] rounded-3xl p-6 sm:p-8 border border-black/[0.06] space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#1D1D1F]">
              {isFa ? 'تغییر رمز عبور حساب مدیریتی' : 'Change Administrator Password'}
            </h2>
            <p className="text-xs text-[#6E6E73]">
              {isFa
                ? 'رمز عبور با الگوریتم Argon2id هش می‌شود و بلافاصله پس از تغییر، تمامی نشست‌های فعال قبلی در پایگاه داده باطل (Revoke) خواهند شد.'
                : 'Passwords are hashed with Argon2id. Changing your password immediately revokes all active sessions.'}
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#1D1D1F]">
                {isFa ? 'رمز عبور فعلی' : 'Current Password'}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/15 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#1D1D1F]">
                {isFa ? 'رمز عبور جدید (حداقل ۱۲ کاراکتر)' : 'New Password (min 12 characters)'}
              </label>
              <input
                type="password"
                required
                minLength={12}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/15 text-xs"
              />
            </div>

            {passwordStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  passwordStatus.type === 'success'
                    ? 'bg-[#EAFBF0] text-[#1D7D3F]'
                    : 'bg-[#FEF2F2] text-[#991B1B]'
                }`}
              >
                {passwordStatus.message}
              </div>
            )}

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full py-3 px-5 rounded-xl bg-[#1D1D1F] hover:bg-black/80 text-white text-xs font-semibold transition-colors"
            >
              {changingPassword
                ? isFa
                  ? 'در حال بروزرسانی...'
                  : 'Updating...'
                : isFa
                  ? 'بروزرسانی رمز عبور و ابطال نشست‌ها'
                  : 'Update Password & Revoke Sessions'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
