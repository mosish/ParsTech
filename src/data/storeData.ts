import type {
  Product,
  DeliverySettings,
  OrderStatus,
  DeliveryMethodId,
  PaymentGatewayId,
  ProductReview,
} from '../utils/commerce';
import {
  IPHONE_CATALOG_PRODUCTS,
  SAMSUNG_CATALOG_PRODUCTS,
} from './mobileCatalog';

export interface OrderItemRecord {
  productId: string;
  nameFa: string;
  nameEn: string;
  quantity: number;
  unitPriceToman: number;
  colorNameFa: string;
  colorNameEn: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  createdAtIso: string;
  customerName: string;
  customerMobile: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  deliveryMethod: DeliveryMethodId;
  paymentGateway: PaymentGatewayId;
  paymentRefId: string;
  trackingCode: string;
  status: OrderStatus;
  subtotalToman: number;
  discountToman: number;
  shippingToman: number;
  payableToman: number;
  items: OrderItemRecord[];
}

export interface StoreCmsConfig {
  heroKickerFa: string;
  heroKickerEn: string;
  heroTitleFa: string;
  heroTitleEn: string;
  heroSubtitleFa: string;
  heroSubtitleEn: string;
  promoBannerFa: string;
  promoBannerEn: string;
  storeAddressFa: string;
  storeAddressEn: string;
  storePhone: string;
  workingHoursFa: string;
  workingHoursEn: string;
  instagramUrl: string;
  telegramUrl: string;
  whatsappNumber: string;
  youtubeUrl: string;
  showInstagramWidget: boolean;
  activeDiscountCode: string;
  activeDiscountPercent: number;
}

export interface GatewayConfig {
  id: PaymentGatewayId;
  nameFa: string;
  nameEn: string;
  typeFa: string;
  typeEn: string;
  merchantCode: string;
  enabled: boolean;
  descriptionFa: string;
  descriptionEn: string;
}

