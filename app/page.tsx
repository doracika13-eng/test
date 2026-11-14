import { Story } from "@/components/hero/Story";
import { Runway } from "@/components/runway/Runway";
import { RUNWAY } from "@/content/runway";
import { Craftsmanship, Statement } from "@/components/home/Sections";
import { EarlyAccessForm } from "@/components/home/EarlyAccess";
import { SplitLines } from "@/components/ui/SplitLines";
import { getProducts } from "@/lib/commerce";
import { site } from "@/lib/site";

export default async function Home() {
  const products = await getProducts();
  // Tunnel: every concept image except the arrival piece (Lumen front); front/back views become arches
  const tunnel = products.flatMap((p) =>
    p.colorways.flatMap((c) =>
      c.images
        .filter((im) => im.src !== "/images/products/ess-l01-front.jpg")
        .map((im) => ({ src: im.src, alt: im.alt, title: p.title, label: c.name, collection: p.collection, href: `/shop/${p.handle}`, hero: im.view === "Front" || im.view === "Back" })),
    ),
  );

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
      <Runway looks={RUNWAY} products={products} />
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
