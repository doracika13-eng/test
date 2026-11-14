import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollection, getCollections, getProducts } from "@/lib/commerce";
import { ProductCard } from "@/components/product/ProductCard";
import { SplitLines } from "@/components/ui/SplitLines";
import { ConceptNote } from "@/components/ui/ConceptNote";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getCollections()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCollection(slug);
  if (!c) return {};
  return { title: c.name, description: c.description, alternates: { canonical: `/collections/${c.slug}` }, openGraph: { images: [{ url: c.image, alt: c.imageAlt }] } };
}

const tone = { bone: "bg-bone text-ink", bordeaux: "bg-bordeaux text-paper", charcoal: "bg-charcoal text-paper", black: "bg-ink text-paper" } as const;

export default async function CollectionPage({ params }: Params) {
  const { slug } = await params;
  const [c, products, all] = await Promise.all([getCollection(slug), getProducts(), getCollections()]);
  if (!c) notFound();
  const items = products.filter((p) => p.collection === c.slug);
  const idx = all.findIndex((x) => x.slug === c.slug);
  const next = all[(idx + 1) % all.length];

  return (
    <>
      <section className={`grain relative overflow-hidden ${tone[c.tone]}`}>
        <div className="gutter mx-auto grid min-h-[92svh] max-w-[120rem] items-end gap-10 pb-14 pt-32 md:grid-cols-12 md:pb-20">
          <div className="md:col-span-7">
            <p className="eyebrow mb-6 opacity-60">{c.kicker}</p>
            <SplitLines as="h1" className="display text-[clamp(4rem,14vw,14rem)] uppercase" lines={[c.name]} />
            <p className="editorial mt-6 text-2xl italic opacity-80 md:text-4xl">{c.tagline}</p>
            <p className="mt-6 max-w-md text-sm leading-relaxed opacity-75">{c.description}</p>
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <div className="relative aspect-[4/5] overflow-hidden" data-reveal="clip">
              <Image src={c.image} alt={c.imageAlt} fill priority sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
            </div>
            <ConceptNote className="mt-3" tone={c.tone === "bone" ? "dark" : "light"} />
          </div>
        </div>
      </section>

      <section className="gutter mx-auto max-w-[120rem] py-20 md:py-28" aria-label={`${c.name} pieces`}>
        <ul className={`grid gap-x-6 gap-y-16 sm:grid-cols-2 ${items.length >= 3 ? "lg:grid-cols-3" : ""}`}>
          {items.map((p, i) => (
            <li key={p.handle} data-reveal data-delay={i * 0.1} className={items.length < 3 && i === 1 ? "sm:mt-32" : ""}>
              <ProductCard product={p} priority={i === 0} sizes={items.length >= 3 ? "(min-width:1024px) 33vw, 50vw" : "(min-width:640px) 50vw, 100vw"} />
            </li>
          ))}
        </ul>
      </section>

      {next && next.slug !== c.slug && (
        <Link href={`/collections/${next.slug}`} className="group block border-t border-ink/15" data-cursor="Next">
          <div className="gutter mx-auto flex max-w-[120rem] flex-col gap-3 py-16 md:py-24">
            <span className="eyebrow text-ink/45">Next collection</span>
            <span className="display text-[clamp(3rem,10vw,10rem)] uppercase transition-colors duration-700 group-hover:text-bordeaux">{next.name}</span>
          </div>
        </Link>
      )}
    </>
  );
}
