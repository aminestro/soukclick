"use client";

import { useEffect } from "react";
import { readMarketingMetadata } from "@/features/analytics/services/utm-service";
import { trackProductView } from "@/lib/tracking";
import type { Product } from "@/types/product";

export function ProductViewTracker({ product }: { product: Product }) {
  useEffect(() => {
    trackProductView(product, readMarketingMetadata());
  }, [product]);

  return null;
}
