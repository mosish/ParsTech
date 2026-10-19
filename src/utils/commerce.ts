export type Language = 'fa' | 'en';
export type CategoryId = 'all' | 'mobiles' | 'laptops' | 'consoles' | 'accessories';
export type DeliveryMethodId = 'pickup' | 'tehran_peyk' | 'iran_post';
export type PaymentGatewayId = 'zarinpal' | 'mellat' | 'idpay' | 'cod';
export type AdminRole = 'owner' | 'staff';
export type OrderStatus = 'pending_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface ProductSpec {
  labelFa: string;
  labelEn: string;
  valueFa: string;
  valueEn: string;
}

export interface Product {
  id: string;
  sku: string;
  category: Exclude<CategoryId, 'all'>;
  brand: 'Apple' | 'Samsung' | 'Sony' | 'Microsoft' | 'ASUS' | 'Xiaomi' | 'Anker';
  nameFa: string;
  nameEn: string;
  subtitleFa: string;
  subtitleEn: string;
  priceToman: number;
  originalPriceToman?: number;
  stockCount: number;
  warrantyFa: string;
  warrantyEn: string;
  colors: { nameFa: string; nameEn: string; hex: string }[];
  artworkKey:
    | 'iphone16pro'
    | 'iphone_dual'
    | 's25ultra'
    | 'galaxy_a'
    | 'galaxy_fold'
    | 'macbookprom4'
    | 'rogzephyrus'
    | 'ps5pro'
    | 'xboxseriesx'
    | 'airpodsmax'
    | 'watchultra2'
    | 'ankercharger';
  seriesTag?: 'ip17' | 'ip16' | 'ip15' | 'ip14' | 'ip13' | 'samsung_a' | 'samsung_sz';
  featured?: boolean;
  isHeavyItem?: boolean;
  specs: ProductSpec[];
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedColorHex: string;
}

export interface DeliverySettings {
  tehranPeykBaseToman: number;
  tehranFreeThresholdToman: number;
  iranPostBaseToman: number;
  iranPostHeavySurchargeToman: number;
  iranPostFreeThresholdToman: number;
  enableInStorePickup: boolean;
  enableTehranPeyk: boolean;
  enableIranPost: boolean;
}

