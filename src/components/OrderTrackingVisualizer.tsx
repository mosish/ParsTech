import React from 'react';
import {
  Check,
  Clock,
  Cpu,
  Truck,
  PackageCheck,
  XCircle,
} from 'lucide-react';
import {
  buildOrderTrackingSteps,
  formatNumber,
  formatJalaliDate,
  type Language,
} from '../utils/commerce';
import type { OrderRecord } from '../data/storeData';

interface OrderTrackingVisualizerProps {
  lang: Language;
  order: OrderRecord;
  compact?: boolean;
}

export const OrderTrackingVisualizer: React.FC<OrderTrackingVisualizerProps> = ({
  lang,
  order,
  compact = false,
}) => {
  const isFa = lang === 'fa';
  const tracking = buildOrderTrackingSteps(order.status);

  const getStepIcon = (stepId: string, state: string) => {
    if (state === 'cancelled') return <XCircle className="w-4 h-4 text-[#B91C1C]" />;
    if (state === 'completed') return <Check className="w-4 h-4 text-white" />;

    switch (stepId) {
      case 'pending_payment':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <Cpu className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <PackageCheck className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const renderDeliveryChannel = () => {
    if (order.deliveryMethod === 'pickup') {
      return isFa ? 'تحویل حضوری در مرکز موبایل شرق' : 'In-Store Pickup (East Mobile Center)';
    }
    if (order.deliveryMethod === 'tehran_peyk') {
      return isFa ? 'پیک اختصاصی ۳ ساعته تهران' : 'Tehran 3-Hour Express Courier';
    }
    return isFa ? 'پست پیشتاز / تیپاکس ویژه شهرستان' : 'Nationwide Express Post / Tipax';
  };

  return (
    <div
      role="region"
      aria-label={
        isFa
          ? `وضعیت رهگیری سفارش ${order.orderNumber}`
          : `Order tracking status for ${order.orderNumber}`
      }
      className={
        compact
          ? 'bg-[#F5F5F7] rounded-2xl p-4 border border-black/[0.05] space-y-4'
          : 'bg-white rounded-3xl p-6 border border-black/[0.08] space-y-5'
      }
    >
      {/* Top Status Summary Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-[#6E6E73]">
            {isFa ? 'گام فعلی مرسوله:' : 'Current Order Step:'}
          </span>
          <span
            className={`px-2.5 py-1 rounded-lg font-bold ${
              tracking.isCancelled
                ? 'bg-[#B91C1C]/10 text-[#B91C1C]'
                : order.status === 'delivered'
                  ? 'bg-[#15803D]/10 text-[#15803D]'
                  : 'bg-[#0066CC]/10 text-[#0066CC]'
            }`}
          >
            {isFa ? tracking.currentStageLabelFa : tracking.currentStageLabelEn}
          </span>
          <span aria-hidden="true" className="text-[#86868B]">
            ·
          </span>
          <span className="text-[#515154] font-medium">{renderDeliveryChannel()}</span>
        </div>

        <div className="flex items-center gap-2 text-xs tabular-nums">
          <span className="text-[#6E6E73]">
            {isFa ? 'پیشرفت تحویل:' : 'Progress:'}
          </span>
          <span className="font-bold text-[#1D1D1F]">
            {formatNumber(tracking.progressPercent, lang)}%
          </span>
        </div>
      </div>

      {/* Continuous Progress Bar */}
      <div
        role="progressbar"
        aria-valuenow={tracking.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={isFa ? 'درصد پیشرفت ارسال سفارش' : 'Order delivery progress percentage'}
        className="w-full h-2 bg-black/[0.07] rounded-full overflow-hidden"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            tracking.isCancelled
              ? 'bg-[#B91C1C]'
              : order.status === 'delivered'
                ? 'bg-[#15803D]'
                : 'bg-[#0066CC]'
          }`}
          style={{ width: `${tracking.progressPercent}%` }}
        />
      </div>

      {/* 4-Step Visual Stepper Nodes ('Order Placed', 'Processing', 'In Transit', 'Delivered') */}
      <ol className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
        {tracking.steps.map((step) => {
          const isCompleted = step.state === 'completed';
          const isCurrent = step.state === 'current';
          const isCancelled = step.state === 'cancelled';

          return (
            <li
              key={step.id}
              aria-current={isCurrent ? 'step' : undefined}
              className={`rounded-2xl p-3.5 border transition-colors flex sm:flex-col items-start gap-3 sm:gap-2 ${
                isCurrent
                  ? 'bg-[#0066CC]/[0.05] border-[#0066CC]'
                  : isCompleted
                    ? 'bg-white border-black/[0.08]'
                    : isCancelled
                      ? 'bg-[#B91C1C]/[0.04] border-[#B91C1C]/30'
                      : 'bg-white/60 border-black/[0.05] opacity-65'
              }`}
            >
              <div className="flex items-center justify-between w-auto sm:w-full shrink-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                    isCompleted
                      ? 'bg-[#15803D] text-white'
                      : isCurrent
                        ? 'bg-[#0066CC] text-white'
                        : isCancelled
                          ? 'bg-[#B91C1C]/15 text-[#B91C1C]'
                          : 'bg-[#E8E8ED] text-[#6E6E73]'
                  }`}
                >
                  {getStepIcon(step.id, step.state)}
                </div>

                <span
                  className={`hidden sm:inline-block text-[11px] font-semibold tabular-nums ${
                    isCurrent
                      ? 'text-[#0066CC]'
                      : isCompleted
                        ? 'text-[#15803D]'
                        : 'text-[#86868B]'
                  }`}
                >
                  {isCompleted
                    ? isFa
                      ? 'انجام شد'
                      : 'Completed'
                    : isCurrent
                      ? isFa
                        ? 'مرحله فعلی'
                        : 'Current Step'
                      : isCancelled
                        ? isFa
                          ? 'لغو شده'
                          : 'Cancelled'
                        : `${formatNumber(step.stepNumber, lang)}/${formatNumber(4, lang)}`}
                </span>
              </div>

              <div className="space-y-0.5 min-w-0">
                <p
                  className={`text-xs font-bold ${
                    isCurrent || isCompleted ? 'text-[#1D1D1F]' : 'text-[#6E6E73]'
                  }`}
                >
                  {isFa ? step.labelFa : step.labelEn}
                </p>
                <p className="text-[11px] text-[#6E6E73] leading-snug">
                  {isFa ? step.descFa : step.descEn}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-black/[0.06] text-xs text-[#6E6E73]">
          <span>
            {isFa ? 'تاریخ ثبت سفارش:' : 'Order Date:'}{' '}
            <strong className="text-[#1D1D1F] font-semibold">
              {formatJalaliDate(order.createdAtIso, lang)}
            </strong>
          </span>
          <span>
            {isFa ? 'کد رهگیری مرسوله:' : 'Tracking Reference:'}{' '}
            <strong className="font-mono text-[#1D1D1F] font-semibold">{order.trackingCode}</strong>
          </span>
          <span>
            {isFa ? 'مقصد:' : 'Destination:'}{' '}
            <strong className="text-[#1D1D1F] font-semibold">{order.city}</strong>
          </span>
        </div>
      )}
    </div>
  );
};
