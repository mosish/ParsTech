import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toPersianDigits,
  toEnglishDigits,
  tomanToRial,
  formatToman,
  gregorianToJalali,
  formatJalaliDate,
  calculateShippingCost,
  calculateOrderTotals,
  validateCheckoutForm,
  filterAndSortProducts,
  canPerformAdminAction,
  toggleCompareProduct,
  buildComparisonRows,
  validateReviewInput,
  calculateProductRatingSummary,
  toggleReviewApproval,
  buildOrderTrackingSteps,
  getProductColorPhotos,
  type DeliverySettings,
  type Product,
  type ProductReview,
} from './commerce.ts';
import {
  IPHONE_CATALOG_PRODUCTS,
  SAMSUNG_CATALOG_PRODUCTS,
} from '../data/mobileCatalog.ts';

const MOCK_SETTINGS: DeliverySettings = {
  tehranPeykBaseToman: 95000,
  tehranFreeThresholdToman: 25000000,
  iranPostBaseToman: 165000,
  iranPostHeavySurchargeToman: 45000,
  iranPostFreeThresholdToman: 50000000,
  enableInStorePickup: true,
  enableTehranPeyk: true,
  enableIranPost: true,
};

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'p1',
    sku: 'PT-IP16P-256',
    category: 'mobiles',
    brand: 'Apple',
    nameFa: 'آیفون ۱۶ پرو ۲۵۶ گیگابایت',
    nameEn: 'iPhone 16 Pro 256GB',
    subtitleFa: 'تیتانیوم طبیعی · رجیستر شده با گارانتی شرکتی',
    subtitleEn: 'Natural Titanium · Official IR-Registry & 18m Warranty',
    priceToman: 89500000,
    stockCount: 8,
    warrantyFa: '۱۸ ماه گارانتی شرکتی پارس‌تک + کد رجیستری همتا',
    warrantyEn: '18-Month ParsTech Corporate Warranty + Hamta Registry',
    colors: [{ nameFa: 'تیتانیوم طبیعی', nameEn: 'Natural Titanium', hex: '#C8C2B8' }],
    artworkKey: 'iphone16pro',
    featured: true,
    specs: [],
  },
  {
    id: 'p2',
    sku: 'PT-ANK-65W',
    category: 'accessories',
    brand: 'Anker',
    nameFa: 'شارژر دیواری انکر ۶۵ وات GaN',
    nameEn: 'Anker Prime 65W GaN Wall Charger',
    subtitleFa: '۳ پورت USB-C/A · فناوری PowerIQ 4.0',
    subtitleEn: '3-Port Fast Charger · PowerIQ 4.0',
    priceToman: 3450000,
    stockCount: 0,
    warrantyFa: '۱۸ ماه گارانتی ایستا',
    warrantyEn: '18-Month Official Warranty',
    colors: [{ nameFa: 'مشکی مات', nameEn: 'Matte Black', hex: '#27272A' }],
    artworkKey: 'ankercharger',
    featured: false,
    specs: [],
  },
  {
    id: 'p3',
    sku: 'PT-PS5-PRO',
    category: 'consoles',
    brand: 'Sony',
    nameEn: 'PlayStation 5 Pro 2TB Console',
    nameFa: 'کنسول بازی پلی‌استیشن ۵ پرو ۲ ترابایت',
    subtitleFa: 'ریجن اروپا · به همراه کنترلر DualSense',
    subtitleEn: 'Europe CFI-7021 · DualSense Wireless Controller',
    priceToman: 46800000,
    stockCount: 5,
    warrantyFa: '۱۰ روز مهلت تست + ۱۲ ماه گارانتی پارس‌تک',
    warrantyEn: '10-Day Test + 12-Month ParsTech Guarantee',
    colors: [{ nameFa: 'سفید', nameEn: 'Glacier White', hex: '#F4F4F5' }],
    artworkKey: 'ps5pro',
    isHeavyItem: true,
    specs: [],
  },
];

test('Persian and English digit conversions work symmetrically', () => {
  assert.equal(toPersianDigits('89,500,000'), '۸۹,۵۰۰,۰۰۰');
  assert.equal(toEnglishDigits('۰۹۱۲۳۴۵۶۷۸۹'), '09123456789');
});

test('Toman to Rial and localized Toman formatting are accurate', () => {
  assert.equal(tomanToRial(3450000), 34500000);
  assert.equal(formatToman(3450000, 'fa'), '۳,۴۵۰,۰۰۰ تومان');
  assert.equal(formatToman(3450000, 'en'), '3,450,000 Toman');
});

