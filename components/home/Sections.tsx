import Image from "next/image";
import Link from "next/link";
import type { Collection, Product } from "@/lib/commerce/types";
import { SplitLines } from "@/components/ui/SplitLines";
import { ConceptNote } from "@/components/ui/ConceptNote";
import { Arrow } from "@/components/ui/Arrow";
import { Wordmark } from "@/components/ui/Wordmark";

/* ───────────────────────── 02 · Introduction ───────────────────────── */
export function Introduction() {
  return (
    <section aria-labelledby="intro-title" className="gutter relative mx-auto max-w-[120rem] py-28 md:py-44">
      <div className="grid gap-12 md:grid-cols-12">
        <p className="eyebrow text-ink/50 md:col-span-2" data-reveal>
          01 — Maison
        </p>
        <div className="md:col-span-10">
          <SplitLines
            as="h2"
            className="editorial text-[clamp(2.1rem,5.4vw,5.6rem)] leading-[1.02] tracking-[-0.02em]"
            lines={[
              <span key="a" id="intro-title">
                DAMI is an independent fashion label
              </span>,
              <>exploring the intersection of contemporary</>,
              <>
                streetwear, <em className="text-bordeaux">refined design</em>
              </>,
              <>and everyday luxury.</>,
            ]}
          />
          <div className="mt-16 grid gap-10 border-t border-ink/15 pt-8 sm:grid-cols-3 md:mt-24">
            {[
              ["Origin", "Designed in Aix-en-Provence, France. Development with manufacturing partners in Bangladesh."],
              ["Approach", "The visual language of luxury fashion, the freedom of streetwear, at an accessible price."],
              ["Status", "First five design families in sample development. Launch details to follow."],
            ].map(([k, v], i) => (
              <div key={k} data-reveal data-delay={i * 0.1}>
                <p className="eyebrow mb-3 text-ink/45">{k}</p>
                <p className="max-w-xs text-sm leading-relaxed text-ink/75">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── 03 · Collections ───────────────────────── */
const toneBg: Record<Collection["tone"], string> = {
  bone: "bg-bone text-ink",
  bordeaux: "bg-bordeaux text-paper",
  charcoal: "bg-charcoal text-paper",
  black: "bg-ink text-paper",
};

export function FeaturedCollections({ collections, products }: { collections: Collection[]; products: Product[] }) {
  return (
    <section aria-labelledby="collections-title" className="relative">
      <div className="gutter mx-auto flex max-w-[120rem] items-end justify-between pb-10">
        <div>
          <p className="eyebrow mb-4 text-ink/50" data-reveal>
            02 — The collections
          </p>
          <SplitLines as="h2" className="display text-[clamp(3rem,9vw,9rem)]" lines={[<span key="t" id="collections-title">Five families,</span>, <em key="b" className="editorial italic">one standard.</em>]} />
        </div>
        <Link href="/collections" className="caps link-u hidden md:inline" data-reveal>
          All collections
        </Link>
      </div>

      {/* Marquee of names */}
      <div className="overflow-hidden border-y border-ink/10 py-5" aria-hidden>
        <div className="marquee-track flex w-max gap-12 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12">
              {["Bordeaux Kiss", "Éclat", "Désir", "Ombre", "Lumen", "I Edition", "Confirmed"].map((n) => (
                <span key={n + k} className="editorial flex items-center gap-12 text-3xl italic text-ink/70 md:text-5xl">
                  {n}
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-bordeaux" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-px">
        {collections.map((c, i) => {
          const items = products.filter((p) => p.collection === c.slug);
          const flip = i % 2 === 1;
          return (
            <article key={c.slug} className={`${toneBg[c.tone]} relative overflow-hidden`}>
              <div className={`gutter mx-auto grid max-w-[120rem] items-center gap-10 py-20 md:grid-cols-12 md:gap-6 md:py-32`}>
                <div className={`relative md:col-span-6 lg:col-span-5 ${flip ? "md:order-2 md:col-start-7 lg:col-start-8" : "lg:col-start-1"}`}>
                  <Link href={`/collections/${c.slug}`} className="group block" data-cursor="Explore">
                    <div className="zoom-img relative aspect-[4/5] overflow-hidden" data-reveal="clip">
                      <Image src={c.image} alt={c.imageAlt} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
                    </div>
                  </Link>
                  <ConceptNote className="mt-3" tone={c.tone === "bone" ? "dark" : "light"} />
                </div>
                <div className={`md:col-span-6 ${flip ? "md:order-1 md:col-start-1 lg:col-start-1" : "lg:col-start-7"}`}>
                  <p className="eyebrow mb-6 opacity-60" data-reveal>
                    {c.kicker}
                  </p>
                  <SplitLines as="h3" className="display text-[clamp(3.4rem,10vw,10rem)] uppercase" lines={[c.name]} />
                  <p className="editorial mt-6 text-2xl italic opacity-80 md:text-3xl" data-reveal>
                    {c.tagline}
                  </p>
                  <p className="mt-6 max-w-md text-sm leading-relaxed opacity-75" data-reveal>
                    {c.description}
                  </p>
                  <ul className="mt-8 space-y-2 border-t border-current/15 pt-6" data-reveal>
                    {items.map((p) => (
                      <li key={p.handle}>
                        <Link href={`/shop/${p.handle}`} className="group flex items-baseline justify-between gap-6 py-1">
                          <span className="editorial text-xl md:text-2xl">
                            <span className="link-u">{p.title}</span>
                          </span>
                          <span className="eyebrow opacity-50">{p.code}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/collections/${c.slug}`} className={`btn mt-10 ${c.tone === "bone" ? "btn-dark" : "btn-light"}`} data-reveal>
                    <span className="btn-label">Explore {c.name}</span>
                    <Arrow className="relative" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ───────────────────────── 04 · Spotlight ───────────────────────── */
export function Spotlight({ product }: { product: Product }) {
  const cols = product.colorways.filter((c) => c.images.length >= 2);
  const offsets = ["md:mt-0", "md:mt-40", "md:mt-16"];
  return (
    <section aria-labelledby="spotlight-title" className="relative overflow-hidden py-28 md:py-44">
      <div className="gutter mx-auto max-w-[120rem]">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="eyebrow mb-4 text-ink/50" data-reveal>
              03 — Spotlight · {product.code}
            </p>
            <SplitLines as="h2" className="display text-[clamp(3rem,7vw,7rem)]" lines={[<span key="a" id="spotlight-title">One word</span>, <em key="b" className="editorial italic text-bordeaux">per colour.</em>]} />
          </div>
          <div className="md:col-span-5 md:col-start-8 md:pt-6">
            <p className="text-sm leading-relaxed text-ink/75" data-reveal>
              {product.description}
            </p>
            <Link href={`/shop/${product.handle}`} className="caps link-u mt-6 inline-flex items-center gap-3" data-reveal>
              Discover {product.title} <Arrow />
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-4 md:mt-24 md:gap-6">
          {cols.map((c, i) => (
            <Link key={c.id} href={`/shop/${product.handle}?colour=${c.id}`} className={`group block ${offsets[i % 3]}`} data-cursor="Turn">
              <div className="relative aspect-[2/3] overflow-hidden bg-bone" data-reveal="clip" data-delay={i * 0.12}>
                <Image src={c.images[0].src} alt={c.images[0].alt} fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover transition-[transform,opacity] duration-[1200ms] ease-[var(--ease-silk)] group-hover:scale-[1.03] group-hover:opacity-0" />
                <Image src={c.images[1].src} alt={c.images[1].alt} fill sizes="(min-width: 640px) 33vw, 100vw" className="scale-[1.06] object-cover opacity-0 transition-[transform,opacity] duration-[1200ms] ease-[var(--ease-silk)] group-hover:scale-100 group-hover:opacity-100" />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <p className="display text-3xl uppercase tracking-[0.12em] md:text-4xl">{c.name.split(" — ")[0]}</p>
                <p className="eyebrow text-ink/45">{c.name.split(" — ")[1]}</p>
              </div>
              <p className="mt-1 text-xs text-ink/45">Hover — front / back</p>
            </Link>
          ))}
        </div>
        <ConceptNote className="mt-10" />
      </div>
    </section>
  );
}

/* Full-bleed detail strip with horizontal scrub */
export function DetailStrip({ images }: { images: { src: string; alt: string; label: string }[] }) {
  return (
    <section aria-label="Details" className="overflow-hidden bg-paper pb-28 md:pb-40">
      <div className="flex gap-4 pl-[var(--gutter)] md:gap-6" data-scrub-x="-18">
        {images.map((im, i) => (
          <figure key={im.src} className={`relative shrink-0 ${i % 2 ? "w-[62vw] md:w-[30vw]" : "w-[72vw] md:w-[38vw]"}`}>
            <div className={`relative overflow-hidden ${i % 2 ? "aspect-square" : "aspect-[4/3]"}`}>
              <Image src={im.src} alt={im.alt} fill sizes="(min-width: 768px) 38vw, 72vw" className="object-cover" />
            </div>
            <figcaption className="eyebrow mt-3 text-ink/50">
              {String(i + 1).padStart(2, "0")} — {im.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── 05 · Craftsmanship ───────────────────────── */
const specs = [
  ["Fleece", "≈ 340 GSM main fleece", "330–350 GSM development range"],
  ["Knit", "Three-end brushed-back", "Smooth matte face, soft brushed interior"],
  ["Silhouette", "Boxy unisex", "Dropped shoulders, relaxed sleeves, slightly shorter body"],
  ["Hood", "Structured double layer", "Self fabric · no drawcords, no eyelets"],
  ["Pocket", "Reinforced kangaroo", "Self fabric, bartacked opening corners"],
  ["Signature", "Embroidered sleeves", "DAMI hand on both outer forearms — stitched, never printed"],
  ["Print", "Soft-hand screen print", "Matte, wash-tested on the actual fleece"],
  ["Rib", "2×2 recovery rib", "7.5 cm hem · 7 cm cuffs"],
];

export function Craftsmanship() {
  return (
    <section aria-labelledby="craft-title" className="grain grain-light relative bg-ink text-paper">
      <div className="gutter mx-auto grid max-w-[120rem] gap-16 py-28 md:grid-cols-12 md:py-44">
        <div className="md:col-span-5">
          <div className="md:sticky md:top-28">
            <p className="eyebrow mb-4 text-champagne" data-reveal>
              04 — Craftsmanship & materials
            </p>
            <SplitLines as="h2" className="display text-[clamp(3rem,7vw,7.5rem)]" lines={[<span key="a" id="craft-title">Considered,</span>, <em key="b" className="editorial italic text-champagne">down to the rib.</em>]} />
            <p className="mt-8 max-w-sm text-sm leading-relaxed text-paper/65" data-reveal>
              One material standard across every family. The figures below are the development targets set in our factory tech pack — they are confirmed only once physical pre-production samples are measured, wash-tested and signed off.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-3" data-reveal>
              <div className="relative aspect-square overflow-hidden">
                <Image src="/images/products/cfm-k01-detail-fabric.jpg" alt="Concept reference: bone fleece surface" fill sizes="(min-width: 768px) 20vw, 50vw" className="object-cover" data-parallax="0.12" />
              </div>
              <div className="relative aspect-square overflow-hidden">
                <Image src="/images/products/cfm-k01-detail-cuff.jpg" alt="Concept reference: rib cuff" fill sizes="(min-width: 768px) 20vw, 50vw" className="object-cover" />
              </div>
            </div>
            <ConceptNote tone="light" className="mt-3" />
          </div>
        </div>

        <div className="md:col-span-6 md:col-start-7">
          <ol className="border-t border-paper/15">
            {specs.map(([k, v, d], i) => (
              <li key={k} className="group grid grid-cols-[3rem_1fr] gap-4 border-b border-paper/15 py-8 md:grid-cols-[4rem_10rem_1fr] md:py-10" data-reveal>
                <span className="eyebrow pt-2 text-paper/35">{String(i + 1).padStart(2, "0")}</span>
                <span className="eyebrow pt-2 text-champagne max-md:col-start-2">{k}</span>
                <div className="max-md:col-start-2">
                  <p className="editorial text-3xl leading-tight transition-transform duration-700 ease-[var(--ease-silk)] group-hover:translate-x-2 md:text-4xl">{v}</p>
                  <p className="mt-2 text-sm text-paper/55">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="eyebrow mt-8 !text-[0.58rem] text-paper/40">Development targets — not yet verified product claims. Fibre composition will be stated once mill-verified.</p>

          <div className="mt-20 grid grid-cols-2 gap-3 md:gap-4">
            <figure className="col-span-2 relative aspect-[16/9] overflow-hidden" data-reveal="clip">
              <Image src="/images/products/ied-001-detail-shoulder.jpg" alt="Concept reference: curved shoulder seam detail" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
            </figure>
            <figure className="relative aspect-[3/4] overflow-hidden" data-reveal="clip" data-delay="0.1">
              <Image src="/images/products/cfm-k01-detail-sleeve.jpg" alt="Concept reference: embroidered sleeve signature" fill sizes="(min-width: 768px) 22vw, 50vw" className="object-cover" />
            </figure>
            <figure className="relative aspect-[3/4] overflow-hidden" data-reveal="clip" data-delay="0.2">
              <Image src="/images/products/ied-001-detail-hood.jpg" alt="Concept reference: woven tab on the hood" fill sizes="(min-width: 768px) 22vw, 50vw" className="object-cover" />
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── 06 · Statement ───────────────────────── */
export function Statement() {
  return (
    <section aria-label="Brand statement" className="grain relative overflow-hidden bg-bordeaux py-28 text-paper md:py-44">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <Wordmark className="text-[48vw] leading-none tracking-[0.02em] text-paper/[0.06]" />
      </div>
      <div className="relative">
        <div className="gutter md:whitespace-nowrap md:px-0" data-scrub-x="-30">
          <p className="display text-[clamp(3.6rem,13vw,14rem)] uppercase leading-[0.9]">Premium in every detail —</p>
        </div>
        <div className="gutter md:whitespace-nowrap md:px-0 md:pl-[12vw]" data-scrub-x="-12">
          <p className="editorial text-[clamp(3.6rem,13vw,14rem)] italic leading-[0.95] text-champagne">effortless in everyday life.</p>
        </div>
      </div>
      <div className="gutter relative mx-auto mt-16 flex max-w-[120rem] flex-col gap-6 md:mt-24 md:flex-row md:items-end md:justify-between">
        <p className="max-w-md text-sm leading-relaxed text-paper/75" data-reveal>
          Premium without being overpriced. Minimal without being plain. Expressive without being excessive.
        </p>
        <Link href="/about" className="btn btn-light self-start" data-reveal>
          <span className="btn-label">The DAMI story</span>
          <Arrow className="relative" />
        </Link>
      </div>
    </section>
  );
}
