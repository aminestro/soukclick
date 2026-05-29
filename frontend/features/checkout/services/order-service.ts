import { apiClient } from "@/lib/api-client";
import type { CheckoutFormValues } from "@/lib/validators";
import type { CartItem } from "@/types/cart";
import type { CreateOrderResponse, OrderDetail } from "@/types/order";
import type { MarketingMetadata } from "@/features/analytics/services/utm-service";

export type CreateOrderInput = CheckoutFormValues & {
  items: CartItem[];
  marketing?: MarketingMetadata;
  eventId?: string;
};

export function createOrder(input: CreateOrderInput) {
  const payload = {
    full_name: input.fullName,
    phone: input.phone,
    city: input.city,
    address: input.address,
    items: input.items.map((item) => ({
      slug: item.slug,
      offer_quantity: item.offer.quantity,
    })),
    event_id: input.eventId,
    ...input.marketing,
  };

  return apiClient<CreateOrderResponse>("/api/v1/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getOrder(orderCode: string) {
  return apiClient<OrderDetail>(`/api/v1/orders/${orderCode}`);
}

export function addUpsellToOrder(orderCode: string, slug: string) {
  return apiClient<{ ok: boolean; order: OrderDetail }>(`/api/v1/orders/${orderCode}/upsell`, {
    method: "PATCH",
    body: JSON.stringify({ slug }),
  });
}
