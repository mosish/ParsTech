import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Check,
  ArrowUpLeft,
  ArrowUpRight,
  MessageCircle,
  Send,
  Instagram,
  Youtube,
  MapPin,
  Phone,
  Clock,
  Scale,
  Star,
  X,
} from 'lucide-react';
import {
  formatToman,
  formatNumber,
  tomanToRial,
  filterAndSortProducts,
  calculateProductRatingSummary,
  type Language,
  type CategoryId,
  type Product,
  type ProductReview,
  type AdminRole,
} from '../utils/commerce';
import type { StoreCmsConfig } from '../data/storeData';
import { ProductArtwork } from './ProductArtwork';
import { ProductReviewsSection } from './ProductReviewsSection';

interface StorefrontViewProps {
  lang: Language;
  products: Product[];
  cms: StoreCmsConfig;
  selectedCategory: CategoryId;
  onSelectCategory: (cat: CategoryId) => void;
  onAddToCart: (product: Product, colorHex: string) => void;
  onOpenSpecView: () => void;
  compareIds: string[];
  compareLimitNotice: boolean;
  onToggleCompare: (productId: string) => void;
  onClearCompare: () => void;
  onOpenCompareModal: () => void;
  reviews: ProductReview[];
  adminRole: AdminRole;
  isAdminAuthenticated: boolean;
  onToggleAdminAuth: (authenticated: boolean) => void;
  onSubmitReview: (review: Omit<ProductReview, 'id' | 'createdAtIso' | 'approved'>) => void;
  onToggleReviewApproval: (reviewId: string, approved: boolean) => void;
  onDeleteReview: (reviewId: string) => void;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  lang,
  products,
  cms,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  onOpenSpecView,
  compareIds,
  compareLimitNotice,
  onToggleCompare,
  onClearCompare,
  onOpenCompareModal,
  reviews,
  adminRole,
  isAdminAuthenticated,
  onToggleAdminAuth,
  onSubmitReview,
  onToggleReviewApproval,
  onDeleteReview,
}) => {
  const isFa = lang === 'fa';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [maxPriceMillion, setMaxPriceMillion] = useState<number>(180);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'stock'>('featured');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [selectedColorHex, setSelectedColorHex] = useState<string>('');
  const [cardSelectedColors, setCardSelectedColors] = useState<Record<string, string>>({});
  const [addedFeedbackId, setAddedFeedbackId] = useState<string | null>(null);

  const baseFilteredProducts = filterAndSortProducts({
    products,
    category: selectedCategory,
    brand: selectedBrand,
    searchQuery,
    onlyInStock,
    maxPriceToman: maxPriceMillion * 1000000,
    sortBy,
  });

  const filteredProducts =
    selectedSeries === 'all'
      ? baseFilteredProducts
      : baseFilteredProducts.filter((p) => p.seriesTag === selectedSeries);

  const seriesFilters: { id: string; labelFa: string; labelEn: string }[] = [
    { id: 'all', labelFa: 'همه سری‌ها', labelEn: 'All Series' },
    { id: 'ip17', labelFa: 'سری آیفون ۱۷ (جدید)', labelEn: 'iPhone 17 Series (New)' },
    { id: 'ip16', labelFa: 'سری آیفون ۱۶', labelEn: 'iPhone 16 Series' },
    { id: 'ip15', labelFa: 'سری آیفون ۱۵', labelEn: 'iPhone 15 Series' },
    { id: 'ip14', labelFa: 'سری آیفون ۱۴', labelEn: 'iPhone 14 Series' },
    { id: 'ip13', labelFa: 'سری آیفون ۱۳', labelEn: 'iPhone 13 Series' },
    { id: 'samsung_sz', labelFa: 'سامسونگ سری S و Z (جدید)', labelEn: 'Samsung Galaxy S & Z' },
    { id: 'samsung_a', labelFa: 'سامسونگ سری A (از A07 تا A56)', labelEn: 'Samsung Galaxy A (A07–A56)' },
  ];

  const categories: { id: CategoryId; labelFa: string; labelEn: string }[] = [
    { id: 'all', labelFa: 'همه محصولات', labelEn: 'All Hardware' },
    { id: 'mobiles', labelFa: 'گوشی موبایل', labelEn: 'Mobiles' },
    { id: 'laptops', labelFa: 'لپ‌تاپ و مک‌بوک', labelEn: 'Laptops' },
    { id: 'consoles', labelFa: 'کنسول بازی', labelEn: 'Game Consoles' },
    { id: 'accessories', labelFa: 'لوازم جانبی', labelEn: 'Accessories' },
  ];

  const brands = ['all', 'Apple', 'Samsung', 'Sony', 'Microsoft', 'ASUS', 'Anker'];

  useEffect(() => {
    if (!activeProduct) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveProduct(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeProduct]);

  const handleOpenProduct = (product: Product) => {
    setActiveProduct(product);
    const activeCardHex = cardSelectedColors[product.id] ?? product.colors[0]?.hex ?? '#C8C2B8';
    setSelectedColorHex(activeCardHex);
  };

  const handleQuickAdd = (product: Product, colorHex?: string) => {
    const hex = colorHex || cardSelectedColors[product.id] || product.colors[0]?.hex || '#C8C2B8';
    onAddToCart(product, hex);
    setAddedFeedbackId(product.id);
    setTimeout(() => {
      setAddedFeedbackId((prev) => (prev === product.id ? null : prev));
    }, 1400);
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Section 1: Apple / Apple-NIC Inspired Minimalist Split Hero */}
      <section className="max-w-[1200px] mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-[#F5F5F7] rounded-3xl p-8 lg:p-12 border border-black/[0.05]">
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-medium text-[#6E6E73] tracking-wide">
                {isFa ? cms.heroKickerFa : cms.heroKickerEn}
              </p>
              <h1
                className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#1D1D1F] leading-[1.18]"
                style={{ textWrap: 'balance' }}
              >
                {isFa ? cms.heroTitleFa : cms.heroTitleEn}
              </h1>
              <p className="text-[15px] text-[#515154] leading-relaxed max-w-[58ch]">
                {isFa ? cms.heroSubtitleFa : cms.heroSubtitleEn}
              </p>
            </div>

            <div className="space-y-5 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#catalog-section"
                  className="px-6 py-3 rounded-xl bg-[#0066CC] hover:bg-[#0055B3] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  {isFa ? 'مشاهده کاتالوگ و قیمت روز' : 'Explore Catalog & Live Prices'}
                </a>
                <button
                  type="button"
                  onClick={onOpenSpecView}
                  className="px-5 py-3 rounded-xl bg-white hover:bg-[#E8E8ED] text-[#1D1D1F] border border-black/10 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  {isFa ? 'مشاهده مستندات فنی (بخش a تا g)' : 'Architecture & Spec Blueprint (a–g)'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6E73] pt-2 border-t border-black/[0.06]">
                <span>{isFa ? 'کد رجیستری رسمی همتا' : 'Official Hamta IMEI Registry'}</span>
                <span aria-hidden="true">·</span>
                <span>{isFa ? 'تحویل ۳ ساعته در تهران' : '3-Hour Tehran Courier'}</span>
                <span aria-hidden="true">·</span>
                <span>{isFa ? 'درگاه امن زرین‌پال و به‌پرداخت ملت' : 'Zarinpal & Mellat Shaparak IPG'}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex items-center justify-center bg-white rounded-2xl p-6 border border-black/[0.04]">
            <ProductArtwork artworkKey="hero_showcase" className="w-full h-auto max-h-[320px]" />
          </div>
        </div>

        {/* Full-width 4-column proof strip below hero split */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 px-2">
          <div>
            <p className="text-xs text-[#6E6E73]">{isFa ? 'شعبه حضوری' : 'Physical Showroom'}</p>
            <p className="text-sm font-semibold text-[#1D1D1F] mt-1">
              {isFa ? 'مرکز موبایل شرق · واحد B24' : 'East Mobile Center · Unit B24'}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6E6E73]">{isFa ? 'ارسال فوری تهران' : 'Tehran Same-Day Courier'}</p>
            <p className="text-sm font-semibold text-[#1D1D1F] mt-1 tabular-nums">
              {isFa ? 'زیر ۳ ساعت (رایگان بالای ۲۵ میلیون)' : 'Under 3 Hours (Free > 25M Toman)'}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6E6E73]">{isFa ? 'ضمانت اصالت و رجیستری' : 'Authenticity & Warranty'}</p>
            <p className="text-sm font-semibold text-[#1D1D1F] mt-1">
              {isFa ? '۱۸ ماه گارانتی شرکتی + کد همتا' : '18-Month Corporate + Hamta Code'}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6E6E73]">{isFa ? 'روش‌های تسویه' : 'Payment Options'}</p>
            <p className="text-sm font-semibold text-[#1D1D1F] mt-1">
              {isFa ? 'زرین‌پال · ملت · آیدی‌پی · پرداخت در محل' : 'Zarinpal · Mellat · IDPay · In-Store POS'}
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Product Catalog, Search & Multi-Faceted Filters */}
      <section id="catalog-section" className="max-w-[1200px] mx-auto px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/[0.07] pb-6">
          <div>
            <p className="text-xs text-[#6E6E73]">
              {isFa ? 'فروشگاه آنلاین پارس‌تک' : 'ParsTech Direct Catalog'}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] mt-1">
              {isFa ? 'انتخاب دستگاه با قیمت لحظه‌ای (تومان)' : 'Select Your Hardware (Live Toman Pricing)'}
            </h2>
          </div>

          {/* Interactive Category Segmented Bar + Compare Tool Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              role="tablist"
              aria-label={isFa ? 'دسته‌بندی محصولات' : 'Product Categories'}
              className="flex items-center gap-1 p-1 bg-[#F5F5F7] rounded-xl overflow-x-auto"
            >
              {categories.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => onSelectCategory(cat.id)}
                    className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-white text-[#1D1D1F] shadow-xs'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                    }`}
                  >
                    {isFa ? cat.labelFa : cat.labelEn}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onOpenCompareModal}
              className="px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black/80 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>
                {isFa
                  ? `جدول مقایسه (${formatNumber(compareIds.length, 'fa')}/۳)`
                  : `Compare Tool (${compareIds.length}/3)`}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Bar: Search, Brand, Max Price, In-Stock Only, Sort */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-[#F5F5F7] p-4 rounded-2xl border border-black/[0.04]">
          <div className="md:col-span-4 relative">
            <label htmlFor="catalog-search" className="sr-only">
              {isFa ? 'جستجوی نام کالا یا مدل' : 'Search product name or SKU'}
            </label>
            <Search className="w-4 h-4 text-[#6E6E73] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
            <input
              id="catalog-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isFa
                  ? 'جستجو: آیفون ۱۶، مک‌بوک، PS5، انکر...'
                  : 'Search iPhone 16, MacBook, PS5, Anker...'
              }
              className="w-full ps-10 pe-4 py-2.5 bg-white rounded-xl text-sm text-[#1D1D1F] placeholder:text-[#86868B] border border-black/[0.08] focus:outline-none focus:border-[#0066CC]"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="brand-filter" className="sr-only">
              {isFa ? 'فیلتر برند' : 'Filter by Brand'}
            </label>
            <select
              id="brand-filter"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2.5 bg-white rounded-xl text-xs font-medium text-[#1D1D1F] border border-black/[0.08] focus:outline-none focus:border-[#0066CC]"
            >
              <option value="all">{isFa ? 'همه برندها' : 'All Brands'}</option>
              {brands
                .filter((b) => b !== 'all')
                .map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-3 px-2">
            <SlidersHorizontal className="w-4 h-4 text-[#6E6E73] shrink-0" />
            <div className="w-full">
              <div className="flex justify-between text-[11px] text-[#6E6E73] mb-1">
                <span>{isFa ? 'سقف قیمت:' : 'Max Price:'}</span>
                <span className="font-semibold text-[#1D1D1F] tabular-nums">
                  {formatNumber(maxPriceMillion, lang)} {isFa ? 'میلیون تومان' : 'M Toman'}
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={180}
                step={5}
                value={maxPriceMillion}
                aria-label={isFa ? 'سقف قیمت به میلیون تومان' : 'Maximum price in million Toman'}
                onChange={(e) => setMaxPriceMillion(Number(e.target.value))}
                className="w-full accent-[#0066CC] cursor-pointer"
              />
            </div>
          </div>

          <div className="md:col-span-3 flex items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#1D1D1F] cursor-pointer select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="rounded border-black/20 text-[#0066CC] focus:ring-[#0066CC]"
              />
              <span>{isFa ? 'فقط کالاهای موجود' : 'In Stock Only'}</span>
            </label>

            <select
              aria-label={isFa ? 'مرتب‌سازی' : 'Sort Products'}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 bg-white rounded-xl text-xs font-medium text-[#1D1D1F] border border-black/[0.08] focus:outline-none"
            >
              <option value="featured">{isFa ? 'پیشنهاد ویژه' : 'Featured'}</option>
              <option value="price_asc">{isFa ? 'ارزان‌ترین' : 'Price: Low to High'}</option>
              <option value="price_desc">{isFa ? 'گران‌ترین' : 'Price: High to Low'}</option>
              <option value="stock">{isFa ? 'بیشترین موجودی' : 'Highest Stock'}</option>
            </select>
          </div>
        </div>

        {/* Generation & Series Quick-Filter Strip (iPhone 13 -> 17 & Samsung A07 -> S25/Z) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label={isFa ? 'فیلتر نسل آیفون و سری سامسونگ' : 'Filter by iPhone or Samsung Series'}
            className="flex items-center gap-1.5 overflow-x-auto pb-1"
          >
            {seriesFilters.map((sf) => {
              const active = selectedSeries === sf.id;
              return (
                <button
                  key={sf.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSelectedSeries(sf.id);
                    if (sf.id !== 'all' && selectedCategory !== 'all' && selectedCategory !== 'mobiles') {
                      onSelectCategory('mobiles');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 border ${
                    active
                      ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                      : 'bg-white text-[#515154] hover:text-[#1D1D1F] border-black/[0.08]'
                  }`}
                >
                  {isFa ? sf.labelFa : sf.labelEn}
                </button>
              );
            })}
          </div>

          <span className="text-xs font-medium text-[#6E6E73] tabular-nums">
            {isFa
              ? `نمایش ${formatNumber(filteredProducts.length, 'fa')} مدل با تمام رنگ‌های اصلی`
              : `Showing ${filteredProducts.length} models with all official finishes`}
          </span>
        </div>

        {/* 3-Column Product Grid (Apple-NIC inspired generous whitespace & clean typography) */}
        {filteredProducts.length === 0 ? (
          <div className="bg-[#F5F5F7] rounded-2xl p-12 text-center space-y-3">
            <p className="text-base font-semibold text-[#1D1D1F]">
              {isFa ? 'کالایی با این مشخصات یافت نشد.' : 'No matching hardware found.'}
            </p>
            <p className="text-xs text-[#6E6E73]">
              {isFa
                ? 'فیلتر سقف قیمت یا عبارت جستجو را تغییر دهید تا تمام مدل‌ها نمایش داده شوند.'
                : 'Try resetting your price ceiling or brand filter.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedBrand('all');
                setSelectedSeries('all');
                setOnlyInStock(false);
                setMaxPriceMillion(180);
                onSelectCategory('all');
              }}
              className="px-4 py-2 rounded-lg bg-[#1D1D1F] text-white text-xs font-medium"
            >
              {isFa ? 'پاک کردن فیلترها' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => {
              const inStock = product.stockCount > 0;
              const isJustAdded = addedFeedbackId === product.id;
              const isCompared = compareIds.includes(product.id);
              const activeCardHex = cardSelectedColors[product.id] ?? product.colors[0]?.hex ?? '#C8C2B8';
              const activeColorObj =
                product.colors.find((c) => c.hex === activeCardHex) ?? product.colors[0];

              return (
                <article
                  key={product.id}
                  className="group bg-white rounded-2xl border border-black/[0.06] hover:border-black/[0.15] transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* 65-75% Neutral Studio Backdrop Imagery + Top-Corner Compare Toggle */}
                    <div className="bg-[#F5F5F7] p-6 h-60 flex items-center justify-center relative">
                      <button
                        type="button"
                        aria-pressed={isCompared}
                        onClick={() => onToggleCompare(product.id)}
                        className={`absolute top-3.5 end-3.5 z-10 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 border ${
                          isCompared
                            ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                            : 'bg-white/90 hover:bg-white text-[#1D1D1F] border-black/10'
                        }`}
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>
                          {isCompared
                            ? isFa
                              ? 'در مقایسه'
                              : 'Comparing'
                            : isFa
                              ? 'مقایسه'
                              : 'Compare'}
                        </span>
                      </button>

                      <div
                        onClick={() => handleOpenProduct(product)}
                        className="w-full h-full flex items-center justify-center cursor-pointer"
                      >
                        <ProductArtwork
                          artworkKey={product.artworkKey}
                          accentHex={activeCardHex}
                          className="w-full h-full max-h-48 transition-transform duration-200 group-hover:scale-[1.03]"
                        />
                      </div>
                    </div>

                      {/* Clean Unboxed Metadata & Title */}
                    <div className="p-6 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-[#6E6E73]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-[#1D1D1F]">{product.brand}</span>
                          <span aria-hidden="true">·</span>
                          <span>{product.sku}</span>
                          {(() => {
                            const ratingSum = calculateProductRatingSummary(reviews, product.id);
                            if (ratingSum.approvedCount === 0) return null;
                            return (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-0.5 text-[#1D1D1F] font-medium tabular-nums">
                                  <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                                  {formatNumber(ratingSum.averageRating, lang)}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                        <span className={inStock ? 'text-[#1D1D1F] font-medium' : 'text-[#B91C1C] font-medium'}>
                          {inStock
                            ? isFa
                              ? `موجود (${formatNumber(product.stockCount, lang)} عدد)`
                              : `In Stock (${product.stockCount})`
                            : isFa
                              ? 'ناموجود'
                              : 'Out of Stock'}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-[#1D1D1F] leading-snug line-clamp-2 min-h-[2.75rem]">
                        <button
                          type="button"
                          onClick={() => handleOpenProduct(product)}
                          className="text-start hover:text-[#0066CC] transition-colors"
                        >
                          {isFa ? product.nameFa : product.nameEn}
                        </button>
                      </h3>

                      <p className="text-xs text-[#6E6E73] line-clamp-1">
                        {isFa ? product.subtitleFa : product.subtitleEn}
                      </p>

                      {/* Interactive Color Swatches Selector on Card */}
                      <div className="flex items-center justify-between gap-2 pt-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {product.colors.map((c) => {
                            const isSelectedColor = c.hex === activeCardHex;
                            return (
                              <button
                                key={c.hex}
                                type="button"
                                aria-label={
                                  isFa
                                    ? `انتخاب رنگ ${c.nameFa} برای ${product.nameFa}`
                                    : `Select ${c.nameEn} color for ${product.nameEn}`
                                }
                                title={isFa ? c.nameFa : c.nameEn}
                                onClick={() =>
                                  setCardSelectedColors((prev) => ({
                                    ...prev,
                                    [product.id]: c.hex,
                                  }))
                                }
                                className={`w-4 h-4 rounded-full border transition-transform ${
                                  isSelectedColor
                                    ? 'ring-2 ring-[#0066CC] ring-offset-1 scale-110 border-black/30'
                                    : 'border-black/20 hover:scale-110'
                                }`}
                                style={{ backgroundColor: c.hex }}
                              />
                            );
                          })}
                        </div>
                        <span className="text-[11px] font-medium text-[#515154] truncate">
                          {activeColorObj
                            ? isFa
                              ? `${formatNumber(product.colors.length, 'fa')} رنگ · ${activeColorObj.nameFa}`
                              : `${product.colors.length} Colors · ${activeColorObj.nameEn}`
                            : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contiguous Footer: Tabular Price in Toman + Quick Actions */}
                  <div className="px-6 pb-6 pt-3 border-t border-black/[0.05] flex items-center justify-between gap-2">
                    <div className="shrink-0">
                      {product.originalPriceToman && product.originalPriceToman > product.priceToman && (
                        <p className="text-[11px] text-[#86868B] line-through tabular-nums whitespace-nowrap">
                          {formatToman(product.originalPriceToman, lang)}
                        </p>
                      )}
                      <p className="text-sm font-bold text-[#1D1D1F] tabular-nums whitespace-nowrap">
                        {formatToman(product.priceToman, lang)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenProduct(product)}
                        className="px-3 py-2 rounded-lg text-xs font-medium text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E8E8ED] transition-colors whitespace-nowrap shrink-0"
                      >
                        {isFa ? 'مشخصات' : 'Specs'}
                      </button>
                      <button
                        type="button"
                        disabled={!inStock}
                        onClick={() => handleQuickAdd(product)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                          !inStock
                            ? 'bg-black/5 text-[#86868B] cursor-not-allowed'
                            : isJustAdded
                              ? 'bg-[#15803D] text-white'
                              : 'bg-[#0066CC] hover:bg-[#0055B3] text-white'
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{isFa ? 'افزوده شد' : 'Added'}</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{isFa ? 'افزودن به سبد' : 'Add to Bag'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3: East Mobile Center Showroom, Social Channels & Direct Contact */}
      <section className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#F5F5F7] rounded-3xl p-8 lg:p-10 border border-black/[0.05]">
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-medium text-[#6E6E73]">
              {isFa ? 'تحویل حضوری و مشاوره تخصصی در شرق تهران' : 'In-Store Experience & Direct Support'}
            </p>
            <h2 className="text-2xl font-bold text-[#1D1D1F]">
              {isFa ? 'پارس‌تک — مجتمع تجاری مرکز موبایل شرق' : 'ParsTech Showroom — East Mobile Center'}
            </h2>
            <p className="text-sm text-[#515154] leading-relaxed">
              {isFa
                ? 'مشتریان محترم می‌توانند پس از ثبت سفارش آنلاین، گزینه «تحویل حضوری در مرکز موبایل شرق» را انتخاب کرده و دستگاه خود را به همراه انتقال مالکیت آنی همتا و تست سلامت در حضور کارشناس تحویل بگیرند.'
                : 'Shop online with instant reservation and pick up your device in person at East Mobile Center (Resalat Expressway), including on-the-spot Hamta SIM registry activation and hardware diagnostics.'}
            </p>

            <div className="space-y-3 pt-2 text-xs text-[#1D1D1F]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
                <span>{isFa ? cms.storeAddressFa : cms.storeAddressEn}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#0066CC] shrink-0" />
                <span className="tabular-nums font-medium">{ formatNumber(0, lang).slice(0,0) }{cms.storePhone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#0066CC] shrink-0" />
                <span>{isFa ? cms.workingHoursFa : cms.workingHoursEn}</span>
              </div>
            </div>

            {/* Direct WhatsApp & Telegram Contact Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <a
                href={`https://wa.me/${cms.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black/80 text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{isFa ? 'مشاوره خرید در واتس‌اپ' : 'WhatsApp Sales Support'}</span>
              </a>
              <a
                href={cms.telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#E8E8ED] text-[#1D1D1F] border border-black/10 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <Send className="w-4 h-4 text-[#0066CC]" />
                <span>{isFa ? 'کانال قیمت لحظه‌ای تلگرام' : 'Telegram Live Price Channel'}</span>
              </a>
            </div>
          </div>

          {/* Instagram & Social Media Feed Showcase */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-black/[0.05] flex flex-col justify-between space-y-5">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <div className="flex items-center gap-2.5">
                <Instagram className="w-5 h-5 text-[#1D1D1F]" />
                <div>
                  <h3 className="text-sm font-bold text-[#1D1D1F]">@parstech.eastmobile</h3>
                  <p className="text-[11px] text-[#6E6E73]">
                    {isFa
                      ? 'آنباکسینگ روزانه، موجودی لحظه‌ای و آموزش رجیستری'
                      : 'Daily Unboxings, Stock Drops & Hamta Guides'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={cms.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#0066CC] hover:underline flex items-center gap-1 whitespace-nowrap"
                >
                  <span>{isFa ? 'مشاهده اینستاگرام' : 'Follow'}</span>
                  {isFa ? <ArrowUpLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                </a>
              </div>
            </div>

            {cms.showInstagramWidget ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    key: 'iphone16pro' as const,
                    captionFa: 'موجودی جدید آیفون ۱۶ پرو ZAA با گارانتی شرکتی',
                    captionEn: 'New iPhone 16 Pro ZAA Dual-SIM Drop',
                  },
                  {
                    key: 'macbookprom4' as const,
                    captionFa: 'بررسی تخصصی مک‌بوک پرو M4 در شعبه شرق',
                    captionEn: 'MacBook Pro M4 Pro Benchmark Review',
                  },
                  {
                    key: 'ps5pro' as const,
                    captionFa: 'پلی‌استیشن ۵ پرو اروپا آماده تحویل فوری',
                    captionEn: 'PS5 Pro 2TB Europe Pack In Stock',
                  },
                ].map((post, idx) => (
                  <a
                    key={idx}
                    href={cms.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group block bg-[#F5F5F7] rounded-xl p-3 border border-black/[0.04] hover:border-black/15 transition-colors"
                  >
                    <div className="h-24 flex items-center justify-center">
                      <ProductArtwork artworkKey={post.key} className="w-full h-full" />
                    </div>
                    <p className="text-[11px] text-[#515154] mt-2 line-clamp-2 leading-relaxed">
                      {isFa ? post.captionFa : post.captionEn}
                    </p>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6E6E73] py-8 text-center">
                {isFa ? 'ویجت اینستاگرام توسط مدیر غیرفعال شده است.' : 'Instagram feed widget is currently hidden by Admin.'}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-[#6E6E73] pt-2 border-t border-black/[0.05]">
              <span>{isFa ? 'شبکه‌های اجتماعی رسمی پارس‌تک:' : 'Official Social Channels:'}</span>
              <div className="flex items-center gap-4">
                <a href={cms.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-[#1D1D1F]">
                  Instagram
                </a>
                <a href={cms.telegramUrl} target="_blank" rel="noreferrer" className="hover:text-[#1D1D1F]">
                  Telegram
                </a>
                <a href={cms.youtubeUrl} target="_blank" rel="noreferrer" className="hover:text-[#1D1D1F] flex items-center gap-1">
                  <Youtube className="w-3.5 h-3.5" />
                  <span>YouTube</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contiguous Product Detail Modal (PDP) */}
      {activeProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isFa ? activeProduct.nameFa : activeProduct.nameEn}
          onClick={() => setActiveProduct(null)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 border border-black/10 shadow-xl my-4 sm:my-8"
          >
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.07]">
              <div className="flex items-center gap-2 text-xs text-[#6E6E73]">
                <span className="font-semibold text-[#1D1D1F]">{activeProduct.brand}</span>
                <span aria-hidden="true">·</span>
                <span>SKU: {activeProduct.sku}</span>
              </div>
              <button
                type="button"
                aria-label={isFa ? 'بستن پنجره محصول' : 'Close product details'}
                onClick={() => setActiveProduct(null)}
                className="p-2 rounded-full hover:bg-[#F5F5F7] text-[#1D1D1F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-6 items-start">
              {/* Left/Start: Studio Gallery & Color Swatches */}
              <div className="md:col-span-6 space-y-4">
                <div className="bg-[#F5F5F7] rounded-2xl p-8 h-72 flex items-center justify-center">
                  <ProductArtwork
                    artworkKey={activeProduct.artworkKey}
                    accentHex={selectedColorHex}
                    className="w-full h-full max-h-56"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#6E6E73]">
                    {isFa ? 'انتخاب رنگ بدنه:' : 'Select Finish:'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {activeProduct.colors.map((c) => {
                      const isSelected = selectedColorHex === c.hex;
                      return (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setSelectedColorHex(c.hex)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 transition-colors ${
                            isSelected
                              ? 'border-[#0066CC] bg-[#0066CC]/5 text-[#1D1D1F]'
                              : 'border-black/10 text-[#6E6E73] hover:text-[#1D1D1F]'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span>{isFa ? c.nameFa : c.nameEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right/End: Contiguous Purchase Module */}
              <div className="md:col-span-6 space-y-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] leading-snug">
                    {isFa ? activeProduct.nameFa : activeProduct.nameEn}
                  </h2>
                  <p className="text-xs text-[#6E6E73] mt-1.5">
                    {isFa ? activeProduct.subtitleFa : activeProduct.subtitleEn}
                  </p>
                </div>

                {/* Price in Toman & Rial equivalent */}
                <div className="bg-[#F5F5F7] rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-[#6E6E73]">{isFa ? 'قیمت نهایی نقدی:' : 'Price (Toman):'}</span>
                    <span className="text-xl font-bold text-[#1D1D1F] tabular-nums">
                      {formatToman(activeProduct.priceToman, lang)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-[11px] text-[#6E6E73] tabular-nums">
                    <span>{isFa ? 'معادل ریالی درگاه شاپرک:' : 'Shaparak IPG Equivalent (Rial):'}</span>
                    <span>
                      {formatNumber(tomanToRial(activeProduct.priceToman), lang)} {isFa ? 'ریال' : 'IRR'}
                    </span>
                  </div>
                  <p className="text-xs text-[#1D1D1F] pt-1 border-t border-black/[0.06]">
                    {isFa ? activeProduct.warrantyFa : activeProduct.warrantyEn}
                  </p>
                </div>

                {/* Technical Specifications Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-[#1D1D1F]">
                    {isFa ? 'مشخصات فنی کلیدی' : 'Technical Specifications'}
                  </h3>
                  <dl className="divide-y divide-black/[0.06] border-t border-b border-black/[0.06] text-xs">
                    {activeProduct.specs.map((spec, idx) => (
                      <div key={idx} className="py-2.5 flex justify-between gap-4">
                        <dt className="text-[#6E6E73]">{isFa ? spec.labelFa : spec.labelEn}</dt>
                        <dd className="font-medium text-[#1D1D1F] text-end">
                          {isFa ? spec.valueFa : spec.valueEn}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleCompare(activeProduct.id)}
                    className={`py-3.5 px-4 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      compareIds.includes(activeProduct.id)
                        ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                        : 'bg-[#F5F5F7] text-[#1D1D1F] border-black/10 hover:bg-[#E8E8ED]'
                    }`}
                  >
                    <Scale className="w-4 h-4" />
                    <span>
                      {compareIds.includes(activeProduct.id)
                        ? isFa
                          ? 'در لیست مقایسه'
                          : 'In Comparison'
                        : isFa
                          ? 'افزودن به مقایسه'
                          : 'Compare'}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={activeProduct.stockCount <= 0}
                    onClick={() => {
                      handleQuickAdd(activeProduct, selectedColorHex);
                      setActiveProduct(null);
                    }}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#0066CC] hover:bg-[#0055B3] disabled:bg-black/10 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {isFa ? 'افزودن به سبد خرید و ادامه' : 'Add to Bag & Continue'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Product Review System & Admin Display Approval Section */}
            <ProductReviewsSection
              lang={lang}
              productId={activeProduct.id}
              productName={isFa ? activeProduct.nameFa : activeProduct.nameEn}
              reviews={reviews}
              adminRole={adminRole}
              isAdminAuthenticated={isAdminAuthenticated}
              onToggleAdminAuth={onToggleAdminAuth}
              onSubmitReview={onSubmitReview}
              onToggleReviewApproval={onToggleReviewApproval}
              onDeleteReview={onDeleteReview}
            />
          </div>
        </div>
      )}

      {/* Floating Compare Dock Bar when 1–3 Products are Selected */}
      {compareIds.length > 0 && (
        <div
          role="region"
          aria-label={isFa ? 'نوار مقایسه محصولات انتخاب‌شده' : 'Selected Products Comparison Bar'}
          className="fixed bottom-4 inset-x-4 z-40 max-w-4xl mx-auto bg-[#1D1D1F] text-white rounded-2xl p-3.5 sm:px-5 shadow-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 no-print"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#F5F5F7] me-1">
              {isFa
                ? `مقایسه (${formatNumber(compareIds.length, 'fa')}/۳):`
                : `Compare (${compareIds.length}/3):`}
            </span>
            {compareIds.map((id) => {
              const prod = products.find((p) => p.id === id);
              if (!prod) return null;
              return (
                <div
                  key={id}
                  className="bg-white/10 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1.5"
                >
                  <span className="truncate max-w-[140px]">
                    {isFa ? prod.nameFa.split('(')[0] : prod.nameEn.split('(')[0]}
                  </span>
                  <button
                    type="button"
                    aria-label={isFa ? `حذف ${prod.nameFa}` : `Remove ${prod.nameEn}`}
                    onClick={() => onToggleCompare(id)}
                    className="text-white/60 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            {compareLimitNotice && (
              <span className="text-[11px] text-[#FCD34D] font-medium">
                {isFa ? 'حداکثر ۳ محصول قابل انتخاب است.' : 'Maximum 3 products can be compared.'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 ms-auto">
            <button
              type="button"
              onClick={onClearCompare}
              className="px-3 py-2 rounded-xl text-xs font-medium text-white/75 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              {isFa ? 'پاک کردن' : 'Clear'}
            </button>
            <button
              type="button"
              onClick={onOpenCompareModal}
              className="px-4 py-2 rounded-xl bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{isFa ? 'مشاهده جدول مقایسه' : 'Compare Side-by-Side'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