export const INITIAL_PRODUCTS: Product[] = [
  ...IPHONE_CATALOG_PRODUCTS,
  ...SAMSUNG_CATALOG_PRODUCTS,
  {
    id: 'prod-mbp-m4',
    sku: 'PT-MBP14-M4P-512',
    category: 'laptops',
    brand: 'Apple',
    nameFa: 'مک‌بوک پرو ۱۴ اینچ با تراشه M4 Pro ظرفیت ۵۱۲ گیگابایت',
    nameEn: 'MacBook Pro 14" M4 Pro (24GB / 512GB SSD)',
    subtitleFa: 'نمایشگر Liquid Retina XDR · ۲۴ گیگابایت حافظه یکپارچه',
    subtitleEn: 'Liquid Retina XDR · 24GB Unified Memory · Space Black',
    priceToman: 142000000,
    originalPriceToman: 146500000,
    stockCount: 4,
    warrantyFa: '۱۸ ماه گارانتی شرکتی پارس‌تک (تعویض بی‌قید و شرط ۳۰ روز اول)',
    warrantyEn: '18-Month ParsTech Pro Laptop Warranty',
    colors: [
      { nameFa: 'مشکی فضایی', nameEn: 'Space Black', hex: '#2E2E30' },
      { nameFa: 'نقره‌ای کلاسیک', nameEn: 'Silver', hex: '#D4D4D8' },
    ],
    artworkKey: 'macbookprom4',
    featured: true,
    isHeavyItem: true,
    specs: [
      { labelFa: 'پردازنده', labelEn: 'Chip', valueFa: 'Apple M4 Pro (۱۲ هسته CPU / ۱۶ هسته GPU)', valueEn: 'Apple M4 Pro (12-core CPU / 16-core GPU)' },
      { labelFa: 'رم و حافظه', labelEn: 'Memory & SSD', valueFa: '۲۴ گیگابایت رم یکپارچه · ۵۱۲ گیگابایت SSD', valueEn: '24GB Unified RAM · 512GB NVMe SSD' },
      { labelFa: 'نمایشگر', labelEn: 'Display', valueFa: '۱۴.۲ اینچ Mini-LED ProMotion 120Hz', valueEn: '14.2" Liquid Retina XDR 120Hz' },
      { labelFa: 'شارژدهی باتری', labelEn: 'Battery Life', valueFa: 'تا ۲۲ ساعت پخش ویدئو · شارژر MagSafe 3', valueEn: 'Up to 22 hours · MagSafe 3 Fast Charge' },
    ],
  },
  {
    id: 'prod-rog-g16',
    sku: 'PT-ASUS-G16-4070',
    category: 'laptops',
    brand: 'ASUS',
    nameFa: 'لپ‌تاپ ایسوس ROG Zephyrus G16 OLED (۲۰۲۶)',
    nameEn: 'ASUS ROG Zephyrus G16 OLED (Core Ultra 9 / RTX 4070)',
    subtitleFa: 'بدنه آلومینیوم CNC · نمایشگر 240Hz OLED · ۱ ترابایت SSD',
    subtitleEn: 'CNC Aluminum · 2.5K 240Hz OLED · 32GB RAM · 1TB SSD',
    priceToman: 128500000,
    stockCount: 3,
    warrantyFa: '۲۴ ماه گارانتی اصلی سازگار ارقام',
    warrantyEn: '24-Month Official Sazgar Warranty',
    colors: [{ nameFa: 'خاکستری اکلیپس', nameEn: 'Eclipse Gray', hex: '#3F3F46' }],
    artworkKey: 'rogzephyrus',
    featured: false,
    isHeavyItem: true,
    specs: [
      { labelFa: 'پردازنده و گرافیک', labelEn: 'CPU & GPU', valueFa: 'Intel Core Ultra 9 185H · RTX 4070 8GB', valueEn: 'Intel Core Ultra 9 185H · NVIDIA RTX 4070 8GB' },
      { labelFa: 'نمایشگر', labelEn: 'Display', valueFa: '۱۶ اینچ ROG Nebula OLED 240Hz 0.2ms', valueEn: '16" ROG Nebula OLED 240Hz 0.2ms' },
      { labelFa: 'وزن دستگاه', labelEn: 'Weight', valueFa: '۱.۸۵ کیلوگرم فوق باریک', valueEn: '1.85 kg Ultra-Slim Chassis' },
    ],
  },
  {
    id: 'prod-ps5-pro',
    sku: 'PT-PS5PRO-2TB-EU',
    category: 'consoles',
    brand: 'Sony',
    nameFa: 'کنسول بازی سونی PlayStation 5 Pro ظرفیت ۲ ترابایت',
    nameEn: 'Sony PlayStation 5 Pro 2TB Console (Europe CFI-7021)',
    subtitleFa: 'ریجن اروپا · فناوری PSSR و Ray Tracing پیشرفته · Wi-Fi 7',
    subtitleEn: 'Europe Region · PSSR AI Upscaling · 2TB Custom SSD',
    priceToman: 46800000,
    originalPriceToman: 48900000,
    stockCount: 7,
    warrantyFa: '۱۰ روز مهلت تست تعویض + ۱۲ ماه گارانتی پارس‌تک شرق',
    warrantyEn: '10-Day Replacement + 12-Month ParsTech Guarantee',
    colors: [{ nameFa: 'سفید استاندارد', nameEn: 'Glacier White', hex: '#F4F4F5' }],
    artworkKey: 'ps5pro',
    featured: true,
    isHeavyItem: true,
    specs: [
      { labelFa: 'حافظه داخلی', labelEn: 'Internal Storage', valueFa: '۲ ترابایت SSD فوق سریع NVMe', valueEn: '2TB Custom High-Speed NVMe SSD' },
      { labelFa: 'توان گرافیکی', labelEn: 'GPU Architecture', valueFa: '۶۷٪ واحد محاسباتی بیشتر + Ray Tracing پیشرفته', valueEn: '67% More Compute Units + Advanced Ray Tracing' },
      { labelFa: 'اقلام داخل جعبه', labelEn: 'In the Box', valueFa: 'کنترلر DualSense، کابل HDMI 2.1، کابل برق و USB-C', valueEn: 'DualSense Controller, HDMI 2.1, AC Cord, USB-C' },
    ],
  },
  {
    id: 'prod-xbox-sx',
    sku: 'PT-XBSX-1TB',
    category: 'consoles',
    brand: 'Microsoft',
    nameFa: 'کنسول بازی ایکس‌باکس Series X ظرفیت ۱ ترابایت',
    nameEn: 'Xbox Series X 1TB 4K Gaming Console',
    subtitleFa: 'اجرای بازی‌های 4K با نرخ ۱۲۰ فریم · پک اصلی اروپا',
    subtitleEn: 'True 4K 120FPS Gaming · 12 Teraflops RDNA 2',
    priceToman: 34900000,
    stockCount: 4,
    warrantyFa: '۱۰ روز مهلت تست + ۱۲ ماه گارانتی پارس‌تک',
    warrantyEn: '10-Day Replacement + 12-Month ParsTech Guarantee',
    colors: [{ nameFa: 'مشکی مات', nameEn: 'Carbon Black', hex: '#18181B' }],
    artworkKey: 'xboxseriesx',
    featured: false,
    isHeavyItem: true,
    specs: [
      { labelFa: 'توان پردازشی', labelEn: 'Performance', valueFa: '۱۲ ترافلاپس · اجرای 4K واقعی در 120FPS', valueEn: '12 Teraflops · True 4K at 120FPS' },
      { labelFa: 'حافظه داخلی', labelEn: 'Storage', valueFa: '۱ ترابایت Custom NVMe SSD', valueEn: '1TB Custom NVMe SSD' },
    ],
  },
  {
    id: 'prod-airpods-max',
    sku: 'PT-APM-USBC-SLV',
    category: 'accessories',
    brand: 'Apple',
    nameFa: 'هدفون بی‌سیم اپل AirPods Max مدل USB-C (۲۰۲۵)',
    nameEn: 'Apple AirPods Max Wireless Over-Ear (USB-C Edition)',
    subtitleFa: 'حذف نویز فعال حرفه‌ای · صدای فضایی تطبیقی · درگاه USB-C',
    subtitleEn: 'Pro-level Active Noise Cancellation · Spatial Audio · USB-C',
    priceToman: 36400000,
    stockCount: 5,
    warrantyFa: '۱۲ ماه گارانتی شرکتی پارس‌تک',
    warrantyEn: '12-Month ParsTech Corporate Warranty',
    colors: [
      { nameFa: 'ستاره‌ای', nameEn: 'Starlight', hex: '#E5DFD5' },
      { nameFa: 'نیمه‌شب', nameEn: 'Midnight', hex: '#272E38' },
    ],
    artworkKey: 'airpodsmax',
    featured: true,
    specs: [
      { labelFa: 'تراشه صوتی', labelEn: 'Audio Chip', valueFa: 'تراشه دوگانه Apple H1 در هر گوشی', valueEn: 'Dual Apple H1 Headphone Chips' },
      { labelFa: 'درگاه شارژ', labelEn: 'Connector', valueFa: 'USB-C به همراه کیس هوشمند Smart Case', valueEn: 'USB-C Charging + Smart Case Included' },
    ],
  },
  {
    id: 'prod-watch-ultra2',
    sku: 'PT-AWU2-49-BLK',
    category: 'accessories',
    brand: 'Apple',
    nameFa: 'اپل واچ اولترا ۲ بدنه ۴۹ میلی‌متری تیتانیوم مشکی',
    nameEn: 'Apple Watch Ultra 2 49mm Black Titanium Case',
    subtitleFa: 'نمایشگر ۳۰۰۰ نیت یاقوت کبود · GPS دوفرکانسه دقیق',
    subtitleEn: '3000-Nit Sapphire Display · Precision Dual-Frequency GPS',
    priceToman: 54900000,
    stockCount: 6,
    warrantyFa: '۱۲ ماه گارانتی شرکتی پارس‌تک',
    warrantyEn: '12-Month ParsTech Corporate Warranty',
    colors: [
      { nameFa: 'تیتانیوم مشکی', nameEn: 'Black Titanium', hex: '#27272A' },
      { nameFa: 'تیتانیوم طبیعی', nameEn: 'Natural Titanium', hex: '#D6D3D1' },
    ],
    artworkKey: 'watchultra2',
    featured: true,
    specs: [
      { labelFa: 'بدنه و شیشه', labelEn: 'Case & Glass', valueFa: 'تیتانیوم هوافضا ۴۹ میلی‌متر · شیشه کریستال یاقوت', valueEn: '49mm Aerospace Titanium · Flat Sapphire Front' },
      { labelFa: 'مقاومت آب', labelEn: 'Water Resistance', valueFa: 'مقاوم تا عمق ۱۰۰ متر (استاندارد EN13319)', valueEn: '100m Water Resistant · Dive Certified' },
    ],
  },
  {
    id: 'prod-anker-65w',
    sku: 'PT-ANK-A2669',
    category: 'accessories',
    brand: 'Anker',
    nameFa: 'شارژر دیواری ۳ پورت انکر ۶۵ وات مدل Prime GaN',
    nameEn: 'Anker Prime 65W GaN 3-Port Fast Wall Charger',
    subtitleFa: 'مناسب آیفون ۱۶، مک‌بوک ایر و گلکسی · فناوری GaNPrime',
    subtitleEn: '2x USB-C + 1x USB-A · ActiveShield 2.0 Thermal Guard',
    priceToman: 3450000,
    stockCount: 18,
    warrantyFa: '۱۸ ماه گارانتی تعویض ایستا فرگام',
    warrantyEn: '18-Month Official Replacement Warranty',
    colors: [{ nameFa: 'خاکستری تیره', nameEn: 'Space Gray', hex: '#3F3F46' }],
    artworkKey: 'ankercharger',
    featured: false,
    specs: [
      { labelFa: 'توان خروجی', labelEn: 'Max Output', valueFa: '۶۵ وات واقعی با توزیع هوشمند توان', valueEn: '65W Max PowerIQ 4.0 Dynamic Allocation' },
      { labelFa: 'پورت‌ها', labelEn: 'Ports', valueFa: '۲ درگاه USB-C PD + ۱ درگاه USB-A QC', valueEn: '2x USB-C Power Delivery + 1x USB-A' },
    ],
  },
];

