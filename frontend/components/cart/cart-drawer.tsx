"use client";

import { Gift, ShieldCheck, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readMarketingMetadata } from "@/features/analytics/services/utm-service";
import { calculateCartSubtotal } from "@/features/cart/services/cart-pricing";
import { trackCheckoutStart } from "@/lib/tracking";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useCheckoutStore } from "@/stores/checkout-store";
import type { ProductOffer } from "@/types/product";

const freeDeliveryThreshold = 349;

export function CartDrawer() {
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateOffer = useCartStore((state) => state.updateOffer);
  const openCheckout = useCheckoutStore((state) => state.openCheckout);
  const subtotal = calculateCartSubtotal(items);
  const crossSells = [...new Set(items.flatMap((item) => item.crossSells))];
  const progress = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));
  const remaining = Math.max(0, freeDeliveryThreshold - subtotal);
  const handleCheckout = () => {
    trackCheckoutStart(items, subtotal, readMarketingMetadata());
    openCheckout();
  };

  return (
    <>
      <div
        className={cn("fixed inset-0 z-50 bg-black/40 transition-opacity", isOpen ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={closeCart}
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-r bg-white shadow-2xl transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!isOpen}
      >
        <div className="border-b bg-brand-black p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">السلة ديالك</h2>
              <p className="mt-1 text-sm text-gray-200">طلبي بسهولة وخلصي عند الاستلام</p>
            </div>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-card bg-white/10" onClick={closeCart} aria-label="Close cart">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="rounded-card bg-[#fbfaf8] p-8 text-center">
              <Gift className="mx-auto h-10 w-10 text-brand-red" />
              <p className="mt-3 font-bold">السلة فارغة دابا</p>
              <p className="mt-1 text-sm text-gray-600">رجعي للمنتوجات واختاري العرض اللي مناسبك.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-card border bg-[#fbfaf8] p-4">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>{remaining === 0 ? "وصلتي لعرض التوصيل" : `زيدي ${remaining} درهم واستافدي أكثر`}</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-brand-red transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {items.map((item) => (
                <div key={item.productId} className="rounded-card border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black leading-7">{item.darijaName}</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.offer.label} - {item.offer.price} درهم
                      </p>
                    </div>
                    <button className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-brand-red" onClick={() => removeItem(item.productId)}>
                      حذف
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {item.offers.map((offer) => (
                      <OfferButton key={offer.quantity} offer={offer} selected={offer.quantity === item.offer.quantity} onClick={() => updateOffer(item.productId, offer)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {crossSells.length > 0 ? (
            <div className="mt-5 rounded-card border bg-white p-4 shadow-sm">
              <h3 className="font-black">كتكمل مع الطلب</h3>
              <p className="mt-1 text-sm text-gray-500">اقتراحات بسيطة باش ترفعي قيمة الطلب.</p>
              <div className="mt-3 grid gap-2">
                {crossSells.slice(0, 3).map((slug) => (
                  <div key={slug} className="rounded-card bg-[#fbfaf8] p-3 text-sm font-semibold text-gray-700">
                    {slug}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid gap-2 text-sm leading-6 text-gray-700">
            <div className="flex items-center gap-2 rounded-card bg-red-50 p-3">
              <ShieldCheck className="h-4 w-4 text-brand-red" />
              الأداء عند الاستلام
            </div>
            <div className="flex items-center gap-2 rounded-card bg-red-50 p-3">
              <Truck className="h-4 w-4 text-brand-red" />
              الفريق كيتاصل بك لتأكيد الطلب
            </div>
          </div>
        </div>

        <div className="border-t bg-white p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
          <div className="rounded-card bg-[#fbfaf8] p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>المجموع الفرعي</span>
              <span>{subtotal} درهم</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-lg font-black">
              <span>المجموع</span>
              <span>{subtotal} درهم</span>
            </div>
          </div>
          <Button className="mt-4 h-12 w-full text-base" disabled={items.length === 0} onClick={handleCheckout}>
            كملي الطلب - خلصي عند الاستلام
          </Button>
          <p className="mt-2 text-center text-xs text-gray-500">معلوماتك محمية وتستعمل غير لتأكيد الطلب.</p>
        </div>
      </aside>
    </>
  );
}

function OfferButton({ offer, selected, onClick }: { offer: ProductOffer; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn("rounded-card border px-3 py-2 text-right text-sm transition", selected ? "border-brand-red bg-red-50 font-bold text-brand-red" : "border-gray-200 hover:border-brand-red")}
      onClick={onClick}
    >
      {offer.label} - {offer.price} درهم
    </button>
  );
}
