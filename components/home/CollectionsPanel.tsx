"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Collection } from "@/lib/commerce/types";

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Figures from the DAMI brief (development specifications).
const STATS = [
  { value: 5, label: "Design families", dec: 0 },
  { value: 340, label: "GSM main fleece", dec: 0 },
  { value: 6, label: "Sizes XS–XXL", dec: 0 },
  { value: 2, label: "Sleeve embroidery", dec: 0 },
];

export function CollectionsPanel({ collections, counts }: { collections: Collection[]; counts: Record<string, number> }) {
  const root = useRef<HTMLElement>(null);

  // count-up once the panel top passes 60% of the viewport
  useEffect(() => {
    const el = root.current!;
    const nums = Array.from(el.querySelectorAll<HTMLElement>("[data-stat]"));
    let done = false, raf = 0;
    const run = () => {
      const t0 = performance.now();
      const step = (now: number) => {
        const k = ease(Math.min(1, (now - t0) / 1600));
        nums.forEach((n) => {
          const v = Number(n.dataset.stat) * k;
          n.textContent = v.toLocaleString("en-GB", { maximumFractionDigits: Number(n.dataset.dec) || 0 });
        });
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const check = () => {
      if (done) return;
      if (el.getBoundingClientRect().top < innerHeight * 0.6) {
        done = true;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) nums.forEach((n) => (n.textContent = n.dataset.stat!));
        else run();
      }
    };
    window.addEventListener("scroll", check, { passive: true });
    check();
    return () => {
      window.removeEventListener("scroll", check);
      cancelAnimationFrame(raf);
    };
  }, []);

  const tilt = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
  };
  const reset = (e: React.PointerEvent<HTMLAnchorElement>) => (e.currentTarget.style.transform = "");

  return (
    <section
      ref={root}
      aria-labelledby="panel-title"
      className="relative z-[5] -mt-[30vh] rounded-t-[22px] bg-paper px-[34px] pb-[90px] pt-[70px] text-ink shadow-[0_-30px_60px_rgba(0,0,0,0.35)] max-md:px-[18px] max-md:pb-[70px] max-md:pt-[50px]"
    >
      <div className="mx-auto max-w-[120rem]">
        <div className="flex flex-wrap items-end justify-between gap-10">
          <div>
            <span className="chip">Collections</span>
            <h2 id="panel-title" className="display mt-5 max-w-[680px] text-[clamp(36px,4.4vw,68px)] leading-[0.98]">
              Featured <em className="editorial italic text-bordeaux">Collection</em>
            </h2>
          </div>
        </div>

        <div className="mt-[54px] grid gap-3.5 md:grid-cols-3">
          {collections.map((c, i) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              onPointerMove={tilt}
              onPointerLeave={reset}
              className="group relative h-[440px] overflow-hidden rounded-xl bg-charcoal text-paper transition-transform duration-300 ease-out max-md:h-[340px]"
              data-cursor="Explore"
            >
              <div
                className="absolute inset-0 bg-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-[1.07]"
                style={{ backgroundImage: `url(${c.image})`, backgroundPosition: "50% 20%" }}
                role="img"
                aria-label={c.imageAlt}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,17,17,.5),transparent_35%,transparent_50%,rgba(17,17,17,.82))]" />
              <div className="absolute inset-x-[18px] top-[18px] flex items-center justify-between">
                <span className="mono-s !text-[10.5px]">[{c.kicker}]</span>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-champagne text-ink transition-transform duration-500 group-hover:-rotate-45">→</span>
              </div>
              <div className="absolute inset-x-[18px] bottom-[18px]">
                <p className="mono-s mb-2 !text-[10px] opacity-70">
                  {counts[c.slug] ?? 0} {counts[c.slug] === 1 ? "piece" : "pieces"} · {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="display text-[clamp(30px,2.6vw,40px)] uppercase leading-[1]">{c.name}</h3>
                {c.tagline && <p className="editorial mt-1 text-lg italic text-champagne">{c.tagline}</p>}
                <p className="max-h-0 overflow-hidden text-[13.5px] leading-relaxed text-paper/80 transition-[max-height,margin] duration-[600ms] group-hover:mt-2 group-hover:max-h-[100px]">{c.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-[60px] grid grid-cols-4 border-t border-ink/10 max-md:grid-cols-2">
          {STATS.map((s) => (
            <div key={s.label} className="pt-[22px] max-md:pb-4">
              <p className="text-[44px] font-medium tracking-[-0.04em] tabular-nums max-md:text-[36px]">
                <span data-stat={s.value} data-dec={s.dec}>
                  0
                </span>
              </p>
              <p className="mono-s !text-[10.5px] text-ink/50">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
