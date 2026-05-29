from app.db.session import SessionLocal
from app.modules.products.services.seed_service import seed_products


def main() -> None:
  db = SessionLocal()
  try:
    seed_products(db)
  finally:
    db.close()


if __name__ == "__main__":
  main()
