import Link from "next/link";
import { site } from "@/lib/site";
import { Wordmark } from "@/components/ui/Wordmark";

const cols = [
  {
    title: "Maison",
    links: [
      { href: "/shop", label: "Shop" },
      { href: "/collections", label: "Collections" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Client care",
    links: [
      { href: "/legal/shipping-returns", label: "Shipping & Returns" },
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/terms", label: "Terms & Conditions" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-ink text-paper">
      <div className="gutter mx-auto grid max-w-[120rem] gap-14 pb-10 pt-24 md:grid-cols-12 md:pt-32">
        <div className="md:col-span-5">
          <p className="editorial max-w-sm text-3xl leading-tight text-paper/90 md:text-4xl">
            Luxury aesthetics. Streetwear culture. <em className="text-champagne">Within reach.</em>
          </p>
          <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="caps link-u mt-10 inline-block" data-cursor="Follow">
            Instagram ↗
          </a>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title} className="md:col-span-3">
            <p className="eyebrow mb-6 text-paper/45">{c.title}</p>
            <ul className="space-y-3">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-u text-sm text-paper/85 hover:text-paper">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div className="md:col-span-1" />
      </div>

      <div className="gutter mx-auto max-w-[120rem]" aria-hidden>
        <Wordmark className="block w-full text-center text-[25vw] leading-[0.78] tracking-[0.04em] text-paper/[0.07] md:text-[23vw]" />
      </div>

      <div className="gutter mx-auto flex max-w-[120rem] flex-col gap-3 border-t border-paper/10 py-6 text-[0.7rem] text-paper/45 sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} DAMI. All rights reserved.</p>
        <p className="eyebrow !text-[0.6rem]">Aix-en-Provence · France</p>
      </div>
    </footer>
  );
}