test('Gregorian to Jalali conversion produces accurate Shamsi date', () => {
  const [jy, jm, jd] = gregorianToJalali(2026, 10, 19);
  assert.equal(jy, 1405);
  assert.equal(jm, 7);
  assert.equal(jd, 27);
  assert.equal(formatJalaliDate('2026-10-19', 'fa'), '۲۷ مهر ۱۴۰۵');
});

test('Shipping cost calculation respects pickup, Tehran threshold, and nationwide heavy surcharge', () => {
  // In-store pickup at East Mobile Center is always free
  assert.equal(
    calculateShippingCost({
      method: 'pickup',
      subtotalToman: 3450000,
      hasHeavyItem: false,
      settings: MOCK_SETTINGS,
    }),
    0
  );

  // Tehran Peyk below threshold charges 95,000 Toman
  assert.equal(
    calculateShippingCost({
      method: 'tehran_peyk',
      subtotalToman: 3450000,
      hasHeavyItem: false,
      settings: MOCK_SETTINGS,
    }),
    95000
  );

  // Tehran Peyk above 25M Toman threshold is free
  assert.equal(
    calculateShippingCost({
      method: 'tehran_peyk',
      subtotalToman: 89500000,
      hasHeavyItem: false,
      settings: MOCK_SETTINGS,
    }),
    0
  );

  // Nationwide post for heavy console below 50M threshold includes 45,000 surcharge
  assert.equal(
    calculateShippingCost({
      method: 'iran_post',
      subtotalToman: 46800000,
      hasHeavyItem: true,
      settings: MOCK_SETTINGS,
    }),
    210000
  );
});

test('Order totals calculation computes discount, shipping, and Rial conversion', () => {
  const totals = calculateOrderTotals({
    items: [{ productId: 'p3', quantity: 1, selectedColorHex: '#F4F4F5' }],
    products: SAMPLE_PRODUCTS,
    deliveryMethod: 'iran_post',
    discountPercent: 10,
    settings: MOCK_SETTINGS,
  });

  assert.equal(totals.subtotalToman, 46800000);
  assert.equal(totals.discountToman, 4680000);
  assert.equal(totals.shippingToman, 210000);
  assert.equal(totals.payableToman, 42330000);
  assert.equal(totals.payableRial, 423300000);
});

test('Checkout form validation enforces Iranian mobile and 10-digit postal code', () => {
  const invalidRes = validateCheckoutForm(
    {
      fullName: 'علی',
      mobile: '091234',
      province: 'Tehran',
      city: 'Tehran',
      address: 'خیابان رسالت، مرکز موبایل شرق، پلاک ۱۲',
      postalCode: '12345',
      deliveryMethod: 'tehran_peyk',
      paymentGateway: 'zarinpal',
    },
    'fa'
  );
  assert.equal(invalidRes.valid, false);
  assert.ok(invalidRes.errors.mobile);
  assert.ok(invalidRes.errors.postalCode);

  const validRes = validateCheckoutForm(
    {
      fullName: 'سارا محمدی',
      mobile: '۰۹۱۲۳۴۵۶۷۸۹',
      province: 'Tehran',
      city: 'Tehran',
      address: 'تهران، بزرگراه رسالت، مرکز موبایل شرق، طبقه اول',
      postalCode: '۱۶۵۱۷۸۹۴۳۱',
      deliveryMethod: 'tehran_peyk',
      paymentGateway: 'zarinpal',
    },
    'fa'
  );
  assert.equal(validRes.valid, true);
});

test('Catalog filtering and RBAC permissions behave deterministically', () => {
  const inStockOnly = filterAndSortProducts({
    products: SAMPLE_PRODUCTS,
    category: 'all',
    brand: 'all',
    searchQuery: '',
    onlyInStock: true,
    sortBy: 'price_asc',
  });
  assert.equal(inStockOnly.length, 2);
  assert.equal(inStockOnly[0].id, 'p3');

  assert.equal(canPerformAdminAction('owner', 'manage_gateways'), true);
  assert.equal(canPerformAdminAction('staff', 'manage_gateways'), false);
  assert.equal(canPerformAdminAction('staff', 'edit_product'), true);
});

