from app.modules.orders.schemas.order_schema import OrderCreate, OrderRead


class CheckoutRequest(OrderCreate):
  pass


class CheckoutResponse(OrderRead):
  upsell_window_seconds: int = 15

