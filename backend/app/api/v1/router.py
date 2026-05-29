from fastapi import APIRouter

from app.api.v1.routes.health import router as health_router
from app.modules.cart.routes.cart_routes import router as cart_router
from app.modules.checkout.routes.checkout_routes import router as checkout_router
from app.modules.fraud.routes.fraud_routes import router as fraud_router
from app.modules.orders.routes.order_routes import router as order_router
from app.modules.products.routes.collection_routes import router as collection_router
from app.modules.products.routes.product_routes import router as product_router
from app.modules.tracking.routes.tracking_routes import router as tracking_router
from app.modules.webhooks.routes.webhook_routes import router as webhook_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(product_router, prefix="/products", tags=["products"])
api_router.include_router(collection_router, prefix="/collections", tags=["collections"])
api_router.include_router(order_router, prefix="/orders", tags=["orders"])
api_router.include_router(cart_router, prefix="/cart", tags=["cart"])
api_router.include_router(checkout_router, prefix="/checkout", tags=["checkout"])
api_router.include_router(tracking_router, prefix="/tracking", tags=["tracking"])
api_router.include_router(webhook_router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(fraud_router, prefix="/fraud", tags=["fraud"])
