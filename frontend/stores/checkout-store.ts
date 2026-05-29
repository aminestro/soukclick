"use client";

import { create } from "zustand";

type CheckoutState = {
  isCheckoutOpen: boolean;
  isUpsellOpen: boolean;
  orderCode: string | null;
  upsellSlug: string | null;
  openCheckout: () => void;
  closeCheckout: () => void;
  openUpsell: (orderCode: string, upsellSlug: string | null) => void;
  closeUpsell: () => void;
  resetCheckoutFlow: () => void;
};

export const useCheckoutStore = create<CheckoutState>((set) => ({
  isCheckoutOpen: false,
  isUpsellOpen: false,
  orderCode: null,
  upsellSlug: null,
  openCheckout: () => set({ isCheckoutOpen: true }),
  closeCheckout: () => set({ isCheckoutOpen: false }),
  openUpsell: (orderCode, upsellSlug) => set({ isUpsellOpen: true, orderCode, upsellSlug }),
  closeUpsell: () => set({ isUpsellOpen: false }),
  resetCheckoutFlow: () => set({ isCheckoutOpen: false, isUpsellOpen: false, orderCode: null, upsellSlug: null }),
}));