test('Product comparison enforces maximum of 3 items and builds side-by-side spec matrix', () => {
  let list: string[] = [];
  const step1 = toggleCompareProduct(list, 'p1');
  list = step1.nextIds;
  assert.deepEqual(list, ['p1']);
  assert.equal(step1.limitReached, false);

  list = toggleCompareProduct(list, 'p2').nextIds;
  list = toggleCompareProduct(list, 'p3').nextIds;
  assert.deepEqual(list, ['p1', 'p2', 'p3']);

  // Attempting to add a 4th product is rejected and signals limitReached
  const step4 = toggleCompareProduct(list, 'p4');
  assert.deepEqual(step4.nextIds, ['p1', 'p2', 'p3']);
  assert.equal(step4.limitReached, true);

  // Toggling an existing product removes it
  const removed = toggleCompareProduct(list, 'p2');
  assert.deepEqual(removed.nextIds, ['p1', 'p3']);

  // Build comparison rows across products with different specs
  const productsWithSpecs: Product[] = [
    {
      ...SAMPLE_PRODUCTS[0],
      specs: [
        { labelFa: 'نمایشگر', labelEn: 'Display', valueFa: '۶.۳ اینچ OLED', valueEn: '6.3" OLED' },
        { labelFa: 'حافظه', labelEn: 'Storage', valueFa: '۲۵۶ گیگابایت', valueEn: '256GB' },
      ],
    },
    {
      ...SAMPLE_PRODUCTS[2],
      specs: [
        { labelFa: 'حافظه', labelEn: 'Storage', valueFa: '۲ ترابایت', valueEn: '2TB' },
      ],
    },
  ];

  const rows = buildComparisonRows(productsWithSpecs);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].labelEn, 'Display');
  assert.equal(rows[0].values[0].valueEn, '6.3" OLED');
  assert.equal(rows[0].values[1].valueEn, '—');
  assert.equal(rows[0].hasDifference, true);
});

test('Product review validation, rating summary, and admin approval toggles work accurately', () => {
  const invalidReview = validateReviewInput(
    { authorName: 'A', rating: 5, comment: 'کوتاه' },
    'fa'
  );
  assert.equal(invalidReview.valid, false);
  assert.ok(invalidReview.errors.authorName);
  assert.ok(invalidReview.errors.comment);

  const validReview = validateReviewInput(
    {
      authorName: 'مهدی نادری',
      rating: 5,
      comment: 'کیفیت ساخت تیتانیوم و سرعت تحویل حضوری در مرکز موبایل شرق عالی بود.',
    },
    'fa'
  );
  assert.equal(validReview.valid, true);

  const sampleReviews: ProductReview[] = [
    {
      id: 'rev-1',
      productId: 'p1',
      authorName: 'مهدی نادری',
      rating: 5,
      comment: 'رجیستری همتا همان لحظه در فروشگاه انجام شد.',
      createdAtIso: '2026-10-16',
      verifiedBuyer: true,
      approved: true,
    },
    {
      id: 'rev-2',
      productId: 'p1',
      authorName: 'پریسا شریفی',
      rating: 4,
      comment: 'بسته‌بندی پلمپ و ارسال با پیک تهران زیر ۲ ساعت رسید.',
      createdAtIso: '2026-10-18',
      verifiedBuyer: true,
      approved: true,
    },
    {
      id: 'rev-3',
      productId: 'p1',
      authorName: 'کاربر مهمان',
      rating: 1,
      comment: 'این نظر هنوز توسط ادمین تایید نشده است.',
      createdAtIso: '2026-10-19',
      verifiedBuyer: false,
      approved: false,
    },
  ];

  // Unapproved review is excluded from public rating average
  const summaryBefore = calculateProductRatingSummary(sampleReviews, 'p1');
  assert.equal(summaryBefore.approvedCount, 2);
  assert.equal(summaryBefore.pendingCount, 1);
  assert.equal(summaryBefore.averageRating, 4.5);

  // Admin approves rev-3 -> now included in public rating average
  const afterApproval = toggleReviewApproval(sampleReviews, 'rev-3', true);
  const summaryAfter = calculateProductRatingSummary(afterApproval, 'p1');
  assert.equal(summaryAfter.approvedCount, 3);
  assert.equal(summaryAfter.pendingCount, 0);
  assert.equal(summaryAfter.averageRating, 3.3);
});