export const INITIAL_DELIVERY_SETTINGS: DeliverySettings = {
  tehranPeykBaseToman: 95000,
  tehranFreeThresholdToman: 25000000,
  iranPostBaseToman: 165000,
  iranPostHeavySurchargeToman: 45000,
  iranPostFreeThresholdToman: 50000000,
  enableInStorePickup: true,
  enableTehranPeyk: true,
  enableIranPost: true,
};

export const INITIAL_GATEWAYS: GatewayConfig[] = [
  {
    id: 'zarinpal',
    nameFa: 'درگاه پرداخت امن زرین‌پال (شاپرک)',
    nameEn: 'Zarinpal Smart IPG (Shaparak)',
    typeFa: 'پشتیبانی از تمام کارت‌های عضو شتاب · مسیردهی هوشمند',
    typeEn: 'All Shetab Cards · Smart Failover Routing',
    merchantCode: 'fa84c912-30b1-49d0-91a2-parstech0021',
    enabled: true,
    descriptionFa: 'تأیید آنی تراکنش با پشتیبانی از رمز دوم پویا و تسویه پایا/ساتنا',
    descriptionEn: 'Instant verification with Dynamic OTP & automated Paya/Satna settlement',
  },
  {
    id: 'mellat',
    nameFa: 'درگاه مستقیم به‌پرداخت بانک ملت',
    nameEn: 'Behpardakht Mellat Direct PSP',
    typeFa: 'درگاه مستقیم بانکی (PSP) با کارمزد صفر',
    typeEn: 'Direct Bank PSP · High-Ticket Electronics Limit',
    merchantCode: 'BPM-7841920',
    enabled: true,
    descriptionFa: 'مناسب خریدهای مبالغ بالا (تا سقف ۲۰۰ میلیون تومان روزانه هر کارت)',
    descriptionEn: 'Ideal for high-value laptops & flagship phones up to 200M Toman/card',
  },
  {
    id: 'idpay',
    nameFa: 'درگاه پرداخت آیدی‌پی (وب‌سرویس REST)',
    nameEn: 'IDPay Payment Gateway',
    typeFa: 'درگاه پشتیبان سریع با استعلام خودکار وضعیت',
    typeEn: 'Secondary IPG with Webhook Auto-Reconciliation',
    merchantCode: 'IDP-992014-EAST',
    enabled: true,
    descriptionFa: 'پشتیبانی کامل از بازگشت وجه آنی در صورت ناموفق بودن سفارش',
    descriptionEn: 'Instant auto-refund support on failed or canceled transactions',
  },
  {
    id: 'cod',
    nameFa: 'پرداخت در محل / کارت‌خوان حضوری مرکز موبایل شرق',
    nameEn: 'In-Store POS / Tehran Courier Card-on-Delivery',
    typeFa: 'ویژه تحویل حضوری در فروشگاه یا پیک اختصاصی تهران',
    typeEn: 'Available for East Mobile Center Pickup & Tehran Courier',
    merchantCode: 'POS-PHYSICAL-EAST-B24',
    enabled: true,
    descriptionFa: 'تست سلامت فیزیکی کالا و استعلام اصالت همتا پیش از کشیدن کارت در حضور مشتری',
    descriptionEn: 'Inspect seal & verify Hamta IMEI registry before paying via wireless POS',
  },
];

