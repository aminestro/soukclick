import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t bg-brand-black text-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="text-xl font-black">{siteConfig.name}</p>
          <p className="mt-1 text-sm text-gray-300">{siteConfig.arabicName}</p>
          <p className="mt-4 text-sm leading-7 text-gray-300">براند مغربي لحلول عملية كتعاونك تنظمي دارك وتربحي الوقت.</p>
        </div>
        <div className="text-sm leading-8 text-gray-300">
          <p className="font-bold text-white">الثقة</p>
          <p>الأداء عند الاستلام</p>
          <p>تأكيد الطلب قبل الإرسال</p>
          <p>توصيل داخل المغرب</p>
        </div>
        <div className="text-sm leading-8 text-gray-300">
          <p className="font-bold text-white">روابط</p>
          <p>Shipping policy</p>
          <p>Return policy</p>
          <p>Privacy policy</p>
        </div>
      </div>
    </footer>
  );
}
