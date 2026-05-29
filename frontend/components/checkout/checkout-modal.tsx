"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, LockKeyhole, PhoneCall, ShieldCheck, Truck, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { readMarketingMetadata } from "@/features/analytics/services/utm-service";
import { calculateCartSubtotal } from "@/features/cart/services/cart-pricing";
import { createOrder } from "@/features/checkout/services/order-service";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/validators";
import { createEventId, trackLead, trackOrderSubmitted } from "@/lib/tracking";
import { useCartStore } from "@/stores/cart-store";
import { useCheckoutStore } from "@/stores/checkout-store";

export function CheckoutModal() {
  const items = useCartStore((state) => state.items);
  const isOpen = useCheckoutStore((state) => state.isCheckoutOpen);
  const closeCheckout = useCheckoutStore((state) => state.closeCheckout);
  const openUpsell = useCheckoutStore((state) => state.openUpsell);
  const subtotal = calculateCartSubtotal(items);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      city: "",
      address: "",
    },
  });

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order, variables) => {
      trackOrderSubmitted({
        orderCode: order.public_order_id,
        eventId: variables.eventId,
        value: order.total,
        city: variables.city,
        phone: variables.phone,
        items,
        marketing: variables.marketing,
      });
      const upsellSlug = items[0]?.crossSells[0] ?? null;
      closeCheckout();
      openUpsell(order.public_order_id, upsellSlug);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/50 p-0 sm:items-center sm:justify-center sm:p-4">
      <div className="grid max-h-dvh w-full overflow-y-auto rounded-t-card bg-white shadow-2xl sm:max-w-4xl sm:grid-cols-[1fr_0.85fr] sm:rounded-card" role="dialog" aria-modal="true">
        <div className="p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-brand-red">COD Checkout</p>
              <h2 className="mt-1 text-3xl font-black">كملي الطلب ديالك</h2>
              <p className="mt-2 text-sm leading-7 text-gray-600">عمري المعلومات، وفريقنا كيتاصل بك باش يأكد الطلب قبل الإرسال.</p>
            </div>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-card border" onClick={closeCheckout} aria-label="Close checkout">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            className="mt-5 grid gap-3"
            onSubmit={form.handleSubmit((values) => {
              const marketing = readMarketingMetadata();
              trackLead({ value: subtotal, items, marketing });
              mutation.mutate({ ...values, items, marketing, eventId: createEventId("CODOrderPlaced") });
            })}
          >
            <Field label="الاسم الكامل" error={form.formState.errors.fullName?.message}>
              <input className="h-12 w-full rounded-card border bg-[#fbfaf8] px-3 outline-none focus:border-brand-red focus:bg-white" {...form.register("fullName")} />
            </Field>
            <Field label="رقم الهاتف" error={form.formState.errors.phone?.message}>
              <input className="h-12 w-full rounded-card border bg-[#fbfaf8] px-3 outline-none focus:border-brand-red focus:bg-white" inputMode="tel" placeholder="06XXXXXXXX" {...form.register("phone")} />
            </Field>
            <Field label="المدينة" error={form.formState.errors.city?.message}>
              <input className="h-12 w-full rounded-card border bg-[#fbfaf8] px-3 outline-none focus:border-brand-red focus:bg-white" {...form.register("city")} />
            </Field>
            <Field label="العنوان الكامل" error={form.formState.errors.address?.message}>
              <textarea className="min-h-24 w-full rounded-card border bg-[#fbfaf8] px-3 py-2 outline-none focus:border-brand-red focus:bg-white" {...form.register("address")} />
            </Field>

            <div className="grid gap-2 rounded-card border border-dashed bg-red-50 p-3 text-sm leading-6 text-gray-700">
              <p className="font-bold text-brand-red">عرض محدود اليوم</p>
              <p>الأداء عند الاستلام، وتأكيد الطلب قبل الإرسال.</p>
            </div>

            {mutation.error ? <p className="rounded-card bg-red-50 p-3 text-sm font-semibold text-brand-red">{mutation.error.message}</p> : null}

            <Button type="submit" className="h-12 w-full text-base" disabled={mutation.isPending || items.length === 0}>
              {mutation.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
              أكد الطلب
            </Button>
          </form>
        </div>

        <aside className="border-t bg-[#fbfaf8] p-4 md:border-r md:border-t-0 md:p-6">
          <h3 className="text-xl font-black">ملخص الطلب</h3>
          <div className="mt-4 grid gap-3">
            {items.map((item) => (
              <div key={item.productId} className="rounded-card border bg-white p-3">
                <div className="flex justify-between gap-3">
                  <span className="font-bold leading-7">{item.darijaName}</span>
                  <span className="font-black">{item.offer.price} درهم</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{item.offer.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-card bg-white p-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>المجموع الفرعي</span>
              <span>{subtotal} درهم</span>
            </div>
            <div className="mt-3 flex justify-between border-t pt-3 text-xl font-black">
              <span>المجموع</span>
              <span>{subtotal} درهم</span>
            </div>
          </div>
          <div className="mt-4 grid gap-2 text-sm leading-6 text-gray-700">
            <TrustLine icon={ShieldCheck} text="خلصي حتى توصلك السلعة" />
            <TrustLine icon={PhoneCall} text="فريقنا كيتاصل بك لتأكيد الطلب" />
            <TrustLine icon={Truck} text="توصيل لعدة مدن مغربية" />
            <TrustLine icon={LockKeyhole} text="معلوماتك محمية" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-bold">
      <span>{label}</span>
      {children}
      {error ? <span className="text-xs font-bold text-brand-red">{error}</span> : null}
    </label>
  );
}

function TrustLine({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-card bg-white p-3">
      <Icon className="h-4 w-4 text-brand-red" />
      {text}
    </div>
  );
}