export const INITIAL_CMS_CONFIG: StoreCmsConfig = {
  heroKickerFa: 'نمایندگی فروش و خدمات تخصصی در مرکز موبایل شرق تهران',
  heroKickerEn: 'Authorized Flagship Retail at East Mobile Center, Tehran',
  heroTitleFa: 'اصالت اپل و پرچمداران روز، با گارانتی معتبر و تحویل ۳ ساعته در تهران.',
  heroTitleEn: 'Flagship Hardware. Official Hamta Registry & 3-Hour Tehran Delivery.',
  heroSubtitleFa:
    'تمامی گوشی‌ها، مک‌بوک‌ها و کنسول‌های بازی در پارس‌تک با پلمپ اصلی، کد فعال‌سازی رسمی سامانه همتا و فاکتور ممهور فروشگاه عرضه می‌شوند.',
  heroSubtitleEn:
    'Every iPhone, MacBook, and PlayStation at ParsTech ships factory-sealed with verified Hamta IMEI activation and an official stamped invoice.',
  promoBannerFa: 'ارسال رایگان با پیک اختصاصی در سراسر تهران برای سفارش‌های بالای ۲۵ میلیون تومان · کد تخفیف ویژه: PARS5',
  promoBannerEn: 'Free same-day Tehran courier on orders over 25,000,000 Toman · Welcome code: PARS5',
  storeAddressFa: 'تهران، بزرگراه رسالت شرق، نرسیده به چهارراه سرسبز، مجتمع تجاری مرکز موبایل شرق، طبقه همکف، واحد B24',
  storeAddressEn: 'Unit B24, Ground Floor, East Mobile Center, Resalat Expy (Near Sarsabz Sq), Tehran, Iran',
  storePhone: '021-77984210',
  workingHoursFa: 'همه‌روزه (حتی جمعه‌ها) از ساعت ۱۰:۰۰ صبح تا ۲۱:۳۰ شب',
  workingHoursEn: 'Daily (Sat–Fri) 10:00 AM – 9:30 PM IRST',
  instagramUrl: 'https://instagram.com/parstech.eastmobile',
  telegramUrl: 'https://t.me/parstech_east',
  whatsappNumber: '989123456789',
  youtubeUrl: 'https://youtube.com/@parstech_official',
  showInstagramWidget: true,
  activeDiscountCode: 'PARS5',
  activeDiscountPercent: 5,
};

