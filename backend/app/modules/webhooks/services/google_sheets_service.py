import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class GoogleSheetsService:
  async def send_order(self, payload: dict) -> bool:
    if not settings.google_sheets_webhook_url:
      logger.info("google_sheets_webhook_not_configured")
      return False

    async with httpx.AsyncClient(timeout=5) as client:
      response = await client.post(settings.google_sheets_webhook_url, json=payload)
      response.raise_for_status()
      return True

