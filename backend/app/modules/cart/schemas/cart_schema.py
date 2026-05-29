from pydantic import BaseModel, Field


class CartPriceItem(BaseModel):
  product_id: int | None = None
  quantity: int = Field(ge=1)
  unit_price: float = Field(ge=0)


class CartPriceRequest(BaseModel):
  items: list[CartPriceItem] = Field(default_factory=list)


class CartPriceResponse(BaseModel):
  subtotal: float
  delivery_fee: float = 0
  total: float
  currency: str = "MAD"

