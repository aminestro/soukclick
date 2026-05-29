from datetime import datetime

from pydantic import BaseModel, Field


class OrderItemCreate(BaseModel):
  slug: str
  offer_quantity: int = Field(ge=1, le=10)


class OrderCreate(BaseModel):
  full_name: str = Field(min_length=3, max_length=255)
  phone: str = Field(min_length=8, max_length=40)
  city: str = Field(min_length=2, max_length=120)
  address: str = Field(min_length=5, max_length=500)
  items: list[OrderItemCreate] = Field(min_length=1)
  event_id: str | None = None
  utm_source: str | None = None
  utm_medium: str | None = None
  utm_campaign: str | None = None
  utm_content: str | None = None
  utm_term: str | None = None
  fbclid: str | None = None
  ttclid: str | None = None
  sc_click_id: str | None = None


class OrderRead(BaseModel):
  order_id: int
  public_order_id: str
  status: str
  total: float
  currency: str = "MAD"


class OrderItemRead(BaseModel):
  product_name: str
  quantity: int
  unit_price: float
  total_price: float
  offer_label: str | None = None
  item_type: str


class OrderDetailRead(BaseModel):
  order_id: int
  public_order_id: str
  customer_name: str
  phone_normalized: str
  city: str
  address: str
  status: str
  confirmation_status: str
  webhook_status: str
  subtotal: float
  delivery_fee: float
  total: float
  currency: str = "MAD"
  items: list[OrderItemRead]
  created_at: datetime


class UpsellRequest(BaseModel):
  slug: str


class UpsellResponse(BaseModel):
  ok: bool
  order: OrderDetailRead


class ResendWebhookResponse(BaseModel):
  ok: bool
  webhook_status: str
  message: str
