import React, { useState } from 'react';
import { Copy, Check, Database, Layers, GitBranch, Layout, Palette, Calendar, ShieldAlert } from 'lucide-react';
import { SPEC_SECTIONS, POSTGRES_SCHEMA_SQL } from '../data/specDeliverables';
import type { Language } from '../utils/commerce';

interface BlueprintSpecViewProps {
  lang: Language;
}

export const BlueprintSpecView: React.FC<BlueprintSpecViewProps> = ({ lang }) => {
  const isFa = lang === 'fa';
  const [activeId, setActiveId] = useState<string>('tech-stack');
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard?.writeText(POSTGRES_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 1800);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-10">
      <div className="border-b border-black/[0.08] pb-6 space-y-2">
        <p className="text-xs font-medium text-[#6E6E73]">
          {isFa
            ? 'مستندات جامع معماری و طراحی سیستم — پارس‌تک (مرکز موبایل شرق تهران)'
            : 'Complete System Architecture & Design Specification — ParsTech (East Mobile Center)'}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F]">
          {isFa
            ? 'تحویل‌های فنی و طراحی (بخش a تا g به ترتیب درخواستی)'
            : 'Engineering & Design Deliverables (Ordered a – g)'}
        </h1>
      </div>

      {/* Deliverable Selector Tabs */}
      <div dir="ltr" className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 p-1.5 bg-[#F5F5F7] rounded-2xl">
        {[
          { id: 'tech-stack', labelFa: 'a. پشته فنی', labelEn: 'a. Tech Stack' },
          { id: 'sitemap-flows', labelFa: 'b. نقشه سایت', labelEn: 'b. Sitemap' },
          { id: 'wireframes', labelFa: 'c. وایرفریم‌ها', labelEn: 'c. Wireframes' },
          { id: 'design-system', labelFa: 'd. سیستم طراحی', labelEn: 'd. Design System' },
          { id: 'database-schema', labelFa: 'e. پایگاه داده', labelEn: 'e. DB Schema' },
          { id: 'phased-roadmap', labelFa: 'f. فازبندی', labelEn: 'f. MVP Plan' },
          { id: 'risks-compliance', labelFa: 'g. الزامات قانونی', labelEn: 'g. Compliance' },
        ].map((tab) => {
          const active = activeId === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveId(tab.id)}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 text-center ${
                active ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              {isFa ? tab.labelFa : tab.labelEn}
            </button>
          );
        })}
      </div>

      <div dir="ltr" className="text-left space-y-8">
      {/* Deliverable A: Tech Stack & Iranian Infrastructure */}
      {activeId === 'tech-stack' && (
        <section className="space-y-6 bg-white rounded-3xl p-8 border border-black/[0.07]">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-[#0066CC]" />
            <h2 className="text-xl font-bold text-[#1D1D1F]">
              a. Recommended Tech Stack & Iranian Payment / Hosting Infrastructure
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-black/10 text-[#6E6E73] bg-[#F5F5F7]">
                  <th className="p-3 text-start">Layer</th>
                  <th className="p-3 text-start">Recommended Technology</th>
                  <th className="p-3 text-start">Why It Fits the Iranian E-Commerce Market</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                <tr>
                  <td className="p-3 font-bold text-[#1D1D1F]">Frontend Framework</td>
                  <td className="p-3 font-mono text-[#0066CC]">Next.js 15 (App Router) + React 19 + Tailwind CSS</td>
                  <td className="p-3 text-[#515154]">
                    Server-Side Rendering (SSR) & ISR ensure instant indexing on Google, Torob (`ترب`), and Emalls (`ایمالز`), fast First Contentful Paint on 4G mobile networks, and native RTL/LTR logical CSS properties.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-[#1D1D1F]">Backend API</td>
                  <td className="p-3 font-mono text-[#0066CC]">NestJS (Node.js / TypeScript) + BullMQ Workers</td>
                  <td className="p-3 text-[#515154]">
                    Modular architecture for inventory locking during flash drops, SMS OTP dispatch (Kavenegar / MeliPayamak), Shaparak IPG webhook reconciliation, and Torob/Emalls JSON price feeds.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-[#1D1D1F]">Database & Cache</td>
                  <td className="p-3 font-mono text-[#0066CC]">PostgreSQL 16 + Redis 7 + Meilisearch</td>
                  <td className="p-3 text-[#515154]">
                    PostgreSQL `BIGINT` handles multi-hundred-million Toman/Rial figures with ACID serializable stock locking; Meilisearch normalizes Persian/Arabic characters (`ی/ي`, `ک/ك`) for instant typo-tolerant search.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-[#1D1D1F]">Hosting & CDN (Iran)</td>
                  <td className="p-3 font-mono text-[#0066CC]">ArvanCloud CDN + Liara / AbrArvan Cloud (Tehran DC)</td>
                  <td className="p-3 text-[#515154]">
                    Domestic Tehran data centers (Asiatech / Afranet) guarantee &lt;15ms latency inside Iran, full resilience during international internet disruptions (NIN / شبکه ملی اطلاعات), and domestic IP whitelisting required by bank PSPs.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-[#1D1D1F]">Payment Gateways (IPG)</td>
                  <td className="p-3 font-mono text-[#0066CC]">Zarinpal (Aggregator) + Behpardakht Mellat / Saman (Direct PSP) + IDPay</td>
                  <td className="p-3 text-[#515154]">
                    Dual-gateway redundancy: Zarinpal provides instant startup onboarding and smart routing, while Direct Behpardakht Mellat PSP offers zero aggregator fee for high-ticket electronics (80M–150M Toman).
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-[#1D1D1F]">SMS & Maps</td>
                  <td className="p-3 font-mono text-[#0066CC]">Kavenegar Pattern SMS + Neshan / Balad Map SDK</td>
                  <td className="p-3 text-[#515154]">
                    Sub-3-second OTP login and order status SMS bypassing promotional blacklists; Neshan Maps provides accurate Tehran district geocoding for 3-hour Peyk courier dispatch without external sanction blocks.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Deliverable B: Sitemap & User Flows */}
      {activeId === 'sitemap-flows' && (
        <section className="space-y-6 bg-white rounded-3xl p-8 border border-black/[0.07]">
          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5 text-[#0066CC]" />
            <h2 className="text-xl font-bold text-[#1D1D1F]">
              b. Sitemap & End-to-End User Flows (Customer & Admin)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="bg-[#F5F5F7] p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-[#1D1D1F]">Customer Sitemap Hierarchy</h3>
              <ul className="space-y-2 text-[#515154]">
                <li>
                  <strong className="text-[#1D1D1F]">1. Home (`/fa` & `/en`):</strong> Campaign Hero, Category Bento (`گوشی موبایل`, `لپ‌تاپ`, `کنسول بازی`, `لوازم جانبی`), Featured Hardware, East Mobile Center Trust Banner, Instagram Feed.
                </li>
                <li>
                  <strong className="text-[#1D1D1F]">2. Catalog (`/products/[category]`):</strong> Multi-facet filter sidebar (Brand, Toman Price Slider, In-Stock toggle, Part Number ZAA/CHA), Sort bar, 3-column grid.
                </li>
                <li>
                  <strong className="text-[#1D1D1F]">3. Product Detail (`/product/[sku]`):</strong> Sticky Gallery, Color/Storage Picker, Warranty & Hamta Badge, Toman/Rial Price, Technical Specs (`مشخصات فنی`).
                </li>
                <li>
                  <strong className="text-[#1D1D1F]">4. Cart & Multi-Step Checkout (`/checkout`):</strong> Bag Review → Mobile OTP Login → Delivery Option (In-Store Pickup / Tehran Peyk / Pishtaz Post) → Shaparak Gateway Redirect → Official Receipt.
                </li>
                <li>
                  <strong className="text-[#1D1D1F]">5. Customer Account (`/account`):</strong> Order History (Jalali dates), 4-Stage Shipment Tracker, Official Tax Invoice (`فاکتور رسمی`), National ID & Sheba IBAN profile.
                </li>
              </ul>
            </div>

            <div className="bg-[#F5F5F7] p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-[#1D1D1F]">Customer & Admin Operational Flows</h3>
              <div className="space-y-3 text-[#515154]">
                <div>
                  <p className="font-bold text-[#1D1D1F]">Customer Purchase Flow:</p>
                  <p className="mt-1">
                    Landing / Search → Filter by `In Stock` & Brand → Inspect PDP (Select Finish & Verify 18m Corporate Warranty) → Add to Bag → Enter 11-digit Mobile (`09xxxxxxxxx`) & 10-digit Postal Code → Choose Delivery (`تحویل حضوری مرکز موبایل شرق` / `پیک ۳ ساعته تهران` / `پست پیشتاز`) → Pay in Rials on Zarinpal/Mellat (`Toman × 10`) → Callback `verify()` → Receive SMS Tracking Code & Printable Invoice.
                  </p>
                </div>
                <div className="pt-2 border-t border-black/[0.06]">
                  <p className="font-bold text-[#1D1D1F]">Admin Fulfillment & Inventory Flow:</p>
                  <p className="mt-1">
                    Login with 2FA Role (`Owner` or `Staff`) → Update daily Toman prices & stock counts → New Paid Order Alert → Scan device IMEI & record Hamta transfer code (`کد انتقال مالکیت همتا`) → Print Official Invoice & Postal Label → Mark `Shipped` (auto-sends SMS to customer).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Deliverable C: Page-by-Page Wireframe Descriptions */}
      {activeId === 'wireframes' && (
        <section className="space-y-6 bg-white rounded-3xl p-8 border border-black/[0.07]">
          <div className="flex items-center gap-3">
            <Layout className="w-5 h-5 text-[#0066CC]" />
            <h2 className="text-xl font-bold text-[#1D1D1F]">
              c. Page-by-Page Wireframe Blueprints (7 Core Templates)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {[
              {
                page: '1. Homepage (`خانه`)',
                zones:
                  'Top 40px Promo Bar → 3-Zone Apple-NIC Header (Brand Wordmark, 4 Category/View Links, Bag CTA) → Split 12-Col Hero (Headline + Dual CTAs on Start, Studio Hardware Render on End) → 4-Col Trust Strip → 3-Col Featured Grid → East Mobile Center Showroom + Instagram & WhatsApp/Telegram Module.',
              },
              {
                page: '2. Product Catalog (`کاتالوگ محصولات`)',
                zones:
                  'Category Segmented Tabs (`همه`, `موبایل`, `لپ‌تاپ`, `کنسول`, `جانبی`) → Horizontal Filter Bar (Persian/English Search Input, Brand Select, Toman Price Range Slider, In-Stock Checkbox, Sort Dropdown) → 3-Column Uniform Aspect-Ratio Product Grid.',
              },
              {
                page: '3. Product Detail Page — PDP (`صفحه محصول`)',
                zones:
                  '2-Column Split: Sticky Studio Product Canvas + Color Swatch Pills (`تیتانیوم طبیعی`, `مشکی فضایی`) on Start; Contiguous Purchase Module on End (Brand/SKU, Title, Toman + Rial Equivalent Box, 18-Month Corporate Warranty & Hamta Note, Key-Value Specs Table, Sticky Add-to-Bag Button).',
              },
              {
                page: '4. Shopping Cart Drawer (`سبد خرید`)',
                zones:
                  'Slide-over Sheet with 4-Step Progress Header → Itemized List with Color, Unit Toman Price, Quantity Steppers (+/-) and Delete → Discount Coupon Box (`PARS5`) → Subtotal, Shipping Preview, and Rial IPG Equivalent Footer.',
              },
              {
                page: '5. Multi-Step Checkout (`تسویه حساب`)',
                zones:
                  'Step 1: Interactive Delivery Cards (East Mobile Center Pickup = 0 Toman, Tehran 3h Courier = 95k/Free >25M, Nationwide Post = 165k + Heavy Surcharge) + Validated Recipient Form (`09xxxxxxxxx` mobile, 10-digit postal code). Step 2: Shaparak Gateway Radio Cards (Zarinpal, Behpardakht Mellat, IDPay, COD).',
              },
              {
                page: '6. Customer Account (`حساب کاربری`)',
                zones:
                  'Left 4-Col Identity Card (Legal Name, 10-Digit National ID for Hamta, 26-Char `IR` Sheba IBAN for instant refunds) → Right 8-Col Order History with Jalali Dates (`۲۷ مهر ۱۴۰۵`), 4-Stage Visual Progress Bar, and Printable Official Invoice Modal.',
              },
              {
                page: '7. Admin Dashboard (`پنل مدیریت`)',
                zones:
                  'Top RBAC Role Switcher (`Owner` vs `Staff`) → 4 KPI Metric Cards (Verified Revenue, Total Orders, Warehouse Units, Low-Stock Alert) → Tabbed Workspace for Inline Product/Price/Stock CRUD, Order Status & Label Printing, Delivery Tariffs, Shaparak Merchant Toggles, and Social/Banner CMS.',
              },
            ].map((wf, i) => (
              <div key={i} className="p-4 rounded-2xl bg-[#F5F5F7] border border-black/[0.04] space-y-1.5">
                <h3 className="font-bold text-[#1D1D1F] text-sm">{wf.page}</h3>
                <p className="text-[#515154] leading-relaxed">{wf.zones}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Deliverable D: Visual Design System */}
      {activeId === 'design-system' && (
        <section className="space-y-6 bg-white rounded-3xl p-8 border border-black/[0.07]">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-[#0066CC]" />
            <h2 className="text-xl font-bold text-[#1D1D1F]">
              d. Visual Design System (Apple / Apple-NIC Aesthetic)
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 text-xs">
            {[
              { name: 'Alabaster Canvas (60%)', hex: '#FBFBFD', text: '#1D1D1F' },
              { name: 'Studio Surface (30%)', hex: '#F5F5F7', text: '#1D1D1F' },
              { name: 'Obsidian Ink', hex: '#1D1D1F', text: '#FFFFFF' },
              { name: 'Muted Graphite', hex: '#6E6E73', text: '#FFFFFF' },
              { name: 'Cupertino Cobalt (10%)', hex: '#0066CC', text: '#FFFFFF' },
              { name: 'Verified Emerald', hex: '#15803D', text: '#FFFFFF' },
            ].map((swatch) => (
              <div
                key={swatch.hex}
                className="p-4 rounded-2xl border border-black/10 flex flex-col justify-between h-28"
                style={{ backgroundColor: swatch.hex, color: swatch.text }}
              >
                <span className="font-semibold text-[11px]">{swatch.name}</span>
                <span className="font-mono text-xs">{swatch.hex}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-2">
            <div className="p-5 rounded-2xl bg-[#F5F5F7] space-y-2">
              <h3 className="font-bold text-sm text-[#1D1D1F]">Typography & Numerals (2+1 Font Rule)</h3>
              <p className="text-[#515154]">
                <strong>Persian (RTL):</strong> <code className="font-mono">Vazirmatn</code> (weights 400, 500, 600, 700) with Persian numerals (`۰۱۲۳۴۵۶۷۸۹`) and `tabular-nums` alignment.
              </p>
              <p className="text-[#515154]">
                <strong>English (LTR):</strong> <code className="font-mono">Plus Jakarta Sans</code> paired with <code className="font-mono">JetBrains Mono</code> for SKUs, IMEI serials, and Shaparak Ref IDs.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#F5F5F7] space-y-2">
              <h3 className="font-bold text-sm text-[#1D1D1F]">Spatial Grid & RTL Mirroring</h3>
              <p className="text-[#515154]">
                1200px max container width, 12-column CSS Grid (`gap-6` to `gap-8`), 24px card border radius (`rounded-3xl`), and logical directional properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`) for zero-glitch RTL/LTR flipping.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Deliverable E: Database Schema */}
      {activeId === 'database-schema' && (
        <section className="space-y-6 bg-white rounded-3xl p-8 border border-black/[0.07]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-[#0066CC]" />
              <h2 className="text-xl font-bold text-[#1D1D1F]">
                e. PostgreSQL Database Schema (Products, Orders, Customers, Payments)
              </h2>
            </div>
            <button
              type="button"
              onClick={handleCopySql}
              className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-[#E8E8ED] text-xs font-semibold flex items-center gap-1.5"
            >
              {copiedSql ? <Check className="w-4 h-4 text-[#15803D]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'Copied SQL' : 'Copy DDL'}</span>
            </button>
          </div>

          <pre
            dir="ltr"
            className="bg-[#1D1D1F] text-[#F5F5F7] p-5 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed"
          >
            {POSTGRES_SCHEMA_SQL}
          </pre>
        </section>
      )}

      {/* Deliverable F: Phased Development Plan */}
      {activeId === 'phased-roadmap' && (
        <section className="space-y-6 bg-white rounded-3xl p-8 border border-black/[0.07]">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#0066CC]" />
            <h2 className="text-xl font-bold text-[#1D1D1F]">
              f. Phased Development Plan (MVP vs. Phase 2 & 3 Enhancements)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="p-5 rounded-2xl bg-[#F5F5F7] space-y-2.5">
              <p className="font-mono text-[#0066CC] font-bold">Phase 1 — MVP (Weeks 1–5)</p>
              <h3 className="text-sm font-bold text-[#1D1D1F]">Core Storefront, Checkout & Admin</h3>
              <ul className="space-y-1.5 text-[#515154]">
                <li>• Bilingual RTL/LTR catalog (Mobiles, Laptops, Consoles, Accessories)</li>
                <li>• Zarinpal + In-Store POS checkout & Kavenegar SMS OTP login</li>
                <li>• 3 Delivery modes (East Mobile Center pickup, Tehran Peyk, Pishtaz Post)</li>
                <li>• Admin Product/Price/Stock CRUD & Official Printable Invoice</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-[#F5F5F7] space-y-2.5">
              <p className="font-mono text-[#0066CC] font-bold">Phase 2 — Growth (Weeks 6–9)</p>
              <h3 className="text-sm font-bold text-[#1D1D1F]">Torob/Emalls & Direct Bank PSP</h3>
              <ul className="space-y-1.5 text-[#515154]">
                <li>• Automated `/api/torob` & `/api/emalls` live price/stock JSON endpoints</li>
                <li>• Direct Behpardakht Mellat PSP + IDPay auto-failover</li>
                <li>• Two-way sync with East Mobile Center accounting POS (Sepidar/Holoo)</li>
                <li>• Automated Instagram Graph API feed & Telegram price bot</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-[#F5F5F7] space-y-2.5">
              <p className="font-mono text-[#0066CC] font-bold">Phase 3 — Scale (Weeks 10–12)</p>
              <h3 className="text-sm font-bold text-[#1D1D1F]">BNPL Installments & Trade-In</h3>
              <ul className="space-y-1.5 text-[#515154]">
                <li>• BNPL / Installment gateways (SnappPay, Tara, AzkiVam) for laptops/phones</li>
                <li>• Online Trade-In estimator (`تعویض گوشی کارکرده با نو`)</li>
                <li>• Live Neshan map courier tracking & Hamta API barcode scanner</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Deliverable G: Risks, Iranian Compliance & Clarifying Questions */}
      {activeId === 'risks-compliance' && (
        <section className="space-y-6 bg-white rounded-3xl p-8 border border-black/[0.07]">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-[#0066CC]" />
            <h2 className="text-xl font-bold text-[#1D1D1F]">
              g. Key Risks, Legal Compliance in Iran & Clarifying Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-5 rounded-2xl bg-[#F5F5F7] space-y-2.5">
              <h3 className="text-sm font-bold text-[#1D1D1F]">Legal & Regulatory Compliance (Iran)</h3>
              <ul className="space-y-2 text-[#515154]">
                <li>
                  <strong className="text-[#1D1D1F]">1. e-Namad (`اینماد`) & Samandehi:</strong> Mandatory trust seal from E-Commerce Development Center (`مرکز توسعه تجارت الکترونیکی`) required before Shaparak issues direct PSP or Zarinpal merchant terminals.
                </li>
                <li>
                  <strong className="text-[#1D1D1F]">2. Hamta IMEI Registry (`سامانه همتا`):</strong> Every cellular device must ship with an official 18-month corporate warranty (`گارانتی ۱۸ ماهه شرکتی`) and verified IMEI transfer code recorded on the customer invoice.
                </li>
                <li>
                  <strong className="text-[#1D1D1F]">3. Electronic Commerce Law (Article 37 — `حق انصراف ۷ روزه`):</strong> 7-day return right for sealed, unactivated goods (`کالای پلمپ و رجیسترنشده`).
                </li>
                <li>
                  <strong className="text-[#1D1D1F]">4. Tax Organization (`سامانه مودیان مالیاتی`):</strong> Official invoices must support 10% VAT (`ارزش افزوده`) calculation and Buyer National ID (`کد ملی`).
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-[#F5F5F7] space-y-2.5">
              <h3 className="text-sm font-bold text-[#1D1D1F]">Primary Gateways & 3 Clarifying Questions</h3>
              <p className="text-[#515154]">
                <strong className="text-[#1D1D1F]">Primary Gateway Architecture:</strong> Tier 1 is <strong>Zarinpal</strong> (smart Shaparak routing + fast setup); Tier 2 is <strong>Behpardakht Mellat / Saman SEP</strong> (direct bank PSP with 0% aggregator commission for high-ticket orders); Tier 3 is <strong>IDPay / Zibal</strong> (backup webhook IPG) + <strong>SnappPay/AzkiVam</strong> (installments).
              </p>
              <div className="pt-2 border-t border-black/[0.06] space-y-1.5 text-[#1D1D1F]">
                <p className="font-bold">3 Clarifying Questions for ParsTech:</p>
                <p>1. Is your in-store inventory at East Mobile Center already managed in local accounting software (e.g., Holoo, Sepidar, Hesabfa) requiring real-time API sync?</p>
                <p>2. Does ParsTech already hold an active 1-Star or 2-Star e-Namad (`اینماد`) under the store owner’s tax file, or should Phase 1 include e-Namad registration?</p>
                <p>3. Given currency fluctuations in the Tehran mobile market, do you want an automated "Price Lock / Hold Timer" (e.g., 15-minute checkout lock) or a manual "Call for Price" toggle during volatile hours?</p>
              </div>
            </div>
          </div>
        </section>
      )}
      </div>
    </div>
  );
};
