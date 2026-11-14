import type { Metadata } from "next";
import { site } from "@/lib/site";
import { SplitLines } from "@/components/ui/SplitLines";
import { EarlyAccessForm } from "@/components/home/EarlyAccess";

export const metadata: Metadata = { title: "Contact", description: "Contact DAMI.", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return (
    <div className="gutter mx-auto max-w-[120rem] pb-28 pt-32 md:pt-40">
      <SplitLines as="h1" className="display text-[clamp(3.6rem,11vw,11rem)]" lines={["Contact"]} />
      <div className="mt-20 grid gap-14 md:grid-cols-12">
        <dl className="space-y-10 md:col-span-5">
          <div>
            <dt className="eyebrow mb-3 text-ink/50">DAMI</dt>
            <dd className="editorial text-3xl">Aix-en-Provence, France</dd>
          </div>
          <div>
            <dt className="eyebrow mb-3 text-ink/50">Email</dt>
            {/* Plain text on purpose — not a mailto link. */}
            <dd className="editorial select-text text-3xl text-ink/50">{site.email || "Soon"}</dd>
          </div>
          <div>
            <dt className="eyebrow mb-3 text-ink/50">Instagram</dt>
            <dd className="editorial text-3xl text-ink/50">Soon</dd>
          </div>
        </dl>
        <div className="md:col-span-6 md:col-start-7">
          <p className="eyebrow mb-6 text-ink/50">Be first to discover DAMI.</p>
          <EarlyAccessForm />
        </div>
      </div>
    </div>
  );
}