export const INITIAL_ORDERS: OrderRecord[] = [
  {
    id: 'ord-1042',
    orderNumber: 'PT-1405-8841',
    createdAtIso: '2026-10-18',
    customerName: 'امیرحسین رضایی',
    customerMobile: '09123456789',
    province: 'Tehran',
    city: 'تهران',
    address: 'تهرانپارس، خیابان فرجام شرقی، پلاک ۱۴۲، واحد ۵',
    postalCode: '1651789431',
    deliveryMethod: 'tehran_peyk',
    paymentGateway: 'zarinpal',
    paymentRefId: 'ZP-4981029941',
    trackingCode: 'PEYK-TEH-742',
    status: 'delivered',
    subtotalToman: 92950000,
    discountToman: 0,
    shippingToman: 0,
    payableToman: 92950000,
    items: [
      {
        productId: 'prod-ip16pro',
        nameFa: 'آیفون ۱۶ پرو ۲۵۶ گیگابایت (دو سیم‌کارت ZAA)',
        nameEn: 'iPhone 16 Pro 256GB Dual SIM (ZAA)',
        quantity: 1,
        unitPriceToman: 89500000,
        colorNameFa: 'تیتانیوم طبیعی',
        colorNameEn: 'Natural Titanium',
      },
      {
        productId: 'prod-anker-65w',
        nameFa: 'شارژر دیواری ۳ پورت انکر ۶۵ وات مدل Prime GaN',
        nameEn: 'Anker Prime 65W GaN 3-Port Fast Wall Charger',
        quantity: 1,
        unitPriceToman: 3450000,
        colorNameFa: 'خاکستری تیره',
        colorNameEn: 'Space Gray',
      },
    ],
  },
  {
    id: 'ord-1043',
    orderNumber: 'PT-1405-8892',
    createdAtIso: '2026-10-19',
    customerName: 'نگین کریمی',
    customerMobile: '09131112233',
    province: 'Isfahan',
    city: 'اصفهان',
    address: 'خیابان چهارباغ بالا، مجتمع پارک، طبقه ۲، واحد ۲۰۸',
    postalCode: '8163491820',
    deliveryMethod: 'iran_post',
    paymentGateway: 'mellat',
    paymentRefId: 'BPM-993018442',
    trackingCode: 'TIPAX-9910421882104',
    status: 'processing',
    subtotalToman: 46800000,
    discountToman: 0,
    shippingToman: 210000,
    payableToman: 47010000,
    items: [
      {
        productId: 'prod-ps5-pro',
        nameFa: 'کنسول بازی سونی PlayStation 5 Pro ظرفیت ۲ ترابایت',
        nameEn: 'Sony PlayStation 5 Pro 2TB Console (Europe CFI-7021)',
        quantity: 1,
        unitPriceToman: 46800000,
        colorNameFa: 'سفید استاندارد',
        colorNameEn: 'Glacier White',
      },
    ],
  },
  {
    id: 'ord-1044',
    orderNumber: 'PT-1405-8904',
    createdAtIso: '2026-10-19',
    customerName: 'امیرحسین رضایی',
    customerMobile: '09123456789',
    province: 'Tehran',
    city: 'تهران',
    address: 'سعادت‌آباد، بلوار دریا، خیابان مطهری شمالی، پلاک ۲۸',
    postalCode: '1998743210',
    deliveryMethod: 'tehran_peyk',
    paymentGateway: 'idpay',
    paymentRefId: 'IDP-77492018',
    trackingCode: 'PEYK-TEH-918',
    status: 'shipped',
    subtotalToman: 32900000,
    discountToman: 0,
    shippingToman: 0,
    payableToman: 32900000,
    items: [
      {
        productId: 'prod-airpods-max',
        nameFa: 'هدفون بی‌سیم اپل AirPods Max مدل ۲۰۲۴ درگاه USB-C',
        nameEn: 'Apple AirPods Max (USB-C 2024 Edition)',
        quantity: 1,
        unitPriceToman: 32900000,
        colorNameFa: 'مشکی نیمه‌شب',
        colorNameEn: 'Midnight',
      },
    ],
  },
];

