"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Tunnel, TunnelItem } from "./tunnelScene";

/**
 * Pinned scroll story (homepage opening).
 *  01 Hero — headline over the tunnel mouth
 *  02 Fly-in — camera flies through the image tunnel, vision resolves out of blur
 *  03 Arrival — the Lumen piece in an arch, brand paragraph writes in, hotspots pop up
 *  04 Atelier — heading, glass "fleece weight" card with count-up, five-row feature list
 * One rAF loop drives every layer from a smoothed scroll progress.
 */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const VISION = [["Luxury", "aesthetics", "×"], ["Streetwear", "culture", "×"], ["Accessible", "pricing."]];
const ACCT =
  "DAMI is an independent label from Aix-en-Provence, exploring the intersection of contemporary streetwear, refined design and everyday luxury — pieces built to be lived in, not just looked at.";

// positions are % of the arch image box (ESS-L01 Lumen, front)
const HOTSPOTS = [
  { x: 50, y: 21, label: "Double-layer hood", value: "No drawcords" },
  { x: 47, y: 43, label: "Chevron mark", value: "Deep Bordeaux" },
  { x: 16, y: 76, label: "Sleeve signature", value: "Embroidered · both arms" },
  { x: 55, y: 70, label: "Kangaroo pocket", value: "Bartacked corners" },
];

const FEATS = [
  "Three-end brushed-back fleece",
  "Structured double-layer hood",
  "Embroidered signature, both sleeves",
  "Soft-hand matte screen print",
  "2×2 rib · 7.5 cm hem / 7 cm cuff",
];

function canRunWebGL() {
  try {
    if (!document.createElement("canvas").getContext("webgl2")) return false;
  } catch {
    return false;
  }
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return !nav.connection?.saveData && (nav.hardwareConcurrency || 4) > 2;
}

