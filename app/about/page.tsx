import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SplitLines } from "@/components/ui/SplitLines";
import { ConceptNote } from "@/components/ui/ConceptNote";
import { Wordmark } from "@/components/ui/Wordmark";
import { Arrow } from "@/components/ui/Arrow";

export const metadata: Metadata = {
  title: "About",
  description: "DAMI brings together the visual language of luxury fashion and the freedom of contemporary streetwear.",
  alternates: { canonical: "/about" },
};

const values = [
  ["Design", "Every piece begins with a single idea — a word, a mark, a line — and is edited until nothing distracts from it."],
  ["Individuality", "A signature on both sleeves. A word that changes with the colour. Details that belong to the person wearing them."],
  ["Comfort", "Heavy, soft fleece, dropped shoulders and a boxy cut: built to be lived in, not just looked at."],
  ["Attention to detail", "Double-layer hoods, reinforced pockets, true embroidery. Nothing approved until it is held, measured and washed."],
];

export default function AboutPage() {
  return (
    <>
      <section className="grain grain-light relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink pb-16 pt-32 text-paper md:pb-24">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <Wordmark className="text-[40vw] leading-none text-paper/[0.05]" />
        </div>
        <div className="gutter relative mx-auto w-full max-w-[120rem]">
          <p className="eyebrow mb-6 text-champagne">About DAMI</p>
          <SplitLines
            as="h1"
            className="editorial max-w-[18ch] text-[clamp(2.8rem,7vw,7.5rem)] leading-[0.98]"
            lines={["A simple ambition:", <em key="a" className="text-champagne">luxury’s language,</em>, "streetwear’s freedom."]}
          />
        </div>
      </section>

      <section className="gutter mx-auto grid max-w-[120rem] gap-14 py-28 md:grid-cols-12 md:py-44">
        <div className="md:col-span-5">
          <div className="relative aspect-[3/4] overflow-hidden" data-reveal="clip">
            <Image src="/images/products/ess-e01-bone-front.jpg" alt="Concept reference: ÉCLAT hoodie in bone" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
          </div>
          <ConceptNote className="mt-3" />
        </div>
        <div className="space-y-8 md:col-span-6 md:col-start-7 md:pt-24">
          <p className="editorial text-3xl leading-[1.15] md:text-[2.6rem]" data-reveal>
            DAMI was created with a simple ambition: to bring together the visual language of luxury fashion and the freedom of contemporary streetwear.
          </p>
          <p className="max-w-lg text-base leading-relaxed text-ink/75" data-reveal>
            Built around design, individuality, comfort and attention to detail, DAMI aims to create pieces that feel considered, distinctive and effortlessly wearable.
          </p>
          <p className="max-w-lg text-base leading-relaxed text-ink/75" data-reveal>
            We believe premium fashion should not be defined by an inaccessible price tag, but by the thought, quality and identity behind every piece.
          </p>
        </div>
      </section>

      <section className="bg-bone">
        <div className="gutter mx-auto max-w-[120rem] py-28 md:py-40">
          <p className="eyebrow mb-12 text-ink/50" data-reveal>
            What we hold on to
          </p>
          <ol className="grid gap-px bg-ink/10 sm:grid-cols-2">
            {values.map(([k, v], i) => (
              <li key={k} className="bg-bone p-8 md:p-12" data-reveal data-delay={(i % 2) * 0.1}>
                <span className="eyebrow text-ink/40">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="display mt-6 text-4xl md:text-5xl">{k}</h2>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink/70">{v}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="gutter mx-auto grid max-w-[120rem] gap-14 py-28 md:grid-cols-12 md:py-44">
        <div className="md:col-span-5">
          <p className="eyebrow mb-6 text-ink/50" data-reveal>
            Between two places
          </p>
          <SplitLines as="h2" className="display text-[clamp(3rem,7vw,7rem)]" lines={["France ×", <em key="b" className="editorial italic text-bordeaux">Bangladesh</em>]} />
        </div>
        <div className="space-y-6 md:col-span-6 md:col-start-7 md:pt-10">
          <p className="text-base leading-relaxed text-ink/75" data-reveal>
            DAMI’s identity is shaped in Aix-en-Provence — its sense of proportion, its restraint, its love of a well-chosen word. Development is under way with manufacturing partners in Bangladesh, where our first samples are being made.
          </p>
          <p className="text-base leading-relaxed text-ink/75" data-reveal>
            Nothing is released on the strength of a rendering. Each design family moves through fabric swatches, a size-M prototype, embroidery stitch-outs and print strike-offs, and is signed off only as a physical, pre-production sample.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-6" data-reveal>
            {["/images/products/ied-001-detail-label.jpg", "/images/products/cfm-t01-detail-sleeve.jpg", "/images/products/ess-l01-detail-fabric.jpg"].map((s) => (
              <div key={s} className="relative aspect-square overflow-hidden">
                <Image src={s} alt="" fill sizes="15vw" className="object-cover" />
              </div>
            ))}
          </div>
          <Link href="/collections" className="btn btn-dark mt-6" data-reveal>
            <span className="btn-label">See the collections</span>
            <Arrow className="relative" />
          </Link>
        </div>
      </section>
    </>
  );
}
