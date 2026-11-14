"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { Collection, Product } from "@/lib/commerce/types";
import { ProductCard } from "./ProductCard";

export function ShopGrid({ products, collections }: { products: Product[]; collections: Collection[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const active = params.get("collection") ?? "all";
  const colour = params.get("colour") ?? "all";

  const colours = useMemo(() => {
    const m = new Map<string, string>();
    products.forEach((p) => p.colorways.forEach((c) => m.set(c.name.split(" — ").pop()!.toLowerCase(), c.hex)));
    return [...m.entries()];
  }, [products]);

  const list = products.filter(
    (p) => (active === "all" || p.collection === active) && (colour === "all" || p.colorways.some((c) => c.name.toLowerCase().includes(colour))),
  );

  const set = (k: string, v: string) => {
    const q = new URLSearchParams(params.toString());
    if (v === "all") q.delete(k);
    else q.set(k, v);
    router.replace(`/shop${q.size ? `?${q}` : ""}`, { scroll: false });
  };

  return (
    <>
      <div className="sticky top-14 z-20 -mx-[var(--gutter)] border-y border-ink/10 bg-paper/92 px-[var(--gutter)] backdrop-blur-md">
        <div className="no-scrollbar flex items-center gap-6 overflow-x-auto py-4">
          <span className="eyebrow shrink-0 text-ink/40">Filter</span>
          {[{ slug: "all", name: "All" }, ...collections].map((c) => (
            <button key={c.slug} onClick={() => set("collection", c.slug)} aria-pressed={active === c.slug} className={`caps link-u shrink-0 ${active === c.slug ? "text-ink" : "text-ink/45"}`} aria-current={active === c.slug ? "page" : undefined}>
              {c.name}
            </button>
          ))}
          <span className="h-4 w-px shrink-0 bg-ink/15" />
          <button onClick={() => set("colour", "all")} aria-pressed={colour === "all"} className={`caps shrink-0 ${colour === "all" ? "text-ink" : "text-ink/45"}`}>
            Any colour
          </button>
          {colours.map(([name, hex]) => (
            <button key={name} onClick={() => set("colour", name)} aria-pressed={colour === name} aria-label={`Colour: ${name}`} title={name} className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${colour === name ? "border-ink" : "border-transparent"}`}>
              <span className="h-4 w-4 rounded-full border border-ink/20" style={{ background: hex }} />
            </button>
          ))}
          <span className="eyebrow ml-auto shrink-0 text-ink/40" aria-live="polite">
            {list.length} {list.length === 1 ? "piece" : "pieces"}
          </span>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="editorial py-32 text-center text-4xl text-ink/60">No pieces match this selection.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-x-4 gap-y-16 py-14 sm:grid-cols-2 md:gap-x-6 lg:grid-cols-12 lg:gap-y-24">
          {list.map((p, i) => {
            // editorial rhythm: big / small / small — and offsets on desktop
            const pattern = ["lg:col-span-6", "lg:col-span-3 lg:mt-40", "lg:col-span-3", "lg:col-span-4 lg:col-start-2", "lg:col-span-5 lg:col-start-7 lg:mt-24"];
            return (
              <li key={p.handle} className={pattern[i % pattern.length]} data-reveal data-delay={(i % 3) * 0.08}>
                <ProductCard product={p} priority={i < 2} aspect={i % 5 === 0 ? "aspect-[4/5]" : "aspect-[3/4]"} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
