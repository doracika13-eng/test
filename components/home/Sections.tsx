import Image from "next/image";
import Link from "next/link";
import { SplitLines } from "@/components/ui/SplitLines";
import { Arrow } from "@/components/ui/Arrow";

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
    <section aria-labelledby="craft-title" className="relative bg-ink text-paper">
      <div className="gutter mx-auto grid max-w-[120rem] gap-16 py-28 md:grid-cols-12 md:py-44">
        <div className="md:col-span-5">
          <div className="md:sticky md:top-28">
            <p className="eyebrow mb-4 text-champagne" data-reveal>
              Development specifications
            </p>
            <SplitLines as="h2" className="display text-[clamp(3rem,7vw,7.5rem)]" lines={[<span key="a" id="craft-title">Craftsmanship</span>, <em key="b" className="editorial italic text-champagne">&amp; Materials</em>]} />
            <div className="mt-10 grid grid-cols-2 gap-3" data-reveal>
              <div className="relative aspect-square overflow-hidden">
                <Image src="/images/products/cfm-k01-detail-fabric.jpg" alt="Fleece close-up, bone" fill sizes="(min-width: 768px) 20vw, 50vw" className="object-cover" />
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
    <section aria-label="Brand statement" className="relative overflow-hidden bg-bordeaux py-28 text-paper md:py-40">
      <div className="gutter mx-auto max-w-[120rem]">
        <p className="display text-[clamp(2.8rem,8vw,8.5rem)] uppercase leading-[0.92]" data-reveal>
          Premium in every detail.
        </p>
        <p className="editorial mt-2 text-[clamp(2.8rem,8vw,8.5rem)] italic leading-[0.95] text-champagne md:pl-[10vw]" data-reveal data-delay="0.1">
          Effortless in everyday life.
        </p>
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
