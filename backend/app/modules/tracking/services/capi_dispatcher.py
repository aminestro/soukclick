from __future__ import annotations

from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem
from app.models.tracking import TrackingEvent
from app.services.meta_capi_service import MetaCapiService
from app.services.snap_capi_service import SnapCapiService
from app.services.tiktok_events_service import TikTokEventsService


class CapiDispatcher:
  def __init__(self, db: Session) -> None:
    self.db = db
    self.services = [MetaCapiService(), TikTokEventsService(), SnapCapiService()]

  def send_cod_order_placed(self, order: Order) -> None:
    event_id = order.event_id or f"CODOrderPlaced_{uuid4().hex}"
    contents = order_items_to_contents(order.items)
    self._send_all(order, event_id, "Purchase", "CompletePayment", "PURCHASE", float(order.total), contents)

  def send_upsell_accepted(self, order: Order, upsell_item: OrderItem) -> None:
    event_id = f"UpsellAccepted_{order.public_order_id}_{upsell_item.id or uuid4().hex}"
    contents = order_items_to_contents([upsell_item])
    self._send_all(order, event_id, "Purchase", "CompletePayment", "PURCHASE", float(upsell_item.total_price), contents)

  def _send_all(
    self,
    order: Order,
    event_id: str,
    meta_event: str,
    tiktok_event: str,
    snap_event: str,
    value: float,
    contents: list[dict],
  ) -> None:
    for service in self.services:
      platform_event = meta_event
      if service.platform == "tiktok":
        platform_event = tiktok_event
      elif service.platform == "snapchat":
        platform_event = snap_event

      status = "skipped"
      if service.enabled():
        status = "sent" if service.send_event(order, platform_event, event_id, value, contents) else "failed"

      self.db.add(
        TrackingEvent(
          event_id=f"{service.platform}_{event_id}",
          event_name=platform_event,
          order_id=order.id,
          platform=service.platform,
          payload={"value": value, "currency": order.currency, "contents": contents, "source_event_id": event_id},
          status=status,
        )
      )
    self.db.commit()


def order_items_to_contents(items: list[OrderItem]) -> list[dict]:
  return [
    {
      "id": str(item.product_id or item.product_name_snapshot),
      "quantity": item.quantity,
      "item_price": float(item.unit_price),
      "title": item.product_name_snapshot,
    }
    for item in items
  ]
