'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  Store,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import {
  formatToman,
  formatNumber,
  calculateOrderTotals,
  validateCheckoutForm,
  type Language,
  type CartItem,
  type Product,
  type DeliverySettings,
  type DeliveryMethodId,
  type CheckoutFormInput,
} from '../utils/commerce';

interface CartCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  cart: CartItem[];
  products: Product[];
  deliverySettings: DeliverySettings;
  activeDiscountCode: string;
  activeDiscountPercent: number;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
}

export const CartCheckoutModal: React.FC<CartCheckoutModalProps> = ({
  isOpen,
  onClose,
  lang,
  cart,
  products,
  deliverySettings,
  activeDiscountCode,
  activeDiscountPercent,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const isFa = lang === 'fa';
  const [step, setStep] = useState<'cart' | 'shipping' | 'payment'>('cart');
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscountPercent, setAppliedDiscountPercent] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  const [form, setForm] = useState<CheckoutFormInput>({
    fullName: '',
    mobile: '',
    province: 'Tehran',
    city: '',
    address: '',
    postalCode: '',
    deliveryMethod: 'tehran_peyk',
    paymentGateway: 'zarinpal',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CheckoutFormInput, string>>>({});

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setStep('cart');
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totals = calculateOrderTotals({
    items: cart,
    products,
    deliveryMethod: form.deliveryMethod,
    discountPercent: appliedDiscountPercent,
    settings: deliverySettings,
  });

  const handleApplyCoupon = () => {
    if (couponInput.trim().toUpperCase() === activeDiscountCode.toUpperCase()) {
      setAppliedDiscountPercent(activeDiscountPercent);
      setCouponMessage(
        isFa
          ? `کد تخفیف ${activeDiscountPercent}٪ با موفقیت اعمال شد.`
          : `${activeDiscountPercent}% discount code applied.`
      );
    } else {
      setAppliedDiscountPercent(0);
      setCouponMessage(isFa ? 'کد تخفیف نامعتبر است.' : 'Invalid discount code.');
    }
  };

  const handleProceedToPayment = () => {
    const validation = validateCheckoutForm(form, lang);
    setFormErrors(validation.errors);
    if (validation.valid) {
      setStep('payment');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isFa ? 'سبد خرید و محاسبه هزینه' : 'Shopping Bag & Estimate'}
      onClick={() => {
        setStep('cart');
        onClose();
      }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl h-full flex flex-col justify-between overflow-y-auto shadow-2xl"
      >
        {/* Top Header + Step Indicator */}
        <div className="p-6 border-b border-black/[0.08] sticky top-0 bg-white/95 backdrop-blur-md z-10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1D1D1F]">
              {step === 'cart' && (isFa ? 'سبد خرید شما در پارس‌تک' : 'Your ParsTech Shopping Bag')}
              {step === 'shipping' && (isFa ? 'مرحله ۱ از ۲: مشخصات گیرنده و نحوه ارسال' : 'Step 1 of 2: Delivery & Recipient')}
              {step === 'payment' && (isFa ? 'مرحله ۲ از ۲: وضعیت پرداخت آنلاین' : 'Step 2 of 2: Online Payment Status')}
            </h2>
            <button
              type="button"
              aria-label={isFa ? 'بستن سبد خرید' : 'Close bag'}
              onClick={() => {
                setStep('cart');
                onClose();
              }}
              className="p-2 rounded-full hover:bg-[#F5F5F7] text-[#1D1D1F]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Bar */}
          <div className="grid grid-cols-3 gap-2 text-[11px] font-medium">
            {[
              { id: 'cart', labelFa: '۱. سبد خرید', labelEn: '1. Bag' },
              { id: 'shipping', labelFa: '۲. ارسال', labelEn: '2. Delivery' },
              { id: 'payment', labelFa: '۳. پرداخت', labelEn: '3. Payment' },
            ].map((s) => {
              const isCurrent = step === s.id;
              return (
                <div
                  key={s.id}
                  className={`py-1.5 px-2 rounded-lg text-center border ${
                    isCurrent
                      ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                      : 'bg-[#F5F5F7] text-[#6E6E73] border-transparent'
                  }`}
                >
                  {isFa ? s.labelFa : s.labelEn}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content Body */}
        <div className="p-6 flex-1 space-y-6">
          {step === 'cart' && (
            <>
              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <p className="text-base font-semibold text-[#1D1D1F]">
                    {isFa ? 'سبد خرید شما خالی است.' : 'Your shopping bag is empty.'}
                  </p>
                  <p className="text-xs text-[#6E6E73]">
                    {isFa
                      ? 'از کاتالوگ محصولات، دستگاه مورد نظر خود را به سبد اضافه کنید.'
                      : 'Add hardware from the catalog to calculate totals.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => {
                    const product = products.find((p) => p.id === item.productId);
                    if (!product) return null;
                    const colorObj =
                      product.colors.find((c) => c.hex === item.selectedColorHex) ?? product.colors[0];

                    return (
                      <div
                        key={item.productId}
                        className="p-4 rounded-2xl bg-[#F5F5F7] border border-black/[0.05] flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-[#1D1D1F]">
                            {isFa ? product.nameFa : product.nameEn}
                          </h3>
                          <p className="text-xs text-[#6E6E73]">
                            {isFa ? `رنگ: ${colorObj?.nameFa}` : `Color: ${colorObj?.nameEn}`} ·{' '}
                            {formatToman(product.priceToman, lang)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            aria-label={isFa ? 'کاهش تعداد' : 'Decrease quantity'}
                            onClick={() => onUpdateQuantity(product.id, -1)}
                            className="w-8 h-8 rounded-lg bg-white border border-black/10 flex items-center justify-center hover:bg-black/5"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold tabular-nums">
                            {formatNumber(item.quantity, lang)}
                          </span>
                          <button
                            type="button"
                            aria-label={isFa ? 'افزایش تعداد' : 'Increase quantity'}
                            onClick={() => onUpdateQuantity(product.id, 1)}
                            className="w-8 h-8 rounded-lg bg-white border border-black/10 flex items-center justify-center hover:bg-black/5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={isFa ? 'حذف از سبد' : 'Remove item'}
                            onClick={() => onRemoveItem(product.id)}
                            className="p-2 text-[#B91C1C] hover:bg-[#B91C1C]/10 rounded-lg ms-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Discount Code Input */}
                  <div className="p-4 rounded-2xl bg-[#F5F5F7] space-y-2">
                    <label htmlFor="coupon-code-input" className="block text-xs font-medium text-[#1D1D1F]">
                      {isFa ? 'کد تخفیف' : 'Discount Code'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="coupon-code-input"
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder={isFa ? 'کد تخفیف را وارد کنید' : 'Enter code'}
                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-black/10 text-xs uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 rounded-xl bg-[#1D1D1F] text-white text-xs font-medium whitespace-nowrap"
                      >
                        {isFa ? 'اعمال کد' : 'Apply Code'}
                      </button>
                    </div>
                    {couponMessage && <p className="text-xs text-[#0066CC]">{couponMessage}</p>}
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'shipping' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[#1D1D1F]">
                  {isFa ? 'انتخاب روش تحویل سفارش:' : 'Select Delivery Method:'}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      id: 'pickup' as DeliveryMethodId,
                      enabled: deliverySettings.enableInStorePickup,
                      icon: Store,
                      titleFa: 'تحویل حضوری',
                      titleEn: 'In-Store Pickup',
                      descFa: 'بدون هزینه ارسال (۰ تومان)',
                      descEn: 'Free pickup (0 Toman)',
                    },
                    {
                      id: 'tehran_peyk' as DeliveryMethodId,
                      enabled: deliverySettings.enableTehranPeyk,
                      icon: Truck,
                      titleFa: 'پیک در شهر تهران',
                      titleEn: 'Tehran Courier Delivery',
                      descFa: `هزینه پایه ${formatToman(deliverySettings.tehranPeykBaseToman, lang)}`,
                      descEn: `Base ${formatToman(deliverySettings.tehranPeykBaseToman, lang)}`,
                    },
                    {
                      id: 'iran_post' as DeliveryMethodId,
                      enabled: deliverySettings.enableIranPost,
                      icon: ShieldCheck,
                      titleFa: 'ارسال پستی به شهرستان‌ها',
                      titleEn: 'Nationwide Post Shipping',
                      descFa: `هزینه پایه ${formatToman(deliverySettings.iranPostBaseToman, lang)}`,
                      descEn: `Base ${formatToman(deliverySettings.iranPostBaseToman, lang)}`,
                    },
                  ]
                    .filter((m) => m.enabled)
                    .map((method) => {
                      const Icon = method.icon;
                      const active = form.deliveryMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              deliveryMethod: method.id,
                              province: method.id === 'tehran_peyk' ? 'Tehran' : prev.province,
                            }))
                          }
                          className={`p-4 rounded-2xl border text-start transition-colors flex items-start gap-3.5 ${
                            active
                              ? 'border-[#0066CC] bg-[#0066CC]/[0.04]'
                              : 'border-black/10 bg-white hover:bg-[#F5F5F7]'
                          }`}
                        >
                          <Icon className="w-5 h-5 text-[#0066CC] shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-[#1D1D1F]">
                              {isFa ? method.titleFa : method.titleEn}
                            </p>
                            <p className="text-[11px] text-[#6E6E73]">
                              {isFa ? method.descFa : method.descEn}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                </div>
                {formErrors.deliveryMethod && (
                  <p className="text-xs text-[#B91C1C]">{formErrors.deliveryMethod}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="chk-fullname" className="block text-xs font-medium text-[#1D1D1F] mb-1">
                    {isFa ? 'نام و نام خانوادگی گیرنده' : 'Recipient Full Name'}
                  </label>
                  <input
                    id="chk-fullname"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/10 text-xs"
                  />
                  {formErrors.fullName && <p className="text-[11px] text-[#B91C1C] mt-1">{formErrors.fullName}</p>}
                </div>

                <div>
                  <label htmlFor="chk-mobile" className="block text-xs font-medium text-[#1D1D1F] mb-1">
                    {isFa ? 'شماره موبایل' : 'Iranian Mobile Number (09xxxxxxxxx)'}
                  </label>
                  <input
                    id="chk-mobile"
                    type="tel"
                    dir="ltr"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/10 text-xs tabular-nums"
                  />
                  {formErrors.mobile && <p className="text-[11px] text-[#B91C1C] mt-1">{formErrors.mobile}</p>}
                </div>

                {form.deliveryMethod !== 'pickup' && (
                  <>
                    <div>
                      <label htmlFor="chk-province" className="block text-xs font-medium text-[#1D1D1F] mb-1">
                        {isFa ? 'استان' : 'Province'}
                      </label>
                      <select
                        id="chk-province"
                        value={form.province}
                        onChange={(e) => setForm({ ...form, province: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/10 text-xs"
                      >
                        <option value="Tehran">{isFa ? 'تهران (Tehran)' : 'Tehran'}</option>
                        <option value="Isfahan">{isFa ? 'اصفهان (Isfahan)' : 'Isfahan'}</option>
                        <option value="Fars">{isFa ? 'فارس - شیراز (Fars)' : 'Fars (Shiraz)'}</option>
                        <option value="Khorasan">{isFa ? 'خراسان رضوی - مشهد' : 'Khorasan Razavi (Mashhad)'}</option>
                        <option value="EastAzerbaijan">{isFa ? 'آذربایجان شرقی - تبریز' : 'East Azerbaijan (Tabriz)'}</option>
                        <option value="Alborz">{isFa ? 'البرز - کرج' : 'Alborz (Karaj)'}</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="chk-postal" className="block text-xs font-medium text-[#1D1D1F] mb-1">
                        {isFa ? 'کد پستی ۱۰ رقمی' : '10-Digit Postal Code'}
                      </label>
                      <input
                        id="chk-postal"
                        type="text"
                        dir="ltr"
                        maxLength={10}
                        value={form.postalCode}
                        onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/10 text-xs tabular-nums"
                      />
                      {formErrors.postalCode && (
                        <p className="text-[11px] text-[#B91C1C] mt-1">{formErrors.postalCode}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="chk-address" className="block text-xs font-medium text-[#1D1D1F] mb-1">
                        {isFa ? 'نشانی دقیق پستی' : 'Complete Street Address'}
                      </label>
                      <textarea
                        id="chk-address"
                        rows={2}
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-black/10 text-xs"
                      />
                      {formErrors.address && <p className="text-[11px] text-[#B91C1C] mt-1">{formErrors.address}</p>}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-4">
              <div
                role="alert"
                className="p-5 rounded-2xl bg-[#FFFBEB] border border-[#F59E0B]/40 space-y-2.5 text-xs text-[#1D1D1F]"
              >
                <div className="flex items-center gap-2 font-bold text-[#B45309] text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>
                    {isFa
                      ? 'پرداخت آنلاین در حال حاضر فعال نیست'
                      : 'Online Payment Is Not Enabled Yet'}
                  </span>
                </div>
                <p className="leading-relaxed text-[#515154]">
                  {isFa
                    ? 'در فاز اول سامانه پارس‌تک، اتصال به درگاه پرداخت آنلاین بانکی و صدور رسید تراکنش غیرفعال است. محاسبه قیمت سبد خرید و هزینه ارسال صرفاً جهت برآورد پیش‌فاکتور انجام می‌شود.'
                    : 'Online payment processing and transaction receipts are not enabled in Phase 1. Your bag total and shipping estimate are calculated for preview only.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom Summary & Action Footer */}
        <div className="p-6 border-t border-black/[0.08] bg-[#FBFBFD] space-y-4">
          {cart.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#6E6E73]">
                <span>{isFa ? 'جمع اقلام سبد:' : 'Items Subtotal:'}</span>
                <span className="tabular-nums">{formatToman(totals.subtotalToman, lang)}</span>
              </div>
              {totals.discountToman > 0 && (
                <div className="flex justify-between text-[#15803D]">
                  <span>{isFa ? 'تخفیف اعمال‌شده:' : 'Discount:'}</span>
                  <span className="tabular-nums">- {formatToman(totals.discountToman, lang)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#6E6E73]">
                <span>{isFa ? 'برآورد هزینه ارسال:' : 'Estimated Shipping:'}</span>
                <span className="tabular-nums">
                  {totals.shippingToman === 0
                    ? isFa
                      ? 'رایگان'
                      : 'Free'
                    : formatToman(totals.shippingToman, lang)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#1D1D1F] pt-2 border-t border-black/[0.06]">
                <span>{isFa ? 'جمع کل برآوردی:' : 'Estimated Total:'}</span>
                <div className="text-end">
                  <p className="tabular-nums text-[#0066CC]">{formatToman(totals.payableToman, lang)}</p>
                  <p className="text-[11px] font-normal text-[#6E6E73] tabular-nums">
                    {formatNumber(totals.payableRial, lang)} {isFa ? 'ریال' : 'IRR'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            {step === 'shipping' && (
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="px-4 py-3 rounded-xl bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold"
              >
                {isFa ? 'بازگشت به سبد' : 'Back to Bag'}
              </button>
            )}
            {step === 'payment' && (
              <button
                type="button"
                onClick={() => setStep('shipping')}
                className="px-4 py-3 rounded-xl bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold"
              >
                {isFa ? 'بازگشت به اطلاعات ارسال' : 'Back to Delivery'}
              </button>
            )}

            {step === 'cart' && cart.length > 0 && (
              <button
                type="button"
                onClick={() => setStep('shipping')}
                className="w-full py-3.5 px-6 rounded-xl bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold flex items-center justify-center gap-2"
              >
                <span>{isFa ? 'ادامه جهت محاسبه هزینه ارسال' : 'Proceed to Delivery Estimate'}</span>
                {isFa ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            )}

            {step === 'shipping' && (
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="flex-1 py-3.5 px-6 rounded-xl bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold flex items-center justify-center gap-2"
              >
                <span>{isFa ? 'بررسی مرحله پرداخت' : 'Continue to Payment Step'}</span>
              </button>
            )}

            {step === 'payment' && (
              <button
                type="button"
                disabled
                className="flex-1 py-3.5 px-6 rounded-xl bg-black/15 text-[#6E6E73] text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>
                  {isFa
                    ? 'پرداخت آنلاین فعال نیست (غیرفعال در فاز اول)'
                    : 'Online Payment Not Enabled Yet'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
