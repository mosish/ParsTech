export interface SpecSection {
  id: string;
  letter: string;
  titleEn: string;
  titleFa: string;
  summaryEn: string;
  summaryFa: string;
}

export const SPEC_SECTIONS: SpecSection[] = [
  {
    id: 'tech-stack',
    letter: 'a',
    titleEn: 'Recommended Tech Stack & Iranian Infrastructure',
    titleFa: 'الف. پشته فناوری پیشنهادی، هاستینگ ایران و درگاه‌های پرداخت',
    summaryEn: 'Next.js 15 / React SSR storefront, NestJS / Node.js API, PostgreSQL + Redis, ArvanCloud CDN + Liara/AbrArvan domestic hosting, and Shaparak IPG adapters.',
    summaryFa: 'معماری فول‌استک بهینه‌شده برای شبکه ملی اطلاعات، CDN ابرآروان و درگاه‌های شاپرک.',
  },
  {
    id: 'sitemap-flows',
    letter: 'b',
    titleEn: 'Sitemap & User Flows (Customer & Admin)',
    titleFa: 'ب. نقشه سایت و جریان کاربری (مشتری و مدیر سیستم)',
    summaryEn: 'Complete information architecture and step-by-step customer purchase + admin fulfillment journeys.',
    summaryFa: 'ساختار درختی صفحات و سناریوهای گام‌به‌گام خرید مشتری و مدیریت سفارش‌ها.',
  },
  {
    id: 'wireframes',
    letter: 'c',
    titleEn: 'Page-by-Page Wireframe Specifications',
    titleFa: 'ج. توصیف وایرفریم صفحات کلیدی (خانه، کاتالوگ، محصول، سبد، تسویه، حساب، پنل مدیریت)',
    summaryEn: 'Structural layout blueprints for all 7 core templates inspired by apple.com and apple-nic.com.',
    summaryFa: 'الگوی چیدمان و سلسله‌مراتب بصری ۷ صفحه اصلی با الهام از Apple و Apple-NIC.',
  },
  {
    id: 'design-system',
    letter: 'd',
    titleEn: 'Visual Design System (Colors, Vazirmatn Typography, Spacing & Components)',
    titleFa: 'د. سیستم طراحی بصری (پالت رنگ، تایپوگرافی وزیرمتن، فاصله‌گذاری و کامپوننت‌ها)',
    summaryEn: '60-30-10 Apple Alabaster palette, Vazirmatn + Plus Jakarta Sans scale, 8pt RTL/LTR grid, and purchase modules.',
    summaryFa: 'استانداردهای رنگ، تایپوگرافی دوزبانه، اعداد فارسی هم‌عرض و فواصل.',
  },
  {
    id: 'database-schema',
    letter: 'e',
    titleEn: 'Relational Database Schema (Products, Orders, Customers, Payments)',
    titleFa: 'هـ. اسکیمای پایگاه داده رابطه‌ای (محصولات، سفارش‌ها، مشتریان و تراکنش‌ها)',
    summaryEn: 'PostgreSQL DDL with BigInt Rial/Toman storage, Hamta IMEI tracking, and Shaparak audit logs.',
    summaryFa: 'ساختار جداول PostgreSQL با پشتیبانی از مبالغ کلان، کد رجیستری همتا و لاگ شاپرک.',
  },
  {
    id: 'phased-roadmap',
    letter: 'f',
    titleEn: 'Phased Development Plan (MVP Scope vs. Phase 2 & 3 Enhancements)',
    titleFa: 'و. برنامه زمان‌بندی و فازبندی توسعه (نسخه MVP و فازهای توسعه آتی)',
    summaryEn: '12-week execution roadmap from core catalog & Zarinpal checkout to POS ERP sync & Torob/Emalls feeds.',
    summaryFa: 'نقشه راه اجرایی از راه‌اندازی MVP تا اتصال به ترب/ایمالز و خرید اقساطی.',
  },
  {
    id: 'risks-compliance',
    letter: 'g',
    titleEn: 'Key Risks, Enamad & Legal Compliance in Iran + Clarifying Questions',
    titleFa: 'ز. الزامات قانونی تجارت الکترونیک در ایران (اینماد، همتا، مالیات) و پرسش‌های تکمیلی',
    summaryEn: 'e-Namad & Samandehi registration, Hamta IMEI transfer laws, Tax Organization e-invoicing, and gateway failovers.',
    summaryFa: 'الزامات اینماد، انتقال مالکیت همتا، سامانه مودیان مالیاتی و راهکارهای کاهش ریسک.',
  },
];

