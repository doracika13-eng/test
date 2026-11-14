import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopGrid } from "@/components/product/ShopGrid";
import { SplitLines } from "@/components/ui/SplitLines";
import { ConceptNote } from "@/components/ui/ConceptNote";
import { commerceLive, getCollections, getProducts } from "@/lib/commerce";

export const metadata: Metadata = {
  title: "Shop",
  description: "The DAMI catalogue — hoodies from the Confirmed, Essentials and I Edition collections.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  return (
    <div className="gutter mx-auto max-w-[120rem] pt-32 md:pt-40">
      <header className="grid gap-8 pb-12 md:grid-cols-12 md:pb-16">
        <div className="md:col-span-8">
          <p className="eyebrow mb-4 text-ink/50">DAMI</p>
          <SplitLines as="h1" className="display text-[clamp(3.6rem,11vw,11rem)]" lines={["Shop"]} />
        </div>
        <div className="flex flex-col justify-end gap-4 md:col-span-4">
          <p className="text-sm leading-relaxed text-ink/70">
            {commerceLive ? "" : "These are product development references, not necessarily independently approved retail products."}
          </p>
          {!commerceLive && <ConceptNote>Concept references — not final product</ConceptNote>}
        </div>
      </header>
      <Suspense>
        <ShopGrid products={products} collections={collections} />
      </Suspense>
    </div>
  );
}
