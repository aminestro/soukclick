from sqlalchemy.orm import Session

from app.modules.products.repositories.product_repository import ProductRepository


class ProductService:
  def __init__(self, db: Session) -> None:
    self.repository = ProductRepository(db)

  def list_products(self):
    return self.repository.list_active()

  def get_product(self, slug: str):
    return self.repository.get_by_slug(slug)

  def get_collection(self, slug: str):
    return self.repository.list_by_collection(slug)
