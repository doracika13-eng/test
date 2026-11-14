"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/commerce/types";

export function SizeGuide({ open, onClose, product, fit }: { open: boolean; onClose: () => void; product: Product; fit: string }) {
  const close = useRef<HTMLButtonElement>(null);
  const [unit, setUnit] = useState<"cm" | "in">("cm");

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
  const chart = product.sizeChart;
  const conv = (v: string | number) => (typeof v === "number" && chart?.unit === "cm" && unit === "in" ? (v / 2.54).toFixed(1) : v);

  return (
    <div className="fixed inset-0 z-[85]" role="dialog" aria-modal="true" aria-labelledby="sg-title">
      <button className="absolute inset-0 bg-ink/50 [animation:fade-in_.4s]" onClick={onClose} aria-label="Close size guide" tabIndex={-1} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[34rem] flex-col overflow-y-auto bg-paper p-6 [animation:slide-in-right_.7s_var(--ease-couture)] md:p-10">
        <div className="flex items-center justify-between">
          <p className="eyebrow text-ink/50">{product.code}</p>
          <button ref={close} onClick={onClose} className="caps link-u">
            Close
          </button>
        </div>
        <h2 id="sg-title" className="display mt-8 text-5xl">
          Size guide
        </h2>
        <p className="mt-6 text-sm leading-relaxed text-ink/75">{fit}</p>
        <p className="caps mt-8">Size range</p>
        <p className="mt-2 text-sm text-ink/75">{product.sizes.join(" · ")}</p>

        {chart ? (
          <>
            <div className="mt-8 flex gap-4">
              {(["cm", "in"] as const).map((u) => (
                <button key={u} onClick={() => setUnit(u)} aria-pressed={unit === u} className={`caps ${unit === u ? "text-ink" : "text-ink/40"}`}>
                  {u}
                </button>
              ))}
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-xs">
                <caption className="sr-only">Garment measurements in {unit}</caption>
                <thead>
                  <tr className="border-b border-ink/20">
                    <th scope="col" className="py-3 pr-4 font-medium">Measurement</th>
                    {chart.columns.map((c) => (
                      <th key={c} scope="col" className="py-3 pr-3 font-medium">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chart.rows.map((r) => (
                    <tr key={r.label} className="border-b border-ink/10">
                      <th scope="row" className="py-3 pr-4 font-normal text-ink/70">{r.label}</th>
                      {r.values.map((v, i) => (
                        <td key={i} className="py-3 pr-3 tabular-nums">{conv(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {chart.note && <p className="mt-4 text-xs text-ink/55">{chart.note}</p>}
          </>
        ) : (
          <div className="mt-10 border border-ink/15 bg-bone/50 p-6">
            <p className="editorial text-2xl">Measurements coming soon.</p>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">
              Garment measurements will be published here once the physical size-set samples have been measured and approved. Until then we don&apos;t publish provisional factory figures, so that what you read is what you receive.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
