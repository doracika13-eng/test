import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/commerce/types";
import { SplitLines } from "@/components/ui/SplitLines";
import { Arrow } from "@/components/ui/Arrow";
import { Wordmark } from "@/components/ui/Wordmark";

/* ───────────────────────── Product spotlight ───────────────────────── */
export function Spotlight({ product }: { product: Product }) {
  const cols = product.colorways.filter((c) => c.images.length >= 2);
  const offsets = ["md:mt-0", "md:mt-40", "md:mt-16"];
  return (
    <section aria-labelledby="spotlight-title" className="relative overflow-hidden py-28 md:py-44">
      <div className="gutter mx-auto max-w-[120rem]">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="eyebrow mb-4 text-ink/50" data-reveal>
              Product Spotlight · {product.code}
            </p>
            <SplitLines as="h2" className="display text-[clamp(3rem,7vw,7rem)]" lines={[<span key="a" id="spotlight-title">ÉCLAT / DÉSIR</span>, <em key="b" className="editorial italic text-bordeaux">/ OMBRE</em>]} />
          </div>
          <div className="md:col-span-5 md:col-start-8 md:pt-6">
            <p className="text-sm leading-relaxed text-ink/75" data-reveal>
              {product.description}
            </p>
            <Link href={`/shop/${product.handle}`} className="caps link-u mt-6 inline-flex items-center gap-3" data-reveal>
              {product.title} <Arrow />
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-4 md:mt-24 md:gap-6">
          {cols.map((c, i) => (
            <Link key={c.id} href={`/shop/${product.handle}?colour=${c.id}`} className={`group block ${offsets[i % 3]}`} data-cursor="View">
              <div className="relative aspect-[2/3] overflow-hidden bg-bone" data-reveal="clip" data-delay={i * 0.12}>
                <Image src={c.images[0].src} alt={c.images[0].alt} fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover transition-[transform,opacity] duration-[1200ms] ease-[var(--ease-silk)] group-hover:scale-[1.03] group-hover:opacity-0" />
                <Image src={c.images[1].src} alt={c.images[1].alt} fill sizes="(min-width: 640px) 33vw, 100vw" className="scale-[1.06] object-cover opacity-0 transition-[transform,opacity] duration-[1200ms] ease-[var(--ease-silk)] group-hover:scale-100 group-hover:opacity-100" />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <p className="display text-3xl uppercase tracking-[0.12em] md:text-4xl">{c.name.split(" — ")[0]}</p>
                <p className="eyebrow text-ink/45">{c.name.split(" — ")[1]}</p>
              </div>
            </Link>
          ))}
        </div>
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
            <figcaption className="eyebrow mt-3 text-ink/50">{im.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── Craftsmanship & Materials ───────────────────────── */
// Exactly the development specification list from the DAMI brief.
const specs = [
  "Approximately 340 GSM main fleece, with a 330–350 GSM development range",
  "Three-end brushed-back fleece",
  "Smooth matte exterior",
  "Soft brushed interior",
  "Boxy unisex silhouette",
  "Dropped shoulders",
  "Structured double-layer hood",
  "No hood drawstrings",
  "Reinforced kangaroo pocket",
  "Premium sleeve embroidery",
  "Soft-hand screen printing",
];

export function Craftsmanship() {
  return (
    <section aria-labelledby="craft-title" className="grain grain-light relative bg-ink text-paper">
      <div className="gutter mx-auto grid max-w-[120rem] gap-16 py-28 md:grid-cols-12 md:py-44">
        <div className="md:col-span-5">
          <div className="md:sticky md:top-28">
            <p className="eyebrow mb-4 text-champagne" data-reveal>
              Development specifications
            </p>
            <SplitLines as="h2" className="display text-[clamp(3rem,7vw,7.5rem)]" lines={[<span key="a" id="craft-title">Craftsmanship</span>, <em key="b" className="editorial italic text-champagne">&amp; Materials</em>]} />
            <div className="mt-10 grid grid-cols-2 gap-3" data-reveal>
              <div className="relative aspect-square overflow-hidden">
                <Image src="/images/products/cfm-k01-detail-fabric.jpg" alt="Fleece close-up, bone" fill sizes="(min-width: 768px) 20vw, 50vw" className="object-cover" data-parallax="0.12" />
              </div>
              <div className="relative aspect-square overflow-hidden">
                <Image src="/images/products/cfm-k01-detail-cuff.jpg" alt="Rib cuff, bone" fill sizes="(min-width: 768px) 20vw, 50vw" className="object-cover" />
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-6 md:col-start-7">
          <ol className="border-t border-paper/15">
            {specs.map((v, i) => (
              <li key={v} className="group grid grid-cols-[3rem_1fr] gap-4 border-b border-paper/15 py-6 md:grid-cols-[4rem_1fr] md:py-8" data-reveal>
                <span className="eyebrow pt-2 text-paper/35">{String(i + 1).padStart(2, "0")}</span>
                <p className="editorial text-2xl leading-tight transition-transform duration-700 ease-[var(--ease-silk)] group-hover:translate-x-2 md:text-4xl">{v}</p>
              </li>
            ))}
          </ol>
          <p className="eyebrow mt-8 !text-[0.58rem] text-paper/40">Development specifications — until physically verified and approved.</p>

          <div className="mt-20 grid grid-cols-2 gap-3 md:gap-4">
            <figure className="relative col-span-2 aspect-[16/9] overflow-hidden" data-reveal="clip">
              <Image src="/images/products/ied-001-detail-shoulder.jpg" alt="I Edition, curved seam" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
            </figure>
            <figure className="relative aspect-[3/4] overflow-hidden" data-reveal="clip" data-delay="0.1">
              <Image src="/images/products/cfm-k01-detail-sleeve.jpg" alt="DAMI sleeve embroidery" fill sizes="(min-width: 768px) 22vw, 50vw" className="object-cover" />
            </figure>
            <figure className="relative aspect-[3/4] overflow-hidden" data-reveal="clip" data-delay="0.2">
              <Image src="/images/products/ied-001-detail-hood.jpg" alt="I Edition hood tab" fill sizes="(min-width: 768px) 22vw, 50vw" className="object-cover" />
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Brand statement ───────────────────────── */
export function Statement() {
  return (
    <section aria-label="Brand statement" className="grain relative overflow-hidden bg-bordeaux py-28 text-paper md:py-44">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <Wordmark className="text-[48vw] leading-none tracking-[0.02em] text-paper/[0.06]" />
      </div>
      <div className="relative">
        <div className="gutter md:whitespace-nowrap md:px-0" data-scrub-x="-30">
          <p className="display text-[clamp(3.6rem,13vw,14rem)] uppercase leading-[0.9]">Premium in every detail.</p>
        </div>
        <div className="gutter md:whitespace-nowrap md:px-0 md:pl-[12vw]" data-scrub-x="-12">
          <p className="editorial text-[clamp(3.6rem,13vw,14rem)] italic leading-[0.95] text-champagne">Effortless in everyday life.</p>
        </div>
      </div>
      <div className="gutter relative mx-auto mt-16 flex max-w-[120rem] flex-col gap-6 md:mt-24 md:flex-row md:items-end md:justify-between">
        <p className="max-w-md text-sm leading-relaxed text-paper/75" data-reveal>
          Premium without being overpriced. Minimal without being plain. Expressive without being excessive.
        </p>
        <Link href="/about" className="btn btn-light self-start" data-reveal>
          <span className="btn-label">About DAMI</span>
          <Arrow className="relative" />
        </Link>
      </div>
    </section>
  );
}
