export type OrderStatus = "pending" | "confirmed" | "cancelled" | "fraud_review" | "blocked";

export type CreateOrderResponse = {
  order_id: number;
  public_order_id: string;
  status: OrderStatus;
  total: number;
  currency: "MAD";
};

export type OrderItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  offer_label?: string | null;
  item_type: "main" | "upsell" | string;
};

export type OrderDetail = {
  order_id: number;
  public_order_id: string;
  customer_name: string;
  phone_normalized: string;
  city: string;
  address: string;
  status: OrderStatus;
  confirmation_status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  currency: "MAD";
  items: OrderItem[];
  created_at: string;
};
