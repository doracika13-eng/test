"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export type SearchItem = { handle: string; title: string; subtitle: string; code: string; collection: string; image: string; colours: string[] };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function SearchOverlay({ open, onClose, items }: { open: boolean; onClose: () => void; items: SearchItem[] }) {
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setTimeout(() => input.current?.focus(), 30);
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", k);
      document.documentElement.style.overflow = "";
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const t = norm(q.trim());
    if (!t) return items;
    return items.filter((i) => norm([i.title, i.subtitle, i.code, i.collection, ...i.colours].join(" ")).includes(t));
  }, [q, items]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-[75] overflow-y-auto bg-paper text-ink [animation:fade-in_.4s_var(--ease-silk)]">
      <div className="gutter mx-auto max-w-[110rem] pb-16">
        <div className="flex h-[var(--header-h)] items-center justify-between">
          <p className="eyebrow text-ink/60">Search</p>
          <button onClick={onClose} className="caps link-u">
            Close
          </button>
        </div>
        <label htmlFor="site-search" className="sr-only">
          Search pieces, collections or colours
        </label>
        <input
          id="site-search"
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search DAMI"
          autoComplete="off"
          className="editorial w-full border-b border-ink/25 bg-transparent pb-4 pt-6 text-[clamp(2.5rem,7vw,6rem)] outline-none placeholder:text-ink/20 focus:border-ink"
        />
        <p className="eyebrow mt-6 text-ink/50" aria-live="polite">
          {results.length} {results.length === 1 ? "piece" : "pieces"}
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
          {results.map((r) => (
            <li key={r.handle}>
              <Link href={`/shop/${r.handle}`} onClick={onClose} className="group block">
                <div className="zoom-img relative aspect-[4/5] overflow-hidden bg-bone">
                  <Image src={r.image} alt="" fill sizes="(min-width:1024px) 20vw, 50vw" className="object-cover" />
                </div>
                <p className="eyebrow mt-4 text-ink/50">{r.code}</p>
                <p className="editorial mt-2 text-2xl">{r.title}</p>
              </Link>
            </li>
          ))}
        </ul>
        {results.length === 0 && <p className="editorial mt-6 text-3xl text-ink/60">Nothing matches “{q}”.</p>}
      </div>
    </div>
  );
}