export interface CheckoutFormInput {
  fullName: string;
  mobile: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  deliveryMethod: DeliveryMethodId;
  paymentGateway: PaymentGatewayId;
  notes?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof CheckoutFormInput, string>>;
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Converts ASCII digits in a string or number to Persian digits.
 */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

/**
 * Converts Persian/Arabic digits in user input to standard ASCII digits.
 */
export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/**
 * Converts Toman amount to Rial (1 Toman = 10 Rials) for Iranian IPG (Shaparak) payloads.
 */
export function tomanToRial(toman: number): number {
  return Math.round(toman * 10);
}

/**
 * Formats a Toman price with comma separators and localized unit label.
 */
export function formatToman(amount: number, lang: Language = 'fa'): string {
  const formatted = Math.max(0, Math.round(amount)).toLocaleString('en-US');
  if (lang === 'fa') {
    return `${toPersianDigits(formatted)} تومان`;
  }
  return `${formatted} Toman`;
}

/**
 * Formats any integer count according to the active language.
 */
export function formatNumber(num: number, lang: Language = 'fa'): string {
  const formatted = num.toLocaleString('en-US');
  return lang === 'fa' ? toPersianDigits(formatted) : formatted;
}

/**
 * Converts a Gregorian Date (year, month 1-12, day 1-31) to Jalali (Shamsi) [jy, jm, jd].
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    (g_d_m[gm - 1] ?? 0);
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

const JALALI_MONTHS_FA = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const JALALI_MONTHS_EN = [
  'Farvardin',
  'Ordibehesht',
  'Khordad',
  'Tir',
  'Mordad',
  'Shahrivar',
  'Mehr',
  'Aban',
  'Azar',
  'Dey',
  'Bahman',
  'Esfand',
];

/**
 * Formats an ISO date string (YYYY-MM-DD) into a human-readable Jalali date.
 */
export function formatJalaliDate(isoDate: string, lang: Language = 'fa'): string {
  const parts = isoDate.split('T')[0].split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return isoDate;
  }
  const [gy, gm, gd] = parts;
  const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
  if (lang === 'fa') {
    const monthName = JALALI_MONTHS_FA[jm - 1] ?? '';
    return `${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
  }
  const monthName = JALALI_MONTHS_EN[jm - 1] ?? '';
  return `${jd} ${monthName} ${jy} (${isoDate.split('T')[0]})`;
}

/**
 * Calculates delivery cost in Toman based on delivery option, cart subtotal, heavy item status, and admin settings.
 */
export function calculateShippingCost(params: {
  method: DeliveryMethodId;
  subtotalToman: number;
  hasHeavyItem: boolean;
  settings: DeliverySettings;
}): number {
  const { method, subtotalToman, hasHeavyItem, settings } = params;
  if (subtotalToman <= 0) return 0;

  if (method === 'pickup') {
    return 0;
  }

  if (method === 'tehran_peyk') {
    if (subtotalToman >= settings.tehranFreeThresholdToman) {
      return 0;
    }
    return settings.tehranPeykBaseToman;
  }

  // iran_post (Nationwide Pishtaz / Tipax)
  if (subtotalToman >= settings.iranPostFreeThresholdToman) {
    return 0;
  }
  const surcharge = hasHeavyItem ? settings.iranPostHeavySurchargeToman : 0;
  return settings.iranPostBaseToman + surcharge;
}

/**
 * Calculates cart totals (subtotal, discount, shipping, Rial equivalent, and grand total).
 */
export function calculateOrderTotals(params: {
  items: CartItem[];
  products: Product[];
  deliveryMethod: DeliveryMethodId;
  discountPercent?: number;
  settings: DeliverySettings;
}): {
  subtotalToman: number;
  discountToman: number;
  shippingToman: number;
  payableToman: number;
  payableRial: number;
  itemCount: number;
  hasHeavyItem: boolean;
} {
  const { items, products, deliveryMethod, discountPercent = 0, settings } = params;
  let subtotalToman = 0;
  let itemCount = 0;
  let hasHeavyItem = false;

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product || item.quantity <= 0) continue;
    subtotalToman += product.priceToman * item.quantity;
    itemCount += item.quantity;
    if (product.isHeavyItem || product.category === 'laptops' || product.category === 'consoles') {
      hasHeavyItem = true;
    }
  }

  const clampedDiscount = Math.max(0, Math.min(50, discountPercent));
  const discountToman = Math.round((subtotalToman * clampedDiscount) / 100);
  const discountedSubtotal = Math.max(0, subtotalToman - discountToman);

  const shippingToman = calculateShippingCost({
    method: deliveryMethod,
    subtotalToman: discountedSubtotal,
    hasHeavyItem,
    settings,
  });

  const payableToman = discountedSubtotal + shippingToman;
  const payableRial = tomanToRial(payableToman);

  return {
    subtotalToman,
    discountToman,
    shippingToman,
    payableToman,
    payableRial,
    itemCount,
    hasHeavyItem,
  };
}

/**
 * Validates checkout customer and shipping fields according to Iranian e-commerce norms.
 */
export function validateCheckoutForm(input: CheckoutFormInput, lang: Language = 'fa'): ValidationResult {
  const errors: Partial<Record<keyof CheckoutFormInput, string>> = {};
  const normalizedMobile = toEnglishDigits(input.mobile.trim()).replace(/[\s-]/g, '');
  const normalizedPostal = toEnglishDigits(input.postalCode.trim()).replace(/[\s-]/g, '');

  if (input.fullName.trim().length < 3) {
    errors.fullName =
      lang === 'fa' ? 'لطفاً نام و نام خانوادگی کامل را وارد کنید.' : 'Please enter your full name (at least 3 characters).';
  }

  if (!/^09\d{9}$/.test(normalizedMobile)) {
    errors.mobile =
      lang === 'fa'
        ? 'شماره موبایل معتبر ۱۱ رقمی (شروع با ۰۹) وارد کنید.'
        : 'Enter a valid 11-digit Iranian mobile number starting with 09.';
  }

  if (input.deliveryMethod !== 'pickup') {
    if (!input.province.trim()) {
      errors.province = lang === 'fa' ? 'انتخاب استان الزامی است.' : 'Province is required.';
    }
    if (!input.city.trim()) {
      errors.city = lang === 'fa' ? 'وارد کردن شهر الزامی است.' : 'City is required.';
    }
    if (input.address.trim().length < 10) {
      errors.address =
        lang === 'fa'
          ? 'نشانی دقیق پستی (حداقل ۱۰ کاراکتر) را وارد کنید.'
          : 'Please enter a complete street address (at least 10 characters).';
    }
    if (!/^\d{10}$/.test(normalizedPostal)) {
      errors.postalCode =
        lang === 'fa' ? 'کد پستی ۱۰ رقمی معتبر بدون خط تیره وارد کنید.' : 'Enter a valid 10-digit Iranian postal code.';
    }
  }

  if (input.deliveryMethod === 'tehran_peyk' && input.province !== 'Tehran' && input.province !== 'تهران') {
    errors.deliveryMethod =
      lang === 'fa'
        ? 'ارسال فوری با پیک فقط برای استان تهران فعال است.'
        : 'Same-day courier delivery is only available within Tehran province.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Filters and sorts catalog products based on search query, category, brand, max price, and stock filter.
 */
export function filterAndSortProducts(params: {
  products: Product[];
  category: CategoryId;
  brand: string;
  searchQuery: string;
  onlyInStock: boolean;
  maxPriceToman?: number;
  sortBy: 'featured' | 'price_asc' | 'price_desc' | 'stock';
}): Product[] {
  const { products, category, brand, searchQuery, onlyInStock, maxPriceToman, sortBy } = params;
  const q = toEnglishDigits(searchQuery.trim().toLowerCase());

  const filtered = products.filter((p) => {
    if (category !== 'all' && p.category !== category) return false;
    if (brand !== 'all' && p.brand !== brand) return false;
    if (onlyInStock && p.stockCount <= 0) return false;
    if (typeof maxPriceToman === 'number' && maxPriceToman > 0 && p.priceToman > maxPriceToman) return false;
    if (q) {
      const hay = `${p.nameFa} ${p.nameEn} ${p.subtitleFa} ${p.subtitleEn} ${p.brand} ${p.sku}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (sortBy === 'price_asc') return a.priceToman - b.priceToman;
    if (sortBy === 'price_desc') return b.priceToman - a.priceToman;
    if (sortBy === 'stock') return b.stockCount - a.stockCount;
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });
}

