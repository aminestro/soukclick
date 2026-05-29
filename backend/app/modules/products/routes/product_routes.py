from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.products.schemas.product_schema import ProductRead
from app.modules.products.services.product_service import ProductService

router = APIRouter()


@router.get("", response_model=list[ProductRead])
def list_products(db: Session = Depends(get_db)):
  return ProductService(db).list_products()


@router.get("/{slug}", response_model=ProductRead)
def get_product(slug: str, db: Session = Depends(get_db)):
  product = ProductService(db).get_product(slug)
  if product is None:
    raise HTTPException(status_code=404, detail="Product not found")
  return product
