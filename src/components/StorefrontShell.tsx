'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ShoppingBag, X } from 'lucide-react';
import {
  formatNumber,
  toggleCompareProduct,
  toggleReviewApproval,
  type Language,
  type CategoryId,
  type Product,
  type ProductReview,
  type CartItem,
} from '../utils/commerce';
import {
  INITIAL_DELIVERY_SETTINGS,
  INITIAL_CMS_CONFIG,
  INITIAL_REVIEWS,
} from '../data/storeData';
import type { SerializedCatalogProduct } from '../server/serialization';
import { StorefrontView } from './StorefrontView';
import { CartCheckoutModal } from './CartCheckoutModal';

// Lazy-load optional comparison modal so it is not eagerly evaluated
const CompareModal = dynamic(
  () => import('./CompareModal').then((mod) => mod.CompareModal),
  { ssr: false }
);

interface StorefrontShellProps {
  initialProducts: SerializedCatalogProduct[];
  initialLang?: Language;
  verifiedBusiness?: {
    name?: string;
    phone?: string;
    address?: string;
  };
}

export const StorefrontShell: React.FC<StorefrontShellProps> = ({
  initialProducts,
  initialLang = 'fa',
  verifiedBusiness,
}) => {
  const [lang, setLang] = useState<Language>(initialLang);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [products] = useState<SerializedCatalogProduct[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showPromoBar, setShowPromoBar] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareLimitNotice, setCompareLimitNotice] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>(INITIAL_REVIEWS);

  const isFa = lang === 'fa';

  const cms = {
    ...INITIAL_CMS_CONFIG,
    storeAddressFa: verifiedBusiness?.address || '',
    storeAddressEn: verifiedBusiness?.address || '',
    storePhone: verifiedBusiness?.phone || '',
  };

  useEffect(() => {
    document.documentElement.dir = isFa ? 'rtl' : 'ltr';
    document.documentElement.lang = isFa ? 'fa' : 'en';
  }, [isFa]);

  const handleSubmitReview = (
    newReviewInput: Omit<ProductReview, 'id' | 'createdAtIso' | 'approved'>
  ) => {
    const newReview: ProductReview = {
      ...newReviewInput,
      id: `rev-${Date.now()}`,
      createdAtIso: new Date().toISOString().slice(0, 10),
      verifiedBuyer: false,
      approved: false,
    };
    setReviews((prev) => [newReview, ...prev]);
  };

  const handleToggleReviewApproval = (reviewId: string, approved: boolean) => {
    setReviews((prev) => toggleReviewApproval(prev, reviewId, approved));
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  };

  const handleToggleCompare = (productId: string) => {
    const { nextIds, limitReached } = toggleCompareProduct(compareIds, productId, 3);
    setCompareIds(nextIds);
    if (limitReached) {
      setCompareLimitNotice(true);
      setTimeout(() => setCompareLimitNotice(false), 2600);
    } else {
      setCompareLimitNotice(false);
    }
  };

  const totalBagCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleAddToCart = (product: Product, colorHex: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: Math.min(product.stockCount, item.quantity + 1),
                selectedColorHex: colorHex,
              }
            : item
        );
      }
      return [...prev, { productId: product.id, quantity: 1, selectedColorHex: colorHex }];
    });
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const prod = products.find((p) => p.id === productId);
          const maxStock = prod ? prod.stockCount : 10;
          const nextQty = Math.min(maxStock, item.quantity + delta);
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        })
        .filter((x): x is CartItem => x !== null)
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFD] text-[#1D1D1F]">
      {/* Slim Dismissible Top Informational Bar */}
      {showPromoBar && (
        <div className="bg-[#1D1D1F] text-[#F5F5F7] h-9 px-4 flex items-center justify-between text-[11px] no-print">
          <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between gap-4">
            <p className="truncate">{isFa ? cms.promoBannerFa : cms.promoBannerEn}</p>
            <button
              type="button"
              aria-label={isFa ? 'بستن اعلان بالای صفحه' : 'Dismiss banner'}
              onClick={() => setShowPromoBar(false)}
              className="text-[#86868B] hover:text-white shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation Bar with Crawlable Internal Links */}
      <header className="sticky top-0 z-30 bg-[#FBFBFD]/90 backdrop-blur-md border-b border-black/[0.07] no-print">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-2 sm:gap-8 px-3 sm:px-6 py-3">
          <Link
            href="/"
            className="text-base sm:text-lg font-bold tracking-tight text-[#1D1D1F] whitespace-nowrap shrink-0"
          >
            {isFa ? 'پارس‌تک' : 'ParsTech'}
          </Link>

          <nav
            aria-label={isFa ? 'منوی اصلی' : 'Primary Navigation'}
            className="flex items-center gap-2.5 sm:gap-7 text-[11px] sm:text-sm font-medium text-[#515154] overflow-x-auto"
          >
            <Link
              href="/"
              className="text-[#1D1D1F] font-semibold underline underline-offset-8 whitespace-nowrap shrink-0"
            >
              {isFa ? 'فروشگاه' : 'Store'}
            </Link>
            <Link
              href="/account"
              className="hover:text-[#1D1D1F] transition-colors whitespace-nowrap shrink-0"
            >
              {isFa ? 'سفارش‌ها' : 'Account'}
            </Link>
            <Link
              href="/admin"
              className="hover:text-[#1D1D1F] transition-colors whitespace-nowrap shrink-0"
            >
              {isFa ? 'مدیریت' : 'Admin'}
            </Link>
            <Link
              href="/blueprint"
              className="hover:text-[#1D1D1F] transition-colors whitespace-nowrap shrink-0"
            >
              {isFa ? 'مستندات' : 'Blueprint'}
            </Link>
            <button
              type="button"
              aria-label={isFa ? 'تغییر زبان به انگلیسی' : 'Switch language to Persian'}
              onClick={() => setLang(isFa ? 'en' : 'fa')}
              className="hover:text-[#0066CC] transition-colors whitespace-nowrap shrink-0 font-semibold"
            >
              {isFa ? 'EN' : 'فارسی'}
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-[#1D1D1F] rounded-xl hover:bg-black/80 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>
                {isFa
                  ? `سبد (${formatNumber(totalBagCount, 'fa')})`
                  : `Bag (${totalBagCount})`}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <StorefrontView
          lang={lang}
          products={products}
          cms={cms}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onAddToCart={handleAddToCart}
          compareIds={compareIds}
          compareLimitNotice={compareLimitNotice}
          onToggleCompare={handleToggleCompare}
          onClearCompare={() => setCompareIds([])}
          onOpenCompareModal={() => setIsCompareOpen(true)}
          reviews={reviews}
          onSubmitReview={handleSubmitReview}
          onToggleReviewApproval={handleToggleReviewApproval}
          onDeleteReview={handleDeleteReview}
        />
      </main>

      <CartCheckoutModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        lang={lang}
        cart={cart}
        products={products}
        deliverySettings={INITIAL_DELIVERY_SETTINGS}
        activeDiscountCode={cms.activeDiscountCode}
        activeDiscountPercent={cms.activeDiscountPercent}
        onUpdateQuantity={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
      />

      {isCompareOpen && (
        <CompareModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          lang={lang}
          products={products}
          compareIds={compareIds}
          onSetCompareIds={setCompareIds}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Truthful Editorial Footer — No fictional licensing or dummy contact claims */}
      <footer className="border-t border-black/[0.07] bg-[#F5F5F7] py-10 px-6 text-xs text-[#6E6E73] no-print">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="font-semibold text-[#1D1D1F]">
              {verifiedBusiness?.name
                ? verifiedBusiness.name
                : isFa
                  ? 'پارس‌تک — کاتالوگ آنلاین سخت‌افزار و کالای دیجیتال'
                  : 'ParsTech — Digital Hardware & Mobile Catalog'}
            </p>
            {verifiedBusiness?.address && <p>{verifiedBusiness.address}</p>}
          </div>

          <nav aria-label={isFa ? 'پیوندهای پایین صفحه' : 'Footer Navigation'} className="flex flex-wrap items-center gap-6">
            <Link href="/" className="hover:text-[#1D1D1F]">
              {isFa ? 'کاتالوگ محصولات' : 'Catalog'}
            </Link>
            <Link href="/blueprint" className="hover:text-[#1D1D1F]">
              {isFa ? 'مستندات معماری' : 'Architecture Spec'}
            </Link>
            <Link href="/account" className="hover:text-[#1D1D1F]">
              {isFa ? 'حساب کاربری' : 'Account'}
            </Link>
            <Link href="/admin" className="hover:text-[#1D1D1F]">
              {isFa ? 'پنل مدیریت' : 'Admin Console'}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};
