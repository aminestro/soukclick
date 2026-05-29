"use client";

import { useEffect } from "react";
import { captureMarketingMetadataFromUrl } from "@/features/analytics/services/utm-service";

export function MarketingMetadataCapture() {
  useEffect(() => {
    captureMarketingMetadataFromUrl();
  }, []);

  return null;
}
