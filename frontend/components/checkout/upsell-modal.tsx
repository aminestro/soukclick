"use client";

import { useMutation } from "@tanstack/react-query";
import { Clock, Gift, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { readMarketingMetadata } from "@/features/analytics/services/utm-service";
import { addUpsellToOrder } from "@/features/checkout/services/order-service";
import { trackUpsell } from "@/lib/tracking";
import { useCartStore } from "@/stores/cart-store";
import { useCheckoutStore } from "@/stores/checkout-store";

export function UpsellModal() {
  const router = useRouter();
  const isOpen = useCheckoutStore((state) => state.isUpsellOpen);
  const orderCode = useCheckoutStore((state) => state.orderCode);
  const upsellSlug = useCheckoutStore((state) => state.upsellSlug);
  const resetCheckoutFlow = useCheckoutStore((state) => state.resetCheckoutFlow);
  const clearCart = useCartStore((state) => state.clearCart);
  const [secondsLeft, setSecondsLeft] = useState(15);

  const finish = useCallback(() => {
    if (!orderCode) return;
    clearCart();
    resetCheckoutFlow();
    router.push(`/thank-you?order=${encodeURIComponent(orderCode)}`);
  }, [clearCart, orderCode, resetCheckoutFlow, router]);

  const mutation = useMutation({
    mutationFn: () => addUpsellToOrder(orderCode ?? "", upsellSlug ?? ""),
    onSuccess: () => {
      trackUpsell("accepted", { order_id: orderCode, product_slug: upsellSlug, value: 99, currency: "MAD", ...readMarketingMetadata() });
      finish();
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    trackUpsell("shown", { order_id: orderCode, product_slug: upsellSlug, value: 99, currency: "MAD", ...readMarketingMetadata() });
    const resetTimer = window.setTimeout(() => setSecondsLeft(15), 0);
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          finish();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearTimeout(resetTimer);
      window.clearInterval(interval);
    };
  }, [finish, isOpen, orderCode, upsellSlug]);

  if (!isOpen || !orderCode) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/50 p-0 sm:items-center sm:justify-center sm:p-4">
      <div className="w-full rounded-t-card bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-card">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-brand-red">
          <Gift className="h-6 w-6" />
        </div>
        <p className="mt-4 text-sm font-bold text-brand-red">عرض خاص قبل ما نرسلو الطلب</p>
        <h2 className="mt-2 text-3xl font-black leading-[1.3]">زيدي منتوج مكمل غير بـ 99 درهم</h2>
        <p className="mt-3 leading-8 text-gray-600">نفس الطلب، نفس التوصيل، ونفس الأداء عند الاستلام. هاد العرض كيبقى غير ثواني قليلة.</p>
        <div className="mt-4 flex items-center justify-between rounded-card bg-[#fbfaf8] p-4">
          <div>
            <p className="text-sm text-gray-500">المنتوج المقترح</p>
            <p className="font-bold">{upsellSlug ?? "منتوج مكمل"}</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-500">السعر</p>
            <p className="text-2xl font-black text-brand-red">99 درهم</p>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-sm font-bold text-brand-red">
          <Clock className="h-4 w-4" />
          باقي {secondsLeft} ثانية
        </div>
        {mutation.error ? <p className="mt-3 rounded-card bg-red-50 p-3 text-sm font-semibold text-brand-red">{mutation.error.message}</p> : null}
        <div className="mt-5 grid gap-3">
          <Button disabled={!upsellSlug || mutation.isPending} onClick={() => mutation.mutate()} className="h-12">
            {mutation.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
            زيديه لطلبي
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              trackUpsell("skipped", { order_id: orderCode, product_slug: upsellSlug, ...readMarketingMetadata() });
              finish();
            }}
            className="h-12"
          >
            لا شكرا، كملي الطلب
          </Button>
        </div>
      </div>
    </div>
  );
}
