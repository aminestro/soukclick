from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.fraud import FraudCheck
from app.modules.fraud.schemas.fraud_schema import FraudDecision, IpRiskResult
from app.modules.fraud.services.maxmind_service import MaxMindService
from app.modules.orders.repositories.order_repository import OrderRepository


class FraudService:
  def __init__(self, db: Session) -> None:
    self.db = db
    self.order_repository = OrderRepository(db)
    self.maxmind = MaxMindService()

  def is_whitelisted_test_order(self, phone_normalized: str) -> bool:
    return phone_normalized == settings.fraud_test_phone

  def evaluate_order_risk(self, phone_normalized: str, address: str, ip_address: str | None, user_agent: str | None) -> FraudDecision:
    if self.is_whitelisted_test_order(phone_normalized):
      return FraudDecision(
        decision="allow",
        status="whitelisted",
        score=0,
        flags=["whitelisted_test_phone"],
        reason="Whitelisted test phone",
        bypassed=True,
        ip_risk=IpRiskResult(ip_address=ip_address),
      )

    ip_risk = self.check_ip_risk(ip_address)
    flags: list[str] = []
    score = 0.0

    if not ip_address:
      flags.append("missing_ip")
      score += 15

    if not user_agent:
      flags.append("missing_user_agent")
      score += 15

    if ip_risk.country_code and ip_risk.country_code != settings.allowed_country_code:
      flags.append("non_morocco_ip")
      score += 35

    if ip_risk.is_vpn:
      flags.append("vpn_risk")
      score += 25

    if ip_risk.is_proxy:
      flags.append("proxy_risk")
      score += 25

    if ip_risk.is_hosting:
      flags.append("hosting_ip_risk")
      score += 20

    if ip_risk.risk_score >= 50:
      flags.append("high_maxmind_risk_score")
      score += min(40, ip_risk.risk_score / 2)

    flags.extend(self.check_duplicates(phone_normalized, address))
    flags.extend(self.check_velocity(ip_address))

    if "duplicate_recent_phone" in flags:
      score += 25
    if "repeated_address_or_phone_pattern" in flags:
      score += 20
    if "ip_velocity_risk" in flags:
      score += 30

    score = min(100, score)
    status = "clean" if not flags else "review"
    decision = "allow"

    if score >= 70 and settings.fraud_block_high_risk:
      status = "blocked"
      decision = "block"

    return FraudDecision(
      decision=decision,
      status=status,
      score=score,
      flags=flags,
      reason=", ".join(flags) if flags else "No risk flags",
      ip_risk=ip_risk,
    )

  def check_ip_risk(self, ip_address: str | None) -> IpRiskResult:
    return self.maxmind.inspect_ip(ip_address)

  def check_velocity(self, ip_address: str | None) -> list[str]:
    if self.order_repository.count_recent_ip_orders(ip_address, minutes=30) >= 3:
      return ["ip_velocity_risk"]
    return []

  def check_duplicates(self, phone_normalized: str, address: str) -> list[str]:
    flags = []
    if self.order_repository.count_recent_phone_orders(phone_normalized, hours=6) > 0:
      flags.append("duplicate_recent_phone")
    if self.order_repository.count_recent_address_orders(phone_normalized, address, hours=24) > 0:
      flags.append("repeated_address_or_phone_pattern")
    return flags

  def record_check(self, decision: FraudDecision, phone_normalized: str, ip_address: str | None, order_id: int | None = None) -> None:
    self.db.add(
      FraudCheck(
        order_id=order_id,
        phone_normalized=phone_normalized,
        ip_address=ip_address,
        country_code=decision.ip_risk.country_code,
        is_vpn=decision.ip_risk.is_vpn,
        is_proxy=decision.ip_risk.is_proxy,
        is_hosting=decision.ip_risk.is_hosting,
        is_suspicious=decision.status in {"review", "blocked"},
        risk_score=decision.score,
        flags=decision.flags,
        maxmind_raw=decision.ip_risk.raw,
        decision=decision.status,
        reason=decision.reason,
      )
    )
    self.db.commit()
