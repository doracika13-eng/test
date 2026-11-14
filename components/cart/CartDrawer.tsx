"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/format";

export function CartDrawer({ live }: { live: boolean }) {
  const { lines, open, setOpen, update, remove, subtotal, count, checkout, checkoutState } = useCart();
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>("a,button:not(:disabled),input");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      prev?.focus?.();
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <button
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px] [animation:fade-in_.5s_var(--ease-silk)]"
        aria-label="Close bag"
        onClick={() => setOpen(false)}
        tabIndex={-1}
      />
      <div
        ref={panel}
        className="absolute inset-y-0 right-0 flex w-full max-w-[30rem] flex-col bg-paper text-ink [animation:slide-in-right_.7s_var(--ease-couture)]"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <p className="eyebrow">
            Bag <span className="text-ink/50">({count})</span>
          </p>
          <button ref={closeBtn} onClick={() => setOpen(false)} className="caps link-u" data-cursor="Close">
            Close
          </button>
        </div>

        {!live && (
          <p className="border-b border-ink/10 bg-bone/60 px-6 py-3 text-xs leading-relaxed text-ink/70">
            Orders are not open yet.
          </p>
        )}

        <div className="flex-1 overflow-y-auto px-6">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-start justify-center gap-6 py-16">
              <p className="editorial text-4xl">Your bag is empty.</p>
              <Link href="/shop" className="btn btn-dark" onClick={() => setOpen(false)}>
                <span className="btn-label">Shop</span>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-ink/10">
              {lines.map((l) => (
                <li key={l.variantId} className="flex gap-4 py-6">
                  <Link href={`/shop/${l.handle}`} onClick={() => setOpen(false)} className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-bone">
                    <Image src={l.image} alt="" fill sizes="96px" className="object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/shop/${l.handle}`} onClick={() => setOpen(false)} className="editorial text-xl leading-tight">
                        {l.title}
                      </Link>
                      <p className="shrink-0 text-xs text-ink/70">{formatPrice(l.price)}</p>
                    </div>
                    <p className="mt-1 text-xs text-ink/60">
                      {l.colorway} · {l.size}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="flex items-center border border-ink/20" role="group" aria-label={`Quantity for ${l.title}`}>
                        <button className="grid h-9 w-9 place-items-center" onClick={() => update(l.variantId, l.quantity - 1)} aria-label="Decrease quantity">
                          −
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
                          {l.quantity}
                        </span>
                        <button
                          className="grid h-9 w-9 place-items-center disabled:opacity-30"
                          onClick={() => update(l.variantId, l.quantity + 1)}
                          disabled={l.quantity >= 10}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button className="caps link-u text-ink/60" onClick={() => remove(l.variantId)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-ink/10 px-6 py-6">
            <div className="mb-1 flex justify-between text-sm">
              <span className="caps">Subtotal</span>
              <span>{subtotal ? formatPrice(subtotal) : "—"}</span>
            </div>
            <p className="mb-5 text-xs text-ink/55">Shipping and taxes are calculated at checkout.</p>
            <button className="btn btn-solid w-full" onClick={checkout} disabled={checkoutState.status === "loading"}>
              <span className="btn-label">{checkoutState.status === "loading" ? "Preparing checkout…" : "Checkout"}</span>
            </button>
            {checkoutState.status === "error" && (
              <p role="alert" className="mt-3 text-xs leading-relaxed text-bordeaux">
                {checkoutState.message}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
