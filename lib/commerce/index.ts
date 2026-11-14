import { cache } from "react";
import { localCollections, localDetails, localProducts } from "./local";
import { shopifyCollections, shopifyEnabled, shopifyProducts } from "./shopify";
import type { Collection, Product } from "./types";

export type { Product, Collection, Colorway, Variant, ProductImage, Money } from "./types";
export { shopifyEnabled as commerceLive };

export const getProducts = cache(async (): Promise<Product[]> => {
  if (!shopifyEnabled) return localProducts();
  try {
    return await shopifyProducts();
  } catch (err) {
    console.error("[commerce] Shopify products failed, using local catalogue", err);
    return localProducts();
  }
});

export const getCollections = cache(async (): Promise<Collection[]> => {
  if (!shopifyEnabled) return localCollections();
  try {
    const c = await shopifyCollections();
    return c.length ? c : localCollections();
  } catch (err) {
    console.error("[commerce] Shopify collections failed, using local catalogue", err);
    return localCollections();
  }
});

export async function getProduct(handle: string) {
  return (await getProducts()).find((p) => p.handle === handle) ?? null;
}

export async function getCollection(slug: string) {
  return (await getCollections()).find((c) => c.slug === slug) ?? null;
}

export const getProductDetails = localDetails;

export { formatPrice, statusLabel } from "../format";
