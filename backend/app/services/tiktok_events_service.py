from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from app.core.config import settings
from app.core.security import hash_phone
from app.models.order import Order

logger = logging.getLogger(__name__)


class TikTokEventsService:
  platform = "tiktok"

  def enabled(self) -> bool:
    return bool(settings.tiktok_events_api_enabled and settings.tiktok_pixel_code and settings.tiktok_access_token)

  def send_event(self, order: Order, event_name: str, event_id: str, value: float, contents: list[dict[str, Any]]) -> bool:
    if not self.enabled():
      return False

    payload = {
      "pixel_code": settings.tiktok_pixel_code,
      "event": event_name,
      "event_id": event_id,
      "timestamp": int(time.time()),
      "context": {
        "ip": order.ip_address,
        "user_agent": order.user_agent,
        "user": {
          "phone_number": hash_phone(order.phone_normalized),
        },
      },
      "properties": {
        "currency": order.currency,
        "value": value,
        "order_id": order.public_order_id,
        "contents": contents,
      },
    }

    try:
      response = httpx.post(
        "https://business-api.tiktok.com/open_api/v1.3/pixel/track/",
        headers={"Access-Token": settings.tiktok_access_token},
        json=payload,
        timeout=5,
      )
      response.raise_for_status()
      return True
    except Exception:
      logger.exception("tiktok_events_api_failed", extra={"order_code": order.public_order_id, "event_id": event_id})
      return False
