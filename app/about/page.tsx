import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SplitLines } from "@/components/ui/SplitLines";
import { Wordmark } from "@/components/ui/Wordmark";
import { Arrow } from "@/components/ui/Arrow";

export const metadata: Metadata = {
  title: "About",
  description: "DAMI was created with a simple ambition: to bring together the visual language of luxury fashion and the freedom of contemporary streetwear.",
  alternates: { canonical: "/about" },
};

// From the DAMI brief — "DAMI should feel"
const feel = [
  "Minimalist but never boring.",
  "Premium but never pretentious.",
  "Modern, youthful, and confident.",
  "Expressive but not excessive.",
  "Sophisticated and fashion-forward.",
  "Comfortable and wearable.",
  "Exclusive without being inaccessible.",
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
            lines={["Luxury Aesthetics ×", "Streetwear Culture ×", <em key="a" className="text-champagne">Accessible Pricing.</em>]}
          />
        </div>
      </section>

      <section className="gutter mx-auto grid max-w-[120rem] gap-14 py-28 md:grid-cols-12 md:py-44">
        <div className="md:col-span-5">
          <div className="relative aspect-[3/4] overflow-hidden" data-reveal="clip">
            <Image src="/images/products/ess-e01-bone-front.jpg" alt="ÉCLAT hoodie, bone" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
          </div>
        </div>
        <div className="space-y-8 md:col-span-6 md:col-start-7 md:pt-24">
          <p className="editorial text-3xl leading-[1.15] md:text-[2.6rem]" data-reveal>
            DAMI was created with a simple ambition: to bring together the visual language of luxury fashion and the freedom of contemporary streetwear.
          </p>
          <p className="max-w-lg text-base leading-relaxed text-ink/75" data-reveal>
            Built around design, individuality, comfort, and attention to detail, DAMI aims to create pieces that feel considered, distinctive, and effortlessly wearable.
          </p>
          <p className="max-w-lg text-base leading-relaxed text-ink/75" data-reveal>
            We believe premium fashion should not be defined by an inaccessible price tag, but by the thought, quality, and identity behind every piece.
          </p>
        </div>
      </section>

      <section className="bg-bone">
        <div className="gutter mx-auto max-w-[120rem] py-28 md:py-40">
          <ol className="border-t border-ink/15">
            {feel.map((f, i) => (
              <li key={f} className="grid grid-cols-[3rem_1fr] items-baseline gap-4 border-b border-ink/15 py-6 md:grid-cols-[5rem_1fr] md:py-8" data-reveal>
                <span className="eyebrow text-ink/40">{String(i + 1).padStart(2, "0")}</span>
                <p className="display text-[clamp(1.8rem,4.4vw,4.2rem)]">{f}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="gutter mx-auto grid max-w-[120rem] gap-14 py-28 md:grid-cols-12 md:py-44">
        <div className="md:col-span-5">
          <SplitLines as="h2" className="display text-[clamp(3rem,7vw,7rem)]" lines={["France ×", <em key="b" className="editorial italic text-bordeaux">Bangladesh</em>]} />
        </div>
        <div className="space-y-6 md:col-span-6 md:col-start-7 md:pt-10">
          <p className="text-base leading-relaxed text-ink/75" data-reveal>
            The brand has a connection between France and Bangladesh, combining French-inspired fashion identity with potential manufacturing opportunities in Bangladesh.
          </p>
          <p className="text-base leading-relaxed text-ink/75" data-reveal>
            The long-term objective is to establish DAMI as a recognisable international fashion label.
          </p>
          <Link href="/collections" className="btn btn-dark mt-6" data-reveal>
            <span className="btn-label">Collections</span>
            <Arrow className="relative" />
          </Link>
        </div>
      </section>
    </>
  );
}
