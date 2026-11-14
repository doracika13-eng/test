"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Site-wide scroll choreography (GSAP + ScrollTrigger, loaded lazily).
 *
 *  data-reveal            fade + rise
 *  data-reveal="clip"     image wipes upward
 *  data-reveal="lines"    children .line-mask > span slide up, staggered
 *  data-parallax="0.15"   vertical drift relative to scroll (desktop/tablet only)
 *  data-scrub-scale       scales from 0.86 → 1 while entering
 *  data-delay="0.2"       delay in seconds
 */
export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        el.style.opacity = "1";
        el.style.clipPath = "none";
      });
      return;
    }

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          const type = el.dataset.reveal;
          const delay = Number(el.dataset.delay || 0);
          const st = { trigger: el, start: "top 88%", once: true };
          if (type === "clip") {
            gsap.fromTo(el, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.5, delay, ease: "expo.inOut", scrollTrigger: st });
            const img = el.querySelector("img");
            if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 2, delay, ease: "expo.out", scrollTrigger: st });
          } else if (type === "lines") {
            gsap.set(el, { opacity: 1 });
            gsap.fromTo(
              el.querySelectorAll(".line-mask > span"),
              { yPercent: 110 },
              { yPercent: 0, duration: 1.3, delay, stagger: 0.09, ease: "expo.out", scrollTrigger: st },
            );
          } else {
            gsap.fromTo(el, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 1.2, delay, ease: "expo.out", scrollTrigger: st });
          }
        });

        const mm = gsap.matchMedia();
        mm.add("(min-width: 768px)", () => {
          gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
            const s = Number(el.dataset.parallax || 0.15);
            gsap.fromTo(
              el,
              { yPercent: -s * 50 },
              { yPercent: s * 50, ease: "none", scrollTrigger: { trigger: el.parentElement || el, start: "top bottom", end: "bottom top", scrub: true } },
            );
          });
          gsap.utils.toArray<HTMLElement>("[data-scrub-scale]").forEach((el) => {
            gsap.fromTo(el, { scale: 0.86 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "top 25%", scrub: true } });
          });
          gsap.utils.toArray<HTMLElement>("[data-scrub-x]").forEach((el) => {
            const d = Number(el.dataset.scrubX || -20);
            gsap.fromTo(el, { xPercent: 0 }, { xPercent: d, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
          });
        });
      });
      ScrollTrigger.refresh();
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [pathname]);

  return null;
}
