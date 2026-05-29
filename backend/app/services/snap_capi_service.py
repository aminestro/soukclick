from __future__ import annotations

import logging
from typing import Any

from app.core.config import settings
from app.models.order import Order

logger = logging.getLogger(__name__)


class SnapCapiService:
  platform = "snapchat"

  def enabled(self) -> bool:
    return bool(settings.snap_capi_enabled and settings.snap_pixel_id and settings.snap_access_token)

  def send_event(self, order: Order, event_name: str, event_id: str, value: float, contents: list[dict[str, Any]]) -> bool:
    if not self.enabled():
      return False

    logger.info(
      "snap_capi_placeholder_enabled",
      extra={"order_code": order.public_order_id, "event_name": event_name, "event_id": event_id, "value": value, "contents": contents},
    )
    return False
