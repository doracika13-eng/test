import type { Metadata } from "next";
import { site } from "@/lib/site";
import { SplitLines } from "@/components/ui/SplitLines";
import { EarlyAccessForm } from "@/components/home/EarlyAccess";

export const metadata: Metadata = { title: "Contact", description: "Get in touch with DAMI.", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return (
    <div className="gutter mx-auto max-w-[120rem] pb-28 pt-32 md:pt-40">
      <p className="eyebrow mb-4 text-ink/50">Contact</p>
      <SplitLines as="h1" className="display text-[clamp(3.6rem,11vw,11rem)]" lines={["Say bonjour."]} />
      <div className="mt-20 grid gap-14 md:grid-cols-12">
        <dl className="space-y-10 md:col-span-5">
          <div>
            <dt className="eyebrow mb-3 text-ink/50">Studio</dt>
            <dd className="editorial text-3xl">Aix-en-Provence, France</dd>
          </div>
          <div>
            <dt className="eyebrow mb-3 text-ink/50">Email</dt>
            <dd className="editorial text-3xl">
              {site.email ? (
                <a href={`mailto:${site.email}`} className="link-u">
                  {site.email}
                </a>
              ) : (
                <span className="text-ink/50">Address to be announced</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="eyebrow mb-3 text-ink/50">Social</dt>
            <dd className="editorial text-3xl">
              <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="link-u">
                Instagram ↗
              </a>
            </dd>
          </div>
        </dl>
        <div className="md:col-span-6 md:col-start-7">
          <p className="eyebrow mb-6 text-ink/50">Early access</p>
          <p className="mb-8 max-w-md text-sm leading-relaxed text-ink/70">Leave your email to hear first about launch dates and releases.</p>
          <EarlyAccessForm />
        </div>
      </div>
    </div>
  );
}
