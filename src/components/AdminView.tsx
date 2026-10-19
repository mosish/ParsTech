import React, { useState } from 'react';
import {
  BarChart3,
  Package,
  ShoppingCart,
  Settings,
  LayoutTemplate,
  Plus,
  Trash2,
  Lock,
  Check,
  Printer,
  MessageSquare,
  Star,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  formatToman,
  formatNumber,
  formatJalaliDate,
  canPerformAdminAction,
  type Language,
  type AdminRole,
  type Product,
  type ProductReview,
  type DeliverySettings,
  type OrderStatus,
} from '../utils/commerce';
import type { OrderRecord, GatewayConfig, StoreCmsConfig } from '../data/storeData';

interface AdminViewProps {
  lang: Language;
  role: AdminRole;
  onChangeRole: (role: AdminRole) => void;
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  orders: OrderRecord[];
  onUpdateOrders: (orders: OrderRecord[]) => void;
  deliverySettings: DeliverySettings;
  onUpdateDeliverySettings: (settings: DeliverySettings) => void;
  gateways: GatewayConfig[];
  onUpdateGateways: (gateways: GatewayConfig[]) => void;
  cms: StoreCmsConfig;
  onUpdateCms: (cms: StoreCmsConfig) => void;
  reviews: ProductReview[];
  onToggleReviewApproval: (reviewId: string, approved: boolean) => void;
  onDeleteReview: (reviewId: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  lang,
  role,
  onChangeRole,
  products,
  onUpdateProducts,
  orders,
  onUpdateOrders,
  deliverySettings,
  onUpdateDeliverySettings,
  gateways,
  onUpdateGateways,
  cms,
  onUpdateCms,
  reviews,
  onToggleReviewApproval,
  onDeleteReview,
}) => {
  const isFa = lang === 'fa';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'reviews' | 'settings' | 'cms'>('dashboard');
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  // New Product Form State
  const [newProd, setNewProd] = useState({
    sku: 'PT-IP16-128-CH',
    category: 'mobiles' as Product['category'],
    brand: 'Apple' as Product['brand'],
    nameFa: 'آیفون ۱۶ استاندارد ۱۲۸ گیگابایت',
    nameEn: 'iPhone 16 128GB Dual SIM',
    priceToman: 66500000,
    stockCount: 10,
  });

  const totalRevenueToman = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, o) => acc + o.payableToman, 0);

  const totalUnitsInStock = products.reduce((acc, p) => acc + p.stockCount, 0);
  const lowStockProducts = products.filter((p) => p.stockCount <= 4);

  const triggerSavedFeedback = (msgFa: string, msgEn: string) => {
    setSavedBanner(isFa ? msgFa : msgEn);
    setTimeout(() => setSavedBanner(null), 2200);
  };

  const handleUpdateProductField = (id: string, field: 'priceToman' | 'stockCount', value: number) => {
    const updated = products.map((p) =>
      p.id === id ? { ...p, [field]: Math.max(0, Math.round(value)) } : p
    );
    onUpdateProducts(updated);
  };

  const handleDeleteProduct = (id: string) => {
    if (!canPerformAdminAction(role, 'delete_product')) return;
    onUpdateProducts(products.filter((p) => p.id !== id));
    triggerSavedFeedback('محصول از کاتالوگ حذف شد.', 'Product removed from catalog.');
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Product = {
      id: `prod-${Date.now()}`,
      sku: newProd.sku,
      category: newProd.category,
      brand: newProd.brand,
      nameFa: newProd.nameFa,
      nameEn: newProd.nameEn,
      subtitleFa: 'پلمپ اصلی شرکتی · به همراه کد رجیستری همتا',
      subtitleEn: 'Factory Sealed · Official Hamta Registry',
      priceToman: Number(newProd.priceToman) || 10000000,
      stockCount: Number(newProd.stockCount) || 1,
      warrantyFa: '۱۸ ماه گارانتی شرکتی پارس‌تک',
      warrantyEn: '18-Month ParsTech Corporate Warranty',
      colors: [{ nameFa: 'مشکی استاندارد', nameEn: 'Black', hex: '#27272A' }],
      artworkKey:
        newProd.category === 'mobiles'
          ? 'iphone16pro'
          : newProd.category === 'laptops'
            ? 'macbookprom4'
            : newProd.category === 'consoles'
              ? 'ps5pro'
              : 'ankercharger',
      featured: true,
      specs: [
        { labelFa: 'گارانتی', labelEn: 'Warranty', valueFa: '۱۸ ماه شرکتی پارس‌تک', valueEn: '18-Month Corporate' },
      ],
    };
    onUpdateProducts([created, ...products]);
    triggerSavedFeedback('کالای جدید به فروشگاه اضافه شد.', 'New product added to storefront.');
  };

  const handleOrderStatusChange = (orderId: string, newStatus: OrderStatus) => {
    onUpdateOrders(
      orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    triggerSavedFeedback('وضعیت سفارش بروزرسانی شد.', 'Order status updated.');
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-8">
      {/* Admin Top Header & RBAC Role Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-black/[0.08] pb-6">
        <div>
          <p className="text-xs text-[#6E6E73]">
            {isFa ? 'پنل مدیریت یکپارچه فروشگاه پارس‌تک (مرکز موبایل شرق)' : 'ParsTech Store & ERP Admin Console'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] mt-1">
            {isFa ? 'مدیریت موجودی، قیمت روز، سفارش‌ها و درگاه‌ها' : 'Inventory, Orders, Gateways & CMS'}
          </h1>
        </div>

        {/* Role-Based Access Switcher (Owner vs Staff) */}
        <div className="flex items-center gap-3 bg-[#F5F5F7] p-1.5 rounded-xl border border-black/[0.06]">
          <span className="text-xs text-[#6E6E73] px-2">
            {isFa ? 'سطح دسترسی (RBAC):' : 'Active Role (RBAC):'}
          </span>
          <button
            type="button"
            onClick={() => onChangeRole('owner')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              role === 'owner' ? 'bg-[#1D1D1F] text-white' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            {isFa ? 'مدیر ارشد (Owner)' : 'Store Owner (Full Access)'}
          </button>
          <button
            type="button"
            onClick={() => onChangeRole('staff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              role === 'staff' ? 'bg-[#1D1D1F] text-white' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            {isFa ? 'کارشناس فروش (Staff)' : 'Sales Staff (Restricted)'}
          </button>
        </div>
      </div>

      {savedBanner && (
        <div className="p-3.5 rounded-xl bg-[#15803D] text-white text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{savedBanner}</span>
        </div>
      )}

      {/* Admin Sub-Navigation */}
      <div className="flex items-center gap-1 p-1 bg-[#F5F5F7] rounded-2xl overflow-x-auto">
        {[
          { id: 'dashboard', icon: BarChart3, labelFa: 'داشبورد فروش و آمار', labelEn: 'Sales Dashboard' },
          { id: 'products', icon: Package, labelFa: 'مدیریت محصولات و قیمت (CRUD)', labelEn: 'Products & Stock CRUD' },
          { id: 'orders', icon: ShoppingCart, labelFa: 'مدیریت سفارش‌ها و فاکتور', labelEn: 'Orders & Invoicing' },
          {
            id: 'reviews',
            icon: MessageSquare,
            labelFa: `تایید دیدگاه‌ها (${formatNumber(reviews.filter((r) => !r.approved).length, 'fa')})`,
            labelEn: `Reviews (${reviews.filter((r) => !r.approved).length} Pending)`,
          },
          { id: 'settings', icon: Settings, labelFa: 'تنظیمات ارسال و درگاه شاپرک', labelEn: 'Delivery & IPG Gateways' },
          { id: 'cms', icon: LayoutTemplate, labelFa: 'مدیریت محتوا و شبکه‌های اجتماعی', labelEn: 'Banners & Social CMS' },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                active ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{isFa ? tab.labelFa : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Sales & Order Overview Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#F5F5F7] p-6 rounded-2xl border border-black/[0.05]">
              <p className="text-xs text-[#6E6E73]">{isFa ? 'فروش خالص ثبت‌شده' : 'Total Verified Sales'}</p>
              <p className="text-xl font-bold text-[#1D1D1F] mt-2 tabular-nums">
                {formatToman(totalRevenueToman, lang)}
              </p>
              <p className="text-[11px] text-[#6E6E73] mt-1">
                {isFa ? 'تسویه خودکار پایا شاپرک' : 'Settled via Shaparak Paya'}
              </p>
            </div>

            <div className="bg-[#F5F5F7] p-6 rounded-2xl border border-black/[0.05]">
              <p className="text-xs text-[#6E6E73]">{isFa ? 'تعداد کل سفارش‌ها' : 'Total Orders'}</p>
              <p className="text-xl font-bold text-[#1D1D1F] mt-2 tabular-nums">
                {formatNumber(orders.length, lang)} {isFa ? 'سفارش' : 'Orders'}
              </p>
              <p className="text-[11px] text-[#6E6E73] mt-1">
                {isFa ? 'پیک تهران + پست پیشتاز + حضوری' : 'Tehran Courier + Nationwide Post'}
              </p>
            </div>

            <div className="bg-[#F5F5F7] p-6 rounded-2xl border border-black/[0.05]">
              <p className="text-xs text-[#6E6E73]">{isFa ? 'موجودی کل انبار شعبه شرق' : 'Total Units in Stock'}</p>
              <p className="text-xl font-bold text-[#1D1D1F] mt-2 tabular-nums">
                {formatNumber(totalUnitsInStock, lang)} {isFa ? 'دستگاه' : 'Units'}
              </p>
              <p className="text-[11px] text-[#6E6E73] mt-1">
                {isFa ? `در ${formatNumber(products.length, lang)} مدل کالا` : `Across ${products.length} SKUs`}
              </p>
            </div>

            <div className="bg-[#F5F5F7] p-6 rounded-2xl border border-black/[0.05]">
              <p className="text-xs text-[#6E6E73]">{isFa ? 'هشدار کسری موجودی (زیر ۴ عدد)' : 'Low Stock SKUs (<= 4)'}</p>
              <p className="text-xl font-bold text-[#B91C1C] mt-2 tabular-nums">
                {formatNumber(lowStockProducts.length, lang)} {isFa ? 'مدل' : 'SKUs'}
              </p>
              <p className="text-[11px] text-[#6E6E73] mt-1">
                {lowStockProducts.map((p) => p.brand).join(' · ') || (isFa ? 'موجودی کامل' : 'All stocked')}
              </p>
            </div>
          </div>

          {/* Recent Orders & Inventory Snapshot */}
          <div className="bg-white rounded-3xl border border-black/[0.07] p-6 space-y-4">
            <h2 className="text-base font-bold text-[#1D1D1F]">
              {isFa ? 'آخرین سفارش‌های ثبت‌شده مشتریان' : 'Latest Customer Orders'}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.08] text-[#6E6E73]">
                    <th className="py-3 text-start">{isFa ? 'شماره سفارش' : 'Order #'}</th>
                    <th className="py-3 text-start">{isFa ? 'مشتری' : 'Customer'}</th>
                    <th className="py-3 text-start">{isFa ? 'تاریخ شمسی' : 'Jalali Date'}</th>
                    <th className="py-3 text-start">{isFa ? 'درگاه پرداخت' : 'Gateway'}</th>
                    <th className="py-3 text-end">{isFa ? 'مبلغ کل' : 'Total (Toman)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05]">
                  {orders.map((ord) => (
                    <tr key={ord.id}>
                      <td className="py-3 font-mono font-semibold text-[#1D1D1F]">{ord.orderNumber}</td>
                      <td className="py-3 text-[#1D1D1F]">
                        {ord.customerName} ({ord.city})
                      </td>
                      <td className="py-3 text-[#6E6E73]">{formatJalaliDate(ord.createdAtIso, lang)}</td>
                      <td className="py-3 uppercase font-mono text-[#6E6E73]">{ord.paymentGateway}</td>
                      <td className="py-3 text-end font-bold text-[#1D1D1F] tabular-nums">
                        {formatToman(ord.payableToman, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Full Product, Price & Stock CRUD */}
      {activeTab === 'products' && (
        <div className="space-y-8">
          {/* Add New Product Form */}
          <form
            onSubmit={handleCreateProduct}
            className="bg-[#F5F5F7] rounded-3xl p-6 border border-black/[0.06] space-y-4"
          >
            <h2 className="text-sm font-bold text-[#1D1D1F] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#0066CC]" />
              <span>{isFa ? 'افزودن محصول جدید به کاتالوگ پارس‌تک' : 'Add New Hardware SKU to Catalog'}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
              <input
                type="text"
                required
                aria-label={isFa ? 'نام فارسی محصول' : 'Persian Product Name'}
                placeholder={isFa ? 'نام فارسی محصول' : 'Persian Name'}
                value={newProd.nameFa}
                onChange={(e) => setNewProd({ ...newProd, nameFa: e.target.value })}
                className="lg:col-span-2 px-3 py-2.5 rounded-xl bg-white border border-black/10"
              />
              <input
                type="text"
                required
                aria-label={isFa ? 'نام انگلیسی محصول' : 'English Product Name'}
                placeholder="English Model Name"
                value={newProd.nameEn}
                onChange={(e) => setNewProd({ ...newProd, nameEn: e.target.value })}
                className="px-3 py-2.5 rounded-xl bg-white border border-black/10"
              />
              <select
                aria-label={isFa ? 'دسته‌بندی' : 'Category'}
                value={newProd.category}
                onChange={(e) => setNewProd({ ...newProd, category: e.target.value as Product['category'] })}
                className="px-3 py-2.5 rounded-xl bg-white border border-black/10"
              >
                <option value="mobiles">{isFa ? 'موبایل' : 'Mobiles'}</option>
                <option value="laptops">{isFa ? 'لپ‌تاپ' : 'Laptops'}</option>
                <option value="consoles">{isFa ? 'کنسول بازی' : 'Game Consoles'}</option>
                <option value="accessories">{isFa ? 'لوازم جانبی' : 'Accessories'}</option>
              </select>
              <input
                type="number"
                required
                aria-label={isFa ? 'قیمت به تومان' : 'Price in Toman'}
                placeholder={isFa ? 'قیمت (تومان)' : 'Price (Toman)'}
                value={newProd.priceToman}
                onChange={(e) => setNewProd({ ...newProd, priceToman: Number(e.target.value) })}
                className="px-3 py-2.5 rounded-xl bg-white border border-black/10 tabular-nums"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0055B3] text-white font-semibold transition-colors"
              >
                {isFa ? 'ثبت محصول جدید' : 'Add Product'}
              </button>
            </div>
          </form>

          {/* Editable Product Inventory Table */}
          <div className="bg-white rounded-3xl border border-black/[0.07] p-6 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-black/[0.08] text-[#6E6E73]">
                  <th className="py-3 text-start">{isFa ? 'کد کالا / نام محصول' : 'SKU / Product Name'}</th>
                  <th className="py-3 text-start">{isFa ? 'برند' : 'Brand'}</th>
                  <th className="py-3 text-start">{isFa ? 'قیمت روز (تومان)' : 'Live Price (Toman)'}</th>
                  <th className="py-3 text-start">{isFa ? 'موجودی انبار' : 'Stock Count'}</th>
                  <th className="py-3 text-end">{isFa ? 'عملیات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {products.map((prod) => {
                  const canDelete = canPerformAdminAction(role, 'delete_product');
                  return (
                    <tr key={prod.id}>
                      <td className="py-3.5 pe-4">
                        <p className="font-semibold text-[#1D1D1F]">{isFa ? prod.nameFa : prod.nameEn}</p>
                        <p className="text-[11px] font-mono text-[#6E6E73]">{prod.sku}</p>
                      </td>
                      <td className="py-3.5 text-[#1D1D1F] font-medium">{prod.brand}</td>
                      <td className="py-3.5">
                        <input
                          type="number"
                          aria-label={`Price for ${prod.sku}`}
                          value={prod.priceToman}
                          step={100000}
                          onChange={(e) =>
                            handleUpdateProductField(prod.id, 'priceToman', Number(e.target.value))
                          }
                          className="w-36 px-2.5 py-1.5 rounded-lg bg-[#F5F5F7] border border-black/10 font-mono tabular-nums"
                        />
                      </td>
                      <td className="py-3.5">
                        <input
                          type="number"
                          aria-label={`Stock for ${prod.sku}`}
                          value={prod.stockCount}
                          onChange={(e) =>
                            handleUpdateProductField(prod.id, 'stockCount', Number(e.target.value))
                          }
                          className="w-20 px-2.5 py-1.5 rounded-lg bg-[#F5F5F7] border border-black/10 font-mono tabular-nums"
                        />
                      </td>
                      <td className="py-3.5 text-end">
                        <button
                          type="button"
                          disabled={!canDelete}
                          title={
                            canDelete
                              ? isFa
                                ? 'حذف محصول'
                                : 'Delete SKU'
                              : isFa
                                ? 'فقط مدیر ارشد مجاز به حذف کالا است'
                                : 'Only Store Owner can delete SKUs'
                          }
                          onClick={() => handleDeleteProduct(prod.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            canDelete
                              ? 'text-[#B91C1C] hover:bg-[#B91C1C]/10'
                              : 'text-black/20 cursor-not-allowed'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Order Management & Status Fulfillment */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-6 border border-black/[0.07] flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#1D1D1F]">{order.orderNumber}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#6E6E73]">{formatJalaliDate(order.createdAtIso, lang)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[#0066CC]">{order.paymentRefId}</span>
                </div>
                <p className="font-semibold text-[#1D1D1F]">
                  {order.customerName} — {order.customerMobile} ({order.city})
                </p>
                <p className="text-[#6E6E73]">{order.address}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="text-end me-2">
                  <p className="text-xs text-[#6E6E73]">{isFa ? 'مبلغ فاکتور:' : 'Total:'}</p>
                  <p className="text-sm font-bold text-[#1D1D1F] tabular-nums">
                    {formatToman(order.payableToman, lang)}
                  </p>
                </div>

                <select
                  aria-label={`Order status for ${order.orderNumber}`}
                  value={order.status}
                  onChange={(e) => handleOrderStatusChange(order.id, e.target.value as OrderStatus)}
                  className="px-3 py-2 rounded-xl bg-[#F5F5F7] border border-black/10 text-xs font-semibold text-[#1D1D1F]"
                >
                  <option value="pending_payment">{isFa ? 'در انتظار پرداخت' : 'Pending Payment'}</option>
                  <option value="processing">{isFa ? 'در حال آماده‌سازی و همتا' : 'Processing & Hamta'}</option>
                  <option value="shipped">{isFa ? 'تحویل به پیک / پست' : 'Shipped'}</option>
                  <option value="delivered">{isFa ? 'تحویل شده' : 'Delivered'}</option>
                  <option value="cancelled">{isFa ? 'لغو شده' : 'Cancelled'}</option>
                </select>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-[#1D1D1F] text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isFa ? 'چاپ لیبل پستی و فاکتور' : 'Print Label & Invoice'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3.5: Customer Reviews Moderation & Display Approval Toggles */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#F5F5F7] p-5 rounded-2xl border border-black/[0.05]">
            <div>
              <h2 className="text-base font-bold text-[#1D1D1F]">
                {isFa ? 'مدیریت و تایید نمایش دیدگاه‌های خریداران' : 'Customer Product Reviews Moderation'}
              </h2>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                {isFa
                  ? 'دیدگاه‌های تاییدشده در صفحه جزئیات محصول به صورت عمومی نمایش داده می‌شوند.'
                  : 'Toggle display approval to publish or unpublish customer reviews on the Product Detail Page.'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="font-semibold text-[#15803D]">
                {isFa
                  ? `تاییدشده: ${formatNumber(reviews.filter((r) => r.approved).length, 'fa')}`
                  : `Approved: ${reviews.filter((r) => r.approved).length}`}
              </span>
              <span className="font-semibold text-[#B45309]">
                {isFa
                  ? `در انتظار تایید: ${formatNumber(reviews.filter((r) => !r.approved).length, 'fa')}`
                  : `Pending Approval: ${reviews.filter((r) => !r.approved).length}`}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {reviews.map((rev) => {
              const prod = products.find((p) => p.id === rev.productId);
              return (
                <div
                  key={rev.id}
                  className={`rounded-2xl p-5 border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    rev.approved
                      ? 'bg-white border-black/[0.07]'
                      : 'bg-[#FFFBEB] border-[#F59E0B]/40'
                  }`}
                >
                  <div className="space-y-1.5 text-xs max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#1D1D1F]">{rev.authorName}</span>
                      <span aria-hidden="true" className="text-[#6E6E73]">·</span>
                      <span className="text-[#0066CC] font-medium">
                        {prod ? (isFa ? prod.nameFa : prod.nameEn) : rev.productId}
                      </span>
                      <span aria-hidden="true" className="text-[#6E6E73]">·</span>
                      <span className="text-[#6E6E73]">{formatJalaliDate(rev.createdAtIso, lang)}</span>
                      <span className="inline-flex items-center gap-0.5 text-[#1D1D1F] font-semibold ms-1 tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                        {formatNumber(rev.rating, lang)}/{formatNumber(5, lang)}
                      </span>
                    </div>
                    <p className="text-[#1D1D1F] leading-relaxed">{rev.comment}</p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      aria-pressed={rev.approved}
                      onClick={() => {
                        onToggleReviewApproval(rev.id, !rev.approved);
                        triggerSavedFeedback(
                          !rev.approved
                            ? 'دیدگاه تایید شد و در صفحه محصول به نمایش درآمد.'
                            : 'نمایش عمومی دیدگاه متوقف شد.',
                          !rev.approved
                            ? 'Review approved and published on PDP.'
                            : 'Review hidden from public PDP.'
                        );
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        rev.approved
                          ? 'bg-[#15803D] text-white hover:bg-[#166534]'
                          : 'bg-[#1D1D1F] text-white hover:bg-black/80'
                      }`}
                    >
                      {rev.approved ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isFa ? 'تاییدشده (نمایش فعال)' : 'Approved (Displayed)'}</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>{isFa ? 'در انتظار — تایید نمایش' : 'Pending — Approve Display'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      aria-label={isFa ? `حذف نظر ${rev.authorName}` : `Delete review by ${rev.authorName}`}
                      onClick={() => {
                        onDeleteReview(rev.id);
                        triggerSavedFeedback('دیدگاه حذف شد.', 'Review deleted.');
                      }}
                      className="p-2 rounded-xl text-[#B91C1C] hover:bg-[#B91C1C]/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Delivery Cost Rules & Shaparak Payment Gateways */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Delivery Tariffs */}
          <div className="lg:col-span-6 bg-[#F5F5F7] rounded-3xl p-6 space-y-4 border border-black/[0.05]">
            <h2 className="text-base font-bold text-[#1D1D1F]">
              {isFa ? 'تعرفه و قوانین ارسال (تهران و شهرستان)' : 'Delivery & Courier Cost Rules'}
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#6E6E73] mb-1">
                  {isFa ? 'هزینه پایه پیک فوری تهران (تومان)' : 'Tehran Express Courier Base Cost (Toman)'}
                </label>
                <input
                  type="number"
                  value={deliverySettings.tehranPeykBaseToman}
                  onChange={(e) =>
                    onUpdateDeliverySettings({
                      ...deliverySettings,
                      tehranPeykBaseToman: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[#6E6E73] mb-1">
                  {isFa ? 'سقف ارسال رایگان در تهران (تومان)' : 'Tehran Free Delivery Threshold (Toman)'}
                </label>
                <input
                  type="number"
                  value={deliverySettings.tehranFreeThresholdToman}
                  onChange={(e) =>
                    onUpdateDeliverySettings({
                      ...deliverySettings,
                      tehranFreeThresholdToman: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[#6E6E73] mb-1">
                  {isFa ? 'هزینه پایه پست پیشتاز / تیپاکس شهرستان (تومان)' : 'Nationwide Pishtaz/Tipax Base (Toman)'}
                </label>
                <input
                  type="number"
                  value={deliverySettings.iranPostBaseToman}
                  onChange={(e) =>
                    onUpdateDeliverySettings({
                      ...deliverySettings,
                      iranPostBaseToman: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Payment Gateways (Protected by RBAC Owner permission) */}
          <div className="lg:col-span-6 bg-[#F5F5F7] rounded-3xl p-6 space-y-4 border border-black/[0.05]">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1D1D1F]">
                {isFa ? 'درگاه‌های پرداخت شاپرک و تسویه در محل' : 'Iranian Payment Gateways (Shaparak)'}
              </h2>
              {!canPerformAdminAction(role, 'manage_gateways') && (
                <span className="text-[11px] text-[#B91C1C] flex items-center gap-1 font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isFa ? 'قفل برای کارشناس فروش' : 'Owner Only'}</span>
                </span>
              )}
            </div>

            <div className="space-y-3">
              {gateways.map((gw) => {
                const allowed = canPerformAdminAction(role, 'manage_gateways');
                return (
                  <div
                    key={gw.id}
                    className="p-4 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-[#1D1D1F]">{isFa ? gw.nameFa : gw.nameEn}</p>
                      <p className="font-mono text-[11px] text-[#6E6E73]">Merchant: {gw.merchantCode}</p>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!allowed}
                        checked={gw.enabled}
                        onChange={(e) =>
                          onUpdateGateways(
                            gateways.map((item) =>
                              item.id === gw.id ? { ...item, enabled: e.target.checked } : item
                            )
                          )
                        }
                        className="rounded text-[#0066CC]"
                      />
                      <span className="font-medium">{gw.enabled ? (isFa ? 'فعال' : 'Active') : isFa ? 'غیرفعال' : 'Off'}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Content & Social Media Integration CMS */}
      {activeTab === 'cms' && (
        <div className="bg-[#F5F5F7] rounded-3xl p-6 border border-black/[0.05] space-y-5 text-xs">
          <h2 className="text-base font-bold text-[#1D1D1F]">
            {isFa
              ? 'مدیریت بنر صفحه اصلی، آدرس مرکز موبایل شرق و شبکه‌های اجتماعی'
              : 'Homepage Hero, Store Contact & Social Feed CMS'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#6E6E73] mb-1">
                {isFa ? 'تیتر اصلی صفحه اول (فارسی)' : 'Hero Headline (Persian)'}
              </label>
              <input
                type="text"
                value={cms.heroTitleFa}
                onChange={(e) => onUpdateCms({ ...cms, heroTitleFa: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10"
              />
            </div>

            <div>
              <label className="block text-[#6E6E73] mb-1">
                {isFa ? 'تیتر اصلی صفحه اول (انگلیسی)' : 'Hero Headline (English)'}
              </label>
              <input
                type="text"
                value={cms.heroTitleEn}
                onChange={(e) => onUpdateCms({ ...cms, heroTitleEn: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10"
              />
            </div>

            <div>
              <label className="block text-[#6E6E73] mb-1">
                {isFa ? 'لینک صفحه اینستاگرام' : 'Instagram Profile URL'}
              </label>
              <input
                type="url"
                dir="ltr"
                value={cms.instagramUrl}
                onChange={(e) => onUpdateCms({ ...cms, instagramUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 font-mono"
              />
            </div>

            <div>
              <label className="block text-[#6E6E73] mb-1">
                {isFa ? 'کانال تلگرام قیمت روز' : 'Telegram Channel URL'}
              </label>
              <input
                type="url"
                dir="ltr"
                value={cms.telegramUrl}
                onChange={(e) => onUpdateCms({ ...cms, telegramUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 font-mono"
              />
            </div>

            <div>
              <label className="block text-[#6E6E73] mb-1">
                {isFa ? 'شماره واتس‌اپ پشتیبانی فروش' : 'WhatsApp Support Number'}
              </label>
              <input
                type="text"
                dir="ltr"
                value={cms.whatsappNumber}
                onChange={(e) => onUpdateCms({ ...cms, whatsappNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 font-mono"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2.5 font-semibold text-[#1D1D1F] cursor-pointer">
                <input
                  type="checkbox"
                  checked={cms.showInstagramWidget}
                  onChange={(e) => onUpdateCms({ ...cms, showInstagramWidget: e.target.checked })}
                  className="rounded text-[#0066CC]"
                />
                <span>
                  {isFa
                    ? 'نمایش ویجت فید اینستاگرام در صفحه اصلی فروشگاه'
                    : 'Display Live Instagram Feed Widget on Storefront'}
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