/**
 * Role-based access control check for admin actions (Owner vs Staff).
 */
export function canPerformAdminAction(
  role: AdminRole,
  action:
    | 'edit_product'
    | 'update_order'
    | 'delete_product'
    | 'manage_gateways'
    | 'manage_roles'
    | 'moderate_reviews'
): boolean {
  if (role === 'owner') return true;
  // Staff can edit products/stock, update order status, and moderate customer reviews, but cannot delete products or change gateways/roles
  return (
    action === 'edit_product' ||
    action === 'update_order' ||
    action === 'moderate_reviews'
  );
}

export interface ProductReview {
  id: string;
  productId: string;
  authorName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAtIso: string;
  verifiedBuyer: boolean;
  approved: boolean;
}

export interface ReviewFormInput {
  authorName: string;
  rating: number;
  comment: string;
}

/**
 * Validates customer review submission (author name, 1-5 star rating, and written review text).
 */
export function validateReviewInput(
  input: ReviewFormInput,
  lang: Language = 'fa'
): { valid: boolean; errors: Partial<Record<keyof ReviewFormInput, string>> } {
  const errors: Partial<Record<keyof ReviewFormInput, string>> = {};

  if (input.authorName.trim().length < 2) {
    errors.authorName =
      lang === 'fa'
        ? 'لطفاً نام خود را وارد کنید (حداقل ۲ حرف).'
        : 'Please enter your name (at least 2 characters).';
  }

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    errors.rating =
      lang === 'fa'
        ? 'امتیاز باید عددی بین ۱ تا ۵ ستاره باشد.'
        : 'Rating must be between 1 and 5 stars.';
  }

  if (input.comment.trim().length < 10) {
    errors.comment =
      lang === 'fa'
        ? 'لطفاً متن دیدگاه خود را کامل‌تر بنویسید (حداقل ۱۰ کاراکتر).'
        : 'Please write a detailed review (at least 10 characters).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Computes average rating, approved count, pending count, and 1-5 star breakdown for a product.
 */
export function calculateProductRatingSummary(
  reviews: ProductReview[],
  productId: string
): {
  averageRating: number;
  approvedCount: number;
  pendingCount: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
} {
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  const productReviews = reviews.filter((r) => r.productId === productId);
  const approvedReviews = productReviews.filter((r) => r.approved);
  const pendingCount = productReviews.length - approvedReviews.length;

  if (approvedReviews.length === 0) {
    return {
      averageRating: 0,
      approvedCount: 0,
      pendingCount,
      distribution,
    };
  }

  let sum = 0;
  for (const r of approvedReviews) {
    const clamped = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[clamped] += 1;
    sum += clamped;
  }

  const averageRating = Math.round((sum / approvedReviews.length) * 10) / 10;

  return {
    averageRating,
    approvedCount: approvedReviews.length,
    pendingCount,
    distribution,
  };
}

/**
 * Toggles the display approval state of a specific review by ID.
 */
export function toggleReviewApproval(
  reviews: ProductReview[],
  reviewId: string,
  approved: boolean
): ProductReview[] {
  return reviews.map((rev) => (rev.id === reviewId ? { ...rev, approved } : rev));
}

export interface ComparisonSpecRow {
  key: string;
  labelFa: string;
  labelEn: string;
  values: { productId: string; valueFa: string; valueEn: string }[];
  hasDifference: boolean;
}

/**
 * Toggles a product ID in the comparison list while strictly enforcing a maximum of 3 items.
 */
export function toggleCompareProduct(
  currentIds: string[],
  productId: string,
  maxItems = 3
): { nextIds: string[]; limitReached: boolean } {
  if (currentIds.includes(productId)) {
    return {
      nextIds: currentIds.filter((id) => id !== productId),
      limitReached: false,
    };
  }
  if (currentIds.length >= maxItems) {
    return {
      nextIds: currentIds,
      limitReached: true,
    };
  }
  return {
    nextIds: [...currentIds, productId],
    limitReached: false,
  };
}

/**
 * Builds a unified side-by-side specification table matrix for up to 3 selected products.
 */
export function buildComparisonRows(selectedProducts: Product[]): ComparisonSpecRow[] {
  if (selectedProducts.length === 0) return [];

  const specKeysOrder: { labelFa: string; labelEn: string }[] = [];
  const seenEn = new Set<string>();

  for (const product of selectedProducts) {
    for (const spec of product.specs) {
      const normalizedKey = spec.labelEn.trim().toLowerCase();
      if (!seenEn.has(normalizedKey)) {
        seenEn.add(normalizedKey);
        specKeysOrder.push({ labelFa: spec.labelFa, labelEn: spec.labelEn });
      }
    }
  }

  return specKeysOrder.map((specMeta) => {
    const values = selectedProducts.map((product) => {
      const found = product.specs.find(
        (s) =>
          s.labelEn.trim().toLowerCase() === specMeta.labelEn.trim().toLowerCase() ||
          s.labelFa.trim() === specMeta.labelFa.trim()
      );
      return {
        productId: product.id,
        valueFa: found ? found.valueFa : '—',
        valueEn: found ? found.valueEn : '—',
      };
    });

    const uniqueValuesEn = new Set(values.map((v) => v.valueEn));
    const hasDifference = selectedProducts.length > 1 && uniqueValuesEn.size > 1;

    return {
      key: specMeta.labelEn,
      labelFa: specMeta.labelFa,
      labelEn: specMeta.labelEn,
      values,
      hasDifference,
    };
  });
}

export type TrackingStepState = 'completed' | 'current' | 'upcoming' | 'cancelled';

export interface OrderTrackingStep {
  id: Exclude<OrderStatus, 'cancelled'>;
  stepNumber: number;
  labelFa: string;
  labelEn: string;
  descFa: string;
  descEn: string;
  state: TrackingStepState;
}

export interface OrderTrackingOverview {
  status: OrderStatus;
  isCancelled: boolean;
  currentStepIndex: number;
  progressPercent: number;
  currentStageLabelFa: string;
  currentStageLabelEn: string;
  steps: OrderTrackingStep[];
}

/**
 * Computes the step-by-step order tracking visualization model ('Order Placed', 'Processing', 'In Transit', 'Delivered')
 * for a given order status.
 */
export function buildOrderTrackingSteps(status: OrderStatus): OrderTrackingOverview {
  const baseSteps: Omit<OrderTrackingStep, 'state'>[] = [
    {
      id: 'pending_payment',
      stepNumber: 1,
      labelFa: 'ثبت سفارش',
      labelEn: 'Order Placed',
      descFa: 'ثبت اولیه و صدور پیش‌فاکتور',
      descEn: 'Order registered & invoice issued',
    },
    {
      id: 'processing',
      stepNumber: 2,
      labelFa: 'در حال پردازش',
      labelEn: 'Processing',
      descFa: 'تست سلامت و ثبت کد همتا',
      descEn: 'Diagnostics & Hamta IMEI registry',
    },
    {
      id: 'shipped',
      stepNumber: 3,
      labelFa: 'در مسیر ارسال',
      labelEn: 'In Transit',
      descFa: 'تحویل به پیک اختصاصی / پست',
      descEn: 'Handed to courier / express post',
    },
    {
      id: 'delivered',
      stepNumber: 4,
      labelFa: 'تحویل شده',
      labelEn: 'Delivered',
      descFa: 'تحویل قطعی مرسوله به مشتری',
      descEn: 'Package delivered to customer',
    },
  ];

  if (status === 'cancelled') {
    return {
      status,
      isCancelled: true,
      currentStepIndex: -1,
      progressPercent: 0,
      currentStageLabelFa: 'لغو شده',
      currentStageLabelEn: 'Cancelled',
      steps: baseSteps.map((s) => ({ ...s, state: 'cancelled' })),
    };
  }

  const orderSequence: Exclude<OrderStatus, 'cancelled'>[] = [
    'pending_payment',
    'processing',
    'shipped',
    'delivered',
  ];
  const currentStepIndex = Math.max(0, orderSequence.indexOf(status));
  const progressMap = [25, 50, 75, 100];
  const progressPercent = progressMap[currentStepIndex] ?? 25;

  const steps: OrderTrackingStep[] = baseSteps.map((s, idx) => {
    let state: TrackingStepState = 'upcoming';
    if (status === 'delivered' || idx < currentStepIndex) {
      state = 'completed';
    } else if (idx === currentStepIndex) {
      state = 'current';
    }
    return {
      ...s,
      state,
    };
  });

  const activeStep = baseSteps[currentStepIndex] ?? baseSteps[0];

  return {
    status,
    isCancelled: false,
    currentStepIndex,
    progressPercent,
    currentStageLabelFa: activeStep.labelFa,
    currentStageLabelEn: activeStep.labelEn,
    steps,
  };
}


