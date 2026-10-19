import React, { useState } from 'react';
import { Package, Search, FileText, Printer, UserCheck, Shield, Compass } from 'lucide-react';
import {
  formatToman,
  formatJalaliDate,
  formatNumber,
  type Language,
  type OrderStatus,
} from '../utils/commerce';
import type { OrderRecord } from '../data/storeData';
import { OrderTrackingVisualizer } from './OrderTrackingVisualizer';

interface AccountViewProps {
  lang: Language;
  orders: OrderRecord[];
}

export const AccountView: React.FC<AccountViewProps> = ({ lang, orders }) => {
  const isFa = lang === 'fa';
  const [trackingQuery, setTrackingQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[2]?.id ?? orders[0]?.id ?? '');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<OrderRecord | null>(null);
  const [customerProfile, setCustomerProfile] = useState({
    fullName: 'امیرحسین رضایی',
    mobile: '09123456789',
    nationalId: '0018492014',
    shebaIban: 'IR820120000000008491029384',
  });
  const [profileSaved, setProfileSaved] = useState(false);

  const activeTrackedOrder =
    orders.find((o) => o.id === selectedOrderId) ?? orders[0] ?? null;

  const filteredOrders = orders.filter((o) => {
    if (!trackingQuery.trim()) return true;
    const q = trackingQuery.trim().toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.trackingCode.toLowerCase().includes(q) ||
      o.customerMobile.includes(q)
    );
  });

  const renderStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment':
        return isFa ? 'در انتظار پرداخت' : 'Pending Payment';
      case 'processing':
        return isFa ? 'در حال آماده‌سازی و ثبت همتا' : 'Processing & Hamta Registry';
      case 'shipped':
        return isFa ? 'تحویل به پیک / پست پیشتاز' : 'Handed to Courier';
      case 'delivered':
        return isFa ? 'تحویل شده به مشتری' : 'Delivered';
      case 'cancelled':
        return isFa ? 'لغو شده' : 'Cancelled';
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/[0.08] pb-6">
        <div>
          <p className="text-xs text-[#6E6E73]">
            {isFa ? 'پنل کاربری مشتری و پیگیری مرسولات' : 'Customer Account & Order Tracking'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] mt-1">
            {isFa ? 'حساب کاربری، سوابق خرید و کد رجیستری' : 'Account, Order History & IMEI Registry'}
          </h1>
        </div>

        {/* Live Tracking Code Search */}
        <div className="relative w-full md:w-80">
          <label htmlFor="order-tracking-search" className="sr-only">
            {isFa ? 'جستجوی شماره سفارش یا کد رهگیری' : 'Search Order Number or Tracking Code'}
          </label>
          <Search className="w-4 h-4 text-[#6E6E73] absolute top-1/2 -translate-y-1/2 start-3.5" />
          <input
            id="order-tracking-search"
            type="search"
            value={trackingQuery}
            onChange={(e) => setTrackingQuery(e.target.value)}
            placeholder={
              isFa
                ? 'کد سفارش (مثلاً PT-1405-8841)...'
                : 'Search order # (e.g. PT-1405-8841)...'
            }
            className="w-full ps-10 pe-4 py-2.5 bg-[#F5F5F7] rounded-xl text-xs text-[#1D1D1F] border border-black/[0.08]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile & Sheba Refund Card */}
        <div className="lg:col-span-4 bg-[#F5F5F7] rounded-3xl p-6 space-y-5 border border-black/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1D1D1F]">{customerProfile.fullName}</h2>
              <p className="text-xs text-[#6E6E73] tabular-nums">{customerProfile.mobile}</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setProfileSaved(true);
              setTimeout(() => setProfileSaved(false), 2000);
            }}
            className="space-y-3 pt-2 border-t border-black/[0.06] text-xs"
          >
            <div>
              <label htmlFor="acc-name" className="block text-[#6E6E73] mb-1">
                {isFa ? 'نام و نام خانوادگی (جهت صدور فاکتور رسمی)' : 'Full Legal Name (For Official Invoice)'}
              </label>
              <input
                id="acc-name"
                type="text"
                value={customerProfile.fullName}
                onChange={(e) => setCustomerProfile({ ...customerProfile, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-black/10"
              />
            </div>

            <div>
              <label htmlFor="acc-nid" className="block text-[#6E6E73] mb-1">
                {isFa ? 'کد ملی ۱۰ رقمی (الزامی برای انتقال مالکیت همتا)' : '10-Digit National ID (For Hamta Transfer)'}
              </label>
              <input
                id="acc-nid"
                type="text"
                dir="ltr"
                value={customerProfile.nationalId}
                onChange={(e) => setCustomerProfile({ ...customerProfile, nationalId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 font-mono"
              />
            </div>

            <div>
              <label htmlFor="acc-sheba" className="block text-[#6E6E73] mb-1">
                {isFa ? 'شماره شبا (IR) جهت بازگشت وجه آنی' : 'Sheba IBAN (For Instant Refunds)'}
              </label>
              <input
                id="acc-sheba"
                type="text"
                dir="ltr"
                value={customerProfile.shebaIban}
                onChange={(e) => setCustomerProfile({ ...customerProfile, shebaIban: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 font-mono text-[11px]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#1D1D1F] hover:bg-black/80 text-white font-semibold transition-colors"
            >
              {profileSaved
                ? isFa
                  ? 'اطلاعات با موفقیت ذخیره شد'
                  : 'Profile Updated'
                : isFa
                  ? 'بروزرسانی اطلاعات هویتی و شبا'
                  : 'Save Identity & Sheba Details'}
            </button>
          </form>

          <div className="p-3.5 rounded-2xl bg-white border border-black/[0.05] flex items-start gap-2.5 text-[11px] text-[#515154]">
            <Shield className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
            <span>
              {isFa
                ? 'کد فعال‌سازی همتا (IMEI) برای تمام گوشی‌های خریداری‌شده به شماره سیم‌کارت ثبت‌شده در پروفایل شما منتقل می‌شود.'
                : 'Official Hamta IMEI ownership transfers are bound to the mobile SIM registered in your profile.'}
            </span>
          </div>
        </div>

        {/* Orders List & Step-by-Step Shipment Progress */}
        <div className="lg:col-span-8 space-y-6">
          {/* Featured Interactive Order Tracking Status Visualization Component */}
          {activeTrackedOrder && (
            <section
              aria-label={isFa ? 'رهگیری زنده وضعیت سفارش' : 'Live Order Status Tracker'}
              className="bg-[#F5F5F7] rounded-3xl p-6 border border-black/[0.06] space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#0066CC]" />
                    <h2 className="text-sm font-bold text-[#1D1D1F]">
                      {isFa
                        ? 'رهگیری مرحله‌به‌مرحله وضعیت سفارش (بر اساس سوابق خرید)'
                        : 'Interactive Order Tracking Status Visualization'}
                    </h2>
                  </div>
                  <span className="text-[11px] text-[#6E6E73]">
                    {isFa ? 'انتخاب سفارش:' : 'Select Order:'}
                  </span>
                </div>

                {/* Order History Selector Pills */}
                <div
                  role="tablist"
                  aria-label={isFa ? 'انتخاب سفارش جهت رهگیری' : 'Select Order to Track'}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                >
                  {orders.map((ord) => {
                    const isSelected = ord.id === activeTrackedOrder.id;
                    const shortStatus =
                      ord.status === 'delivered'
                        ? isFa
                          ? 'تحویل شده'
                          : 'Delivered'
                        : ord.status === 'shipped'
                          ? isFa
                            ? 'در مسیر ارسال'
                            : 'In Transit'
                          : ord.status === 'processing'
                            ? isFa
                              ? 'در حال پردازش'
                              : 'Processing'
                            : renderStatusLabel(ord.status);

                    return (
                      <button
                        key={ord.id}
                        role="tab"
                        aria-selected={isSelected}
                        type="button"
                        onClick={() => setSelectedOrderId(ord.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#1D1D1F] text-white shadow-xs'
                            : 'bg-white text-[#515154] hover:text-[#1D1D1F] border border-black/[0.08]'
                        }`}
                      >
                        <span className="font-mono">{ord.orderNumber}</span>
                        <span className="text-[11px] opacity-85 truncate">{shortStatus}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <OrderTrackingVisualizer lang={lang} order={activeTrackedOrder} />
            </section>
          )}

          {/* Order History Cards */}
          <div className="space-y-5">
            {filteredOrders.map((order) => {
              return (
                <article
                  key={order.id}
                  className="bg-white rounded-3xl p-6 border border-black/[0.07] space-y-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.06] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-[#6E6E73]">
                        <Package className="w-4 h-4 text-[#0066CC]" />
                        <span className="font-mono font-bold text-[#1D1D1F]">{order.orderNumber}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatJalaliDate(order.createdAtIso, lang)}</span>
                      </div>
                      <p className="text-xs font-medium text-[#1D1D1F]">
                        {isFa ? 'وضعیت فعلی:' : 'Current Status:'}{' '}
                        <span className="text-[#0066CC] font-semibold">{renderStatusLabel(order.status)}</span>
                      </p>
                    </div>

                    <div className="text-end">
                      <p className="text-sm font-bold text-[#1D1D1F] tabular-nums">
                        {formatToman(order.payableToman, lang)}
                      </p>
                      <p className="text-[11px] text-[#6E6E73]">
                        {isFa ? 'کد رهگیری:' : 'Tracking:'}{' '}
                        <span className="font-mono text-[#1D1D1F] font-medium">{order.trackingCode}</span>
                      </p>
                    </div>
                  </div>

                  {/* Step-by-Step Visual Order Tracker Component */}
                  <OrderTrackingVisualizer lang={lang} order={order} compact />

                  {/* Order Line Items */}
                  <div className="space-y-2 bg-[#F5F5F7] rounded-2xl p-4 text-xs">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4">
                      <div>
                        <span className="font-semibold text-[#1D1D1F]">
                          {isFa ? item.nameFa : item.nameEn}
                        </span>
                        <span className="text-[#6E6E73] ms-2">
                          ({isFa ? item.colorNameFa : item.colorNameEn} × {formatNumber(item.quantity, lang)})
                        </span>
                      </div>
                      <span className="font-medium text-[#1D1D1F] tabular-nums">
                        {formatToman(item.unitPriceToman * item.quantity, lang)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-[#6E6E73]">
                  <span>
                    {isFa ? 'نشانی تحویل:' : 'Destination:'} {order.city} — {order.address}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoiceOrder(order)}
                    className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#0066CC]" />
                    <span>{isFa ? 'مشاهده و چاپ فاکتور رسمی' : 'View Official Invoice'}</span>
                  </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {/* Printable Official Invoice Modal */}
      {selectedInvoiceOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 border border-black/10 space-y-6">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#1D1D1F]">
                  {isFa ? 'صورتحساب رسمی فروش کالا — پارس‌تک (مرکز موبایل شرق)' : 'Official Sales Invoice — ParsTech (East Mobile Center)'}
                </h2>
                <p className="text-xs text-[#6E6E73] mt-0.5">
                  {isFa
                    ? `شماره فاکتور: ${selectedInvoiceOrder.orderNumber} · تاریخ شمسی: ${formatJalaliDate(selectedInvoiceOrder.createdAtIso, 'fa')}`
                    : `Invoice #: ${selectedInvoiceOrder.orderNumber} · Date: ${formatJalaliDate(selectedInvoiceOrder.createdAtIso, 'en')}`}
                </p>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-[#0066CC] text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isFa ? 'چاپ فاکتور' : 'Print'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="px-3 py-2 rounded-xl bg-[#F5F5F7] text-xs font-medium"
                >
                  {isFa ? 'بستن' : 'Close'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-[#F5F5F7] p-4 rounded-2xl">
              <div>
                <p className="text-[#6E6E73]">{isFa ? 'فروشنده:' : 'Seller:'}</p>
                <p className="font-bold text-[#1D1D1F] mt-0.5">
                  {isFa ? 'فروشگاه پارس‌تک — مرکز موبایل شرق، واحد B24' : 'ParsTech Store — East Mobile Center, Unit B24'}
                </p>
                <p className="text-[#6E6E73] mt-0.5">021-77984210</p>
              </div>
              <div>
                <p className="text-[#6E6E73]">{isFa ? 'خریدار:' : 'Buyer:'}</p>
                <p className="font-bold text-[#1D1D1F] mt-0.5">{selectedInvoiceOrder.customerName}</p>
                <p className="text-[#6E6E73] mt-0.5">
                  {selectedInvoiceOrder.customerMobile} · {selectedInvoiceOrder.postalCode}
                </p>
              </div>
            </div>

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-black/10 text-[#6E6E73]">
                  <th className="py-2 text-start">{isFa ? 'شرح کالا و گارانتی' : 'Item Description'}</th>
                  <th className="py-2 text-center">{isFa ? 'تعداد' : 'Qty'}</th>
                  <th className="py-2 text-end">{isFa ? 'مبلغ کل (تومان)' : 'Total (Toman)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {selectedInvoiceOrder.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-3 font-medium text-[#1D1D1F]">
                      {isFa ? it.nameFa : it.nameEn} ({isFa ? it.colorNameFa : it.colorNameEn})
                    </td>
                    <td className="py-3 text-center tabular-nums">{formatNumber(it.quantity, lang)}</td>
                    <td className="py-3 text-end font-semibold tabular-nums">
                      {formatToman(it.unitPriceToman * it.quantity, lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-black/10 pt-4 flex justify-between items-center text-sm font-bold">
              <span>{isFa ? 'جمع کل قابل پرداخت (به همراه هزینه ارسال):' : 'Grand Total Paid:'}</span>
              <span className="text-[#0066CC] tabular-nums">
                {formatToman(selectedInvoiceOrder.payableToman, lang)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
