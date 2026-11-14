"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Showroom, ShowroomItem } from "./showroomScene";
import { Arrow } from "@/components/ui/Arrow";

type Mode = "pending" | "3d" | "fallback";

function canRunWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    if (!c.getContext("webgl2")) return false;
  } catch {
    return false;
  }
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return false;
  if ((nav.hardwareConcurrency || 4) <= 2 || (nav.deviceMemory ?? 8) <= 1) return false;
  return true;
}

export function Hero({ items }: { items: ShowroomItem[] }) {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<Showroom | null>(null);
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("pending");
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!canRunWebGL() || items.length < 3) {
      setMode("fallback");
      return;
    }
    setMode("3d");
    let disposed = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const boot = () =>
      import("./showroomScene")
        .then(({ createShowroom }) => {
          if (disposed || !canvas.current) return;
          scene.current = createShowroom(canvas.current, {
            items,
            reducedMotion,
            onActive: setActive,
            onNavigate: (href) => router.push(href),
            onReady: () => setReady(true),
          });
        })
        .catch(() => setMode("fallback"));
    const t = setTimeout(boot, 60);
    return () => {
      disposed = true;
      clearTimeout(t);
      scene.current?.dispose();
      scene.current = null;
    };
  }, [items, router]);

  // Intro + scroll choreography
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ctx: { revert: () => void } | undefined;
    let dead = false;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (dead || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
        gsap.to("[data-hero-word]", { scale: 1.2, opacity: 0, ease: "none", scrollTrigger: st });
        gsap.to("[data-hero-stage]", { yPercent: 12, scale: 0.94, opacity: 0.2, ease: "none", scrollTrigger: st });
        gsap.to("[data-hero-copy]", { yPercent: -30, opacity: 0, ease: "none", scrollTrigger: { ...st, end: "55% top" } });
        gsap.fromTo("[data-hero-in]", { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.4, ease: "expo.out", stagger: 0.1, delay: 0.35 });
        gsap.fromTo("[data-hero-word] span", { yPercent: 105 }, { yPercent: 0, duration: 1.9, ease: "expo.out", stagger: 0.07 });
      }, root);
    });
    return () => {
      dead = true;
      ctx?.revert();
    };
  }, []);

  const item = items[active];
  const show3d = mode === "3d";

  return (
    <section
      ref={root}
      aria-label="DAMI — Beyond the ordinary"
      className="grain grain-light relative h-[100svh] min-h-[40rem] overflow-hidden bg-ink text-paper"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") scene.current?.next();
        if (e.key === "ArrowLeft") scene.current?.prev();
      }}
    >
      {/* warm light pool */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_58%_42%,rgba(216,199,168,0.13),rgba(88,20,34,0.06)_45%,transparent_75%)]" />

      {/* giant wordmark */}
      <div data-hero-word className="pointer-events-none absolute inset-x-0 top-[13%] flex justify-center will-change-transform" aria-hidden>
        <p className="display flex overflow-hidden text-[34vw] leading-[0.8] tracking-[0.02em] text-paper/[0.05] md:text-[26vw]">
          {"DAMI".split("").map((l, i) => (
            <span key={i} className="inline-block">
              {l}
            </span>
          ))}
        </p>
      </div>

      {/* stage */}
      <div data-hero-stage className="absolute inset-0 will-change-transform">
        {show3d && (
          <canvas
            ref={canvas}
            className={`h-full w-full cursor-grab touch-pan-y transition-opacity duration-[1800ms] ease-[var(--ease-silk)] active:cursor-grabbing ${ready ? "opacity-100" : "opacity-0"}`}
            aria-label="Showroom carousel of DAMI concept pieces. Drag to browse, use the arrows below, or click the front piece to open it."
            role="img"
            data-cursor="Drag"
          />
        )}
        {(mode === "fallback" || (show3d && !ready)) && (
          <div className={`absolute inset-0 flex justify-center pt-[16svh] md:items-center md:pt-0 lg:pl-[18%] ${show3d ? "animate-pulse" : ""}`}>
            <div className="relative aspect-[2/3] h-[46svh] overflow-hidden rounded-t-full border border-champagne/30 md:h-[62svh]">
              <Image src={items[0]?.front ?? "/images/products/cfm-k01-front.jpg"} alt={items[0] ? `Concept reference: ${items[0].title}` : ""} fill priority sizes="(min-width: 768px) 40vw, 70vw" className="object-cover object-top" />
            </div>
          </div>
        )}
      </div>

      {/* veil for legibility on phones */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[50%] bg-gradient-to-t from-ink via-ink/80 to-transparent md:h-[35%] md:via-ink/40" />

      {/* copy */}
      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-end">
        <div className="gutter mx-auto grid w-full max-w-[120rem] items-end gap-6 pb-8 md:grid-cols-12 md:pb-12">
          <div data-hero-copy className="pointer-events-auto md:col-span-6 lg:col-span-5">
            <p data-hero-in className="eyebrow mb-5 text-champagne">
              Aix-en-Provence<span className="hidden sm:inline"> — First collection in development</span>
            </p>
            <h1 data-hero-in className="editorial text-[clamp(2.6rem,6vw,5.6rem)] leading-[0.95]">
              Beyond the <em className="italic text-champagne">ordinary.</em>
            </h1>
            <div data-hero-in className="mt-6 md:mt-8">
              <Link href="/collections" className="btn btn-light" data-cursor="Enter">
                <span className="btn-label">Explore the collection</span>
                <Arrow className="relative" />
              </Link>
            </div>
          </div>

          {item && (
            <div data-hero-in className="pointer-events-auto flex items-end justify-between gap-6 md:col-span-6 md:flex-col md:items-end lg:col-span-7">
              <Link href={item.href} className="group block md:text-right" aria-live="polite">
                <span className="eyebrow block text-paper/45">
                  <span className="tabular-nums">{String(active + 1).padStart(2, "0")}</span> / {String(items.length).padStart(2, "0")} — {item.code}
                </span>
                <span key={item.title + item.label} className="display mt-3 block text-[clamp(1.8rem,3.4vw,3.2rem)] uppercase tracking-[0.06em] [animation:page-in_.9s_var(--ease-silk)_both]">
                  {item.title}
                </span>
                <span key={item.label} className="editorial mt-1 block text-lg italic text-champagne [animation:page-in_1.1s_var(--ease-silk)_both]">
                  {item.label}
                </span>
              </Link>
              {show3d && (
                <div className="flex shrink-0 items-center gap-2">
                  <button onClick={() => scene.current?.prev()} aria-label="Previous piece" className="grid h-11 w-11 place-items-center rounded-full border border-paper/25 transition-colors hover:border-paper hover:bg-paper hover:text-ink">
                    <Arrow className="rotate-180" />
                  </button>
                  <button onClick={() => scene.current?.next()} aria-label="Next piece" className="grid h-11 w-11 place-items-center rounded-full border border-paper/25 transition-colors hover:border-paper hover:bg-paper hover:text-ink">
                    <Arrow />
                  </button>
                </div>
              )}
              <p className="eyebrow hidden !text-[0.55rem] text-paper/35 md:block">
                {show3d ? "Drag to browse · hover to turn · " : ""}AI concept references — not final product
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
