from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.orders.schemas.order_schema import (
  OrderCreate,
  OrderDetailRead,
  OrderRead,
  ResendWebhookResponse,
  UpsellRequest,
  UpsellResponse,
)
from app.modules.orders.services.order_service import OrderService

router = APIRouter()


@router.post("", response_model=OrderRead)
def create_order(payload: OrderCreate, request: Request, db: Session = Depends(get_db)):
  order = OrderService(db).create_order(
    payload,
    ip_address=request.client.host if request.client else None,
    user_agent=request.headers.get("user-agent"),
  )
  return OrderRead(order_id=order.id, public_order_id=order.public_order_id, status=order.status, total=float(order.total))


@router.get("/{order_code}", response_model=OrderDetailRead)
def get_order(order_code: str, db: Session = Depends(get_db)):
  service = OrderService(db)
  return service.to_detail(service.get_order(order_code))


@router.patch("/{order_code}/upsell", response_model=UpsellResponse)
def add_upsell(order_code: str, payload: UpsellRequest, db: Session = Depends(get_db)):
  service = OrderService(db)
  order = service.add_upsell(order_code, payload)
  return UpsellResponse(ok=True, order=service.to_detail(order))


@router.post("/{order_code}/resend-webhook", response_model=ResendWebhookResponse)
def resend_webhook(order_code: str, db: Session = Depends(get_db)):
  service = OrderService(db)
  order = service.resend_webhook(order_code)
  return ResendWebhookResponse(ok=order.webhook_status == "sent", webhook_status=order.webhook_status, message="Webhook resend attempted")
