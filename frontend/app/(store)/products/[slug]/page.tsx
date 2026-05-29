import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, PackageCheck, ShieldCheck, Star, Truck } from "lucide-react";
import { FaqSection } from "@/components/cro/faq-section";
import { ReviewCard } from "@/components/cro/review-card";
import { SectionHeader } from "@/components/cro/section-header";
import { TrustStrip } from "@/components/cro/trust-strip";
import { ProductCard } from "@/features/products/components/product-card";
import { ProductPurchasePanel } from "@/features/products/components/product-purchase-panel";
import { ProductViewTracker } from "@/features/products/components/product-view-tracker";
import { StickyMobileCta } from "@/features/products/components/sticky-mobile-cta";
import { getProductBySlug, getProducts } from "@/features/products/services/product-service";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  return {
    title: product.seo_title,
    description: product.seo_description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, allProducts] = await Promise.all([getProductBySlug(slug), getProducts()]);
  const crossSells = allProducts.filter((item) => product.cross_sells.includes(item.slug));

  return (
    <div className="pb-24 md:pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(product.schema_data) }} />
      <ProductViewTracker product={product} />

      <section id="top" className="border-b bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-12">
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-card border bg-brand-gray shadow-sm">
              <Image src={product.images[0]} alt={product.darija_name} fill priority className="object-cover" sizes="(min-width: 1024px) 52vw, 100vw" />
              <div className="absolute right-4 top-4 rounded-full bg-brand-red px-4 py-2 text-sm font-bold text-white">عرض محدود اليوم</div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {product.images.slice(1).map((image) => (
                <div key={image} className="relative aspect-[4/3] overflow-hidden rounded-card border bg-white">
                  <Image src={image} alt={product.darija_name} fill className="object-cover" sizes="50vw" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-sm font-bold text-brand-red">{product.collection_name}</p>
              <h1 className="mt-2 text-3xl font-black leading-[1.35] text-brand-black md:text-5xl">{product.darija_name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 text-brand-red">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-600">{product.reviews.length} تقييمات زبناء مغاربة</span>
              </div>
              <p className="mt-4 text-xl font-bold leading-9">{product.headline}</p>
              <p className="mt-3 leading-8 text-gray-600">{product.subheadline}</p>
            </div>

            <ProductPurchasePanel product={product} />

            <div className="grid gap-2 rounded-card border bg-[#fbfaf8] p-4 text-sm leading-7 text-gray-700 sm:grid-cols-2">
              {product.trust_badges.map((badge) => (
                <span key={badge} className="inline-flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-brand-red" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <TrustStrip />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div>
            <SectionHeader eyebrow="المشكل" title="واش هاد المشكل كيتعاود عندك كل نهار؟" description="هاد المنتوج مختار باش يحل مشكل واضح فالدار بطريقة بسيطة وعملية." />
            <div className="mt-5 grid gap-3">
              {product.pain_points.map((pain) => (
                <div key={pain} className="rounded-card border bg-white p-4 shadow-sm">
                  <p className="font-bold leading-7">{pain}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-card bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-brand-red">قبل / من بعد</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-card bg-[#fbfaf8] p-5">
                <p className="font-black">قبل</p>
                <p className="mt-2 text-sm leading-7 text-gray-600">كركبة، وقت ضايع، وحلول مؤقتة كتزيد الصداع.</p>
              </div>
              <div className="rounded-card bg-red-50 p-5">
                <p className="font-black text-brand-red">من بعد</p>
                <p className="mt-2 text-sm leading-7 text-gray-700">كلشي منظم، الخدمة أسهل، والدار كتبان مرتبة أكثر.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeader eyebrow="الفوائد" title="علاش غادي يعجبك هاد المنتوج؟" />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {product.benefits.map((benefit) => (
              <div key={benefit} className="rounded-card border bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-brand-red">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <p className="mt-4 font-bold leading-7">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-card border bg-white p-5 shadow-sm md:col-span-2">
            <SectionHeader eyebrow="المميزات" title="تفاصيل عملية كتفرق فالاستعمال اليومي" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {product.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 rounded-card bg-[#fbfaf8] p-3">
                  <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-brand-red" />
                  <p className="text-sm font-semibold leading-7">{feature}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-card bg-brand-black p-5 text-white shadow-sm">
            <ShieldCheck className="h-8 w-8 text-red-200" />
            <h3 className="mt-4 text-2xl font-black">طلب بلا مخاطرة</h3>
            <p className="mt-3 leading-8 text-gray-200">خلصي حتى توصلك السلعة. الفريق كيتاصل بك باش يأكد الطلب قبل الإرسال.</p>
            <div className="mt-5 flex items-center gap-2 text-sm font-bold text-red-100">
              <Truck className="h-4 w-4" />
              توصيل لجميع مدن المغرب
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeader eyebrow="تجارب الزبناء" title="شنو قالو الناس اللي جربوه؟" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {product.reviews.map((review) => (
              <ReviewCard key={`${review.name}-${review.city}`} review={review} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <FaqSection faqs={product.faqs} />
      </section>

      {crossSells.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <SectionHeader eyebrow="كتكمل معاه" title="منتوجات كتعاونك تنظمي أكثر" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {crossSells.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-card border bg-brand-red p-6 text-white md:p-10">
          <h2 className="text-3xl font-black">باقي محتاجة تفكري؟ الطلب سهل ومضمون</h2>
          <p className="mt-3 leading-8 text-red-50">اختاري العرض، زيديه للسلة، وخلي الفريق يتاصل بك لتأكيد الطلب.</p>
          <Link href="#top" className="mt-5 inline-flex rounded-card bg-white px-5 py-3 font-bold text-brand-red">
            رجعي للفوق
          </Link>
        </div>
      </section>

      <StickyMobileCta product={product} />
    </div>
  );
}
