"use client";

import { create } from "zustand";
import type { CartItem } from "@/types/cart";

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateOffer: (productId: number, offer: CartItem["offer"]) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  items: [],
  isOpen: false,
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  addItem: (item) =>
    set((state) => ({
      items: [...state.items.filter((cartItem) => cartItem.productId !== item.productId), item],
      isOpen: true,
    })),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    })),
  updateOffer: (productId, offer) =>
    set((state) => ({
      items: state.items.map((item) => (item.productId === productId ? { ...item, offer } : item)),
    })),
  clearCart: () => set({ items: [], isOpen: false }),
}));
