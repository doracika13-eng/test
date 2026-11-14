"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { HoodieScene, View } from "./hoodieScene";
import { Arrow } from "@/components/ui/Arrow";

const SWATCHES = [
  { id: "bone", label: "Bone", hex: "#EEE2CF" },
  { id: "bordeaux", label: "Bordeaux", hex: "#581422" },
  { id: "black", label: "Black", hex: "#161616" },
  { id: "charcoal", label: "Charcoal", hex: "#393838" },
];

type Mode = "pending" | "3d" | "fallback";

function canRun3D(): { ok: boolean; quality: "high" | "medium" } {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return { ok: false, quality: "medium" };
  } catch {
    return { ok: false, quality: "medium" };
  }
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return { ok: false, quality: "medium" };
  const cores = nav.hardwareConcurrency || 4;
  const mem = nav.deviceMemory ?? 8;
  const touch = window.matchMedia("(pointer: coarse)").matches;
  if (cores <= 2 || mem <= 2) return { ok: false, quality: "medium" };
  const quality = !touch && cores >= 8 && mem >= 8 ? "high" : "medium";
  return { ok: true, quality };
}

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HoodieScene | null>(null);
  const [mode, setMode] = useState<Mode>("pending");
  const [ready, setReady] = useState(false);
  const [colour, setColour] = useState("bone");
  const [view, setView] = useState<View>("front");

  // Boot the 3D scene after first paint, only on capable devices.
  useEffect(() => {
    const { ok, quality } = canRun3D();
    if (!ok) {
      setMode("fallback");
      return;
    }
    setMode("3d");
    let disposed = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const boot = () =>
      import("./hoodieScene")
        .then(({ createHoodieScene }) => {
          if (disposed || !canvas.current) return;
          sceneRef.current = createHoodieScene(canvas.current, { quality, reducedMotion, onReady: () => setReady(true) });
        })
        .catch(() => setMode("fallback"));
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (idle) idle(boot, { timeout: 1200 });
    else setTimeout(boot, 200);
    return () => {
      disposed = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Scroll choreography: wordmark grows & fades, stage recedes.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ctx: { revert: () => void } | undefined;
    let dead = false;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (dead || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
        gsap.to("[data-hero-word]", { scale: 1.25, opacity: 0, ease: "none", scrollTrigger: st });
        gsap.to("[data-hero-stage]", { yPercent: 14, opacity: 0.25, ease: "none", scrollTrigger: st });
        gsap.to("[data-hero-copy]", { yPercent: -40, opacity: 0, ease: "none", scrollTrigger: { ...st, end: "60% top" } });
        gsap.fromTo(
          "[data-hero-in]",
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.4, ease: "expo.out", stagger: 0.12, delay: 0.25 },
        );
        gsap.fromTo("[data-hero-word] span", { yPercent: 100 }, { yPercent: 0, duration: 1.8, ease: "expo.out", stagger: 0.06 });
      }, root);
    });
    return () => {
      dead = true;
      ctx?.revert();
    };
  }, []);

  const pickColour = (id: string) => {
    setColour(id);
    sceneRef.current?.setColour(id);
  };
  const pickView = (v: View) => {
    setView(v);
    sceneRef.current?.setView(v);
  };

  const show3d = mode === "3d";

  return (
    <section ref={root} aria-label="DAMI — Beyond the ordinary" className="grain grain-light relative h-[100svh] min-h-[38rem] overflow-hidden bg-ink text-paper">
      {/* Giant wordmark behind the garment */}
      <div data-hero-word className="pointer-events-none absolute inset-x-0 top-[15%] z-0 flex justify-center will-change-transform md:top-[12%]" aria-hidden>
        <p className="display flex overflow-hidden text-[34vw] leading-[0.8] tracking-[0.02em] text-paper/[0.06] md:text-[27vw]">
          {"DAMI".split("").map((l, i) => (
            <span key={i} className="inline-block">
              {l}
            </span>
          ))}
        </p>
      </div>

      {/* Stage: 3D canvas or editorial fallback */}
      <div data-hero-stage className="absolute inset-0 z-[1]">
        {show3d && (
          <div aria-hidden className="absolute left-1/2 top-[11%] h-[74%] w-[min(30rem,74vw)] -translate-x-1/2 lg:left-[59%]">
            <div className="absolute inset-0 rounded-t-full border border-paper/[0.07] bg-[radial-gradient(ellipse_at_50%_38%,rgba(216,199,168,0.20),rgba(88,20,34,0.10)_45%,rgba(17,17,17,0)_75%)]" />
            <div className="absolute inset-x-[7%] bottom-0 top-[5%] rounded-t-full border border-paper/[0.04]" />
          </div>
        )}
        {show3d && (
          <canvas
            ref={canvas}
            className={`h-full w-full touch-pan-y transition-opacity duration-[1600ms] ${ready ? "opacity-100" : "opacity-0"}`}
            aria-label="Interactive 3D hoodie study. Drag horizontally to rotate."
            role="img"
            data-cursor="Drag"
          />
        )}
        {(!show3d || !ready) && (
          <div className={`absolute inset-0 flex items-end justify-center pb-[22svh] md:items-center md:pb-0 ${show3d ? "transition-opacity duration-1000" : ""}`}>
            <div className="relative aspect-[3/4] h-[52svh] max-h-[40rem] overflow-hidden rounded-t-full border border-paper/10 md:h-[64svh]">
              <Image
                src="/images/products/cfm-k01-front.jpg"
                alt="Concept reference: Bordeaux Kiss hoodie in bone"
                fill
                priority
                sizes="(min-width: 768px) 40vw, 80vw"
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
            </div>
          </div>
        )}
      </div>

      {/* Copy */}
      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-end">
        <div className="gutter mx-auto grid w-full max-w-[120rem] items-end gap-8 pb-10 md:grid-cols-12 md:pb-12">
          <div data-hero-copy className="pointer-events-auto md:col-span-6 lg:col-span-5">
            <p data-hero-in className="eyebrow mb-5 text-champagne">
              Aix-en-Provence — First collection in development
            </p>
            <h1 data-hero-in className="editorial text-[clamp(2.6rem,6.2vw,5.6rem)] leading-[0.95]">
              Beyond the <em className="italic text-champagne">ordinary.</em>
            </h1>
            <p data-hero-in className="mt-5 max-w-sm text-sm leading-relaxed text-paper/70">
              Luxury aesthetics, streetwear culture and accessible pricing — designed as one language.
            </p>
            <div data-hero-in className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/collections" className="btn btn-light" data-cursor="Enter">
                <span className="btn-label">Explore the collection</span>
                <Arrow className="relative" />
              </Link>
            </div>
          </div>

          {show3d && (
            <div data-hero-in className="pointer-events-auto flex flex-col items-start gap-4 md:col-span-6 md:items-end lg:col-span-7">
              <div className="flex items-center gap-2" role="radiogroup" aria-label="Colourway">
                {SWATCHES.map((s) => (
                  <button
                    key={s.id}
                    role="radio"
                    aria-checked={colour === s.id}
                    aria-label={s.label}
                    onClick={() => pickColour(s.id)}
                    className={`group flex h-11 items-center gap-2 border px-3 transition-colors duration-500 ${
                      colour === s.id ? "border-paper/80" : "border-paper/15 hover:border-paper/40"
                    }`}
                  >
                    <span className="h-3.5 w-3.5 rounded-full border border-paper/30" style={{ background: s.hex }} />
                    <span className="eyebrow hidden !text-[0.58rem] lg:inline">{s.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1" role="group" aria-label="Camera view">
                {(["front", "back", "detail"] as View[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => pickView(v)}
                    aria-pressed={view === v}
                    className={`eyebrow h-10 px-3 !text-[0.6rem] transition-colors ${view === v ? "text-paper" : "text-paper/45 hover:text-paper/80"}`}
                  >
                    {v === "detail" ? "Closer" : v}
                  </button>
                ))}
              </div>
              <p className="eyebrow !text-[0.55rem] text-paper/40">3D study · placeholder form, not a DAMI product model</p>
            </div>
          )}
          {mode === "fallback" && (
            <p data-hero-in className="eyebrow !text-[0.55rem] text-paper/40 md:col-span-6 md:text-right lg:col-span-7">
              AI concept reference — not final product
            </p>
          )}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 hidden h-16 w-px -translate-x-1/2 overflow-hidden md:block" aria-hidden>
        <span className="scroll-cue absolute inset-0 bg-paper/60" />
      </div>
    </section>
  );
}
