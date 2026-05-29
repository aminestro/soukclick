from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class FraudCheck(Base):
  __tablename__ = "fraud_checks"

  id: Mapped[int] = mapped_column(primary_key=True)
  order_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
  phone_normalized: Mapped[str] = mapped_column(String(40), index=True)
  ip_address: Mapped[str | None] = mapped_column(String(80), nullable=True)
  country_code: Mapped[str | None] = mapped_column(String(2), nullable=True)
  is_vpn: Mapped[bool] = mapped_column(Boolean, default=False)
  is_proxy: Mapped[bool] = mapped_column(Boolean, default=False)
  is_hosting: Mapped[bool] = mapped_column(Boolean, default=False)
  is_suspicious: Mapped[bool] = mapped_column(Boolean, default=False)
  risk_score: Mapped[float] = mapped_column(default=0)
  flags: Mapped[list[str]] = mapped_column(JSON, default=list)
  maxmind_raw: Mapped[dict | None] = mapped_column(JSON, nullable=True)
  decision: Mapped[str] = mapped_column(String(40), default="review")
  reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
  created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
