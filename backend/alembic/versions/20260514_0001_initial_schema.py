"""initial schema

Revision ID: 20260514_0001
Revises:
Create Date: 2026-05-14
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260514_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
  op.create_table(
    "products",
    sa.Column("id", sa.Integer(), primary_key=True),
    sa.Column("slug", sa.String(length=160), nullable=False),
    sa.Column("name", sa.String(length=255), nullable=False),
    sa.Column("darija_name", sa.String(length=255), nullable=False),
    sa.Column("headline", sa.String(length=255), nullable=False),
    sa.Column("subheadline", sa.Text(), nullable=False),
    sa.Column("description", sa.Text(), nullable=False),
    sa.Column("base_price", sa.Numeric(10, 2), nullable=False),
    sa.Column("currency", sa.String(length=3), nullable=False),
    sa.Column("is_active", sa.Boolean(), nullable=False),
    sa.Column("stock_quantity", sa.Integer(), nullable=False),
    sa.Column("stock_status", sa.String(length=40), nullable=False),
    sa.Column("collection_slug", sa.String(length=120), nullable=False),
    sa.Column("collection_name", sa.String(length=160), nullable=False),
    sa.Column("benefits", sa.JSON(), nullable=False),
    sa.Column("pain_points", sa.JSON(), nullable=False),
    sa.Column("features", sa.JSON(), nullable=False),
    sa.Column("faqs", sa.JSON(), nullable=False),
    sa.Column("reviews", sa.JSON(), nullable=False),
    sa.Column("trust_badges", sa.JSON(), nullable=False),
    sa.Column("cross_sells", sa.JSON(), nullable=False),
    sa.Column("upsell_suggestion", sa.String(length=160), nullable=True),
    sa.Column("images", sa.JSON(), nullable=False),
    sa.Column("seo_title", sa.String(length=255), nullable=False),
    sa.Column("seo_description", sa.Text(), nullable=False),
    sa.Column("schema_data", sa.JSON(), nullable=False),
    sa.Column("created_at", sa.DateTime(), nullable=False),
    sa.Column("updated_at", sa.DateTime(), nullable=False),
  )
  op.create_index(op.f("ix_products_id"), "products", ["id"])
  op.create_index(op.f("ix_products_collection_slug"), "products", ["collection_slug"])
  op.create_index(op.f("ix_products_slug"), "products", ["slug"], unique=True)

  op.create_table(
    "product_offers",
    sa.Column("id", sa.Integer(), primary_key=True),
    sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
    sa.Column("quantity", sa.Integer(), nullable=False),
    sa.Column("price", sa.Numeric(10, 2), nullable=False),
    sa.Column("label", sa.String(length=120), nullable=False),
    sa.Column("badge", sa.String(length=120), nullable=True),
    sa.Column("savings_text", sa.String(length=255), nullable=True),
    sa.Column("is_default", sa.Boolean(), nullable=False),
  )
  op.create_index(op.f("ix_product_offers_product_id"), "product_offers", ["product_id"])

  op.create_table(
    "orders",
    sa.Column("id", sa.Integer(), primary_key=True),
    sa.Column("public_order_id", sa.String(length=40), nullable=False),
    sa.Column("customer_name", sa.String(length=255), nullable=False),
    sa.Column("phone_raw", sa.String(length=40), nullable=False),
    sa.Column("phone_normalized", sa.String(length=40), nullable=False),
    sa.Column("city", sa.String(length=120), nullable=False),
    sa.Column("address", sa.Text(), nullable=False),
    sa.Column("subtotal", sa.Numeric(10, 2), nullable=False),
    sa.Column("delivery_fee", sa.Numeric(10, 2), nullable=False),
    sa.Column("discount_total", sa.Numeric(10, 2), nullable=False),
    sa.Column("total", sa.Numeric(10, 2), nullable=False),
    sa.Column("currency", sa.String(length=3), nullable=False),
    sa.Column("payment_method", sa.String(length=20), nullable=False),
    sa.Column("status", sa.String(length=40), nullable=False),
    sa.Column("confirmation_status", sa.String(length=40), nullable=False),
    sa.Column("event_id", sa.String(length=160), nullable=True),
    sa.Column("fraud_status", sa.String(length=40), nullable=False),
    sa.Column("fraud_score", sa.Numeric(5, 2), nullable=False),
    sa.Column("fraud_flags", sa.JSON(), nullable=False),
    sa.Column("fraud_reason", sa.Text(), nullable=True),
    sa.Column("ip_country", sa.String(length=2), nullable=True),
    sa.Column("is_vpn", sa.Boolean(), nullable=False),
    sa.Column("is_proxy", sa.Boolean(), nullable=False),
    sa.Column("is_hosting", sa.Boolean(), nullable=False),
    sa.Column("maxmind_raw", sa.JSON(), nullable=True),
    sa.Column("webhook_status", sa.String(length=40), nullable=False),
    sa.Column("webhook_last_error", sa.Text(), nullable=True),
    sa.Column("webhook_sent_at", sa.DateTime(), nullable=True),
    sa.Column("utm_source", sa.String(length=255), nullable=True),
    sa.Column("utm_medium", sa.String(length=255), nullable=True),
    sa.Column("utm_campaign", sa.String(length=255), nullable=True),
    sa.Column("utm_content", sa.String(length=255), nullable=True),
    sa.Column("utm_term", sa.String(length=255), nullable=True),
    sa.Column("fbclid", sa.Text(), nullable=True),
    sa.Column("ttclid", sa.Text(), nullable=True),
    sa.Column("sc_click_id", sa.Text(), nullable=True),
    sa.Column("ip_address", sa.String(length=80), nullable=True),
    sa.Column("user_agent", sa.Text(), nullable=True),
    sa.Column("created_at", sa.DateTime(), nullable=False),
    sa.Column("updated_at", sa.DateTime(), nullable=False),
  )
  op.create_index(op.f("ix_orders_id"), "orders", ["id"])
  op.create_index(op.f("ix_orders_event_id"), "orders", ["event_id"])
  op.create_index(op.f("ix_orders_phone_normalized"), "orders", ["phone_normalized"])
  op.create_index(op.f("ix_orders_public_order_id"), "orders", ["public_order_id"], unique=True)

  op.create_table(
    "order_items",
    sa.Column("id", sa.Integer(), primary_key=True),
    sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
    sa.Column("product_id", sa.Integer(), nullable=True),
    sa.Column("product_name_snapshot", sa.String(length=255), nullable=False),
    sa.Column("quantity", sa.Integer(), nullable=False),
    sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
    sa.Column("total_price", sa.Numeric(10, 2), nullable=False),
    sa.Column("offer_label", sa.String(length=120), nullable=True),
    sa.Column("item_type", sa.String(length=40), nullable=False),
  )
  op.create_index(op.f("ix_order_items_order_id"), "order_items", ["order_id"])

  op.create_table(
    "fraud_checks",
    sa.Column("id", sa.Integer(), primary_key=True),
    sa.Column("order_id", sa.Integer(), nullable=True),
    sa.Column("phone_normalized", sa.String(length=40), nullable=False),
    sa.Column("ip_address", sa.String(length=80), nullable=True),
    sa.Column("country_code", sa.String(length=2), nullable=True),
    sa.Column("is_vpn", sa.Boolean(), nullable=False),
    sa.Column("is_proxy", sa.Boolean(), nullable=False),
    sa.Column("is_hosting", sa.Boolean(), nullable=False),
    sa.Column("is_suspicious", sa.Boolean(), nullable=False),
    sa.Column("risk_score", sa.Float(), nullable=False),
    sa.Column("flags", sa.JSON(), nullable=False),
    sa.Column("maxmind_raw", sa.JSON(), nullable=True),
    sa.Column("decision", sa.String(length=40), nullable=False),
    sa.Column("reason", sa.String(length=255), nullable=True),
    sa.Column("created_at", sa.DateTime(), nullable=False),
  )
  op.create_index(op.f("ix_fraud_checks_order_id"), "fraud_checks", ["order_id"])
  op.create_index(op.f("ix_fraud_checks_phone_normalized"), "fraud_checks", ["phone_normalized"])

  op.create_table(
    "tracking_events",
    sa.Column("id", sa.Integer(), primary_key=True),
    sa.Column("event_id", sa.String(length=120), nullable=False),
    sa.Column("event_name", sa.String(length=80), nullable=False),
    sa.Column("order_id", sa.Integer(), nullable=True),
    sa.Column("platform", sa.String(length=40), nullable=False),
    sa.Column("payload", sa.JSON(), nullable=False),
    sa.Column("status", sa.String(length=40), nullable=False),
    sa.Column("error_message", sa.Text(), nullable=True),
    sa.Column("sent_at", sa.DateTime(), nullable=True),
    sa.Column("created_at", sa.DateTime(), nullable=False),
  )
  op.create_index(op.f("ix_tracking_events_event_id"), "tracking_events", ["event_id"], unique=True)
  op.create_index(op.f("ix_tracking_events_event_name"), "tracking_events", ["event_name"])
  op.create_index(op.f("ix_tracking_events_order_id"), "tracking_events", ["order_id"])


def downgrade() -> None:
  op.drop_table("tracking_events")
  op.drop_table("fraud_checks")
  op.drop_table("order_items")
  op.drop_table("orders")
  op.drop_table("product_offers")
  op.drop_table("products")
