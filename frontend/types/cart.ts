import type { ProductOffer } from "@/types/product";

export type CartItem = {
  productId: number;
  slug: string;
  name: string;
  darijaName: string;
  image?: string;
  offer: ProductOffer;
  offers: ProductOffer[];
  crossSells: string[];
};
