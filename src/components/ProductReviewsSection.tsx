import React, { useState } from 'react';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Trash2,
  MessageSquarePlus,
} from 'lucide-react';
import {
  formatNumber,
  formatJalaliDate,
  validateReviewInput,
  calculateProductRatingSummary,
  canPerformAdminAction,
  type Language,
  type ProductReview,
  type AdminRole,
  type ReviewFormInput,
} from '../utils/commerce';

interface ProductReviewsSectionProps {
  lang: Language;
  productId: string;
  productName: string;
  reviews: ProductReview[];
  adminRole: AdminRole;
  isAdminAuthenticated: boolean;
  onToggleAdminAuth: (authenticated: boolean) => void;
  onSubmitReview: (review: Omit<ProductReview, 'id' | 'createdAtIso' | 'approved'>) => void;
  onToggleReviewApproval: (reviewId: string, approved: boolean) => void;
  onDeleteReview: (reviewId: string) => void;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  lang,
  productId,
  productName,
  reviews,
  adminRole,
  isAdminAuthenticated,
  onToggleAdminAuth,
  onSubmitReview,
  onToggleReviewApproval,
  onDeleteReview,
}) => {
  const isFa = lang === 'fa';
  const [form, setForm] = useState<ReviewFormInput>({
    authorName: '',
    rating: 5,
    comment: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ReviewFormInput, string>>>({});
  const [submittedNotice, setSubmittedNotice] = useState(false);

  const summary = calculateProductRatingSummary(reviews, productId);
  const allProductReviews = reviews.filter((r) => r.productId === productId);
  const canModerate = isAdminAuthenticated && canPerformAdminAction(adminRole, 'moderate_reviews');

  // Customers see only approved reviews; authenticated admins in moderation mode see all reviews (approved + pending)
  const visibleReviews = canModerate
    ? allProductReviews
    : allProductReviews.filter((r) => r.approved);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateReviewInput(form, lang);
    setFormErrors(validation.errors);
    if (!validation.valid) return;

    onSubmitReview({
      productId,
      authorName: form.authorName.trim(),
      rating: form.rating,
      comment: form.comment.trim(),
      verifiedBuyer: true,
    });

    setForm({ authorName: '', rating: 5, comment: '' });
    setFormErrors({});
    setSubmittedNotice(true);
  };

  return (
    <div className="pt-8 mt-8 border-t border-black/[0.08] space-y-8">
      {/* Top Header + Authenticated Admin Moderation Switch */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#1D1D1F]">
            {isFa ? 'امتیازات و دیدگاه‌های خریداران' : 'Customer Ratings & Reviews'}
          </h3>
          <p className="text-xs text-[#6E6E73] mt-0.5">
            {isFa
              ? `نظرات ثبت‌شده برای ${productName} پس از تایید کارشناس در این بخش نمایش داده می‌شوند.`
              : `Verified customer reviews for ${productName}, moderated by ParsTech staff.`}
          </p>
        </div>

        {/* Authenticated Admin Moderation Toggle */}
        <div className="flex items-center gap-2.5 bg-[#F5F5F7] px-3.5 py-2 rounded-xl border border-black/[0.06]">
          <ShieldCheck className="w-4 h-4 text-[#0066CC] shrink-0" />
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1D1D1F] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAdminAuthenticated}
              onChange={(e) => onToggleAdminAuth(e.target.checked)}
              className="rounded text-[#0066CC] focus:ring-[#0066CC]"
            />
            <span>
              {isFa
                ? `حالت مدیریت و تایید نظرات (${summary.pendingCount > 0 ? `${formatNumber(summary.pendingCount, 'fa')} در انتظار` : 'ادمین'})`
                : `Admin Review Approval Mode (${summary.pendingCount} pending)`}
            </span>
          </label>
        </div>
      </div>

      {/* Grid: Left/Start = Aggregate Rating + Submit Form, Right/End = Reviews List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Column 1 (5 cols): Rating Breakdown & Submit Review Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Rating Summary Box */}
          <div className="bg-[#F5F5F7] rounded-2xl p-5 border border-black/[0.05] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#1D1D1F] tabular-nums">
                    {summary.approvedCount > 0
                      ? isFa
                        ? formatNumber(summary.averageRating, 'fa')
                        : summary.averageRating.toFixed(1)
                      : '—'}
                  </span>
                  <span className="text-xs text-[#6E6E73]">
                    {isFa ? 'از ۵ ستاره' : 'out of 5'}
                  </span>
                </div>
                <p className="text-xs text-[#6E6E73] mt-1">
                  {isFa
                    ? `بر اساس ${formatNumber(summary.approvedCount, 'fa')} دیدگاه تاییدشده`
                    : `Based on ${summary.approvedCount} approved review(s)`}
                </p>
              </div>

              <div className="flex items-center gap-1" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(summary.averageRating)
                        ? 'fill-[#F59E0B] text-[#F59E0B]'
                        : 'text-black/15'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 5 to 1 Star Bars */}
            <div className="space-y-1.5 pt-2 border-t border-black/[0.06] text-[11px]">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const count = summary.distribution[star];
                const pct =
                  summary.approvedCount > 0
                    ? Math.round((count / summary.approvedCount) * 100)
                    : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-10 text-[#6E6E73] tabular-nums">
                      {formatNumber(star, lang)} ★
                    </span>
                    <div className="flex-1 h-2 bg-black/[0.07] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F59E0B] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-end text-[#6E6E73] tabular-nums">
                      {formatNumber(count, lang)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit a New Review Form */}
          <form
            onSubmit={handleFormSubmit}
            className="bg-[#F5F5F7] rounded-2xl p-5 border border-black/[0.05] space-y-4"
          >
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4 text-[#0066CC]" />
              <h4 className="text-sm font-bold text-[#1D1D1F]">
                {isFa ? 'ثبت امتیاز و دیدگاه جدید' : 'Write a Customer Review'}
              </h4>
            </div>

            {submittedNotice && (
              <div
                role="status"
                className="p-3 rounded-xl bg-[#15803D]/10 border border-[#15803D]/30 text-xs text-[#15803D] space-y-1"
              >
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {isFa
                      ? 'دیدگاه شما با موفقیت ثبت شد و در صف تایید مدیر قرار گرفت.'
                      : 'Your review has been submitted and is pending admin approval.'}
                  </span>
                </div>
                <p className="text-[11px] text-[#1D1D1F]">
                  {isFa
                    ? 'می‌توانید با فعال کردن تیک «حالت مدیریت و تایید نظرات» در بالای همین بخش، دیدگاه خود را فوراً تایید و منتشر کنید.'
                    : 'Toggle "Admin Review Approval Mode" above or visit the Admin Panel to approve and publish it immediately.'}
                </p>
              </div>
            )}

            {/* Star Selector */}
            <div>
              <span className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                {isFa ? 'امتیاز شما به این محصول:' : 'Your Star Rating:'}
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= form.rating;
                  return (
                    <button
                      key={star}
                      type="button"
                      aria-label={
                        isFa ? `امتیاز ${star} ستاره` : `Rate ${star} out of 5 stars`
                      }
                      onClick={() => setForm({ ...form, rating: star })}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                        active
                          ? 'bg-white border-[#F59E0B] text-[#1D1D1F]'
                          : 'bg-white/50 border-black/10 text-[#6E6E73]'
                      }`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          active ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#86868B]'
                        }`}
                      />
                      <span className="tabular-nums">{formatNumber(star, lang)}</span>
                    </button>
                  );
                })}
              </div>
              {formErrors.rating && (
                <p className="text-[11px] text-[#B91C1C] mt-1">{formErrors.rating}</p>
              )}
            </div>

            {/* Author Name Input */}
            <div>
              <label htmlFor="review-author-name" className="block text-xs font-medium text-[#1D1D1F] mb-1">
                {isFa ? 'نام و نام خانوادگی شما' : 'Your Name'}
              </label>
              <input
                id="review-author-name"
                type="text"
                value={form.authorName}
                onChange={(e) => {
                  setForm({ ...form, authorName: e.target.value });
                  setSubmittedNotice(false);
                }}
                placeholder={isFa ? 'مثلاً: سارا محمدی' : 'e.g. Sara Mohammadi'}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-black/10 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC]"
              />
              {formErrors.authorName && (
                <p className="text-[11px] text-[#B91C1C] mt-1">{formErrors.authorName}</p>
              )}
            </div>

            {/* Written Review Textarea */}
            <div>
              <label htmlFor="review-comment-text" className="block text-xs font-medium text-[#1D1D1F] mb-1">
                {isFa ? 'متن تجربه خرید و بررسی فنی' : 'Written Review'}
              </label>
              <textarea
                id="review-comment-text"
                rows={3}
                value={form.comment}
                onChange={(e) => {
                  setForm({ ...form, comment: e.target.value });
                  setSubmittedNotice(false);
                }}
                placeholder={
                  isFa
                    ? 'نظر خود درباره اصالت کالا، کیفیت ساخت، باتری یا سرعت ارسال پارس‌تک را بنویسید...'
                    : 'Share your experience with build quality, battery life, Hamta activation, or delivery...'
                }
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-black/10 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0066CC]"
              />
              {formErrors.comment && (
                <p className="text-[11px] text-[#B91C1C] mt-1">{formErrors.comment}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#0066CC] hover:bg-[#0055B3] text-white text-xs font-semibold transition-colors"
            >
              {isFa ? 'ثبت دیدگاه و ارسال برای تایید' : 'Submit Review'}
            </button>
          </form>
        </div>

        {/* Column 2 (7 cols): Reviews List + Admin Display Toggles */}
        <div className="lg:col-span-7 space-y-4">
          {visibleReviews.length === 0 ? (
            <div className="bg-[#F5F5F7] rounded-2xl p-8 text-center space-y-2 border border-black/[0.04]">
              <p className="text-sm font-semibold text-[#1D1D1F]">
                {isFa
                  ? 'هنوز دیدگاه تاییدشده‌ای برای این محصول منتشر نشده است.'
                  : 'No approved reviews published for this product yet.'}
              </p>
              <p className="text-xs text-[#6E6E73]">
                {isFa
                  ? 'اولین نفری باشید که تجربه خرید خود را درباره این دستگاه ثبت می‌کند.'
                  : 'Be the first customer to submit a rating and written review.'}
              </p>
            </div>
          ) : (
            visibleReviews.map((rev) => (
              <article
                key={rev.id}
                className={`rounded-2xl p-5 border transition-colors space-y-3 ${
                  rev.approved
                    ? 'bg-white border-black/[0.07]'
                    : 'bg-[#FFFBEB] border-[#F59E0B]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3 border-b border-black/[0.05] pb-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-xs font-bold text-[#1D1D1F]">{rev.authorName}</span>
                      <span aria-hidden="true" className="text-xs text-[#6E6E73]">
                        ·
                      </span>
                      <span className="text-[11px] text-[#6E6E73]">
                        {formatJalaliDate(rev.createdAtIso, lang)}
                      </span>
                      {rev.verifiedBuyer && (
                        <>
                          <span aria-hidden="true" className="text-xs text-[#6E6E73]">
                            ·
                          </span>
                          <span className="text-[11px] text-[#15803D] font-medium">
                            {isFa ? 'خریدار تاییدشده' : 'Verified Buyer'}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating
                              ? 'fill-[#F59E0B] text-[#F59E0B]'
                              : 'text-black/15'
                          }`}
                        />
                      ))}
                      <span className="text-[11px] font-semibold text-[#1D1D1F] ms-1 tabular-nums">
                        {formatNumber(rev.rating, lang)}/{formatNumber(5, lang)}
                      </span>
                    </div>
                  </div>

                  {/* Authenticated Admin Display Approval Toggle Controls */}
                  {canModerate && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        aria-pressed={rev.approved}
                        onClick={() => onToggleReviewApproval(rev.id, !rev.approved)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                          rev.approved
                            ? 'bg-[#15803D] text-white hover:bg-[#166534]'
                            : 'bg-[#1D1D1F] text-white hover:bg-black/80'
                        }`}
                      >
                        {rev.approved ? (
                          <>
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <span>{isFa ? 'تاییدشده (عمومی)' : 'Approved (Public)'}</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 shrink-0" />
                            <span>{isFa ? 'در انتظار — تایید' : 'Pending — Approve'}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        aria-label={isFa ? `حذف نظر ${rev.authorName}` : `Delete review by ${rev.authorName}`}
                        onClick={() => onDeleteReview(rev.id)}
                        className="p-1.5 rounded-lg text-[#B91C1C] hover:bg-[#B91C1C]/10 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-[#1D1D1F] leading-relaxed">{rev.comment}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
