from app.modules.cart.schemas.cart_schema import CartPriceRequest, CartPriceResponse


class CartService:
  def calculate(self, payload: CartPriceRequest) -> CartPriceResponse:
    subtotal = sum(item.quantity * item.unit_price for item in payload.items)
    return CartPriceResponse(subtotal=subtotal, total=subtotal)

