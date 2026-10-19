import React, { useState, useEffect } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import {
  formatNumber,
  toggleCompareProduct,
  toggleReviewApproval,
  type Language,
  type CategoryId,
  type Product,
  type ProductReview,
  type CartItem,
  type DeliverySettings,
  type AdminRole,
} from './utils/commerce';
import {
  INITIAL_PRODUCTS,
  INITIAL_DELIVERY_SETTINGS,
  INITIAL_GATEWAYS,
  INITIAL_CMS_CONFIG,
  INITIAL_ORDERS,
  INITIAL_REVIEWS,
  type OrderRecord,
  type GatewayConfig,
  type StoreCmsConfig,
} from './data/storeData';
import { StorefrontView } from './components/StorefrontView';
import { CartCheckoutModal } from './components/CartCheckoutModal';
import { CompareModal } from './components/CompareModal';
import { AccountView } from './components/AccountView';
import { AdminView } from './components/AdminView';
import { BlueprintSpecView } from './components/BlueprintSpecView';

type ActiveWorkspace = 'storefront' | 'account' | 'admin' | 'blueprint';

export default function App() {
  const [lang, setLang] = useState<Language>('fa');
  const [activeView, setActiveView] = useState<ActiveWorkspace>('storefront');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([
    { productId: 'prod-ip16pro', quantity: 1, selectedColorHex: '#C8C2B8' },
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>(INITIAL_ORDERS);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(INITIAL_DELIVERY_SETTINGS);
  const [gateways, setGateways] = useState<GatewayConfig[]>(INITIAL_GATEWAYS);
  const [cms, setCms] = useState<StoreCmsConfig>(INITIAL_CMS_CONFIG);
  const [adminRole, setAdminRole] = useState<AdminRole>('owner');
  const [showPromoBar, setShowPromoBar] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>(['prod-ip16pro', 'prod-s25ultra']);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareLimitNotice, setCompareLimitNotice] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>(INITIAL_REVIEWS);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  const isFa = lang === 'fa';

  const handleSubmitReview = (
    newReviewInput: Omit<ProductReview, 'id' | 'createdAtIso' | 'approved'>
  ) => {
    const newReview: ProductReview = {
      ...newReviewInput,
      id: `rev-${Date.now()}`,
      createdAtIso: new Date().toISOString().slice(0, 10),
      approved: false,
    };
    setReviews((prev) => [newReview, ...prev]);
  };

  const handleToggleReviewApproval = (reviewId: string, approved: boolean) => {
    setReviews((prev) => toggleReviewApproval(prev, reviewId, approved));
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  };

  const handleToggleCompare = (productId: string) => {
    const { nextIds, limitReached } = toggleCompareProduct(compareIds, productId, 3);
    setCompareIds(nextIds);
    if (limitReached) {
      setCompareLimitNotice(true);
      setTimeout(() => setCompareLimitNotice(false), 2600);
    } else {
      setCompareLimitNotice(false);
    }
  };

  useEffect(() => {
    document.documentElement.dir = isFa ? 'rtl' : 'ltr';
    document.documentElement.lang = isFa ? 'fa' : 'en';
  }, [isFa]);

  const totalBagCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleAddToCart = (product: Product, colorHex: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(product.stockCount, item.quantity + 1), selectedColorHex: colorHex }
            : item
        );
      }
      return [...prev, { productId: product.id, quantity: 1, selectedColorHex: colorHex }];
    });
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const prod = products.find((p) => p.id === productId);
          const maxStock = prod ? prod.stockCount : 10;
          const nextQty = Math.min(maxStock, item.quantity + delta);
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        })
        .filter((x): x is CartItem => x !== null)
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleCompleteOrder = (newOrder: OrderRecord) => {
    setOrders((prev) => [newOrder, ...prev]);
    // Deduct stock levels
    setProducts((prev) =>
      prev.map((prod) => {
        const orderedItem = cart.find((c) => c.productId === prod.id);
        if (!orderedItem) return prod;
        return {
          ...prod,
          stockCount: Math.max(0, prod.stockCount - orderedItem.quantity),
        };
      })
    );
    setCart([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFD] text-[#1D1D1F]">
      {/* Slim Dismissible Top Promotional Bar (<= 40px) */}
      {showPromoBar && (
        <div className="bg-[#1D1D1F] text-[#F5F5F7] h-9 px-4 flex items-center justify-between text-[11px] no-print">
          <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between gap-4">
            <p className="truncate">{isFa ? cms.promoBannerFa : cms.promoBannerEn}</p>
            <button
              type="button"
              aria-label={isFa ? 'بستن اعلان بالای صفحه' : 'Dismiss promotional banner'}
              onClick={() => setShowPromoBar(false)}
              className="text-[#86868B] hover:text-white shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation Bar — Strict 3-Zone Contract */}
      <header className="sticky top-0 z-30 bg-[#FBFBFD]/90 backdrop-blur-md border-b border-black/[0.07] no-print">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-2 sm:gap-8 px-3 sm:px-6 py-3">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('storefront');
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-[#1D1D1F] whitespace-nowrap shrink-0"
          >
            {isFa ? 'پارس‌تک' : 'ParsTech'}
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav
            aria-label={isFa ? 'منوی اصلی' : 'Primary Navigation'}
            className="flex items-center gap-2.5 sm:gap-7 text-[11px] sm:text-sm font-medium text-[#515154] overflow-x-auto"
          >
            <button
              type="button"
              onClick={() => setActiveView('storefront')}
              className={`hover:text-[#1D1D1F] transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'storefront' ? 'text-[#1D1D1F] font-semibold underline underline-offset-8' : ''
              }`}
            >
              {isFa ? 'فروشگاه' : 'Store'}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('account')}
              className={`hover:text-[#1D1D1F] transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'account' ? 'text-[#1D1D1F] font-semibold underline underline-offset-8' : ''
              }`}
            >
              {isFa ? 'سفارش‌ها' : 'Account'}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className={`hover:text-[#1D1D1F] transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'admin' ? 'text-[#1D1D1F] font-semibold underline underline-offset-8' : ''
              }`}
            >
              {isFa ? 'مدیریت' : 'Admin'}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('blueprint')}
              className={`hover:text-[#1D1D1F] transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'blueprint' ? 'text-[#1D1D1F] font-semibold underline underline-offset-8' : ''
              }`}
            >
              {isFa ? 'مستندات' : 'Blueprint'}
            </button>
            <button
              type="button"
              aria-label={isFa ? 'تغییر زبان به انگلیسی' : 'Switch language to Persian'}
              onClick={() => setLang(isFa ? 'en' : 'fa')}
              className="hover:text-[#0066CC] transition-colors whitespace-nowrap shrink-0 font-semibold"
            >
              {isFa ? 'EN' : 'فارسی'}
            </button>
          </nav>

          {/* Zone 3: 1 primary action (Shopping Bag) */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-[#1D1D1F] rounded-xl hover:bg-black/80 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>
                {isFa
                  ? `سبد (${formatNumber(totalBagCount, 'fa')})`
                  : `Bag (${totalBagCount})`}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-1">
        {activeView === 'storefront' && (
          <StorefrontView
            lang={lang}
            products={products}
            cms={cms}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onAddToCart={handleAddToCart}
            onOpenSpecView={() => setActiveView('blueprint')}
            compareIds={compareIds}
            compareLimitNotice={compareLimitNotice}
            onToggleCompare={handleToggleCompare}
            onClearCompare={() => setCompareIds([])}
            onOpenCompareModal={() => setIsCompareOpen(true)}
            reviews={reviews}
            adminRole={adminRole}
            isAdminAuthenticated={isAdminAuthenticated}
            onToggleAdminAuth={setIsAdminAuthenticated}
            onSubmitReview={handleSubmitReview}
            onToggleReviewApproval={handleToggleReviewApproval}
            onDeleteReview={handleDeleteReview}
          />
        )}

        {activeView === 'account' && <AccountView lang={lang} orders={orders} />}

        {activeView === 'admin' && (
          <AdminView
            lang={lang}
            role={adminRole}
            onChangeRole={setAdminRole}
            products={products}
            onUpdateProducts={setProducts}
            orders={orders}
            onUpdateOrders={setOrders}
            deliverySettings={deliverySettings}
            onUpdateDeliverySettings={setDeliverySettings}
            gateways={gateways}
            onUpdateGateways={setGateways}
            cms={cms}
            onUpdateCms={setCms}
            reviews={reviews}
            onToggleReviewApproval={handleToggleReviewApproval}
            onDeleteReview={handleDeleteReview}
          />
        )}

        {activeView === 'blueprint' && <BlueprintSpecView lang={lang} />}
      </main>

      {/* Slide-over Cart & Multi-Step Checkout Modal */}
      <CartCheckoutModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        lang={lang}
        cart={cart}
        products={products}
        deliverySettings={deliverySettings}
        gateways={gateways}
        activeDiscountCode={cms.activeDiscountCode}
        activeDiscountPercent={cms.activeDiscountPercent}
        onUpdateQuantity={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onCompleteOrder={handleCompleteOrder}
      />

      {/* Side-by-Side 3-Product Specification Comparison Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        lang={lang}
        products={products}
        compareIds={compareIds}
        onSetCompareIds={setCompareIds}
        onAddToCart={handleAddToCart}
      />

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-black/[0.07] bg-[#F5F5F7] py-10 px-6 text-xs text-[#6E6E73] no-print">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="font-semibold text-[#1D1D1F]">
              {isFa
                ? 'پارس‌تک — مرکز موبایل شرق تهران (واحد B24)'
                : 'ParsTech — East Mobile Center, Tehran (Unit B24)'}
            </p>
            <p>
              {isFa
                ? 'دارای نماد اعتماد الکترونیکی (اینماد)، مجوز اتحادیه فناوران رایانه و سامانه همتا.'
                : 'Compliant with Iranian e-Namad, Samandehi, and Hamta Official IMEI Registry.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveView('storefront')}
              className="hover:text-[#1D1D1F]"
            >
              {isFa ? 'کاتالوگ محصولات' : 'Catalog'}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('account')}
              className="hover:text-[#1D1D1F]"
            >
              {isFa ? 'پیگیری مرسوله' : 'Order Tracking'}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className="hover:text-[#1D1D1F]"
            >
              {isFa ? 'پنل مدیریت' : 'Admin Console'}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('blueprint')}
              className="hover:text-[#1D1D1F]"
            >
              {isFa ? 'مستندات معماری (a–g)' : 'Spec Blueprint (a–g)'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
