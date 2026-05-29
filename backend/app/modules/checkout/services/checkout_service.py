from sqlalchemy.orm import Session

from app.modules.checkout.schemas.checkout_schema import CheckoutRequest, CheckoutResponse
from app.modules.orders.services.order_service import OrderService


class CheckoutService:
  def __init__(self, db: Session) -> None:
    self.order_service = OrderService(db)

  def submit(self, payload: CheckoutRequest, ip_address: str | None, user_agent: str | None) -> CheckoutResponse:
    order = self.order_service.create_order(payload, ip_address=ip_address, user_agent=user_agent)
    return CheckoutResponse(
      order_id=order.id,
      public_order_id=order.public_order_id,
      status=order.status,
      total=float(order.total),
    )

