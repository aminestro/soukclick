import Image from "next/image";
import Link from "next/link";
import { CheckCircle, Home, PhoneCall, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { SectionHeader } from "@/components/cro/section-header";
import { TrustStrip } from "@/components/cro/trust-strip";
import { ValueCard } from "@/components/cro/value-card";
import { ReviewCard } from "@/components/cro/review-card";
import { ProductCard } from "@/features/products/components/product-card";
import { getProducts } from "@/features/products/services/product-service";

export const dynamic = "force-dynamic";

const faqs = [
  { question: "واش الأداء عند الاستلام؟", answer: "نعم، كتخلصي حتى توصلك السلعة وكتأكدي الطلب مع الفريق قبل الإرسال." },
  { question: "فين كتوصلو؟", answer: "كنوصلو لعدة مدن مغربية، والفريق كيتاصل بك باش يأكد المدينة والعنوان." },
  { question: "شنو إلا وصل المنتوج متضرر؟", answer: "تواصلي معنا، وكنشوفو معاك حل مناسب حسب الحالة." },
];

export default async function HomePage() {
  const products = await getProducts();
  const reviews = products.flatMap((product) => product.reviews).slice(0, 3);

  return (
    <div className="pb-12">
      <section className="border-b bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1fr_0.9fr] md:items-center md:py-16">
          <div>
            <p className="inline-flex rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-brand-red">Souk Click - سوق كليك</p>
            <h1 className="mt-5 text-4xl font-black leading-[1.25] text-brand-black md:text-6xl">رتّب دارك بلا صداع</h1>
            <p className="mt-5 max-w-xl text-lg leading-9 text-gray-600">
              حلول عملية كتعاونك تنظمي الكوزينة، المدخل، الغسيل، والحوايج اليومية. منتوجات مختارة للمغاربة، والدفع حتى توصلك السلعة.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="#featured-products" className="inline-flex h-12 items-center justify-center rounded-card bg-brand-red px-6 font-bold text-white">
                شوفي المنتوجات
              </Link>
              <Link href="/collections/home-organization" className="inline-flex h-12 items-center justify-center rounded-card border bg-white px-6 font-bold text-brand-black">
                تنظيم الدار
              </Link>
            </div>
            <div className="mt-6 grid gap-2 text-sm leading-7 text-gray-700 sm:grid-cols-3">
              <span className="inline-flex items-center gap-2"><CheckCircle className="h-4 w-4 text-brand-red" /> خلّصي عند الاستلام</span>
              <span className="inline-flex items-center gap-2"><CheckCircle className="h-4 w-4 text-brand-red" /> تأكيد عبر الهاتف</span>
              <span className="inline-flex items-center gap-2"><CheckCircle className="h-4 w-4 text-brand-red" /> عروض عائلية</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {products.slice(0, 4).map((product, index) => (
              <Link
                key={product.slug}
                href={`/products/${product.slug}`}
                className={index === 0 ? "relative col-span-2 aspect-[16/10] overflow-hidden rounded-card border bg-brand-gray md:col-span-1 md:row-span-2 md:aspect-auto" : "relative aspect-square overflow-hidden rounded-card border bg-brand-gray"}
              >
                <Image src={product.images[0]} alt={product.darija_name} fill priority={index === 0} className="object-cover" sizes="(min-width: 768px) 25vw, 50vw" />
                <div className="absolute inset-x-0 bottom-0 bg-white/90 p-3">
                  <p className="text-sm font-black">{product.darija_name}</p>
                  <p className="text-xs text-brand-red">ابتداء من 199 درهم</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <TrustStrip />
      </div>

      <section id="featured-products" className="mx-auto max-w-6xl px-4 py-12">
        <SectionHeader eyebrow="منتوجات مختارة" title="حلول عملية كتعاونك كل نهار" description="بداي بالمنتوج اللي كيحل المشكل ديالك، واختاري العرض المناسب للدار." />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeader eyebrow="المشكل والحل" title="دار صغيرة؟ كركبة كثيرة؟ الحل كيبدأ بتفاصيل بسيطة" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <ValueCard icon={Home} title="تنظيم المساحات الصغيرة" text="منتوجات كتستغل البلاصة بذكاء وكتخلي كلشي فبلاصتو." />
            <ValueCard icon={Sparkles} title="راحة فاليوميات" text="حلول كتربحك الوقت فالكوزينة، الغسيل، والمدخل." />
            <ValueCard icon={ShieldCheck} title="شراء بلا مخاطرة" text="الأداء عند الاستلام، وتأكيد الطلب قبل الإرسال." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <SectionHeader eyebrow="علاش Souk Click؟" title="براند مغربي كيركز على المنتوجات اللي عندها فائدة حقيقية" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <ValueCard icon={PhoneCall} title="فريق كيتاصل بك" text="كنأكدو الطلب باش ما يبقاش الغلط فالعنوان أو الهاتف." />
          <ValueCard icon={Truck} title="توصيل داخل المغرب" text="تجربة طلب واضحة ومناسبة للكاش أون دليفري." />
          <ValueCard icon={CheckCircle} title="اختيارات عملية" text="كل منتوج خاصو يحل مشكل واضح فدارك." />
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeader eyebrow="آراء الزبناء" title="مغاربة جربو حلول Souk Click" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard key={`${review.name}-${review.city}`} review={review} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-card border bg-brand-black p-6 text-white md:p-10">
          <div className="grid gap-8 md:grid-cols-[1fr_0.8fr] md:items-center">
            <div>
              <p className="text-sm font-bold text-red-200">COD reassurance</p>
              <h2 className="mt-2 text-3xl font-black leading-[1.35]">طلبي دابا وخلّصي حتى توصلك السلعة</h2>
              <p className="mt-4 leading-8 text-gray-200">فريقنا كيتاصل بك لتأكيد الطلب قبل الإرسال. تجربة واضحة، بسيطة، ومناسبة للتسوق فالمغرب.</p>
            </div>
            <Link href="#featured-products" className="inline-flex h-12 items-center justify-center rounded-card bg-brand-red px-6 font-bold text-white">
              اختاري المنتوج ديالك
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <SectionHeader align="center" eyebrow="FAQ" title="أسئلة قبل ما تطلبي" />
        <div className="mt-8 rounded-card border bg-white p-5 shadow-sm">
          <div className="divide-y">
            {faqs.map((faq) => (
              <details key={faq.question} className="py-4">
                <summary className="cursor-pointer list-none font-bold">{faq.question}</summary>
                <p className="mt-3 leading-7 text-gray-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
