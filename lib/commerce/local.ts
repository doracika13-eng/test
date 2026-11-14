import catalog from "@/content/catalog.json";
import type { Collection, Product, ProductDetails, Variant } from "./types";

type RawProduct = (typeof catalog.products)[number];

function toProduct(p: RawProduct): Product {
  const variants: Variant[] = [];
  for (const c of p.colorways) {
    for (const size of p.sizes) {
      variants.push({
        id: `local:${p.handle}:${c.id}:${size}`,
        colorwayId: c.id,
        size,
        // Nothing is on sale until Shopify is connected and products are published there.
        availableForSale: false,
        price: null,
      });
    }
  }
  return {
    handle: p.handle,
    code: p.code,
    title: p.title,
    subtitle: p.subtitle,
    collection: p.collection,
    description: p.description,
    status: p.status as Product["status"],
    price: null,
    sizes: p.sizes,
    colorways: p.colorways.map((c) => ({ ...c, status: c.status as Product["colorways"][number]["status"] })),
    variants,
    highlights: p.highlights,
    sizeChart: null,
    conceptImagery: true,
  };
}

export const localProducts = (): Product[] => catalog.products.map(toProduct);
export const localCollections = (): Collection[] => catalog.collections as Collection[];
export const localDetails = (): ProductDetails => catalog.sharedDetails;
