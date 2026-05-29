import { PackageCheck, PhoneCall, ShieldCheck, Truck } from "lucide-react";

const trustItems = [
  {
    icon: ShieldCheck,
    title: "خلصي حتى توصلك",
    text: "الأداء عند الاستلام بلا مخاطرة.",
  },
  {
    icon: PhoneCall,
    title: "تأكيد الطلب",
    text: "فريقنا كيتاصل بك قبل الإرسال.",
  },
  {
    icon: Truck,
    title: "توصيل للمغرب",
    text: "كنوصلو لعدة مدن مغربية.",
  },
  {
    icon: PackageCheck,
    title: "منتوجات عملية",
    text: "مختارة باش تعاونك كل نهار.",
  },
];

export function TrustStrip({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "grid gap-2 sm:grid-cols-2" : "grid gap-3 rounded-card border bg-white p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-4"}>
      {trustItems.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.title} className="flex items-start gap-3 rounded-card bg-[#fbfaf8] p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-brand-red">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold leading-6">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-gray-600">{item.text}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
