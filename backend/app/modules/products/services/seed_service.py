from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product, ProductOffer
from app.modules.products.data.seed_products import DEFAULT_OFFERS, SEED_PRODUCTS, product_schema_for


def seed_products(db: Session) -> None:
  for item in SEED_PRODUCTS:
    product = db.scalars(select(Product).where(Product.slug == item["slug"])).first()

    values = {
      "name": item["name"],
      "darija_name": item["darija_name"],
      "headline": item["headline"],
      "subheadline": item["subheadline"],
      "description": item["description"],
      "base_price": 199,
      "currency": "MAD",
      "is_active": True,
      "stock_quantity": item["stock_quantity"],
      "stock_status": item["stock_status"],
      "collection_slug": item["collection_slug"],
      "collection_name": item["collection_name"],
      "benefits": item["benefits"],
      "pain_points": item["pain_points"],
      "features": item["features"],
      "faqs": item["faqs"],
      "reviews": item["reviews"],
      "trust_badges": item["trust_badges"],
      "cross_sells": item["cross_sells"],
      "upsell_suggestion": item["upsell_suggestion"],
      "images": item["images"],
      "seo_title": item["seo_title"],
      "seo_description": item["seo_description"],
      "schema_data": product_schema_for(item),
    }

    if product is None:
      product = Product(slug=item["slug"], **values)
      db.add(product)
      db.flush()
    else:
      for key, value in values.items():
        setattr(product, key, value)
      product.offers.clear()
      db.flush()

    for offer in DEFAULT_OFFERS:
      product.offers.append(ProductOffer(**offer))

  db.commit()