export const INITIAL_REVIEWS: ProductReview[] = [
  {
    id: 'rev-101',
    productId: 'prod-ip16pro',
    authorName: 'امیرحسین رضایی',
    rating: 5,
    comment:
      'دستگاه پلمپ اصلی ZAA بود و کد فعال‌سازی سامانه همتا همان لحظه در حضور خودم در شعبه مرکز موبایل شرق به سیم‌کارتم منتقل شد. کیفیت بدنه تیتانیوم طبیعی فوق‌العاده است.',
    createdAtIso: '2026-10-18',
    verifiedBuyer: true,
    approved: true,
  },
  {
    id: 'rev-102',
    productId: 'prod-ip16pro',
    authorName: 'کیوان صادقی',
    rating: 5,
    comment:
      'سفارش من با پیک اختصاصی تهران کمتر از ۲ ساعت به سعادت‌آباد رسید. فاکتور رسمی ممهور و کارت گارانتی ۱۸ ماهه پارس‌تک داخل بسته بود.',
    createdAtIso: '2026-10-17',
    verifiedBuyer: true,
    approved: true,
  },
  {
    id: 'rev-103',
    productId: 'prod-ip16pro',
    authorName: 'مریم توکلی',
    rating: 4,
    comment:
      'دوربین 4K 120fps و نمایشگر عالی هستند، فقط کاش آداپتور ۲۰ وات هم داخل جعبه اپل بود که البته شارژر انکر را جداگانه از همین سایت سفارش دادم.',
    createdAtIso: '2026-10-19',
    verifiedBuyer: true,
    approved: false, // Pending admin approval
  },
  {
    id: 'rev-104',
    productId: 'prod-s25ultra',
    authorName: 'سهیل فرهادی',
    rating: 5,
    comment:
      'نمایشگر ضد بازتاب گلکسی S25 Ultra و سرعت پردازنده Snapdragon 8 Elite بی‌نظیر است. گارانتی رسمی داریا همراه و رجیستری کامل بود.',
    createdAtIso: '2026-10-16',
    verifiedBuyer: true,
    approved: true,
  },
  {
    id: 'rev-105',
    productId: 'prod-mbp-m4',
    authorName: 'دکتر نیما شمس',
    rating: 5,
    comment:
      'برای برنامه‌نویسی و پردازش‌های سنگین مدل ۲۴ گیگابایت رم M4 Pro را خریداری کردم. کاملاً بی‌صدا و فوق‌العاده سریع.',
    createdAtIso: '2026-10-15',
    verifiedBuyer: true,
    approved: true,
  },
  {
    id: 'rev-106',
    productId: 'prod-ps5-pro',
    authorName: 'نگین کریمی',
    rating: 5,
    comment:
      'بسته‌بندی بسیار ایمن با تیپاکس به اصفهان رسید. ریجن اروپا CFI-7021 پلمپ اصلی بود.',
    createdAtIso: '2026-10-19',
    verifiedBuyer: true,
    approved: true,
  },
];

