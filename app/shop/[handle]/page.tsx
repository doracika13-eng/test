import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductView } from "@/components/product/ProductView";
import { ProductCard } from "@/components/product/ProductCard";
import { commerceLive, getCollection, getProduct, getProductDetails, getProducts } from "@/lib/commerce";
import { site } from "@/lib/site";

type Params = { params: Promise<{ handle: string }> };

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle } = await params;
  const p = await getProduct(handle);
  if (!p) return {};
  const img = p.colorways.find((c) => c.images.length)?.images[0];
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: `/shop/${p.handle}` },
    openGraph: { title: `${p.title} — DAMI`, description: p.description, images: img ? [{ url: img.src, alt: img.alt }] : undefined },
  };
}

export default async function ProductPage({ params }: Params) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) notFound();
  const [collection, all] = await Promise.all([getCollection(product.collection), getProducts()]);
  const related = all.filter((p) => p.handle !== product.handle).sort((a, b) => Number(b.collection === product.collection) - Number(a.collection === product.collection)).slice(0, 3);
  const img = product.colorways.find((c) => c.images.length)?.images[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    sku: product.code,
    brand: { "@type": "Brand", name: "DAMI" },
    image: img ? [`${site.url}${img.src.startsWith("/") ? img.src : ""}`] : undefined,
    ...(product.price && commerceLive
      ? { offers: { "@type": "Offer", priceCurrency: product.price.currencyCode, price: product.price.amount, availability: product.status === "available" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${site.url}/shop/${product.handle}` } }
      : {}),
  };

  return (
    <div className="gutter mx-auto max-w-[120rem] pt-24 md:pt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="eyebrow mb-8 flex flex-wrap gap-2 text-ink/45">
        <Link href="/shop" className="link-u">Shop</Link>
        <span>/</span>
        {collection && (
          <>
            <Link href={`/collections/${collection.slug}`} className="link-u">{collection.name}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-ink/80" aria-current="page">{product.title}</span>
      </nav>

      <Suspense>
        <ProductView product={product} details={getProductDetails()} live={commerceLive} />
      </Suspense>

      {related.length > 0 && (
        <section aria-labelledby="related" className="border-t border-ink/15 py-24 md:py-32 mt-24">
          <div className="mb-12 flex items-end justify-between">
            <h2 id="related" className="display text-[clamp(2.6rem,6vw,5.5rem)]">
              <em className="editorial italic text-bordeaux">Collections</em>
            </h2>
            <Link href="/shop" className="caps link-u hidden sm:inline">All pieces</Link>
          </div>
          <ul className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <li key={p.handle} data-reveal>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
