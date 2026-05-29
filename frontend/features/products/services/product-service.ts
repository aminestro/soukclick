import { apiClient } from "@/lib/api-client";
import type { Collection, Product } from "@/types/product";

export function getProducts() {
  return apiClient<Product[]>("/api/v1/products");
}

export function getProductBySlug(slug: string) {
  return apiClient<Product>(`/api/v1/products/${slug}`);
}

export function getCollectionBySlug(slug: string) {
  return apiClient<Collection>(`/api/v1/collections/${slug}`);
}
