from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.tracking import TrackingEvent
from app.modules.tracking.schemas.tracking_schema import TrackingEventCreate, TrackingEventResponse


class TrackingService:
  def __init__(self, db: Session) -> None:
    self.db = db

  def record(self, payload: TrackingEventCreate) -> TrackingEventResponse:
    event_id = payload.event_id or f"{payload.event_name}_{uuid4().hex}"
    event = TrackingEvent(
      event_id=event_id,
      event_name=payload.event_name,
      order_id=payload.order_id,
      platform=payload.platform,
      payload=payload.payload,
      status="queued",
    )
    self.db.add(event)
    self.db.commit()
    return TrackingEventResponse(ok=True, event_id=event_id)

