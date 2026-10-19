import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  Store,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import {
  formatToman,
  formatNumber,
  formatJalaliDate,
  calculateOrderTotals,
  validateCheckoutForm,
  type Language,
  type CartItem,
  type Product,
  type DeliverySettings,
  type DeliveryMethodId,
  type PaymentGatewayId,
  type CheckoutFormInput,
} from '../utils/commerce';
import type { GatewayConfig, OrderRecord } from '../data/storeData';

interface CartCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  cart: CartItem[];
  products: Product[];
  deliverySettings: DeliverySettings;
  gateways: GatewayConfig[];
  activeDiscountCode: string;
  activeDiscountPercent: number;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCompleteOrder: (order: OrderRecord) => void;
}

export const CartCheckoutModal: React.FC<CartCheckoutModalProps> = ({
  isOpen,
  onClose,
  lang,
  cart,
  products,
  deliverySettings,
  gateways,
  activeDiscountCode,
  activeDiscountPercent,
  onUpdateQuantity,
  onRemoveItem,
  onCompleteOrder,
}) => {
  const isFa = lang === 'fa';
  const [step, setStep] = useState<'cart' | 'shipping' | 'payment' | 'receipt'>('cart');
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscountPercent, setAppliedDiscountPercent] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  const [form, setForm] = useState<CheckoutFormInput>({
    fullName: 'سارا محمدی',
    mobile: '09123456789',
    province: 'Tehran',
    city: 'تهران',
    address: 'بزرگراه رسالت، خیابان آیت شمالی، کوچه بهار، پلاک ۱۸، واحد ۴',
    postalCode: '1651789431',
    deliveryMethod: 'tehran_peyk',
    paymentGateway: 'zarinpal',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CheckoutFormInput, string>>>({});
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

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
      setCouponMessage(isFa ? 'کد تخفیف نامعتبر است. (کد نمونه: PARS5)' : 'Invalid code. Try PARS5.');
    }
  };

  const handleProceedToPayment = () => {
    const validation = validateCheckoutForm(form, lang);
    setFormErrors(validation.errors);
    if (validation.valid) {
      setStep('payment');
    }
  };

  const handleFinalizeOrder = () => {
    const todayIso = '2026-10-19';
    const randNum = Math.floor(1000 + Math.random() * 8999);
    const newOrder: OrderRecord = {
      id: `ord-${randNum}`,
      orderNumber: `PT-1405-${randNum}`,
      createdAtIso: todayIso,
      customerName: form.fullName,
      customerMobile: form.mobile,
      province: form.deliveryMethod === 'pickup' ? 'Tehran' : form.province,
      city: form.deliveryMethod === 'pickup' ? 'تهران (شعبه مرکز موبایل شرق)' : form.city,
      address:
        form.deliveryMethod === 'pickup'
          ? 'تحویل حضوری در مرکز موبایل شرق، طبقه همکف، واحد B24'
          : form.address,
      postalCode: form.deliveryMethod === 'pickup' ? '1651700000' : form.postalCode,
      deliveryMethod: form.deliveryMethod,
      paymentGateway: form.paymentGateway,
      paymentRefId:
        form.paymentGateway === 'cod'
          ? `POS-PENDING-${randNum}`
          : `${form.paymentGateway.toUpperCase()}-${Math.floor(100000000 + Math.random() * 900000000)}`,
      trackingCode:
        form.deliveryMethod === 'pickup'
          ? `PICKUP-B24-${randNum}`
          : form.deliveryMethod === 'tehran_peyk'
            ? `PEYK-TEH-${randNum}`
            : `POST-IR-${randNum}991`,
      status: form.paymentGateway === 'cod' ? 'processing' : 'processing',
      subtotalToman: totals.subtotalToman,
      discountToman: totals.discountToman,
      shippingToman: totals.shippingToman,
      payableToman: totals.payableToman,
      items: cart
        .map((c) => {
          const prod = products.find((p) => p.id === c.productId);
          if (!prod) return null;
          const colorObj = prod.colors.find((col) => col.hex === c.selectedColorHex) ?? prod.colors[0];
          return {
            productId: prod.id,
            nameFa: prod.nameFa,
            nameEn: prod.nameEn,
            quantity: c.quantity,
            unitPriceToman: prod.priceToman,
            colorNameFa: colorObj?.nameFa ?? 'استاندارد',
            colorNameEn: colorObj?.nameEn ?? 'Standard',
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    };

    setConfirmedOrder(newOrder);
    onCompleteOrder(newOrder);
    setStep('receipt');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isFa ? 'سبد خرید و تسویه حساب' : 'Shopping Bag & Checkout'}
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
              {step === 'payment' && (isFa ? 'مرحله ۲ از ۲: انتخاب درگاه پرداخت شاپرک' : 'Step 2 of 2: Iranian Payment Gateway')}
              {step === 'receipt' && (isFa ? 'تأیید نهایی سفارش و رسید شاپرک' : 'Order Confirmed & Official Receipt')}
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
          <div className="grid grid-cols-4 gap-2 text-[11px] font-medium">
            {[
              { id: 'cart', labelFa: '۱. سبد خرید', labelEn: '1. Bag' },
              { id: 'shipping', labelFa: '۲. ارسال', labelEn: '2. Delivery' },
              { id: 'payment', labelFa: '۳. پرداخت', labelEn: '3. Payment' },
              { id: 'receipt', labelFa: '۴. فاکتور', labelEn: '4. Receipt' },
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
                      ? 'از کاتالوگ محصولات، گوشی، لپ‌تاپ یا کنسول مورد نظر خود را به سبد اضافه کنید.'
                      : 'Add an iPhone, MacBook, or PlayStation from the catalog to begin checkout.'}
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
                      {isFa ? 'کد تخفیف (کد نمونه: PARS5)' : 'Promo / Discount Code (Try: PARS5)'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="coupon-code-input"
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="PARS5"
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
              {/* Delivery Method Selector with Live Cost Calculation */}
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
                      titleFa: 'تحویل حضوری در شعبه مرکز موبایل شرق تهران (واحد B24)',
                      titleEn: 'In-Store Pickup at East Mobile Center (Tehran, Unit B24)',
                      descFa: 'آماده تحویل ۱ ساعته · تست فیزیکی و فعال‌سازی رایگان کد همتا در حضور شما',
                      descEn: 'Ready in 1 hour · Free on-site Hamta IMEI activation · Free (0 Toman)',
                    },
                    {
                      id: 'tehran_peyk' as DeliveryMethodId,
                      enabled: deliverySettings.enableTehranPeyk,
                      icon: Truck,
                      titleFa: 'پیک اختصاصی ۳ ساعته در شهر تهران',
                      titleEn: 'Same-Day Express Courier (Tehran Only — Under 3 Hours)',
                      descFa: `هزینه پایه ${formatToman(deliverySettings.tehranPeykBaseToman, lang)} · رایگان برای خرید بالای ۲۵ میلیون تومان`,
                      descEn: `Base ${formatToman(deliverySettings.tehranPeykBaseToman, lang)} · Free over 25M Toman`,
                    },
                    {
                      id: 'iran_post' as DeliveryMethodId,
                      enabled: deliverySettings.enableIranPost,
                      icon: ShieldCheck,
                      titleFa: 'ارسال بیمه‌شده پست پیشتاز / تیپاکس به سراسر ایران',
                      titleEn: 'Insured Nationwide Shipping (Pishtaz Post / Tipax across Iran)',
                      descFa: `بیمه کامل سرقت و شکستگی · تحویل ۲۴ تا ۷۲ ساعته به تمام شهرها`,
                      descEn: `Full transit insurance · 24–72h nationwide delivery`,
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

              {/* Customer & Address Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="chk-fullname" className="block text-xs font-medium text-[#1D1D1F] mb-1">
                    {isFa ? 'نام و نام خانوادگی گیرنده (مطابق کارت ملی)' : 'Recipient Full Name'}
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
                    {isFa ? 'شماره موبایل (جهت پیامک همتا و رهگیری)' : 'Iranian Mobile Number (09xxxxxxxxx)'}
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
                        {isFa ? 'نشانی دقیق پستی، پلاک و واحد' : 'Complete Street Address, Plaque & Unit'}
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
              <p className="text-xs text-[#6E6E73]">
                {isFa
                  ? 'درگاه پرداخت مورد نظر خود را انتخاب کنید. تمامی درگاه‌های آنلاین متصل به شبکه شاپرک بانک مرکزی هستند:'
                  : 'Select your preferred Iranian payment option (connected to Central Bank Shaparak network):'}
              </p>

              <div className="space-y-3">
                {gateways
                  .filter((g) => g.enabled)
                  .map((gw) => {
                    const active = form.paymentGateway === gw.id;
                    return (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => setForm({ ...form, paymentGateway: gw.id })}
                        className={`w-full p-4 rounded-2xl border text-start transition-colors flex items-start gap-3.5 ${
                          active
                            ? 'border-[#0066CC] bg-[#0066CC]/[0.04]'
                            : 'border-black/10 bg-white hover:bg-[#F5F5F7]'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-[#0066CC] shrink-0 mt-0.5" />
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#1D1D1F]">
                              {isFa ? gw.nameFa : gw.nameEn}
                            </span>
                            <span className="text-[11px] font-mono text-[#6E6E73]">{gw.id.toUpperCase()}</span>
                          </div>
                          <p className="text-[11px] text-[#1D1D1F] font-medium">
                            {isFa ? gw.typeFa : gw.typeEn}
                          </p>
                          <p className="text-[11px] text-[#6E6E73]">
                            {isFa ? gw.descriptionFa : gw.descriptionEn}
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {step === 'receipt' && confirmedOrder && (
            <div className="bg-[#F5F5F7] rounded-2xl p-6 space-y-5 border border-black/[0.06]">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-[#15803D] shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-[#1D1D1F]">
                    {isFa
                      ? `سفارش ${confirmedOrder.orderNumber} با موفقیت ثبت شد`
                      : `Order ${confirmedOrder.orderNumber} Confirmed`}
                  </h3>
                  <p className="text-xs text-[#6E6E73]">
                    {isFa
                      ? `تاریخ ثبت: ${formatJalaliDate(confirmedOrder.createdAtIso, 'fa')}`
                      : `Date: ${formatJalaliDate(confirmedOrder.createdAtIso, 'en')}`}
                  </p>
                </div>
              </div>

              <dl className="divide-y divide-black/[0.06] text-xs border-t border-b border-black/[0.06]">
                <div className="py-2.5 flex justify-between">
                  <dt className="text-[#6E6E73]">{isFa ? 'کد رهگیری مرسوله:' : 'Shipment Tracking Code:'}</dt>
                  <dd className="font-mono font-bold text-[#1D1D1F]">{confirmedOrder.trackingCode}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-[#6E6E73]">{isFa ? 'شماره مرجع شاپرک / پرداخت:' : 'Shaparak / POS Ref ID:'}</dt>
                  <dd className="font-mono text-[#1D1D1F]">{confirmedOrder.paymentRefId}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-[#6E6E73]">{isFa ? 'تحویل‌گیرنده:' : 'Recipient:'}</dt>
                  <dd className="font-medium text-[#1D1D1F]">
                    {confirmedOrder.customerName} ({confirmedOrder.customerMobile})
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-[#6E6E73]">{isFa ? 'مبلغ کل تسویه‌شده:' : 'Total Paid:'}</dt>
                  <dd className="font-bold text-[#0066CC] tabular-nums">
                    {formatToman(confirmedOrder.payableToman, lang)}
                  </dd>
                </div>
              </dl>

              <p className="text-xs text-[#515154] leading-relaxed">
                {isFa
                  ? 'پیامک حاوی کد رهگیری و لینک فاکتور رسمی به شماره همراه شما ارسال شد. همچنین می‌توانید در بخش «حساب کاربری» وضعیت لحظه‌ای سفارش را دنبال کنید.'
                  : 'An SMS with your tracking code and official invoice has been dispatched. You can track this order anytime in the Customer Account view.'}
              </p>
            </div>
          )}
        </div>

        {/* Sticky Bottom Summary & Action Footer */}
        <div className="p-6 border-t border-black/[0.08] bg-[#FBFBFD] space-y-4">
          {step !== 'receipt' && cart.length > 0 && (
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
                <span>{isFa ? 'هزینه ارسال و بسته‌بندی بیمه‌شده:' : 'Shipping & Insurance:'}</span>
                <span className="tabular-nums">
                  {totals.shippingToman === 0
                    ? isFa
                      ? 'رایگان'
                      : 'Free'
                    : formatToman(totals.shippingToman, lang)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#1D1D1F] pt-2 border-t border-black/[0.06]">
                <span>{isFa ? 'مبلغ قابل پرداخت:' : 'Total Payable:'}</span>
                <div className="text-end">
                  <p className="tabular-nums text-[#0066CC]">{formatToman(totals.payableToman, lang)}</p>
                  <p className="text-[11px] font-normal text-[#6E6E73] tabular-nums">
                    {formatNumber(totals.payableRial, lang)} {isFa ? 'ریال در درگاه بانکی' : 'Rial (Shaparak IPG)'}
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
                {isFa ? 'ویرایش آدرس' : 'Edit Shipping'}
              </button>
            )}

            {step === 'cart' && cart.length > 0 && (
              <button
                type="button"
                onClick={() => setStep('shipping')}
                className="w-full py-3.5 px-6 rounded-xl bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold flex items-center justify-center gap-2"
              >
                <span>{isFa ? 'ادامه جهت ثبت آدرس و نحوه ارسال' : 'Proceed to Delivery Options'}</span>
                {isFa ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            )}

            {step === 'shipping' && (
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="flex-1 py-3.5 px-6 rounded-xl bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold flex items-center justify-center gap-2"
              >
                <span>{isFa ? 'تأیید اطلاعات و انتخاب درگاه پرداخت' : 'Continue to Payment Gateway'}</span>
              </button>
            )}

            {step === 'payment' && (
              <button
                type="button"
                onClick={handleFinalizeOrder}
                className="flex-1 py-3.5 px-6 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold flex items-center justify-center gap-2"
              >
                <span>
                  {isFa
                    ? `پرداخت امن و ثبت نهایی سفارش (${formatToman(totals.payableToman, lang)})`
                    : `Complete Order (${formatToman(totals.payableToman, lang)})`}
                </span>
              </button>
            )}

            {step === 'receipt' && (
              <button
                type="button"
                onClick={() => {
                  setStep('cart');
                  onClose();
                }}
                className="w-full py-3.5 px-6 rounded-xl bg-[#1D1D1F] text-white text-xs font-semibold"
              >
                {isFa ? 'بستن و بازگشت به فروشگاه' : 'Done & Return to Store'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
