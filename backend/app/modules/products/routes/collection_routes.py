from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.products.schemas.product_schema import CollectionRead
from app.modules.products.services.product_service import ProductService

router = APIRouter()


@router.get("/{slug}", response_model=CollectionRead)
def get_collection(slug: str, db: Session = Depends(get_db)):
  products = ProductService(db).get_collection(slug)
  if not products:
    raise HTTPException(status_code=404, detail="Collection not found")
  return CollectionRead(slug=slug, name=products[0].collection_name, products=products)
