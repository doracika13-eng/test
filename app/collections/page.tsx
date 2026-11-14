import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCollections, getProducts } from "@/lib/commerce";
import { SplitLines } from "@/components/ui/SplitLines";
import { ConceptNote } from "@/components/ui/ConceptNote";
import { Arrow } from "@/components/ui/Arrow";

export const metadata: Metadata = {
  title: "Collections",
  description: "Confirmed, Essentials and I Edition — the first DAMI collections.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const [collections, products] = await Promise.all([getCollections(), getProducts()]);
  return (
    <div className="pt-32 md:pt-40">
      <header className="gutter mx-auto max-w-[120rem] pb-16 md:pb-24">
        <p className="eyebrow mb-4 text-ink/50">Index</p>
        <SplitLines as="h1" className="display text-[clamp(3.6rem,12vw,12rem)]" lines={["Collections"]} />
      </header>
      <ol className="border-t border-ink/15">
        {collections.map((c, i) => {
          const items = products.filter((p) => p.collection === c.slug);
          return (
            <li key={c.slug} className="border-b border-ink/15">
              <Link href={`/collections/${c.slug}`} className="group gutter mx-auto grid max-w-[120rem] items-center gap-6 py-10 md:grid-cols-12 md:py-14" data-cursor="Enter">
                <span className="eyebrow text-ink/40 md:col-span-1">{String(i + 1).padStart(2, "0")}</span>
                <div className="md:col-span-6">
                  <h2 className="display text-[clamp(3rem,8vw,8rem)] uppercase transition-[letter-spacing,color] duration-700 ease-[var(--ease-silk)] group-hover:tracking-[0.04em] group-hover:text-bordeaux">
                    {c.name}
                  </h2>
                  <p className="editorial mt-3 text-xl italic text-ink/60 md:text-2xl">{c.tagline || c.description}</p>
                </div>
                <div className="relative hidden aspect-[4/5] w-full overflow-hidden md:col-span-2 md:block">
                  <Image src={c.image} alt={c.imageAlt} fill sizes="16vw" className="object-cover grayscale transition-[filter,transform] duration-1000 group-hover:scale-105 group-hover:grayscale-0" />
                </div>
                <div className="flex items-end justify-between gap-6 md:col-span-3 md:flex-col md:items-end">
                  <p className="eyebrow text-ink/50">
                    {items.length} {items.length === 1 ? "piece" : "pieces"}
                  </p>
                  <Arrow className="transition-transform duration-700 group-hover:translate-x-2" />
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="gutter mx-auto max-w-[120rem] py-10">
        <ConceptNote>Concept references — not final product</ConceptNote>
      </div>
    </div>
  );
}
