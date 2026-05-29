from pydantic import BaseModel, Field


class IpRiskResult(BaseModel):
  ip_address: str | None = None
  country_code: str | None = None
  is_vpn: bool = False
  is_proxy: bool = False
  is_hosting: bool = False
  risk_score: float = 0
  raw: dict | None = None


class FraudDecision(BaseModel):
  decision: str
  status: str
  score: float = 0
  flags: list[str] = Field(default_factory=list)
  reason: str | None = None
  bypassed: bool = False
  ip_risk: IpRiskResult = Field(default_factory=IpRiskResult)

  @property
  def should_block(self) -> bool:
    return self.status == "blocked"
