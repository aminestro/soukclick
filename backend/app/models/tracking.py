from datetime import datetime

from sqlalchemy import DateTime, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TrackingEvent(Base):
  __tablename__ = "tracking_events"

  id: Mapped[int] = mapped_column(primary_key=True)
  event_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
  event_name: Mapped[str] = mapped_column(String(80), index=True)
  order_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
  platform: Mapped[str] = mapped_column(String(40), default="internal")
  payload: Mapped[dict] = mapped_column(JSON, default=dict)
  status: Mapped[str] = mapped_column(String(40), default="pending")
  error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
  sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
  created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

