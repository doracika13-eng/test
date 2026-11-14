export const dynamic = "force-static";
import type { MetadataRoute } from "next";
import { getCollections, getProducts } from "@/lib/commerce";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  const now = new Date();
  const fixed = ["", "/shop", "/collections", "/about", "/contact", "/legal/privacy", "/legal/terms", "/legal/shipping-returns"];
  return [
    ...fixed.map((p) => ({ url: `${site.url}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...collections.map((c) => ({ url: `${site.url}/collections/${c.slug}`, lastModified: now, priority: 0.8 })),
    ...products.map((p) => ({ url: `${site.url}/shop/${p.handle}`, lastModified: now, priority: 0.8 })),
  ];
}
