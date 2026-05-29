from pydantic import BaseModel, ConfigDict


class ProductOfferRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  quantity: int
  price: float
  label: str
  badge: str | None = None
  savings_text: str | None = None
  is_default: bool = False


class ProductRead(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  slug: str
  name: str
  darija_name: str
  headline: str
  subheadline: str
  base_price: float
  currency: str
  stock_status: str
  collection_slug: str
  collection_name: str
  benefits: list[str]
  pain_points: list[str]
  features: list[str]
  faqs: list[dict]
  reviews: list[dict]
  trust_badges: list[str]
  cross_sells: list[str]
  upsell_suggestion: str | None = None
  images: list[str]
  seo_title: str
  seo_description: str
  schema_data: dict
  offers: list[ProductOfferRead] = []


class CollectionRead(BaseModel):
  slug: str
  name: str
  products: list[ProductRead]
