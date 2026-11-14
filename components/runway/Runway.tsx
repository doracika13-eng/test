"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RunwayLook } from "@/content/runway";
import type { Product } from "@/lib/commerce/types";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice } from "@/lib/format";

/**
 * Runway — "Featured Collection" as a turning 3D ring of looks (desktop) or a
 * diagonal walking line (phones). Spring physics, autoplay with progress ticks,
 * drag / swipe / trackpad / keyboard, custom Drag·View cursor, a "View look"
 * popup with numbered pins, and an "In this look" panel linked to the pins.
 */

const K = 95;
const C = 2 * Math.sqrt(K);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mod = (a: number, n: number) => ((a % n) + n) % n;
const wrapPi = (a: number) => a - Math.PI * 2 * Math.floor((a + Math.PI) / (Math.PI * 2));
const wrapC = (a: number, n: number) => a - n * Math.floor((a + n / 2) / n); // → (-n/2, n/2]

type Mode = "ring" | "classic";

export function Runway({ looks, products }: { looks: RunwayLook[]; products: Product[] }) {
  const n = looks.length;
  const N = n * Math.ceil(8 / n);
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const bodies = useRef<(HTMLDivElement | null)[]>([]);
  const cursor = useRef<HTMLSpanElement>(null);
  const live = useRef<HTMLSpanElement>(null);
  const itemsRef = useRef<HTMLUListElement>(null);
  const lbModel = useRef<HTMLDivElement>(null);
  const lbStage = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const api = useRef<{ next: () => void; prev: () => void; go: (i: number) => void; moveTo: (t: number) => void; rank: (a: number) => number; restartBar: () => void; target: () => number } | null>(null);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hot, setHot] = useState<number | null>(null);
  const [zoom, setZoom] = useState<{ look: number; from: DOMRect | null } | null>(null);
  const [closing, setClosing] = useState(false);
  const [size, setSize] = useState<Record<number, string>>({});
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState("");
  const flags = useRef({ playing: false, engaged: false, panelHover: false, zoomed: false, visible: false, dragging: false });
  const { add } = useCart();

  const look = looks[index];
  const product = products.find((p) => p.handle === look.product.handle);
  const colorway = product?.colorways.find((c) => c.id === look.product.colorway);

  /* ───────────── engine ───────────── */
  useEffect(() => {
    const el = root.current!;
    const st = stage.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.classList.add("rw--js");

    let mode: Mode = "ring";
    let W = 0, H = 0, unit = 200, fs = 1.08, hx = 0, hy = 0;
    let target = 0, cur = reduce ? 0 : -1.15, vel = 0;
    // classic: per-body follow + spring
    const g = new Float64Array(N);
    const x = new Float64Array(N);
    const v = new Float64Array(N);
    for (let a = 0; a < N; a++) g[a] = x[a] = cur;
    let raf = 0, last = 0, running = false, idx = 0, timer = 0;
    const blurCache = new Array<number>(N).fill(-1);

    const measure = () => {
      mode = window.innerWidth < 750 ? "classic" : "ring";
      const r = st.getBoundingClientRect();
      W = r.width;
      H = r.height;
      fs = mode === "ring" ? 1.08 : 1;
      // half-length cut-outs are wider than full-body figures, so they stand a little smaller
      const modelH = mode === "ring" ? Math.max(200, Math.round(((H - 34 - 18) / 1.08) * 0.84)) : Math.max(200, Math.round((H - 24 - 18) * 0.86));
      st.style.setProperty("--rw-model-h", `${modelH}px`);
      unit = mode === "ring" ? Math.max(120, W * 0.3) : Math.max(90, W * 0.32 * 1.6);
      hx = mode === "ring" ? 0.5 * W : 0.3 * W;
      hy = mode === "ring" ? 34 : 22;
      kick();
    };

    const put = (a: number, px: number, bottom: number, scale: number, opacity: number, blur: number, z: number) => {
      const b = bodies.current[a];
      if (!b) return;
      const w = b.offsetWidth;
      if (px + (w * scale) / 2 < -4 || px - (w * scale) / 2 > W + 4) opacity = 0;
      b.style.transform = `translate3d(${px.toFixed(2)}px, ${(-bottom).toFixed(2)}px, 0) translateX(-50%) scale(${scale.toFixed(4)})`;
      b.style.opacity = opacity.toFixed(3);
      b.style.zIndex = String(z);
      b.style.visibility = opacity < 0.01 ? "hidden" : "visible";
      b.style.pointerEvents = opacity < 0.5 ? "none" : "auto";
      const bl = Math.round(blur * 10) / 10;
      if (bl !== blurCache[a]) {
        blurCache[a] = bl;
        b.style.filter = bl <= 0.05 ? "" : `blur(${bl}px)`;
      }
    };

    const renderRing = () => {
      const step = (Math.PI * 2) / N;
      const mobile = W < 750;
      const cx = 0.5 * W, R = (mobile ? 0.72 : 0.62) * W, P = (mobile ? 1.9 : 1.65) * W;
      const floor = H - 34, horizon = 0.36 * H;
      for (let a = 0; a < N; a++) {
        const phi = wrapPi((a - cur) * step);
        const z = R * (1 - Math.cos(phi));
        const persp = P / (P + z);
        const sl = Math.abs(phi) / step;
        const scale = persp * (1 + (fs - 1) * clamp(1 - sl));
        const px = cx + R * Math.sin(phi) * persp;
        const feet = horizon + (floor - horizon) * persp;
        const blur = sl <= 1 ? 1.8 * sl : Math.min(1.8 + (sl - 1) * 2, 6.5);
        const op = clamp((Math.cos(phi) + 0.55) / 0.3);
        put(a, px, H - feet, scale, op, blur, Math.round(scale * 1000));
      }
    };

    const renderClassic = () => {
      const ax = 0.3, ay = 22, sx = 0.32, sy = 22, sr = 0.76, ex = 0.55, d = 4;
      for (let a = 0; a < N; a++) {
        const k = wrapC(a - x[a], N);
        if (k < 0) {
          const e = Math.min(-k, 1.4);
          put(a, W * (ax - ex * e), ay - 22 * e, 1 + 0.14 * e, Math.max(0, 1 - 1.05 * e), 4 * Math.min(e, 1), 1100);
        } else {
          const op = k <= d - 1 ? 1 - 0.13 * k : Math.max(0, 0.61 * (d - k));
          put(a, W * (ax + sx * k), ay + sy * k, Math.pow(sr, k), op, Math.min(0.9 * k, 3.2), 1000 - Math.round(10 * k));
        }
      }
    };

    const render = () => (mode === "ring" ? renderRing() : renderClassic());

    const settled = () => {
      if (mode === "ring") return Math.abs(cur - target) <= 0.0005 && Math.abs(vel) <= 0.0005;
      for (let a = 0; a < N; a++) if (Math.abs(x[a] - target) > 0.0006 || Math.abs(v[a]) > 0.0006) return false;
      return true;
    };

    const frame = (now: number) => {
      const dt = last ? Math.min(0.034, (now - last) / 1000) : 1 / 60;
      last = now;
      if (reduce) {
        cur = target;
        vel = 0;
        for (let a = 0; a < N; a++) (g[a] = x[a] = target), (v[a] = 0);
      } else if (mode === "ring") {
        const h = dt / 3;
        for (let s = 0; s < 3; s++) {
          const acc = -K * (cur - target) - C * vel;
          vel += acc * h;
          cur += vel * h;
        }
      } else {
        const h = dt / 3;
        for (let a = 0; a < N; a++) {
          const k = Math.max(0, wrapC(a - target, N));
          const tau = flags.current.dragging ? 0.016 : 0.03 + 0.04 * Math.min(k, 4);
          g[a] += (target - g[a]) * (1 - Math.exp(-dt / tau));
          for (let s = 0; s < 3; s++) {
            const acc = -K * (x[a] - g[a]) - C * v[a];
            v[a] += acc * h;
            x[a] += v[a] * h;
          }
        }
      }
      if (!flags.current.dragging && settled()) {
        cur = target;
        vel = 0;
        for (let a = 0; a < N; a++) (x[a] = g[a] = target), (v[a] = 0);
        render();
        running = false;
        last = 0;
        return;
      }
      render();
      raf = requestAnimationFrame(frame);
    };

    function kick() {
      if (running || !flags.current.visible || document.hidden) {
        if (!running) render();
        return;
      }
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    }

    /* autoplay */
    const restartBar = () => {
      window.clearTimeout(timer);
      const ticks = el.querySelectorAll<HTMLElement>(".rw__tick");
      ticks.forEach((t) => t.classList.remove("is-run"));
      void el.offsetWidth;
      ticks[idx]?.classList.add("is-run");
      if (!flags.current.playing) return;
      timer = window.setTimeout(() => {
        const f = flags.current;
        if (f.playing && f.visible && !f.dragging && !document.hidden && !f.panelHover && !f.zoomed && !f.engaged) next();
        else restartBar();
      }, 5000);
    };

    const moveTo = (T: number) => {
      target = T;
      const i = mod(Math.round(T), n);
      if (i !== idx) {
        idx = i;
        setIndex(i);
        el.style.setProperty("--rw-progress", ((i + 1) / n).toFixed(3));
        if (!reduce) {
          st.classList.remove("is-sweep");
          void st.offsetWidth;
          st.classList.add("is-sweep");
        }
        if (live.current) live.current.textContent = `Look ${i + 1}: ${looks[i].name}`;
      }
      restartBar();
      kick();
    };
    const next = () => moveTo(Math.round(target) + 1);
    const prev = () => moveTo(Math.round(target) - 1);
    const go = (i: number) => {
      let d = mod(i - idx, n);
      if (d > n / 2) d -= n;
      moveTo(Math.round(target) + d);
    };
    const rank = (a: number) => Math.round(wrapC(a - target, N));
    api.current = { next, prev, go, moveTo, rank, restartBar, target: () => target };

    /* drag / swipe */
    let down: { x: number; y: number; t: number; id: number; drag: boolean; samples: { x: number; t: number }[] } | null = null;
    let suppress = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (flags.current.zoomed) return;
      down = { x: e.clientX, y: e.clientY, t: target, id: e.pointerId, drag: false, samples: [{ x: e.clientX, t: performance.now() }] };
    };
    const onMove = (e: PointerEvent) => {
      if (!down || e.pointerId !== down.id) return;
      if (e.pointerType === "mouse" && e.buttons === 0) return onUp(e);
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!down.drag) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
          down = null;
          return;
        }
        if (Math.abs(dx) > 8 && Math.abs(dx) > 1.2 * Math.abs(dy)) {
          down.drag = true;
          flags.current.dragging = true;
          el.classList.add("is-dragging");
          st.setPointerCapture?.(e.pointerId);
        } else return;
      }
      down.samples.push({ x: e.clientX, t: performance.now() });
      if (down.samples.length > 6) down.samples.shift();
      target = down.t - dx / unit;
      kick();
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      const d = down;
      down = null;
      if (!d.drag) return;
      flags.current.dragging = false;
      el.classList.remove("is-dragging");
      suppress = performance.now() + 60;
      const s0 = d.samples[0], s1 = d.samples[d.samples.length - 1];
      const vx = (s1.x - s0.x) / Math.max(1, s1.t - s0.t);
      const dx = e.clientX - d.x;
      const from = Math.round(d.t);
      if (mode === "classic") {
        if (Math.abs(dx) > 30 || Math.abs(vx) > 0.3) moveTo(from + (dx > 0 ? -1 : 1));
        else moveTo(from);
      } else {
        let i = Math.round(target - (vx * 160) / unit);
        if (i === from && Math.abs(vx) > 0.3) i = from + (vx > 0 ? -1 : 1);
        moveTo(clamp(i, from - 2, from + 2));
      }
    };
    const onClickCapture = (e: MouseEvent) => {
      if (performance.now() < suppress) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    st.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    st.addEventListener("click", onClickCapture, true);

    /* trackpad horizontal wheel */
    let acc = 0, lock = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (performance.now() < lock) return;
      acc += e.deltaX;
      if (Math.abs(acc) > 45) {
        if (acc > 0) next();
        else prev();
        acc = 0;
        lock = performance.now() + 520;
      }
    };
    st.addEventListener("wheel", onWheel, { passive: false });

    /* cursor */
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let cx = 0, cy = 0, tx = 0, ty = 0, craf = 0, entered = false;
    const curEl = cursor.current;
    const cTick = () => {
      const k = reduce ? 1 : 0.18;
      cx += (tx - cx) * k;
      cy += (ty - cy) * k;
      if (curEl) curEl.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      craf = Math.hypot(tx - cx, ty - cy) > 0.2 ? requestAnimationFrame(cTick) : 0;
    };
    const onCMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !curEl) return;
      const r = st.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!entered) {
        entered = true;
        cx = tx;
        cy = ty;
        curEl.classList.add("is-on");
      }
      const t = e.target as HTMLElement;
      const hit = t.closest<HTMLElement>("[data-rw-go]");
      const front = hit && rank(Number(hit.dataset.rwGo)) === 0;
      curEl.classList.toggle("is-view", !!front && !flags.current.dragging);
      curEl.classList.toggle("is-link", !!hit && !front && !flags.current.dragging);
      if (!craf) craf = requestAnimationFrame(cTick);
    };
    const onCLeave = () => {
      entered = false;
      curEl?.classList.remove("is-on", "is-link", "is-view");
    };
    if (fine) {
      el.classList.add("rw--cursor");
      st.addEventListener("pointermove", onCMove);
      st.addEventListener("pointerleave", onCLeave);
    }

    /* visibility, resize */
    const io = new IntersectionObserver(([en]) => {
      flags.current.visible = en.isIntersecting;
      if (en.isIntersecting) kick();
    });
    io.observe(el);
    const reveal = new IntersectionObserver(
      ([en]) => {
        if (!en.isIntersecting) return;
        reveal.disconnect();
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-revealed")));
        kick();
      },
      { rootMargin: "0px 0px -22% 0px" },
    );
    if (reduce) el.classList.add("is-revealed");
    else reveal.observe(el);
    let rt = 0;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(measure, 120);
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(() => measure());
    ro.observe(st);
    const onVis = () => !document.hidden && kick();
    document.addEventListener("visibilitychange", onVis);

    measure();
    el.style.setProperty("--rw-progress", (1 / n).toFixed(3));
    if (!reduce) {
      flags.current.playing = true;
      setPlaying(true);
    }
    restartBar();

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(craf);
      window.clearTimeout(timer);
      window.clearTimeout(rt);
      io.disconnect();
      reveal.disconnect();
      ro.disconnect();
      st.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      st.removeEventListener("click", onClickCapture, true);
      st.removeEventListener("wheel", onWheel);
      st.removeEventListener("pointermove", onCMove);
      st.removeEventListener("pointerleave", onCLeave);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [N, n, looks]);

  /* ───────────── helpers ───────────── */
  const engage = useCallback(() => {
    flags.current.engaged = true;
    flags.current.playing = false;
    setPlaying(false);
    api.current?.restartBar();
  }, []);

  const togglePlay = () => {
    const p = !flags.current.playing;
    if (p) flags.current.engaged = false;
    flags.current.playing = p;
    setPlaying(p);
    api.current?.restartBar();
  };

  useEffect(() => {
    root.current?.classList.toggle("is-playing", playing);
  }, [playing]);

  // reset per-look UI
  useEffect(() => {
    setHot(null);
    setMsg("");
    setZoom(null);
    flags.current.zoomed = false;
    root.current?.classList.remove("rw--zoom");
  }, [index]);

  const openZoom = (a: number) => {
    const fig = bodies.current[a]?.querySelector(".rw__fig") as HTMLElement | null;
    engage();
    setHot(null);
    setClosing(false);
    flags.current.zoomed = true;
    setZoom({ look: mod(a, n), from: fig ? fig.getBoundingClientRect() : null });
    root.current?.classList.add("rw--zoom");
  };

  // FLIP: grow from the runway spot into the popup
  useLayoutEffect(() => {
    if (!zoom || closing) return;
    const m = lbModel.current, s = lbStage.current;
    if (!m || !s) return;
    const r = s.getBoundingClientRect();
    const ar = looks[zoom.look].aspect;
    const h = Math.max(160, Math.min(r.height, r.width / ar));
    m.style.setProperty("--rw-model-h", `${h}px`);
    closeBtn.current?.focus({ preventScroll: true });
    if (!zoom.from || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fig = m.querySelector(".rw__fig") as HTMLElement;
    const b = fig.getBoundingClientRect();
    const a = zoom.from;
    m.style.transformOrigin = "0 100%";
    m.style.transition = "none";
    m.style.transform = `translate3d(${a.left - b.left}px, ${a.bottom - b.bottom}px, 0) scale(${a.height / b.height})`;
    void m.offsetWidth;
    m.style.transition = "";
    m.style.transform = "";
  }, [zoom, closing, looks]);

  const closeZoom = useCallback(() => {
    if (!zoom) return;
    const m = lbModel.current;
    const fig = m?.querySelector(".rw__fig") as HTMLElement | null;
    const a = zoom.from;
    if (m && fig && a && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const b = fig.getBoundingClientRect();
      m.style.transform = `translate3d(${a.left - b.left}px, ${a.bottom - b.bottom}px, 0) scale(${a.height / b.height})`;
    }
    setClosing(true);
    root.current?.classList.remove("rw--zoom");
    flags.current.zoomed = false;
    window.setTimeout(() => {
      setZoom(null);
      setClosing(false);
    }, 950);
    stage.current?.focus({ preventScroll: true });
  }, [zoom]);

  useEffect(() => {
    if (!zoom) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && closeZoom();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [zoom, closeZoom]);

  const pinClick = (p: number) => {
    engage();
    setHot(p);
    const list = itemsRef.current;
    const card = list?.querySelector<HTMLElement>(`[data-card="${p}"]`);
    if (!list || !card) return;
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (list.scrollWidth > list.clientWidth + 2) list.scrollTo({ left: card.offsetLeft - list.offsetLeft - 20, behavior });
    else if (list.scrollHeight > list.clientHeight + 2) list.scrollTo({ top: card.offsetTop - list.offsetTop - 12, behavior });
  };

  const addToBag = () => {
    engage();
    setMsg("");
    const s = size[index];
    if (!product || !colorway) return;
    if (!s) return setMsg(`Pick a size for: ${product.title}`);
    const variant = product.variants.find((x) => x.colorwayId === colorway.id && x.size === s);
    if (!variant) return setMsg("This size is not available.");
    add({ variantId: variant.id, handle: product.handle, title: product.title, colorway: colorway.name, size: s, image: colorway.images[0]?.src ?? look.image, price: variant.price });
    setAdded((m) => ({ ...m, [`${index}:${s}`]: true }));
  };

  const pad = (i: number) => String(i + 1).padStart(2, "0");
  const isAdded = !!added[`${index}:${size[index]}`];

  return (
    <section
      ref={root}
      id="runway"
      className="rw"
      aria-labelledby="rw-title"
      onKeyDown={(e) => {
        if (e.key === "Escape" && zoom) closeZoom();
      }}
    >
      <div className="rw__frame">
        <div className="rw__grid">
          <div className="rw__left">
            <div className="rw__head">
              <h2 id="rw-title" className="rw__title">
                Featured Collection
              </h2>
              <p className="rw__sub">CFM-K01 · ESS-E01 · ESS-L01 · IED-001 · CFM-T01</p>
              <span ref={live} className="sr-only" aria-live="polite" aria-atomic="true" />
            </div>

            <div
              ref={stage}
              className="rw__stage"
              tabIndex={0}
              role="region"
              aria-roledescription="carousel"
              aria-label="Featured Collection — use arrow keys or swipe to change look"
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") (e.preventDefault(), api.current?.next());
                if (e.key === "ArrowLeft") (e.preventDefault(), api.current?.prev());
              }}
            >
              <div className="rw__actors absolute inset-0">
                {Array.from({ length: N }).map((_, a) => {
                  const l = looks[a % n];
                  const front = a % n === index;
                  return (
                    <div key={a} ref={(r) => void (bodies.current[a] = r)} className="rw__model" aria-hidden={!front}>
                      <span className="rw__shadow" />
                      <div className="rw__fig" style={{ ["--ar" as string]: l.aspect }}>
                        <Image src={l.image} alt={a < n ? `${l.name}, ${l.colour}` : ""} fill sizes="(min-width: 750px) 420px, 320px" priority={a === 0} loading={a < 3 ? "eager" : "lazy"} draggable={false} />
                        <button
                          type="button"
                          className="rw__hit"
                          data-rw-go={a}
                          tabIndex={-1}
                          aria-label={`Look ${pad(a % n)}: ${l.name}`}
                          onClick={() => {
                            const k = api.current?.rank(a) ?? 0;
                            if (k !== 0 && Math.abs(k) < N / 2) api.current?.moveTo((api.current?.target() ?? 0) + k);
                            else if (k === 0) openZoom(a);
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <span className="rw__sweep" aria-hidden />
              <span ref={cursor} className="rw__cursor" aria-hidden>
                <span className="rw__cursor-in">
                  <span className="rw__cursor-label rw__cursor-drag">Drag</span>
                  <span className="rw__cursor-label rw__cursor-view">View</span>
                </span>
              </span>
              <span className="rw__walk" aria-hidden>
                <span className="rw__walk-line" />
              </span>
            </div>

            <div className="rw__controls">
              <button type="button" className="rw__icon" data-rw-prev aria-label="Previous look" onClick={() => api.current?.prev()}>
                <svg width="26" height="14" viewBox="0 0 26 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M25 7H1M7 1L1 7l6 6" />
                </svg>
              </button>
              <div className="rw__ticks">
                {looks.map((l, i) => (
                  <button key={i} type="button" className={`rw__tick ${i < index ? "is-past" : ""}`} aria-current={i === index} aria-label={`Look ${pad(i)}: ${l.name}`} onClick={() => api.current?.go(i)}>
                    <span className="rw__tick-bar" />
                    <span className="rw__tick-label">
                      {pad(i)}
                      <span className="rw__tick-name">&nbsp;&nbsp;{l.name}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button type="button" className="rw__icon rw__auto" aria-pressed={playing} aria-label="Autoplay" onClick={togglePlay}>
                <svg className="rw-play" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M7 4.5v15l12.5-7.5z" />
                </svg>
                <svg className="rw-pause" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M6.5 4.5h3.5v15H6.5zM14 4.5h3.5v15H14z" />
                </svg>
              </button>
              <button type="button" className="rw__icon" data-rw-next aria-label="Next look" onClick={() => api.current?.next()}>
                <svg width="26" height="14" viewBox="0 0 26 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M1 7h24M19 1l6 6-6 6" />
                </svg>
              </button>
            </div>

            {/* View look popup */}
            <div className="rw__lb" role="region" aria-label="View look" aria-hidden={!zoom || closing}>
              {zoom && (
                <>
                  <div ref={lbStage} className="rw__lb-stage" onClick={(e) => e.target === e.currentTarget && closeZoom()}>
                    <div ref={lbModel} className="rw__lb-model">
                      <span className="rw__shadow" />
                      <div className="rw__fig" style={{ ["--ar" as string]: looks[zoom.look].aspect }}>
                        <Image src={looks[zoom.look].image} alt={`${looks[zoom.look].name}, ${looks[zoom.look].colour}`} fill sizes="600px" />
                        {looks[zoom.look].pins.map((p, i) => (
                          <button
                            key={i}
                            type="button"
                            className={`rw__pin ${hot === i + 1 ? "is-hot" : ""}`}
                            data-tip={looks[zoom.look].rows[i].title}
                            style={{ left: `${p.x}%`, top: `${p.y}%`, ["--pi" as string]: i + 1 }}
                            aria-label={`${i + 1}: ${looks[zoom.look].rows[i].title}`}
                            onClick={() => pinClick(i + 1)}
                          >
                            <span className="rw__pin-dot">{i + 1}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rw__lb-top">
                    <p className="rw__lb-cap">
                      <span className="rw__lb-kicker">
                        Look {pad(zoom.look)} · {looks[zoom.look].code}
                      </span>
                      <span className="rw__lb-name">
                        {looks[zoom.look].name} — {looks[zoom.look].colour}
                      </span>
                    </p>
                    <button ref={closeBtn} type="button" className="rw__lb-close" aria-label="Close" onClick={closeZoom}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                        <path d="M5 5l14 14M19 5L5 19" />
                      </svg>
                    </button>
                  </div>
                  <p className="rw__lb-hint">Tap a dot</p>
                </>
              )}
            </div>
          </div>

          {/* In this look */}
          <aside
            className="rw__panel"
            aria-label="In this look"
            onPointerEnter={(e) => e.pointerType === "mouse" && (flags.current.panelHover = true)}
            onPointerLeave={(e) => {
              if (e.pointerType !== "mouse") return;
              flags.current.panelHover = false;
              api.current?.restartBar();
            }}
          >
            <div className="rw__panel-inner">
              <div className="rw__panel-head">
                <h3 className="rw__panel-title">In this look</h3>
                <span key={index} className="rw__label is-swap">
                  {look.code}
                </span>
              </div>
              <div key={`m${index}`} className="rw__mhead">
                <span className="rw__mhead-title">
                  {look.name} — {look.colour}
                </span>
                <span className="rw__label">{look.code}</span>
              </div>
              <ul ref={itemsRef} key={`l${index}`} className="rw__items" role="list">
                {look.rows.map((r, i) => (
                  <li
                    key={r.title}
                    data-card={i + 1}
                    className={`rw__item ${hot === i + 1 ? "is-hot" : ""}`}
                    style={{ ["--i" as string]: i + 1 }}
                    onPointerEnter={(e) => e.pointerType === "mouse" && setHot(i + 1)}
                    onPointerLeave={(e) => e.pointerType === "mouse" && setHot(null)}
                  >
                    <span className="rw__media">
                      <Image src={r.thumb} alt="" fill sizes="80px" className="object-cover" />
                      <span className="rw__num">{i + 1}</span>
                    </span>
                    <span className="rw__info">
                      <span className="rw__type">{r.process}</span>
                      <span className="rw__name">{r.title}</span>
                      <span className="rw__spec">{r.spec}</span>
                    </span>
                  </li>
                ))}
              </ul>

              {product && colorway && (
                <div key={`b${index}`} className="rw__buy">
                  {msg && (
                    <p className="rw__msg" role="status">
                      {msg}
                    </p>
                  )}
                  <div className="rw__buy-row">
                    <span className="flex flex-col gap-1">
                      <Link href={`/shop/${product.handle}?colour=${colorway.id}`} className="rw__buy-title link-u self-start" onClick={engage}>
                        {product.title} — {colorway.name}
                      </Link>
                      <span className="rw__buy-note">{formatPrice(product.price)}</span>
                    </span>
                    <span className="rw__label">Size</span>
                  </div>
                  <div className="rw__pills" role="group" aria-label="Size">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="rw__pill"
                        aria-pressed={size[index] === s}
                        onClick={() => {
                          engage();
                          setMsg("");
                          setSize((m) => ({ ...m, [index]: s }));
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <button type="button" className={`rw__cta ${isAdded ? "is-done" : ""}`} onClick={addToBag}>
                    <span>{isAdded ? "In your bag" : "Add to bag"}</span>
                    {!isAdded && (
                      <svg width="22" height="12" viewBox="0 0 26 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                        <path d="M1 7h24M19 1l6 6-6 6" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
