import { SlidersHorizontal, Truck } from "lucide-react";
import { SectionHeader } from "@/components/cro/section-header";
import { TrustStrip } from "@/components/cro/trust-strip";
import { ProductCard } from "@/features/products/components/product-card";
import { getCollectionBySlug } from "@/features/products/services/product-service";

export const dynamic = "force-dynamic";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  return (
    <div className="pb-12">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-sm font-bold text-brand-red">Souk Click Collections</p>
          <h1 className="mt-3 text-4xl font-black leading-[1.3] md:text-5xl">{collection.name}</h1>
          <p className="mt-4 max-w-2xl leading-8 text-gray-600">
            منتوجات عملية مختارة باش تعاونك تنظمي دارك وتربحي المساحة والوقت. اختاري العرض المناسب وخلصي حتى توصلك السلعة.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-card border bg-[#fbfaf8] p-4">
              <p className="text-sm font-bold">منتوجات متوفرة</p>
              <p className="mt-1 text-2xl font-black text-brand-red">{collection.products.length}</p>
            </div>
            <div className="rounded-card border bg-[#fbfaf8] p-4">
              <p className="text-sm font-bold">الدفع</p>
              <p className="mt-1 text-sm text-gray-600">عند الاستلام</p>
            </div>
            <div className="rounded-card border bg-[#fbfaf8] p-4">
              <p className="text-sm font-bold">التأكيد</p>
              <p className="mt-1 text-sm text-gray-600">عبر الهاتف</p>
            </div>
            <div className="rounded-card border bg-[#fbfaf8] p-4">
              <p className="text-sm font-bold">العروض</p>
              <p className="mt-1 text-sm text-gray-600">1 / 2 / 3 قطع</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <TrustStrip />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeader eyebrow="المنتوجات" title="اختاري الحل اللي مناسب لدارك" />
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-card border bg-white px-4 font-bold text-gray-700" disabled>
            <SlidersHorizontal className="h-4 w-4" />
            فلاتر قريبا
          </button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {collection.products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-card border bg-brand-black p-6 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-red-200">توصيل و COD</p>
              <h2 className="mt-2 text-2xl font-black">طلبي من هاد الكوليكسيون وخلصي حتى توصلك السلعة</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-card bg-white/10 px-4 py-3 text-sm font-bold">
              <Truck className="h-4 w-4" />
              فريقنا كيتاصل بك لتأكيد الطلب
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
