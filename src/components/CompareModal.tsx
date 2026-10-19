import React, { useState, useEffect } from 'react';
import {
  X,
  Scale,
  ShoppingBag,
  Trash2,
  Plus,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  formatToman,
  formatNumber,
  tomanToRial,
  buildComparisonRows,
  type Language,
  type Product,
} from '../utils/commerce';
import { ProductArtwork } from './ProductArtwork';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  products: Product[];
  compareIds: string[];
  onSetCompareIds: (ids: string[]) => void;
  onAddToCart: (product: Product, colorHex: string) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  lang,
  products,
  compareIds,
  onSetCompareIds,
  onAddToCart,
}) => {
  const isFa = lang === 'fa';
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedProducts = compareIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const specRows = buildComparisonRows(selectedProducts);
  const visibleSpecRows = onlyDifferences
    ? specRows.filter((row) => row.hasDifference)
    : specRows;

  const lowestPriceToman =
    selectedProducts.length > 1
      ? Math.min(...selectedProducts.map((p) => p.priceToman))
      : null;

  const handleSelectSlotProduct = (slotIndex: number, productId: string) => {
    if (!productId) {
      const next = compareIds.filter((_, idx) => idx !== slotIndex);
      onSetCompareIds(next);
      return;
    }
    if (compareIds.includes(productId)) return;
    const next = [...compareIds];
    if (slotIndex < next.length) {
      next[slotIndex] = productId;
    } else if (next.length < 3) {
      next.push(productId);
    }
    onSetCompareIds(next.slice(0, 3));
  };

  const handleRemoveSlot = (productId: string) => {
    onSetCompareIds(compareIds.filter((id) => id !== productId));
  };

  const handleLoadPreset = (presetIds: string[]) => {
    onSetCompareIds(presetIds.slice(0, 3));
  };

  const handleAddFromTable = (product: Product) => {
    onAddToCart(product, product.colors[0]?.hex ?? '#C8C2B8');
    setAddedId(product.id);
    setTimeout(() => {
      setAddedId((prev) => (prev === product.id ? null : prev));
    }, 1400);
  };

  const slots = [0, 1, 2];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isFa ? 'ابزار مقایسه تخصصی محصولات' : 'Side-by-Side Product Comparison Tool'}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-[1160px] w-full p-5 sm:p-8 border border-black/10 shadow-2xl my-auto max-h-[92vh] flex flex-col justify-between overflow-hidden"
      >
        {/* Top Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-black/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] flex items-center justify-center text-[#0066CC]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#1D1D1F]">
                {isFa
                  ? 'مقایسه مشخصات فنی محصولات (حداکثر ۳ دستگاه)'
                  : 'Side-by-Side Hardware Comparison (Up to 3 Products)'}
              </h2>
              <p className="text-xs text-[#6E6E73]">
                {isFa
                  ? `${formatNumber(selectedProducts.length, 'fa')} از ۳ محصول انتخاب شده · مقایسه قیمت، گارانتی و مشخصات سخت‌افزاری`
                  : `${selectedProducts.length} of 3 products selected · Compare pricing, warranty, and technical specs`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {selectedProducts.length > 1 && (
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#1D1D1F] bg-[#F5F5F7] px-3.5 py-2 rounded-xl cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyDifferences}
                  onChange={(e) => setOnlyDifferences(e.target.checked)}
                  className="rounded text-[#0066CC] focus:ring-[#0066CC]"
                />
                <span>{isFa ? 'فقط نمایش تفاوت‌ها' : 'Show Only Differences'}</span>
              </label>
            )}

            {selectedProducts.length > 0 && (
              <button
                type="button"
                onClick={() => onSetCompareIds([])}
                className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-[#E8E8ED] text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
              >
                {isFa ? 'پاک کردن همه' : 'Clear All'}
              </button>
            )}

            <button
              type="button"
              aria-label={isFa ? 'بستن جدول مقایسه' : 'Close comparison table'}
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#F5F5F7] text-[#1D1D1F]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slot Selector Bar (Allows selecting/changing any of the 3 comparison slots directly) */}
        <div className="py-4 border-b border-black/[0.06] shrink-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {slots.map((slotIdx) => {
              const currentId = compareIds[slotIdx] ?? '';
              return (
                <div key={slotIdx} className="flex items-center gap-2 bg-[#F5F5F7] p-2.5 rounded-xl border border-black/[0.05]">
                  <span className="text-[11px] font-bold text-[#6E6E73] px-1.5 whitespace-nowrap">
                    {isFa ? `جایگاه ${formatNumber(slotIdx + 1, 'fa')}:` : `Slot ${slotIdx + 1}:`}
                  </span>
                  <select
                    aria-label={
                      isFa ? `انتخاب محصول جایگاه ${slotIdx + 1}` : `Select product for slot ${slotIdx + 1}`
                    }
                    value={currentId}
                    onChange={(e) => handleSelectSlotProduct(slotIdx, e.target.value)}
                    className="w-full bg-white px-3 py-1.5 rounded-lg text-xs font-medium text-[#1D1D1F] border border-black/10 focus:outline-none focus:border-[#0066CC]"
                  >
                    <option value="">
                      {isFa ? '+ انتخاب محصول برای مقایسه...' : '+ Select a product...'}
                    </option>
                    {products.map((prod) => {
                      const alreadyPickedElsewhere =
                        compareIds.includes(prod.id) && currentId !== prod.id;
                      return (
                        <option
                          key={prod.id}
                          value={prod.id}
                          disabled={alreadyPickedElsewhere}
                        >
                          {isFa ? prod.nameFa : prod.nameEn} ({formatToman(prod.priceToman, lang)})
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            })}
          </div>

          {/* Quick Comparison Presets when fewer than 2 items are selected */}
          {selectedProducts.length < 2 && (
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
              <span className="text-[#6E6E73] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#0066CC]" />
                <span>{isFa ? 'مقایسه‌های پیشنهادی سریع:' : 'Quick Comparison Presets:'}</span>
              </span>
              <button
                type="button"
                onClick={() => handleLoadPreset(['prod-ip16pro', 'prod-s25ultra'])}
                className="px-3 py-1 rounded-lg bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] font-medium transition-colors"
              >
                {isFa ? 'آیفون ۱۶ پرو در برابر گلکسی S25 Ultra' : 'iPhone 16 Pro vs. Galaxy S25 Ultra'}
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset(['prod-mbp-m4', 'prod-rog-g16'])}
                className="px-3 py-1 rounded-lg bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] font-medium transition-colors"
              >
                {isFa ? 'مک‌بوک پرو M4 در برابر ایسوس ROG G16' : 'MacBook Pro M4 vs. ASUS ROG G16'}
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset(['prod-ip16pro', 'prod-s25ultra', 'prod-mbp-m4'])}
                className="px-3 py-1 rounded-lg bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] font-medium transition-colors"
              >
                {isFa ? 'مقایسه ۳ پرچمدار محبوب' : 'Compare Top 3 Flagships'}
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Side-by-Side Comparison Table */}
        <div className="flex-1 overflow-auto pt-4">
          {selectedProducts.length === 0 ? (
            <div className="bg-[#F5F5F7] rounded-2xl p-12 text-center space-y-3 my-4">
              <p className="text-base font-bold text-[#1D1D1F]">
                {isFa
                  ? 'هنوز محصولی برای مقایسه انتخاب نشده است.'
                  : 'No products selected for comparison yet.'}
              </p>
              <p className="text-xs text-[#6E6E73]">
                {isFa
                  ? 'از منوهای بالای همین پنجره یا دکمه «مقایسه» روی کارت محصولات، حداکثر ۳ کالا را انتخاب کنید.'
                  : 'Use the slot dropdowns above or click "Compare" on any product card to compare up to 3 devices side-by-side.'}
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-black/[0.08] align-top">
                  <th className="w-44 py-4 pe-4 text-start text-[#6E6E73] font-semibold">
                    {isFa ? 'ویژگی / مشخصات' : 'Attribute / Specification'}
                  </th>
                  {selectedProducts.map((product) => {
                    const isAdded = addedId === product.id;
                    return (
                      <th
                        key={product.id}
                        className="py-4 px-4 text-start font-normal align-top w-1/3"
                      >
                        <div className="bg-[#F5F5F7] rounded-2xl p-4 space-y-3 border border-black/[0.05] relative">
                          <div className="flex items-center justify-between text-[11px] text-[#6E6E73]">
                            <span className="font-semibold text-[#1D1D1F]">
                              {product.brand} · {product.sku}
                            </span>
                            <button
                              type="button"
                              aria-label={
                                isFa
                                  ? `حذف ${product.nameFa} از مقایسه`
                                  : `Remove ${product.nameEn} from comparison`
                              }
                              onClick={() => handleRemoveSlot(product.id)}
                              className="p-1 rounded-lg hover:bg-black/10 text-[#6E6E73] hover:text-[#B91C1C]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="h-32 flex items-center justify-center bg-white rounded-xl p-3">
                            <ProductArtwork
                              artworkKey={product.artworkKey}
                              accentHex={product.colors[0]?.hex}
                              className="w-full h-full max-h-24"
                            />
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-[#1D1D1F] leading-snug min-h-[2.5rem]">
                              {isFa ? product.nameFa : product.nameEn}
                            </h3>
                            <p className="text-sm font-bold text-[#0066CC] tabular-nums whitespace-nowrap">
                              {formatToman(product.priceToman, lang)}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={product.stockCount <= 0}
                            onClick={() => handleAddFromTable(product)}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                              isAdded
                                ? 'bg-[#15803D] text-white'
                                : 'bg-[#1D1D1F] hover:bg-black/80 text-white'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>{isFa ? 'به سبد افزوده شد' : 'Added to Bag'}</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>{isFa ? 'افزودن به سبد خرید' : 'Add to Bag'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-black/[0.06]">
                {/* Row 1: Price in Toman & Rial */}
                <tr>
                  <th className="py-3.5 pe-4 text-start font-semibold text-[#6E6E73]">
                    {isFa ? 'قیمت نقدی (تومان / ریال)' : 'Price (Toman & Rial)'}
                  </th>
                  {selectedProducts.map((product) => {
                    const isLowest =
                      lowestPriceToman !== null && product.priceToman === lowestPriceToman;
                    return (
                      <td key={product.id} className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-[#1D1D1F] tabular-nums">
                            {formatToman(product.priceToman, lang)}
                          </span>
                          {isLowest && (
                            <span className="ms-2 text-[11px] font-semibold text-[#15803D]">
                              {isFa ? '(اقتصادی‌ترین)' : '(Lowest Price)'}
                            </span>
                          )}
                          <p className="text-[11px] text-[#6E6E73] tabular-nums">
                            {formatNumber(tomanToRial(product.priceToman), lang)}{' '}
                            {isFa ? 'ریال' : 'IRR'}
                          </p>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Row 2: Stock Status */}
                <tr>
                  <th className="py-3.5 pe-4 text-start font-semibold text-[#6E6E73]">
                    {isFa ? 'وضعیت موجودی انبار' : 'Stock Availability'}
                  </th>
                  {selectedProducts.map((product) => (
                    <td key={product.id} className="py-3.5 px-4 font-medium">
                      {product.stockCount > 0 ? (
                        <span className="text-[#15803D]">
                          {isFa
                            ? `موجود در انبار شرق (${formatNumber(product.stockCount, 'fa')} دستگاه)`
                            : `In Stock (${product.stockCount} units)`}
                        </span>
                      ) : (
                        <span className="text-[#B91C1C]">
                          {isFa ? 'ناموجود' : 'Out of Stock'}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Row 3: Corporate Warranty & Hamta */}
                <tr>
                  <th className="py-3.5 pe-4 text-start font-semibold text-[#6E6E73]">
                    {isFa ? 'گارانتی و رجیستری همتا' : 'Warranty & Hamta Registry'}
                  </th>
                  {selectedProducts.map((product) => (
                    <td key={product.id} className="py-3.5 px-4 text-[#1D1D1F]">
                      {isFa ? product.warrantyFa : product.warrantyEn}
                    </td>
                  ))}
                </tr>

                {/* Row 4: Available Color Finishes */}
                <tr>
                  <th className="py-3.5 pe-4 text-start font-semibold text-[#6E6E73]">
                    {isFa ? 'رنگ‌بندی قابل سفارش' : 'Available Finishes'}
                  </th>
                  {selectedProducts.map((product) => (
                    <td key={product.id} className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {product.colors.map((c) => (
                          <span
                            key={c.hex}
                            className="inline-flex items-center gap-1.5 text-[11px] text-[#1D1D1F]"
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-black/20"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span>{isFa ? c.nameFa : c.nameEn}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Dynamic Technical Specification Rows */}
                {visibleSpecRows.map((row) => (
                  <tr
                    key={row.key}
                    className={row.hasDifference ? 'bg-[#0066CC]/[0.03]' : ''}
                  >
                    <th className="py-3.5 pe-4 text-start font-semibold text-[#6E6E73]">
                      <div className="flex items-center gap-1.5">
                        <span>{isFa ? row.labelFa : row.labelEn}</span>
                        {row.hasDifference && selectedProducts.length > 1 && (
                          <span className="text-[10px] font-normal text-[#0066CC]">
                            {isFa ? '· متفاوت' : '· Differs'}
                          </span>
                        )}
                      </div>
                    </th>
                    {row.values.map((val) => (
                      <td
                        key={val.productId}
                        className="py-3.5 px-4 font-medium text-[#1D1D1F]"
                      >
                        {isFa ? val.valueFa : val.valueEn}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
