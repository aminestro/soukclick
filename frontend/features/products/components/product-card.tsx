import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star } from "lucide-react";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  const defaultOffer = product.offers.find((offer) => offer.is_default) ?? product.offers[0];

  return (
    <Link href={`/products/${product.slug}`} className="group block overflow-hidden rounded-card border bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-red hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-gray">
        <Image src={product.images[0]} alt={product.darija_name} fill className="object-cover" sizes="(min-width: 1024px) 25vw, 50vw" />
        <div className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-red shadow-sm">
          {product.stock_status === "limited" ? "كمية محدودة" : "متوفر"}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-brand-red">{product.collection_name}</p>
          <div className="flex items-center gap-1 text-xs font-bold text-brand-red">
            <Star className="h-3.5 w-3.5 fill-current" />
            4.8
          </div>
        </div>
        <h2 className="mt-2 min-h-14 text-lg font-black leading-7">{product.darija_name}</h2>
        <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-gray-600">{product.headline}</p>
        <div className="mt-4 flex items-end justify-between gap-3 border-t pt-4">
          <div>
            <span className="text-xs text-gray-500">ابتداء من</span>
            <p className="text-xl font-black text-brand-black">{defaultOffer?.price ?? product.base_price} درهم</p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-red">
            شوفي العرض
            <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
