from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.order import Order

logger = logging.getLogger(__name__)


class OrderWebhookService:
  def __init__(self, db: Session) -> None:
    self.db = db

  def send_order_if_enabled(self, order: Order) -> bool:
    if not settings.order_webhook_enabled or not settings.order_webhook_url:
      order.webhook_status = "pending"
      self.db.add(order)
      self.db.commit()
      return False

    return self.send_order(order)

  def send_order(self, order: Order, force: bool = False) -> bool:
    if not settings.order_webhook_url:
      order.webhook_status = "failed" if force else "pending"
      order.webhook_last_error = "ORDER_WEBHOOK_URL is not configured"
      self.db.add(order)
      self.db.commit()
      return False

    payload = build_order_webhook_payload(order)

    try:
      response = httpx.post(settings.order_webhook_url, json=payload, timeout=5)
      response.raise_for_status()
      order.webhook_status = "sent"
      order.webhook_last_error = None
      order.webhook_sent_at = datetime.utcnow()
      self.db.add(order)
      self.db.commit()
      return True
    except Exception as exc:
      logger.exception("order_webhook_failed", extra={"order_code": order.public_order_id})
      order.webhook_status = "failed"
      order.webhook_last_error = str(exc)[:1000]
      self.db.add(order)
      self.db.commit()
      return False


def build_order_webhook_payload(order: Order) -> dict[str, Any]:
  items = [
    {
      "product_id": item.product_id,
      "product_name": item.product_name_snapshot,
      "quantity": item.quantity,
      "unit_price": float(item.unit_price),
      "total_price": float(item.total_price),
      "offer_label": item.offer_label,
      "item_type": item.item_type,
    }
    for item in order.items
  ]
  upsell_items = [item for item in items if item["item_type"] == "upsell"]

  return {
    "order_id": order.public_order_id,
    "internal_id": order.id,
    "created_at": order.created_at.isoformat(),
    "updated_at": order.updated_at.isoformat(),
    "customer_name": order.customer_name,
    "phone_raw": order.phone_raw,
    "phone_normalized": order.phone_normalized,
    "city": order.city,
    "address": order.address,
    "products": " | ".join(item["product_name"] for item in items),
    "quantities": " | ".join(str(item["quantity"]) for item in items),
    "offer_selected": " | ".join(str(item["offer_label"] or "") for item in items),
    "upsell_status": "accepted" if upsell_items else "not_accepted",
    "upsell_items": " | ".join(item["product_name"] for item in upsell_items),
    "items": items,
    "subtotal": float(order.subtotal),
    "delivery_fee": float(order.delivery_fee),
    "discount_total": float(order.discount_total),
    "total": float(order.total),
    "currency": order.currency,
    "payment_method": order.payment_method,
    "order_status": order.status,
    "confirmation_status": order.confirmation_status,
    "webhook_status": order.webhook_status,
    "utm_source": order.utm_source,
    "utm_medium": order.utm_medium,
    "utm_campaign": order.utm_campaign,
    "utm_content": order.utm_content,
    "utm_term": order.utm_term,
    "fbclid": order.fbclid,
    "ttclid": order.ttclid,
    "sc_click_id": order.sc_click_id,
    "ip_address": order.ip_address,
    "user_agent": order.user_agent,
    "fraud_status": order.fraud_status,
    "fraud_score": float(order.fraud_score),
    "fraud_flags": order.fraud_flags,
    "fraud_reason": order.fraud_reason,
    "ip_country": order.ip_country,
    "is_vpn": order.is_vpn,
    "is_proxy": order.is_proxy,
    "is_hosting": order.is_hosting,
    "notes": "",
  }