export function Story({ tunnel }: { tunnel: TunnelItem[] }) {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Tunnel | null>(null);
  const vp = useRef(0);
  const [gl, setGl] = useState<"pending" | "on" | "off">("pending");
  const [ready, setReady] = useState(false);
  const [hot, setHot] = useState<number | null>(null);
  const [feat, setFeat] = useState<number | null>(null);

  // Boot the tunnel
  useEffect(() => {
    if (!canRunWebGL()) return setGl("off");
    setGl("on");
    let dead = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => {
      import("./tunnelScene")
        .then(({ createTunnel }) => {
          if (dead || !canvas.current) return;
          sceneRef.current = createTunnel(canvas.current, { items: tunnel, reducedMotion, getProgress: () => vp.current, onReady: () => setReady(true) });
        })
        .catch(() => setGl("off"));
    }, 50);
    return () => {
      dead = true;
      clearTimeout(t);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [tunnel]);

  // Scroll controller
  useEffect(() => {
    const el = root.current!;
    const $ = <T extends HTMLElement = HTMLElement>(s: string) => el.querySelector<T>(s)!;
    const $$ = <T extends HTMLElement = HTMLElement>(s: string) => Array.from(el.querySelectorAll<T>(s));
    const cam = $("[data-cam]");
    const cv = $("[data-cv]");
    const dest = $("[data-dest]");
    const L0 = $("[data-l0]"), heroCopy = $("[data-hero-copy]"), hud = $("[data-hud]"), cap = $("[data-cap]"), hint = $("[data-hint]");
    const L2 = $("[data-l2]"), vWords = $$("[data-vw]"), vMeta = $$("[data-vmeta]");
    const L3 = $("[data-l3]"), aWords = $$("[data-aw]"), spots = $$("[data-hs]");
    const L4 = $("[data-l4]"), cred = $("[data-cred]"), card = $("[data-card]"), num = $("[data-num]"), range = el.querySelector<SVGPathElement>("[data-range]")!, rows = $$("[data-row]"), note = $("[data-note]");
    const prog = $("[data-prog]");
    const rangeLen = range.getTotalLength();
    range.style.strokeDasharray = `${rangeLen}`;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let sp = 0, sx = 0, sy = 0, mx = 0, my = 0, last = performance.now(), raf = 0, lastNum = -1;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX / innerWidth - 0.5;
      my = e.clientY / innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const vis = (n: HTMLElement, on: boolean) => (n.style.visibility = on ? "visible" : "hidden");

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > innerHeight + 50) return;
      const dt = Math.min(64, now - last);
      last = now;
      const p = clamp(-r.top / (el.offsetHeight - innerHeight));
      sp = reduce ? p : sp + (p - sp) * (1 - Math.pow(0.86, dt / 16.7));
      if (Math.abs(p - sp) < 0.0002) sp = p;
      sx += (mx - sx) * 0.06;
      sy += (my - sy) * 0.06;

      // 02 — fly-in through the tunnel
      vp.current = ease(seg(sp, 0.03, 0.5));
      const tunnelOut = seg(sp, 0.42, 0.52);
      cam.style.transform = `translate3d(${-sx * 18}px, ${-sy * 12}px, 0) scale(${1 + 0.04 * tunnelOut})`;
      cv.style.opacity = String(1 - tunnelOut);

      // 01 — hero
      const h = seg(sp, 0.02, 0.1);
      heroCopy.style.transform = `translate3d(${-sx * 10}px, ${-h * 80 - sy * 6}px, 0) scale(${1 + h * 0.12})`;
      heroCopy.style.filter = `blur(${h * 14}px)`;
      heroCopy.style.opacity = String(1 - h);
      hud.style.transform = `translate3d(${sx * 26}px, ${sy * 18 - h * 40}px, 0)`;
      hud.style.opacity = String(1 - seg(sp, 0.02, 0.08));
      const ch = 1 - seg(sp, 0.01, 0.05);
      cap.style.opacity = hint.style.opacity = String(ch);
      vis(L0, h < 1);

      // vision, mid-flight
      const vIn = seg(sp, 0.12, 0.22), vOut = seg(sp, 0.3, 0.38);
      vWords.forEach((w, i) => {
        const k = clamp(vIn * 1.6 - i * 0.08);
        w.style.transform = `translate3d(0, ${(1 - k) * 30 - vOut * 60}px, 0)`;
        w.style.filter = `blur(${(1 - k) * 12 + vOut * 14}px)`;
        w.style.opacity = String(k * (1 - vOut));
      });
      const vm = clamp(vIn * 2 - 0.6) * (1 - vOut);
      vMeta.forEach((m) => {
        m.style.opacity = String(vm);
        m.style.transform = `translateY(${-vOut * 50}px)`;
      });
      vis(L2, vIn > 0 && vOut < 1);

      // 03 — arrival: the piece in its arch
      const dIn = ease(seg(sp, 0.4, 0.52));
      const dSt = ease(seg(sp, 0.68, 0.8));
      dest.style.opacity = String(dIn);
      dest.style.filter = `blur(${(1 - dIn) * 14}px)`;
      dest.style.transform = `translate3d(${-sx * 22}px, ${(1 - dIn) * 40 - sy * 14}px, 0) scale(${0.72 + 0.28 * dIn - 0.06 * dSt})`;
      vis(dest, dIn > 0);

      const aIn = seg(sp, 0.5, 0.6), aOut = seg(sp, 0.66, 0.7);
      aWords.forEach((w, i) => {
        const k = clamp(aIn * 2.2 - (i / aWords.length) * 1.2);
        w.style.opacity = String((0.15 + 0.85 * k) * (1 - aOut));
        w.style.filter = `blur(${(1 - k) * 6 + aOut * 10}px)`;
      });
      spots.forEach((s, i) => {
        const k = seg(sp, 0.53 + i * 0.02, 0.57 + i * 0.02);
        s.style.transform = `scale(${k * (1 - aOut)})`;
        vis(s, k > 0 && aOut < 1);
      });
      vis(L3, aIn > 0 && aOut < 1);

      // 04 — atelier
      const sIn = seg(sp, 0.72, 0.82);
      cred.style.opacity = String(sIn);
      cred.style.transform = `translateY(${(1 - sIn) * 30}px)`;
      cred.style.filter = `blur(${(1 - sIn) * 8}px)`;
      const cIn = ease(seg(sp, 0.74, 0.86));
      card.style.opacity = String(cIn);
      card.style.transform = `translate3d(${sx * -14}px, ${(1 - cIn) * 60 + sy * -10}px, 0) rotateY(${sx * 8}deg) rotateX(${-sy * 8}deg)`;
      const n = Math.round(340 * seg(sp, 0.76, 0.9));
      if (n !== lastNum) {
        num.textContent = String(n);
        lastNum = n;
      }
      range.style.strokeDashoffset = String(rangeLen * (1 - seg(sp, 0.77, 0.92)));
      rows.forEach((row, i) => {
        const k = ease(seg(sp, 0.76 + i * 0.025, 0.82 + i * 0.025));
        row.style.opacity = String(k);
        row.style.transform = `translateX(${(1 - k) * 40}px)`;
      });
      note.style.opacity = String(seg(sp, 0.88, 0.94));
      vis(L4, sIn > 0);

      prog.style.transform = `scaleX(${sp})`;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <section id="story" ref={root} aria-label="DAMI — Beyond the ordinary" className="relative h-[640vh] bg-ink max-md:h-[560vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-ink text-paper [perspective:1200px]">
        {/* camera box: tunnel canvas + mist */}
        <div data-cam className="absolute -inset-x-[3%] -top-[6%] -bottom-[3%] will-change-transform">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(55%_50%_at_50%_45%,#241c1a,#111111_75%)]" />
          {gl === "on" && (
            <canvas ref={canvas} data-cv className={`absolute inset-0 h-full w-full transition-opacity duration-[1500ms] ${ready ? "" : "!opacity-0"}`} aria-hidden />
          )}
          {gl !== "on" && <div data-cv aria-hidden />}
          <div className="story-mist" aria-hidden />
        </div>

        {/* destination: Lumen in an arch, with hotspots */}
        <div
          data-dest
          className="invisible absolute left-1/2 top-[13vh] h-[var(--dh)] w-[min(calc(var(--dh)*0.7375),90vw)] -ml-[calc(min(calc(var(--dh)*0.7375),90vw)/2)] will-change-transform [--dh:74vh] max-md:top-[22vh] max-md:[--dh:52vh]"
        >
          <div className="absolute inset-0 overflow-hidden rounded-t-full border border-champagne/40">
            <Image src="/images/products/ess-l01-front.jpg" alt="Concept reference: Lumen hoodie in white" fill sizes="(min-width: 768px) 40vw, 90vw" className="object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
          </div>
          <div className="absolute -inset-3 rounded-t-full border border-champagne/15" aria-hidden />
          <span className="eyebrow absolute -bottom-7 left-0 !text-[0.55rem] text-paper/40">ESS-L01 · AI concept reference — not final product</span>
          {HOTSPOTS.map((h, i) => (
            <button
              key={h.label}
              data-hs
              type="button"
              className={`hs invisible ${hot === i ? "on" : ""}`}
              style={{ left: `calc(${h.x}% - 11px)`, top: `calc(${h.y}% - 11px)` }}
              onClick={() => setHot(hot === i ? null : i)}
              aria-expanded={hot === i}
            >
              <span className="hs-dot" aria-hidden />
              <span className="hs-label">
                {h.label}
                <em>{h.value}</em>
              </span>
            </button>
          ))}
        </div>

        {/* L0 — hero copy */}
        <div data-l0 className="story-layer">
          <div data-hero-copy className="absolute inset-x-0 top-[24vh] text-center will-change-transform max-md:top-[22vh]">
            <span className="chip">Aix-en-Provence</span>
            <h1 className="editorial mt-5 text-[clamp(52px,10.5vw,180px)] leading-[0.92] tracking-[-0.03em]">
              <span className="rise block overflow-hidden pb-[0.06em]">
                <span className="inline-block">
                  Beyond the <em className="italic text-champagne">ordinary.</em>
                </span>
              </span>
            </h1>
            <p className="mono-s mx-auto mt-6 max-w-md text-paper/60">The first DAMI collection — in development</p>
          </div>
        </div>

        {/* L1 — HUD, caption, hint */}
        <div className="story-layer">
          <div data-hud className="absolute left-[64%] top-[62%] max-md:hidden">
            <span aria-hidden className="absolute -left-11 top-1 h-[22px] w-[22px]">
              <span className="absolute left-1/2 top-0 h-full w-px bg-paper/70" />
              <span className="absolute left-0 top-1/2 h-px w-full bg-paper/70" />
            </span>
            <span className="chip">CFM-K01</span>
            <pre className="mono-s relative mt-3 font-sans leading-[1.65] text-paper/85">
              {"LAT  43.5297° N\nLON   5.4474° E\nFLEECE  340 GSM*"}
              <span aria-hidden className="absolute -bottom-2.5 -left-2 -right-3.5 -top-2 border border-paper/50 [clip-path:polygon(0_0,14px_0,14px_1px,1px_1px,1px_14px,0_14px,0_calc(100%-14px),1px_calc(100%-14px),1px_calc(100%-1px),14px_calc(100%-1px),14px_100%,0_100%,0_0,100%_0,100%_14px,calc(100%-1px)_14px,calc(100%-1px)_1px,calc(100%-14px)_1px,calc(100%-14px)_0,100%_0,100%_100%,calc(100%-14px)_100%,calc(100%-14px)_calc(100%-1px),calc(100%-1px)_calc(100%-1px),calc(100%-1px)_calc(100%-14px),100%_calc(100%-14px),100%_100%)]" />
            </pre>
          </div>
          <p data-cap className="mono-s absolute bottom-[34px] left-[34px] border-l-2 border-champagne pl-4 leading-[1.75] text-paper/70 max-md:bottom-[70px] max-md:left-[18px] max-md:right-[18px]">
            Luxury aesthetics.
            <br />
            Streetwear culture.
            <br />
            Accessible pricing.
          </p>
          <div data-hint className="mono-s absolute bottom-9 right-[34px] flex items-center gap-3 text-paper/60 max-md:bottom-6 max-md:right-[18px]">
            <span className="grid h-5 w-5 place-items-center rounded-full border-[1.3px] border-current">
              <span className="hint-chev" />
            </span>
            Scroll to explore
          </div>
        </div>

        {/* L2 — vision */}
        <div data-l2 className="story-layer invisible">
          <div className="absolute left-1/2 top-1/2 w-[min(860px,90vw)] -translate-x-1/2 -translate-y-1/2 text-center">
            <span data-vmeta className="chip">The DAMI idea</span>
            <h2 className="display my-5 text-[clamp(38px,6vw,96px)] leading-[0.98] [text-shadow:0_2px_40px_rgba(0,0,0,0.6)]">
              {VISION.map((line, li) => (
                <span key={li} className="block">
                  {line.map((w) => (
                    <span key={w + li} data-vw className={`mx-[0.12em] inline-block will-change-transform ${w === "×" ? "editorial italic text-champagne" : ""}`}>
                      {w}
                    </span>
                  ))}
                </span>
              ))}
            </h2>
            <p data-vmeta className="text-base leading-[1.45] text-paper/80">
              An independent label from Aix-en-Provence,
              <br />
              designed as one language.
            </p>
          </div>
        </div>

        {/* L3 — brand paragraph */}
        <div data-l3 className="story-layer invisible">
          <p className="editorial absolute left-[34px] top-[14vh] w-[min(440px,86vw)] text-[clamp(22px,2.1vw,32px)] leading-[1.16] max-md:left-[18px] max-md:top-[9vh] max-md:text-[19px]">
            {ACCT.split(" ").map((w, i) => (
              <span key={i} data-aw className="inline-block whitespace-pre">
                {w}{" "}
              </span>
            ))}
          </p>
        </div>

        {/* L4 — atelier */}
        <div data-l4 className="story-layer invisible">
          <div data-cred className="absolute left-[34px] top-[13vh] max-w-[380px] max-md:left-[18px] max-md:top-[9vh] max-md:max-w-[80vw]">
            <span className="chip">✕ Atelier · Sample size M</span>
            <h2 className="display mt-4 text-[clamp(30px,3.4vw,54px)] leading-[0.98]">
              Considered, <em className="editorial italic text-champagne">down to the rib.</em>
            </h2>
          </div>

          <div data-card className="absolute left-[34px] top-[44vh] w-[250px] rounded-[10px] border border-paper/20 bg-[rgba(57,56,56,0.38)] p-[18px] backdrop-blur-[16px] will-change-transform max-md:bottom-[6vh] max-md:left-[18px] max-md:top-auto max-md:w-[46vw] max-md:p-3">
            <h4 className="text-[15px] font-medium leading-tight max-md:text-[13px]">
              Main fleece
              <br />
              weight
            </h4>
            <p className="mono-s mt-1 !text-[9.5px] opacity-70">Development target</p>
            <p className="mt-3 flex items-baseline gap-1.5">
              <span data-num className="text-[46px] font-medium tracking-[-0.04em] tabular-nums max-md:text-[34px]">0</span>
              <span className="mono-s !text-[10px]">GSM</span>
            </p>
            <span className="chip absolute right-4 top-[18px] max-md:hidden">330–350</span>
            <svg viewBox="0 0 220 40" className="mt-2 w-full" aria-hidden>
              <line x1="0" y1="20" x2="220" y2="20" stroke="rgba(245,241,233,0.25)" strokeWidth="1" />
              {[0, 55, 110, 165, 220].map((x) => (
                <line key={x} x1={x} y1="15" x2={x} y2="25" stroke="rgba(245,241,233,0.35)" strokeWidth="1" />
              ))}
              <path data-range d="M60 20 L160 20" stroke="#d8c7a8" strokeWidth="6" strokeLinecap="round" fill="none" />
              <circle cx="110" cy="20" r="4" fill="#f5f1e9" />
            </svg>
            <p className="mono-s mt-1 flex justify-between !text-[9px] opacity-60">
              <span>300</span>
              <span>340</span>
              <span>380</span>
            </p>
          </div>

          <div className="absolute right-[34px] top-[30vh] w-[min(400px,34vw)] rounded-[10px] border border-paper/10 bg-[rgba(17,17,17,0.55)] px-4 py-1.5 backdrop-blur-[14px] max-md:bottom-[6vh] max-md:right-[18px] max-md:top-auto max-md:w-[44vw] max-md:px-2.5">
            {FEATS.map((f, i) => (
              <button key={f} data-row type="button" className={`feat max-md:!text-[9px] ${feat === i ? "on" : ""}`} onClick={() => setFeat(feat === i ? null : i)}>
                <span className="opacity-60">{String(i + 1).padStart(2, "0")}</span>
                <span>{f}</span>
                <span className="arr max-md:hidden">→</span>
              </button>
            ))}
          </div>

          <p data-note className="mono-s absolute bottom-14 left-1/2 -translate-x-1/2 whitespace-nowrap !text-[9.5px] text-paper/45 max-md:hidden">
            * Development targets — confirmed only on approved pre-production samples
          </p>
        </div>

        {/* progress */}
        <div className="absolute bottom-[22px] left-1/2 h-[2px] w-[120px] -translate-x-1/2 overflow-hidden rounded-[2px] bg-paper/15" aria-hidden>
          <div data-prog className="h-full origin-left scale-x-0 bg-champagne" />
        </div>

        <Link href="/collections" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-20 focus:bg-paper focus:px-4 focus:py-2 focus:text-ink">
          Skip to the collections
        </Link>
      </div>
    </section>
  );
}
