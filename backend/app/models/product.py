from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Product(Base):
  __tablename__ = "products"

  id: Mapped[int] = mapped_column(primary_key=True, index=True)
  slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
  name: Mapped[str] = mapped_column(String(255))
  darija_name: Mapped[str] = mapped_column(String(255))
  headline: Mapped[str] = mapped_column(String(255))
  subheadline: Mapped[str] = mapped_column(Text)
  description: Mapped[str] = mapped_column(Text)
  base_price: Mapped[float] = mapped_column(Numeric(10, 2), default=199)
  currency: Mapped[str] = mapped_column(String(3), default="MAD")
  is_active: Mapped[bool] = mapped_column(Boolean, default=True)
  stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
  stock_status: Mapped[str] = mapped_column(String(40), default="in_stock")
  collection_slug: Mapped[str] = mapped_column(String(120), default="home-organization", index=True)
  collection_name: Mapped[str] = mapped_column(String(160), default="تنظيم الدار")
  benefits: Mapped[list[str]] = mapped_column(JSON, default=list)
  pain_points: Mapped[list[str]] = mapped_column(JSON, default=list)
  features: Mapped[list[str]] = mapped_column(JSON, default=list)
  faqs: Mapped[list[dict]] = mapped_column(JSON, default=list)
  reviews: Mapped[list[dict]] = mapped_column(JSON, default=list)
  trust_badges: Mapped[list[str]] = mapped_column(JSON, default=list)
  cross_sells: Mapped[list[str]] = mapped_column(JSON, default=list)
  upsell_suggestion: Mapped[str | None] = mapped_column(String(160), nullable=True)
  images: Mapped[list[str]] = mapped_column(JSON, default=list)
  seo_title: Mapped[str] = mapped_column(String(255), default="")
  seo_description: Mapped[str] = mapped_column(Text, default="")
  schema_data: Mapped[dict] = mapped_column(JSON, default=dict)
  created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
  updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

  offers: Mapped[list["ProductOffer"]] = relationship(back_populates="product", cascade="all, delete-orphan")


class ProductOffer(Base):
  __tablename__ = "product_offers"

  id: Mapped[int] = mapped_column(primary_key=True)
  product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
  quantity: Mapped[int] = mapped_column(Integer)
  price: Mapped[float] = mapped_column(Numeric(10, 2))
  label: Mapped[str] = mapped_column(String(120))
  badge: Mapped[str | None] = mapped_column(String(120), nullable=True)
  savings_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
  is_default: Mapped[bool] = mapped_column(Boolean, default=False)

  product: Mapped[Product] = relationship(back_populates="offers")
