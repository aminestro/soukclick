import type { CartItem } from "@/types/cart";

export function calculateCartSubtotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.offer.price, 0);
}
