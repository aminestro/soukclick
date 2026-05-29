from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from app.core.config import settings
from app.core.security import hash_phone
from app.models.order import Order

logger = logging.getLogger(__name__)


class MetaCapiService:
  platform = "meta"

  def enabled(self) -> bool:
    return bool(settings.meta_capi_enabled and settings.meta_pixel_id and settings.meta_access_token)

  def send_event(self, order: Order, event_name: str, event_id: str, value: float, contents: list[dict[str, Any]]) -> bool:
    if not self.enabled():
      return False

    payload: dict[str, Any] = {
      "data": [
        {
          "event_name": event_name,
          "event_time": int(time.time()),
          "event_id": event_id,
          "action_source": "website",
          "event_source_url": settings.frontend_url,
          "user_data": {
            "ph": [hash_phone(order.phone_normalized)],
            "client_ip_address": order.ip_address,
            "client_user_agent": order.user_agent,
            "ct": order.city.strip().lower() if order.city else None,
          },
          "custom_data": {
            "currency": order.currency,
            "value": value,
            "order_id": order.public_order_id,
            "contents": contents,
            "content_type": "product",
          },
        }
      ]
    }

    if settings.meta_test_event_code:
      payload["test_event_code"] = settings.meta_test_event_code

    try:
      response = httpx.post(
        f"https://graph.facebook.com/v19.0/{settings.meta_pixel_id}/events",
        params={"access_token": settings.meta_access_token},
        json=payload,
        timeout=5,
      )
      response.raise_for_status()
      return True
    except Exception:
      logger.exception("meta_capi_failed", extra={"order_code": order.public_order_id, "event_id": event_id})
      return False
