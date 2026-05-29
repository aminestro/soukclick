from fastapi import APIRouter

from app.modules.fraud.schemas.fraud_schema import FraudDecision

router = APIRouter()


@router.get("/health", response_model=FraudDecision)
def fraud_health():
  return FraudDecision(decision="ready")

