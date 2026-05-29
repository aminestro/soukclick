from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem
from app.models.product import Product, ProductOffer
from app.modules.fraud.services.fraud_service import FraudService
from app.modules.orders.repositories.order_repository import OrderRepository
from app.modules.orders.schemas.order_schema import OrderCreate, OrderDetailRead, OrderItemRead, UpsellRequest
from app.modules.orders.services.phone_service import is_valid_moroccan_phone, normalize_moroccan_phone
from app.modules.orders.services.pricing_service import calculate_offer_unit_price, find_offer
from app.modules.products.repositories.product_repository import ProductRepository
from app.modules.tracking.services.capi_dispatcher import CapiDispatcher
from app.modules.webhooks.services.order_webhook_service import OrderWebhookService


class OrderService:
  def __init__(self, db: Session) -> None:
    self.db = db
    self.repository = OrderRepository(db)
    self.product_repository = ProductRepository(db)

  def create_order(self, payload: OrderCreate, ip_address: str | None, user_agent: str | None) -> Order:
    if not is_valid_moroccan_phone(payload.phone):
      raise HTTPException(status_code=400, detail="Invalid Moroccan phone number")

    normalized_phone = normalize_moroccan_phone(payload.phone)
    fraud_service = FraudService(self.db)
    fraud_decision = fraud_service.evaluate_order_risk(normalized_phone, payload.address, ip_address, user_agent)
    if fraud_decision.should_block:
      fraud_service.record_check(fraud_decision, normalized_phone, ip_address)
      raise HTTPException(status_code=403, detail="ماقدرناش نكملو الطلب دابا، عافاك تواصل معنا فالواتساب.")

    resolved_items: list[tuple[Product, ProductOffer]] = []
    for item in payload.items:
      product = self.product_repository.get_by_slug(item.slug)
      if product is None:
        raise HTTPException(status_code=400, detail=f"Invalid product: {item.slug}")
      offer = find_offer(product, item)
      if offer is None:
        raise HTTPException(status_code=400, detail=f"Invalid offer for product: {item.slug}")
      resolved_items.append((product, offer))

    total = sum(float(offer.price) for _, offer in resolved_items)
    year = datetime.utcnow().year
    order_count = self.repository.count_orders_for_year(year) + 1

    order = Order(
      public_order_id=f"SC-{year}-{order_count:06d}",
      customer_name=payload.full_name,
      phone_raw=payload.phone,
      phone_normalized=normalized_phone,
      city=payload.city,
      address=payload.address,
      subtotal=total,
      total=total,
      event_id=payload.event_id,
      ip_address=ip_address,
      user_agent=user_agent,
      fraud_status=fraud_decision.status,
      fraud_score=fraud_decision.score,
      fraud_flags=fraud_decision.flags,
      fraud_reason=fraud_decision.reason,
      ip_country=fraud_decision.ip_risk.country_code,
      is_vpn=fraud_decision.ip_risk.is_vpn,
      is_proxy=fraud_decision.ip_risk.is_proxy,
      is_hosting=fraud_decision.ip_risk.is_hosting,
      maxmind_raw=fraud_decision.ip_risk.raw,
      webhook_status="pending",
      utm_source=payload.utm_source,
      utm_medium=payload.utm_medium,
      utm_campaign=payload.utm_campaign,
      utm_content=payload.utm_content,
      utm_term=payload.utm_term,
      fbclid=payload.fbclid,
      ttclid=payload.ttclid,
      sc_click_id=payload.sc_click_id,
    )

    items = [
      OrderItem(
        product_id=product.id,
        product_name_snapshot=product.darija_name,
        quantity=offer.quantity,
        unit_price=calculate_offer_unit_price(offer),
        total_price=float(offer.price),
        offer_label=offer.label,
        item_type="main",
      )
      for product, offer in resolved_items
    ]

    created_order = self.repository.create(order, items)
    fraud_service.record_check(fraud_decision, normalized_phone, ip_address, created_order.id)
    OrderWebhookService(self.db).send_order_if_enabled(created_order)
    CapiDispatcher(self.db).send_cod_order_placed(created_order)
    return created_order

  def get_order(self, public_order_id: str) -> Order:
    order = self.repository.get_by_public_order_id(public_order_id)
    if order is None:
      raise HTTPException(status_code=404, detail="Order not found")
    return order

  def add_upsell(self, public_order_id: str, payload: UpsellRequest) -> Order:
    order = self.get_order(public_order_id)
    product = self.product_repository.get_by_slug(payload.slug)
    if product is None:
      raise HTTPException(status_code=400, detail="Invalid upsell product")

    existing = next((item for item in order.items if item.item_type == "upsell"), None)
    if existing is not None:
      return order

    upsell_item = OrderItem(
      order_id=order.id,
      product_id=product.id,
      product_name_snapshot=product.darija_name,
      quantity=1,
      unit_price=99,
      total_price=99,
      offer_label="Upsell - 99 MAD",
      item_type="upsell",
    )
    order.items.append(upsell_item)
    order.subtotal = float(order.subtotal) + 99
    order.total = float(order.total) + 99
    saved_order = self.repository.save(order)
    OrderWebhookService(self.db).send_order_if_enabled(saved_order)
    CapiDispatcher(self.db).send_upsell_accepted(saved_order, upsell_item)
    return saved_order

  def resend_webhook(self, public_order_id: str) -> Order:
    order = self.get_order(public_order_id)
    OrderWebhookService(self.db).send_order(order, force=True)
    return order

  def to_detail(self, order: Order) -> OrderDetailRead:
    return OrderDetailRead(
      order_id=order.id,
      public_order_id=order.public_order_id,
      customer_name=order.customer_name,
      phone_normalized=order.phone_normalized,
      city=order.city,
      address=order.address,
      status=order.status,
      confirmation_status=order.confirmation_status,
      webhook_status=order.webhook_status,
      subtotal=float(order.subtotal),
      delivery_fee=float(order.delivery_fee),
      total=float(order.total),
      items=[
        OrderItemRead(
          product_name=item.product_name_snapshot,
          quantity=item.quantity,
          unit_price=float(item.unit_price),
          total_price=float(item.total_price),
          offer_label=item.offer_label,
          item_type=item.item_type,
        )
        for item in order.items
      ],
      created_at=order.created_at,
    )
