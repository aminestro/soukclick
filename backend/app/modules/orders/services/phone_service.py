import re

from app.core.config import settings


def normalize_moroccan_phone(phone: str) -> str:
  digits = re.sub(r"\D", "", phone)

  if digits == settings.fraud_test_phone:
    return settings.fraud_test_phone

  if re.fullmatch(r"0[67]\d{8}", digits):
    return f"+212{digits[1:]}"

  if re.fullmatch(r"212[67]\d{8}", digits):
    return f"+{digits}"

  return phone.strip()


def is_valid_moroccan_phone(phone: str) -> bool:
  normalized = normalize_moroccan_phone(phone)
  return normalized == settings.fraud_test_phone or re.fullmatch(r"\+212[67]\d{8}", normalized) is not None

