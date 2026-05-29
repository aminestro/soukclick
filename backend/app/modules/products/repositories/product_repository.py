from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.product import Product


class ProductRepository:
  def __init__(self, db: Session) -> None:
    self.db = db

  def list_active(self) -> list[Product]:
    statement = select(Product).where(Product.is_active.is_(True)).options(selectinload(Product.offers))
    return list(self.db.scalars(statement).all())

  def get_by_slug(self, slug: str) -> Product | None:
    statement = select(Product).where(Product.slug == slug, Product.is_active.is_(True)).options(selectinload(Product.offers))
    return self.db.scalars(statement).first()

  def list_by_collection(self, slug: str) -> list[Product]:
    statement = (
      select(Product)
      .where(Product.collection_slug == slug, Product.is_active.is_(True))
      .options(selectinload(Product.offers))
    )
    return list(self.db.scalars(statement).all())
