from app.models.product import Product, ProductOffer
from app.modules.orders.schemas.order_schema import OrderItemCreate


def find_offer(product: Product, item: OrderItemCreate) -> ProductOffer | None:
  return next((offer for offer in product.offers if offer.quantity == item.offer_quantity), None)


def calculate_offer_unit_price(offer: ProductOffer) -> float:
  return float(offer.price) / offer.quantity
