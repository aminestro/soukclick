import Link from "next/link";
import { CheckCircle, MessageCircle, PhoneCall, ShieldCheck, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ThankYouTracker } from "@/components/tracking/thank-you-tracker";
import { getOrder } from "@/features/checkout/services/order-service";

export const dynamic = "force-dynamic";

type ThankYouPageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const { order: orderCode } = await searchParams;

  if (!orderCode) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-card border bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black">ما لقيناش رقم الطلب</h1>
          <p className="mt-3 leading-7 text-gray-600">رجعي للمتجر أو تواصلي معنا باش نعاونوك.</p>
          <Link href="/" className="mt-5 inline-flex rounded-card bg-brand-red px-5 py-3 font-bold text-white">
            رجعي للمتجر
          </Link>
        </div>
      </section>
    );
  }

  const order = await getOrder(orderCode);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <ThankYouTracker orderCode={order.public_order_id} value={order.total} />
      <div className="rounded-card border bg-white p-5 shadow-sm md:p-8">
        <div className="grid gap-8 md:grid-cols-[1fr_0.85fr]">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-brand-red">
              <CheckCircle className="h-8 w-8" />
            </div>
            <p className="mt-5 text-sm font-bold text-brand-red">تم تسجيل الطلب بنجاح</p>
            <h1 className="mt-2 text-4xl font-black leading-[1.25]">شكرا {order.customer_name}</h1>
            <p className="mt-4 text-lg leading-9 text-gray-600">
              توصلنا بالطلب ديالك. فريق Souk Click غادي يتاصل بيك باش يأكد المعلومات قبل الإرسال. خلي الهاتف قريب منك.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <TrustBox icon={PhoneCall} title="اتصال للتأكيد" text="قبل الإرسال" />
              <TrustBox icon={Truck} title="توصيل داخل المغرب" text="حسب المدينة" />
              <TrustBox icon={ShieldCheck} title="الدفع عند الاستلام" text="بلا مخاطرة" />
            </div>

            <div className="mt-6 rounded-card border border-dashed bg-[#fbfaf8] p-4">
              <p className="font-black">شنو غادي يوقع دابا؟</p>
              <p className="mt-2 leading-8 text-gray-600">
                غادي نعيطو ليك لتأكيد الطلب، ومن بعد كنرسلوه للتوصيل. إلا كان شي تغيير فالعنوان أو الهاتف، قوليها للفريق وقت التأكيد.
              </p>
              <button className="mt-4 inline-flex items-center gap-2 rounded-card border bg-white px-4 py-3 font-bold text-brand-red" disabled>
                <MessageCircle className="h-4 w-4" />
                WhatsApp / Contact CTA placeholder
              </button>
            </div>
          </div>

          <aside className="rounded-card bg-[#fbfaf8] p-4 md:p-5">
            <h2 className="text-2xl font-black">ملخص الطلب</h2>
            <div className="mt-4 grid gap-3 rounded-card bg-white p-4 text-sm leading-7">
              <InfoRow label="رقم الطلب" value={order.public_order_id} strong />
              <InfoRow label="الهاتف" value={order.phone_normalized} />
              <InfoRow label="المدينة" value={order.city} />
            </div>

            <div className="mt-4 grid gap-3">
              {order.items.map((item) => (
                <div key={`${item.product_name}-${item.item_type}`} className="rounded-card border bg-white p-3">
                  <div className="flex justify-between gap-3">
                    <span className="font-bold leading-7">{item.product_name}</span>
                    <span className="font-black">{item.total_price} درهم</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {item.offer_label} - الكمية: {item.quantity}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-card bg-brand-black p-4 text-white">
              <div className="flex justify-between text-sm text-gray-200">
                <span>المجموع الفرعي</span>
                <span>{order.subtotal} درهم</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-xl font-black">
                <span>المجموع</span>
                <span>{order.total} درهم</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function InfoRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className={strong ? "font-black" : "font-semibold"}>{value}</span>
    </div>
  );
}

function TrustBox({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="rounded-card border bg-white p-4">
      <Icon className="h-5 w-5 text-brand-red" />
      <p className="mt-3 font-black">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{text}</p>
    </div>
  );
}
