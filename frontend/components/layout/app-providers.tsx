"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CheckoutModal } from "@/components/checkout/checkout-modal";
import { UpsellModal } from "@/components/checkout/upsell-modal";
import { MarketingMetadataCapture } from "@/components/analytics/marketing-metadata-capture";
import { PixelLoader } from "@/components/tracking/pixel-loader";

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <MarketingMetadataCapture />
      <PixelLoader />
      <CartDrawer />
      <CheckoutModal />
      <UpsellModal />
    </QueryClientProvider>
  );
}
