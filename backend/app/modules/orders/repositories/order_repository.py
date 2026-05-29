from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order, OrderItem


class OrderRepository:
  def __init__(self, db: Session) -> None:
    self.db = db

  def create(self, order: Order, items: list[OrderItem]) -> Order:
    order.items = items
    self.db.add(order)
    self.db.commit()
    self.db.refresh(order)
    return order

  def count_orders_for_year(self, year: int) -> int:
    return self.db.scalar(
      select(func.count(Order.id)).where(
        Order.created_at >= datetime(year, 1, 1),
        Order.created_at < datetime(year + 1, 1, 1),
      )
    ) or 0

  def get_by_public_order_id(self, public_order_id: str) -> Order | None:
    statement = select(Order).where(Order.public_order_id == public_order_id).options(selectinload(Order.items))
    return self.db.scalars(statement).first()

  def has_recent_phone_order(self, phone_normalized: str, hours: int = 6) -> bool:
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    statement = select(Order.id).where(Order.phone_normalized == phone_normalized, Order.created_at >= cutoff).limit(1)
    return self.db.scalars(statement).first() is not None

  def count_recent_phone_orders(self, phone_normalized: str, hours: int = 6) -> int:
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    return self.db.scalar(select(func.count(Order.id)).where(Order.phone_normalized == phone_normalized, Order.created_at >= cutoff)) or 0

  def count_recent_ip_orders(self, ip_address: str | None, minutes: int = 30) -> int:
    if not ip_address:
      return 0
    cutoff = datetime.utcnow() - timedelta(minutes=minutes)
    return self.db.scalar(select(func.count(Order.id)).where(Order.ip_address == ip_address, Order.created_at >= cutoff)) or 0

  def count_recent_address_orders(self, phone_normalized: str, address: str, hours: int = 24) -> int:
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    normalized_address = address.strip().lower()
    return self.db.scalar(
      select(func.count(Order.id)).where(
        Order.created_at >= cutoff,
        (Order.phone_normalized == phone_normalized) | (func.lower(Order.address) == normalized_address),
      )
    ) or 0

  def save(self, order: Order) -> Order:
    self.db.add(order)
    self.db.commit()
    self.db.refresh(order)
    return order
