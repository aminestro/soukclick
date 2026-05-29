from __future__ import annotations

import logging

import httpx

from app.core.config import settings
from app.modules.fraud.schemas.fraud_schema import IpRiskResult

logger = logging.getLogger(__name__)


class MaxMindService:
  def inspect_ip(self, ip_address: str | None) -> IpRiskResult:
    if not ip_address:
      return IpRiskResult(ip_address=None)

    if not self.enabled():
      return IpRiskResult(ip_address=ip_address)

    minfraud = self._inspect_minfraud(ip_address) if settings.maxmind_minfraud_enabled else {}
    geoip = self._inspect_geoip(ip_address) if settings.maxmind_geoip_enabled else {}

    traits = geoip.get("traits", {}) if isinstance(geoip, dict) else {}
    country = geoip.get("country", {}) if isinstance(geoip, dict) else {}
    minfraud_ip = minfraud.get("ip_address", {}) if isinstance(minfraud, dict) else {}
    risk_score = float(minfraud.get("risk_score") or 0) if isinstance(minfraud, dict) else 0

    return IpRiskResult(
      ip_address=ip_address,
      country_code=country.get("iso_code") or minfraud_ip.get("country", {}).get("iso_code"),
      is_vpn=bool(traits.get("is_anonymous_vpn") or minfraud_ip.get("traits", {}).get("is_anonymous_vpn")),
      is_proxy=bool(traits.get("is_public_proxy") or minfraud_ip.get("traits", {}).get("is_public_proxy")),
      is_hosting=bool(traits.get("is_hosting_provider") or minfraud_ip.get("traits", {}).get("is_hosting_provider")),
      risk_score=risk_score,
      raw={"minfraud": minfraud, "geoip": geoip},
    )

  def enabled(self) -> bool:
    return bool(settings.maxmind_enabled and settings.maxmind_account_id and settings.maxmind_license_key)

  def _inspect_minfraud(self, ip_address: str) -> dict:
    try:
      response = httpx.post(
        "https://minfraud.maxmind.com/minfraud/v2.0/score",
        auth=(settings.maxmind_account_id or "", settings.maxmind_license_key or ""),
        json={"device": {"ip_address": ip_address}},
        timeout=4,
      )
      response.raise_for_status()
      return response.json()
    except Exception:
      logger.exception("maxmind_minfraud_failed", extra={"ip_address": ip_address})
      return {}

  def _inspect_geoip(self, ip_address: str) -> dict:
    try:
      response = httpx.get(
        f"https://geoip.maxmind.com/geoip/v2.1/city/{ip_address}",
        auth=(settings.maxmind_account_id or "", settings.maxmind_license_key or ""),
        timeout=4,
      )
      response.raise_for_status()
      return response.json()
    except Exception:
      logger.exception("maxmind_geoip_failed", extra={"ip_address": ip_address})
      return {}
