import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * TEMPLATE LEGAL PAGES — to be reviewed and completed by a qualified adviser
 * before launch (company details, SIRET, governing law, data controller, etc.).
 */
const pages: Record<string, { title: string; intro: string; sections: [string, string][] }> = {
  privacy: {
    title: "Privacy Policy",
    intro: "How DAMI collects and uses personal data. This page is a working draft and will be finalised before launch.",
    sections: [
      ["What we collect", "If you join our early-access list we collect your email address and the date of your consent. If you shop with us after launch, order details are processed by our checkout provider (Shopify)."],
      ["Why we use it", "To send launch news and early-access invitations you have asked for, and — after launch — to fulfil and support your orders. We do not sell personal data."],
      ["Legal basis", "Email marketing is based on your consent, which you can withdraw at any time using the unsubscribe link in any email. Order processing is based on the performance of a contract."],
      ["Storage on your device", "Your shopping bag is stored in your browser's local storage so it survives page reloads. No advertising cookies are set by this website."],
      ["Your rights", "Under the GDPR you may access, correct, delete or port your data, and object to or restrict its processing. You may also lodge a complaint with the CNIL (France)."],
      ["Contact", "Data controller details and a contact address will be published here before launch."],
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro: "The terms that will govern use of this website and purchases from DAMI. Draft — to be completed before sales open.",
    sections: [
      ["About this website", "This website is operated by DAMI, Aix-en-Provence, France. Company registration details will be published here before launch."],
      ["Product information", "Products shown are in development. Imagery is concept reference material and does not represent final products. Specifications are development targets until approved."],
      ["Orders and payment", "No orders are currently accepted. Once sales open, payment will be handled securely by our checkout provider; DAMI never stores card details."],
      ["Intellectual property", "The DAMI name, designs, text and imagery on this website may not be reproduced without permission."],
    ],
  },
  "shipping-returns": {
    title: "Shipping & Returns",
    intro: "Delivery and return conditions will be confirmed before launch.",
    sections: [
      ["Shipping", "Destinations, carriers, rates and delivery times will be published here at launch."],
      ["Returns", "Return and exchange conditions will be published at launch. For EU customers, the statutory 14-day right of withdrawal for online purchases will apply."],
      ["Questions", "Until then, follow DAMI on Instagram or join the early-access list for launch details."],
    ],
  },
};

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = pages[slug];
  return p ? { title: p.title, description: p.intro, alternates: { canonical: `/legal/${slug}` } } : {};
}

export default async function LegalPage({ params }: Params) {
  const { slug } = await params;
  const p = pages[slug];
  if (!p) notFound();
  return (
    <article className="gutter mx-auto max-w-[120rem] pb-28 pt-32 md:pt-40">
      <div className="grid gap-12 md:grid-cols-12">
        <header className="md:col-span-5">
          <p className="eyebrow mb-4 text-ink/50">Client care</p>
          <h1 className="display text-[clamp(3rem,7vw,6.5rem)]">{p.title}</h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink/65">{p.intro}</p>
        </header>
        <div className="md:col-span-6 md:col-start-7">
          {p.sections.map(([h, b]) => (
            <section key={h} className="border-t border-ink/15 py-8">
              <h2 className="caps mb-3">{h}</h2>
              <p className="text-sm leading-relaxed text-ink/75">{b}</p>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
