from hashlib import sha256


def sha256_hash(value: str) -> str:
  return sha256(value.strip().lower().encode("utf-8")).hexdigest()


def hash_phone(phone: str) -> str:
  return sha256_hash(phone)


def hash_email(email: str | None) -> str | None:
  if not email:
    return None
  return sha256_hash(email)
