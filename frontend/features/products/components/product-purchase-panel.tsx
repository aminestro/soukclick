"use client";

import { ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { OfferSelector } from "@/features/products/components/offer-selector";
import { readMarketingMetadata } from "@/features/analytics/services/utm-service";
import { trackAddToCart } from "@/lib/tracking";
import { useCartStore } from "@/stores/cart-store";
import type { Product, ProductOffer } from "@/types/product";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const defaultOffer = useMemo(() => product.offers.find((offer) => offer.is_default) ?? product.offers[0], [product.offers]);
  const [selectedOffer, setSelectedOffer] = useState<ProductOffer>(defaultOffer);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    trackAddToCart(product, selectedOffer.quantity, selectedOffer.price, readMarketingMetadata());
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      darijaName: product.darija_name,
      image: product.images[0],
      offer: selectedOffer,
      offers: product.offers,
      crossSells: product.cross_sells,
    });
  };

  return (
    <div className="rounded-card border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3 rounded-card bg-[#fbfaf8] p-3">
        <div>
          <p className="text-xs font-bold text-brand-red">العرض الأكثر اختيارا</p>
          <p className="mt-1 text-sm text-gray-600">اختاري الكمية اللي مناسبة لدارك</p>
        </div>
        <div className="rounded-full bg-brand-red px-3 py-1 text-xs font-bold text-white">COD</div>
      </div>
      <OfferSelector offers={product.offers} selectedOffer={selectedOffer} onSelect={setSelectedOffer} />
      <Button
        className="mt-4 h-12 w-full text-base"
        onClick={handleAddToCart}
      >
        <ShoppingCart className="ml-2 h-5 w-5" />
        زيدي للسلة
      </Button>
      <p className="mt-3 text-center text-sm text-gray-600">الأداء عند الاستلام، وتأكيد الطلب قبل الإرسال.</p>
    </div>
  );
}
