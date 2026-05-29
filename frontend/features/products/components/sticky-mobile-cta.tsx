"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readMarketingMetadata } from "@/features/analytics/services/utm-service";
import { trackAddToCart } from "@/lib/tracking";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types/product";

export function StickyMobileCta({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const defaultOffer = product.offers.find((offer) => offer.is_default) ?? product.offers[0];

  if (!defaultOffer) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{product.darija_name}</p>
          <p className="text-xs text-gray-500">{defaultOffer.price} درهم - الأداء عند الاستلام</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            trackAddToCart(product, defaultOffer.quantity, defaultOffer.price, readMarketingMetadata());
            addItem({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              darijaName: product.darija_name,
              image: product.images[0],
              offer: defaultOffer,
              offers: product.offers,
              crossSells: product.cross_sells,
            });
          }}
        >
          <ShoppingCart className="ml-1 h-4 w-4" />
          طلبي
        </Button>
      </div>
    </div>
  );
}
