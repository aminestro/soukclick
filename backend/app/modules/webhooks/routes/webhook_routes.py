from fastapi import APIRouter

from app.modules.webhooks.schemas.webhook_schema import WebhookDeliveryResult

router = APIRouter()


@router.get("/health", response_model=WebhookDeliveryResult)
def webhook_health():
  return WebhookDeliveryResult(ok=True, provider="google_sheets")

