from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Order(Base):
  __tablename__ = "orders"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  public_order_id: Mapped[str] = mapped_column(String(40), unique=True, index=True)
  customer_name: Mapped[str] = mapped_column(String(255))
  phone_raw: Mapped[str] = mapped_column(String(40))
  phone_normalized: Mapped[str] = mapped_column(String(40), index=True)
  city: Mapped[str] = mapped_column(String(120))
  address: Mapped[str] = mapped_column(Text)
  subtotal: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
  delivery_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
  discount_total: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
  total: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
  currency: Mapped[str] = mapped_column(String(3), default="MAD")
  payment_method: Mapped[str] = mapped_column(String(20), default="COD")
  status: Mapped[str] = mapped_column(String(40), default="pending")
  confirmation_status: Mapped[str] = mapped_column(String(40), default="pending")
  event_id: Mapped[str | None] = mapped_column(String(160), nullable=True, index=True)
  fraud_status: Mapped[str] = mapped_column(String(40), default="pending")
  fraud_score: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
  fraud_flags: Mapped[list[str]] = mapped_column(JSON, default=list)
  fraud_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
  ip_country: Mapped[str | None] = mapped_column(String(2), nullable=True)
  is_vpn: Mapped[bool] = mapped_column(default=False)
  is_proxy: Mapped[bool] = mapped_column(default=False)
  is_hosting: Mapped[bool] = mapped_column(default=False)
  maxmind_raw: Mapped[dict | None] = mapped_column(JSON, nullable=True)
  webhook_status: Mapped[str] = mapped_column(String(40), default="pending")
  webhook_last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
  webhook_sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
  utm_source: Mapped[str | None] = mapped_column(String(255), nullable=True)
  utm_medium: Mapped[str | None] = mapped_column(String(255), nullable=True)
  utm_campaign: Mapped[str | None] = mapped_column(String(255), nullable=True)
  utm_content: Mapped[str | None] = mapped_column(String(255), nullable=True)
  utm_term: Mapped[str | None] = mapped_column(String(255), nullable=True)
  fbclid: Mapped[str | None] = mapped_column(Text, nullable=True)
  ttclid: Mapped[str | None] = mapped_column(Text, nullable=True)
  sc_click_id: Mapped[str | None] = mapped_column(Text, nullable=True)
  ip_address: Mapped[str | None] = mapped_column(String(80), nullable=True)
  user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
  created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
  updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

  items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
  __tablename__ = "order_items"

  id: Mapped[int] = mapped_column(primary_key=True)
  order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
  product_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
  product_name_snapshot: Mapped[str] = mapped_column(String(255))
  quantity: Mapped[int] = mapped_column(Integer)
  unit_price: Mapped[float] = mapped_column(Numeric(10, 2))
  total_price: Mapped[float] = mapped_column(Numeric(10, 2))
  offer_label: Mapped[str | None] = mapped_column(String(120), nullable=True)
  item_type: Mapped[str] = mapped_column(String(40), default="main")

  order: Mapped[Order] = relationship(back_populates="items")