export const POSTGRES_SCHEMA_SQL = `-- PostgreSQL 16 Schema for ParsTech (East Mobile Center)
-- Note: Monetary values stored as BIGINT in Toman (and converted to Rial x10 at IPG boundary)

CREATE TYPE user_role AS ENUM ('customer', 'staff', 'owner');
CREATE TYPE order_status AS ENUM ('pending_payment', 'processing', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE delivery_method AS ENUM ('pickup_east_center', 'tehran_peyk', 'iran_post_pishtaz', 'tipax_courier');
CREATE TYPE payment_gateway AS ENUM ('zarinpal', 'mellat_behpardakht', 'idpay', 'saman_sep', 'cod_pos');
CREATE TYPE payment_status AS ENUM ('initiated', 'verified', 'settled', 'failed', 'reversed');

-- 1. Customers & Staff Accounts
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile VARCHAR(11) UNIQUE NOT NULL CHECK (mobile ~ '^09[0-9]{9}$'),
  full_name VARCHAR(120) NOT NULL,
  national_id VARCHAR(10) CHECK (national_id ~ '^[0-9]{10}$'),
  email VARCHAR(160),
  role user_role NOT NULL DEFAULT 'customer',
  sheba_iban VARCHAR(26), -- IRxxxxxxxxxxxxxxxxxxxxxxxx for instant refunds
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Categories & Brands
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(64) UNIQUE NOT NULL,
  name_fa VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  parent_id INT REFERENCES categories(id),
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(64) UNIQUE NOT NULL,
  name_fa VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3. Products & SKU Variants (Supports Hamta Registry & Corporate Warranty)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(64) UNIQUE NOT NULL,
  category_id INT NOT NULL REFERENCES categories(id),
  brand_id INT NOT NULL REFERENCES brands(id),
  name_fa VARCHAR(200) NOT NULL,
  name_en VARCHAR(200) NOT NULL,
  subtitle_fa VARCHAR(300),
  subtitle_en VARCHAR(300),
  price_toman BIGINT NOT NULL CHECK (price_toman >= 0),
  compare_at_toman BIGINT,
  stock_count INT NOT NULL DEFAULT 0 CHECK (stock_count >= 0),
  is_heavy_item BOOLEAN NOT NULL DEFAULT FALSE,
  requires_hamta_registry BOOLEAN NOT NULL DEFAULT FALSE,
  warranty_label_fa VARCHAR(200) NOT NULL,
  warranty_label_en VARCHAR(200) NOT NULL,
  specs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  colors_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Orders & Fulfillments
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(32) UNIQUE NOT NULL, -- e.g. PT-1405-8841
  user_id UUID NOT NULL REFERENCES users(id),
  status order_status NOT NULL DEFAULT 'pending_payment',
  delivery_type delivery_method NOT NULL,
  recipient_name VARCHAR(120) NOT NULL,
  recipient_mobile VARCHAR(11) NOT NULL,
  province VARCHAR(80) NOT NULL,
  city VARCHAR(80) NOT NULL,
  street_address TEXT NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  subtotal_toman BIGINT NOT NULL,
  discount_toman BIGINT NOT NULL DEFAULT 0,
  shipping_toman BIGINT NOT NULL DEFAULT 0,
  tax_toman BIGINT NOT NULL DEFAULT 0,
  payable_toman BIGINT NOT NULL,
  tracking_code VARCHAR(64),
  jalali_date_str VARCHAR(20) NOT NULL, -- e.g. 1405/07/27 for indexed Jalali reporting
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price_toman BIGINT NOT NULL,
  selected_color VARCHAR(64),
  imei_serial_code VARCHAR(32), -- Recorded at fulfillment for phones/consoles
  hamta_transfer_code VARCHAR(32)
);

-- 5. Shaparak Payment Transactions
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  gateway payment_gateway NOT NULL,
  amount_rial BIGINT NOT NULL, -- Always payable_toman * 10
  authority_token VARCHAR(128) NOT NULL,
  ref_id VARCHAR(64), -- Shaparak Reference Number (کد رهگیری شاپرک)
  masked_card_pan VARCHAR(20), -- e.g. 6104-33**-****-8912
  status payment_status NOT NULL DEFAULT 'initiated',
  raw_callback_json JSONB,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`;
