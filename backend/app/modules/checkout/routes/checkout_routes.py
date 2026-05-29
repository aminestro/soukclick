from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.checkout.schemas.checkout_schema import CheckoutRequest, CheckoutResponse
from app.modules.checkout.services.checkout_service import CheckoutService

router = APIRouter()


@router.post("", response_model=CheckoutResponse)
def submit_checkout(payload: CheckoutRequest, request: Request, db: Session = Depends(get_db)):
  return CheckoutService(db).submit(
    payload,
    ip_address=request.client.host if request.client else None,
    user_agent=request.headers.get("user-agent"),
  )