test('Order tracking status visualization steps accurately reflect Processing, In Transit, Delivered, and Cancelled states', () => {
  const proc = buildOrderTrackingSteps('processing');
  assert.equal(proc.isCancelled, false);
  assert.equal(proc.currentStepIndex, 1);
  assert.equal(proc.progressPercent, 50);
  assert.equal(proc.currentStageLabelEn, 'Processing');
  assert.equal(proc.steps[0].state, 'completed');
  assert.equal(proc.steps[1].state, 'current');
  assert.equal(proc.steps[2].state, 'upcoming');
  assert.equal(proc.steps[3].state, 'upcoming');

  const transit = buildOrderTrackingSteps('shipped');
  assert.equal(transit.currentStepIndex, 2);
  assert.equal(transit.progressPercent, 75);
  assert.equal(transit.currentStageLabelEn, 'In Transit');
  assert.equal(transit.steps[0].state, 'completed');
  assert.equal(transit.steps[1].state, 'completed');
  assert.equal(transit.steps[2].state, 'current');
  assert.equal(transit.steps[3].state, 'upcoming');

  const deliv = buildOrderTrackingSteps('delivered');
  assert.equal(deliv.currentStepIndex, 3);
  assert.equal(deliv.progressPercent, 100);
  assert.equal(deliv.currentStageLabelEn, 'Delivered');
  assert.equal(deliv.steps.every((s) => s.state === 'completed'), true);

  const canc = buildOrderTrackingSteps('cancelled');
  assert.equal(canc.isCancelled, true);
  assert.equal(canc.progressPercent, 0);
  assert.equal(canc.currentStageLabelEn, 'Cancelled');
  assert.equal(canc.steps.every((s) => s.state === 'cancelled'), true);
});

test('Full mobile catalog includes all iPhone models (13 normal to 17 Pro Max) and Samsung models (A07 to S25 Ultra & Z Fold7) with all official colors', () => {
  assert.equal(IPHONE_CATALOG_PRODUCTS.length >= 21, true);
  assert.equal(SAMSUNG_CATALOG_PRODUCTS.length >= 13, true);

  // Verify iPhone 13 normal through iPhone 17 Pro Max
  const ip13 = IPHONE_CATALOG_PRODUCTS.find((p) => p.id === 'prod-ip13');
  const ip17pm = IPHONE_CATALOG_PRODUCTS.find((p) => p.id === 'prod-ip17promax');
  assert.ok(ip13);
  assert.equal(ip13.colors.length, 6);
  assert.ok(ip17pm);
  assert.equal(ip17pm.colors.length, 5);

  // Verify all 5 iPhone series tags exist (ip13, ip14, ip15, ip16, ip17)
  for (const tag of ['ip13', 'ip14', 'ip15', 'ip16', 'ip17'] as const) {
    const count = IPHONE_CATALOG_PRODUCTS.filter((p) => p.seriesTag === tag).length;
    assert.ok(count >= 4, `Expected at least 4 models in series ${tag}`);
  }

  // Verify Samsung Galaxy A07 through S25 Ultra & Z Fold7
  const a07 = SAMSUNG_CATALOG_PRODUCTS.find((p) => p.id === 'prod-a07');
  const a56 = SAMSUNG_CATALOG_PRODUCTS.find((p) => p.id === 'prod-a56');
  const s25u = SAMSUNG_CATALOG_PRODUCTS.find((p) => p.id === 'prod-s25ultra');
  const zfold7 = SAMSUNG_CATALOG_PRODUCTS.find((p) => p.id === 'prod-zfold7');
  assert.ok(a07);
  assert.equal(a07.colors.length, 4);
  assert.ok(a56);
  assert.equal(a56.colors.length, 4);
  assert.ok(s25u);
  assert.equal(s25u.colors.length, 5);
  assert.ok(zfold7);
  assert.equal(zfold7.colors.length, 4);

  // Every mobile model must have at least 2 colors with valid hex codes
  for (const prod of [...IPHONE_CATALOG_PRODUCTS, ...SAMSUNG_CATALOG_PRODUCTS]) {
    assert.ok(prod.colors.length >= 2, `${prod.id} should have multiple colors`);
    for (const color of prod.colors) {
      assert.match(color.hex, /^#[0-9A-Fa-f]{6}$/);
    }
  }
});

test('Every color of every product provides at least 4 multi-angle studio photos with official source attribution', () => {
  const allProducts = [...IPHONE_CATALOG_PRODUCTS, ...SAMSUNG_CATALOG_PRODUCTS, ...SAMPLE_PRODUCTS];
  for (const product of allProducts) {
    for (const color of product.colors) {
      const photos = getProductColorPhotos(product, color.hex);
      assert.ok(photos.length >= 3, `Expected at least 3 angle photos for ${product.id} (${color.nameEn})`);
      assert.equal(photos.length, 4);
      assert.deepEqual(
        photos.map((p) => p.angle),
        ['front_back', 'back_camera', 'side_profile', 'angled_studio']
      );
      for (const photo of photos) {
        assert.equal(photo.colorHex, color.hex);
        assert.equal(photo.colorNameEn, color.nameEn);
        assert.equal(photo.colorNameFa, color.nameFa);
        assert.ok(photo.officialSourceDomain.length > 0);
      }
    }
  }
});

