export type ProductOffer = {
  quantity: number;
  price: number;
  label: string;
  badge?: string;
  savings_text?: string | null;
  is_default?: boolean;
};

export type ProductReview = {
  name: string;
  city: string;
  rating: number;
  body: string;
};

export type ProductFaq = {
  question: string;
  answer: string;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  darija_name: string;
  headline: string;
  subheadline: string;
  base_price: number;
  currency: "MAD";
  stock_status: string;
  collection_slug: string;
  collection_name: string;
  benefits: string[];
  pain_points: string[];
  features: string[];
  faqs: ProductFaq[];
  reviews: ProductReview[];
  trust_badges: string[];
  cross_sells: string[];
  upsell_suggestion?: string | null;
  offers: ProductOffer[];
  images: string[];
  seo_title: string;
  seo_description: string;
  schema_data: Record<string, unknown>;
};

export type Collection = {
  slug: string;
  name: string;
  products: Product[];
};
