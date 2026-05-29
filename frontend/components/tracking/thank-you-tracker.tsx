"use client";

import { useEffect } from "react";
import { readMarketingMetadata } from "@/features/analytics/services/utm-service";
import { trackEvent } from "@/lib/tracking";

export function ThankYouTracker({ orderCode, value }: { orderCode: string; value: number }) {
  useEffect(() => {
    trackEvent("ThankYouViewed", {
      order_id: orderCode,
      value,
      currency: "MAD",
      ...readMarketingMetadata(),
    });
  }, [orderCode, value]);

  return null;
}
