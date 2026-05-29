from fastapi import APIRouter

from app.modules.cart.schemas.cart_schema import CartPriceRequest, CartPriceResponse
from app.modules.cart.services.cart_service import CartService

router = APIRouter()


@router.post("/price", response_model=CartPriceResponse)
def price_cart(payload: CartPriceRequest):
  return CartService().calculate(payload)

