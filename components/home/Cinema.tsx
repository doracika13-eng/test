"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * Two full-viewport sections over a scroll-scrubbed cinematic background.
 * The background is a canvas that dissolves slowly between DAMI images while
 * pushing in — driven only by scroll (smoothed), never auto-playing.
 * Copy is taken from the DAMI brief.
 */

const FRAMES = [
  "/images/products/cfm-k01-back.jpg",
  "/images/products/ied-001-front.jpg",
  "/images/products/ess-e01-bordeaux-back.jpg",
  "/images/products/cfm-t01-back.jpg",
];

const FAMILIES = ["CFM-K01 — Bordeaux Kiss", "ESS-E01 — Éclat / Désir / Ombre", "ESS-L01 — Lumen", "IED-001 — I Edition", "CFM-T01 — DAMI Confirmed"];

const SPECS = [
  { title: "Three-end brushed-back fleece", body: "Smooth matte exterior. Soft brushed interior. Approximately 340 GSM." },
  { title: "Structured double-layer hood", body: "No hood drawstrings. Boxy unisex silhouette, dropped shoulders." },
  { title: "Premium sleeve embroidery", body: "Soft-hand screen printing. Reinforced kangaroo pocket." },
];

function Chevron({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/** Fade-up reveal on enter: hidden translate-y-8 opacity-0 → visible, 700ms ease-out. */
function R({ d = 0, className = "", children, as: Tag = "div" }: { d?: number; className?: string; children: React.ReactNode; as?: "div" | "p" | "h2" | "li" | "span" }) {
  return (
    <Tag data-cin-reveal className={`translate-y-8 opacity-0 transition-all duration-700 ease-out will-change-transform ${className}`} style={{ transitionDelay: `${d}ms` }}>
      {children}
    </Tag>
  );
}

export function Cinema() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  // staggered reveals
  useEffect(() => {
    const els = root.current!.querySelectorAll<HTMLElement>("[data-cin-reveal]");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((e) => e.classList.remove("translate-y-8", "opacity-0"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.remove("translate-y-8", "opacity-0");
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.15 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  // scroll-scrubbed background
  useEffect(() => {
    const el = root.current!;
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const imgs: HTMLImageElement[] = [];
    let loaded = 0;
    let target = 0, smoothed = 0, raf = 0, visible = false;

    FRAMES.forEach((src, i) => {
      const im = new window.Image();
      im.decoding = "async";
      im.onload = () => {
        loaded++;
        draw();
      };
      im.src = src;
      imgs[i] = im;
    });

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(cv.clientWidth * dpr);
      cv.height = Math.round(cv.clientHeight * dpr);
      draw();
    };

    // object-cover draw with push-in and slight drift
    const cover = (im: HTMLImageElement, alpha: number, zoom: number, dx: number) => {
      if (!im.complete || !im.naturalWidth || alpha <= 0) return;
      const cw = cv.width, ch = cv.height;
      const s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight) * zoom;
      const w = im.naturalWidth * s, h = im.naturalHeight * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(im, (cw - w) / 2 + dx * cw, (ch - h) / 2 - h * 0.04 * (zoom - 1) * 4, w, h);
    };

    function draw() {
      if (!loaded) return;
      const p = smoothed * (FRAMES.length - 1);
      const i = Math.min(FRAMES.length - 2, Math.floor(p));
      const t = p - i;
      const mix = t < 0.6 ? 0 : (t - 0.6) / 0.4; // hold, then dissolve
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#111111";
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.filter = "blur(1.2px) saturate(0.9)";
      cover(imgs[i], 1, 1.06 + t * 0.14, (t - 0.5) * 0.02);
      cover(imgs[i + 1], mix, 1.2 - mix * 0.14, (mix - 0.5) * -0.02);
      ctx.filter = "none";
      ctx.globalAlpha = 1;
    }

    const read = () => {
      const r = el.getBoundingClientRect();
      const span = el.offsetHeight - window.innerHeight;
      target = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    };

    const loop = () => {
      raf = 0;
      read();
      smoothed = reduce ? target : smoothed + (target - smoothed) * 0.12;
      if (Math.abs(target - smoothed) < 0.0005) smoothed = target;
      draw();
      if (visible && smoothed !== target) raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf && visible) raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      kick();
    });
    io.observe(el);
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    window.addEventListener("scroll", kick, { passive: true });
    size();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", kick);
    };
  }, []);

  const pad = "px-5 sm:px-8 md:px-12";
  const shell = `relative flex min-h-screen flex-col justify-between pb-12 pt-24 supports-[height:100svh]:min-h-[100svh] sm:pt-28 md:pb-16 ${pad}`;
  const badge = "inline-block border-l-2 border-paper bg-white/15 px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] backdrop-blur-md";
  const headline = "display text-5xl font-normal leading-[1.02] tracking-tight drop-shadow-lg sm:text-6xl lg:text-7xl";

  return (
    <div ref={root} data-header-dark className="relative bg-ink text-paper">
      {/* scrubbed background */}
      <div className="pointer-events-none sticky top-0 z-0 h-screen overflow-hidden supports-[height:100svh]:h-[100svh]" aria-hidden>
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,rgba(17,17,17,0.25),rgba(17,17,17,0.72))]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-ink/60" />
      </div>

      <div className="relative z-10 -mt-[100vh] supports-[height:100svh]:-mt-[100svh]">
        {/* Section one */}
        <section className={shell} aria-labelledby="cin-h1">
          <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
            <ul className="flex flex-col gap-2">
              {FAMILIES.map((f, i) => (
                <R key={f} as="li" d={150 + i * 120} className="text-xs uppercase tracking-[0.15em] text-paper/90 drop-shadow-md">
                  / {f}
                </R>
              ))}
            </ul>
            <R as="p" d={300} className="max-w-xs text-lg leading-relaxed drop-shadow-md sm:text-right sm:text-xl">
              Premium without being overpriced. Minimal without being plain. Expressive without being excessive.
            </R>
          </div>

          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <R d={150} className="mb-5">
                <span className={badge}>Featured Collection</span>
              </R>
              <R as="h2" d={280} className={headline}>
                <span id="cin-h1">
                  Defined
                  <br />
                  by Design.
                </span>
              </R>
            </div>

            <R d={420}>
              <div className="flex items-center gap-4 rounded-xl bg-white/15 p-3 backdrop-blur-md">
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg">
                  <Image src="/images/products/cfm-k01-front.jpg" alt="Bordeaux Kiss, bone" fill sizes="80px" className="object-cover" />
                </div>
                <div className="flex flex-col gap-1.5 pr-2">
                  <p className="text-sm font-medium">Bordeaux Kiss</p>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-paper/60">CFM-K01 · Bone</p>
                  <Link href="/shop/bordeaux-kiss" className="mt-1.5 inline-flex items-center gap-1 self-start rounded-full bg-paper px-4 py-2 text-xs font-medium text-ink transition-colors duration-300 hover:bg-paper/85">
                    View piece <Chevron />
                  </Link>
                </div>
              </div>
            </R>
          </div>
        </section>

        <div className="h-[80vh]" aria-hidden />

        {/* Section two */}
        <section className={shell} aria-labelledby="cin-h2">
          <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
            <R d={120}>
              <span className={badge}>Craftsmanship &amp; Materials</span>
            </R>
            <R as="p" d={220} className="max-w-sm text-lg leading-relaxed drop-shadow-md sm:text-right sm:text-xl">
              We believe premium fashion should not be defined by an inaccessible price tag, but by the thought, quality, and identity behind every piece.
            </R>
          </div>

          <div className="flex flex-1 flex-col justify-end gap-12 pt-16 md:flex-row md:items-end md:justify-between md:gap-16">
            <div className="max-w-xl">
              <R as="h2" d={180} className={headline}>
                <span id="cin-h2">
                  Premium in
                  <br />
                  every detail.
                </span>
              </R>
              <R as="p" d={320} className="mt-6 max-w-md text-sm text-paper/80 drop-shadow-md sm:text-base">
                DAMI aims to create pieces that feel considered, distinctive, and effortlessly wearable.
              </R>
              <R d={420} className="mt-8 flex flex-wrap gap-3">
                <Link href="/shop" className="inline-flex items-center gap-1 rounded-full bg-paper px-5 py-2.5 text-xs font-medium text-ink transition-colors duration-300 hover:bg-paper/85 sm:text-sm">
                  Shop <Chevron />
                </Link>
                <Link href="/collections" className="rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-xs backdrop-blur-md transition-colors duration-300 hover:bg-white/20 sm:text-sm">
                  Collections
                </Link>
              </R>
            </div>

            <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/10 px-5 backdrop-blur-md sm:px-6">
              {SPECS.map((s, i) => (
                <R key={s.title} d={300 + i * 110} className={`group flex gap-5 py-5 ${i < SPECS.length - 1 ? "border-b border-white/15" : ""}`}>
                  <span className="pt-1 text-[11px] tracking-[0.15em] text-paper/55">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="flex items-center gap-1.5 text-base font-medium sm:text-lg">
                      {s.title}
                      <Chevron size={16} className="text-paper/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-paper" />
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-paper/70">{s.body}</p>
                  </div>
                </R>
              ))}
              <p className="border-t border-white/15 py-3 text-[10px] uppercase tracking-[0.15em] text-paper/45">Development specifications — until physically verified and approved</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
