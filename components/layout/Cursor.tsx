"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Desktop-only cursor: a small dot and a trailing ring that expands with a label
 * over elements carrying data-cursor="Label". Never mounted on touch devices.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq.matches || rm.matches) return;
    setEnabled(true);
    document.documentElement.classList.add("has-cursor");

    let x = -100, y = -100, rx = -100, ry = -100, raf = 0, visible = false;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        visible = true;
        rx = x;
        ry = y;
        dot.current?.style.setProperty("opacity", "1");
        ring.current?.style.setProperty("opacity", "1");
      }
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor], a, button");
      setLabel(t ? t.dataset.cursor ?? "" : null);
    };
    const leave = () => {
      visible = false;
      dot.current?.style.setProperty("opacity", "0");
      ring.current?.style.setProperty("opacity", "0");
    };
    const tick = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  if (!enabled) return null;
  const hasText = !!label;
  const hovering = label !== null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[200] mix-blend-difference">
      <div ref={dot} className="absolute left-0 top-0 opacity-0">
        <div className={`-translate-x-1/2 -translate-y-1/2 rounded-full bg-paper transition-[width,height] duration-300 ${hovering ? "h-0 w-0" : "h-1.5 w-1.5"}`} />
      </div>
      <div ref={ring} className="absolute left-0 top-0 opacity-0">
        <div
          className={`grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-paper text-paper transition-[width,height,background-color] duration-500 ease-[var(--ease-silk)] ${
            hasText ? "h-20 w-20 bg-paper" : hovering ? "h-12 w-12" : "h-8 w-8"
          }`}
        >
          {hasText && <span className="eyebrow !text-[0.55rem] text-ink">{label}</span>}
        </div>
      </div>
    </div>
  );
}
