from pydantic import BaseModel


class WebhookDeliveryResult(BaseModel):
  ok: bool
  provider: str

