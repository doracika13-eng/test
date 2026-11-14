"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { site } from "@/lib/site";
import { Wordmark } from "@/components/ui/Wordmark";

const items = [
  { href: "/shop", label: "Shop" },
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MobileMenu({ open, onClose, onSearch }: { open: boolean; onClose: () => void; onSearch: () => void }) {
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", k);
      document.documentElement.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[70] flex flex-col bg-ink text-paper [animation:fade-in_.5s_var(--ease-silk)]">
      <div className="gutter flex h-[var(--header-h)] items-center justify-between">
        <button ref={close} onClick={onClose} className="caps">
          Close
        </button>
        <Wordmark className="text-[1.6rem]" />
        <button onClick={onSearch} className="caps">
          Search
        </button>
      </div>
      <nav aria-label="Mobile" className="gutter flex flex-1 flex-col justify-center gap-2">
        {items.map((it, i) => (
          <Link
            key={it.href}
            href={it.href}
            onClick={onClose}
            className="display flex items-baseline gap-4 text-[clamp(3rem,15vw,5.5rem)] tracking-[-0.01em] [animation:page-in_.9s_var(--ease-silk)_both]"
            style={{ animationDelay: `${120 + i * 70}ms` }}
          >
            <span className="eyebrow !text-[0.6rem] text-champagne">0{i + 1}</span>
            {it.label}
          </Link>
        ))}
      </nav>
      <div className="gutter flex items-center justify-between border-t border-paper/10 py-6">
        {site.instagram ? (
          <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="caps">
            Instagram
          </a>
        ) : (
          <span className="caps text-paper/40">Instagram · soon</span>
        )}
        <span className="eyebrow text-paper/50">Aix-en-Provence</span>
      </div>
    </div>
  );
}
