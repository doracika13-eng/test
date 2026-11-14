import { Story } from "@/components/hero/Story";
import { CollectionsPanel } from "@/components/home/CollectionsPanel";
import { Craftsmanship, DetailStrip, Spotlight, Statement } from "@/components/home/Sections";
import { EarlyAccessForm } from "@/components/home/EarlyAccess";
import { SplitLines } from "@/components/ui/SplitLines";
import { getCollections, getProducts } from "@/lib/commerce";
import { site } from "@/lib/site";

export default async function Home() {
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  // Tunnel: every concept image except the arrival piece (Lumen front); front/back views become arches
  const tunnel = products.flatMap((p) =>
    p.colorways.flatMap((c) =>
      c.images
        .filter((im) => im.src !== "/images/products/ess-l01-front.jpg")
        .map((im) => ({ src: im.src, alt: im.alt, title: p.title, label: c.name, collection: p.collection, href: `/shop/${p.handle}`, hero: im.view === "Front" || im.view === "Back" })),
    ),
  );
  const counts = Object.fromEntries(collections.map((c) => [c.slug, products.filter((p) => p.collection === c.slug).length]));
  const spotlight = products.find((p) => p.handle === "eclat-desir-ombre") ?? products[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DAMI",
    url: site.url,
    description: site.description,
    address: { "@type": "PostalAddress", addressLocality: "Aix-en-Provence", addressCountry: "FR" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Story tunnel={tunnel} />
      <CollectionsPanel collections={collections} counts={counts} />
      {spotlight && <Spotlight product={spotlight} />}
      <DetailStrip
        images={[
          { src: "/images/products/cfm-t01-detail-print.jpg", alt: "DAMI Confirmed, back print", label: "CFM-T01 — DAMI Confirmed" },
          { src: "/images/products/ess-l01-detail-chevron.jpg", alt: "LUMEN, double chevron", label: "ESS-L01 — LUMEN" },
          { src: "/images/products/ess-e01-detail-sleeve.jpg", alt: "DÉSIR, sleeve embroidery", label: "ESS-E01 — DÉSIR" },
          { src: "/images/products/ied-001-detail-rib.jpg", alt: "I Edition, rib insert", label: "IED-001 — I Edition" },
          { src: "/images/products/cfm-k01-detail-chest.jpg", alt: "Bordeaux Kiss, Confirmed chest print", label: "CFM-K01 — Bordeaux Kiss" },
        ]}
      />
      <Craftsmanship />
      <Statement />
      <section aria-labelledby="ea-title" className="gutter relative mx-auto max-w-[120rem] py-28 md:py-44">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="eyebrow mb-4 text-ink/50" data-reveal>
              Newsletter / Early Access
            </p>
            <SplitLines as="h2" className="display text-[clamp(3rem,7.5vw,7.5rem)]" lines={[<span key="a" id="ea-title">Be first to</span>, <em key="b" className="editorial italic text-bordeaux">discover DAMI.</em>]} />
          </div>
          <div className="md:col-span-5 md:col-start-8 md:pt-16" data-reveal>
            <EarlyAccessForm />
          </div>
        </div>
      </section>
    </>
  );
}
