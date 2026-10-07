"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Large stat value with an RGB-split glitch: red and cyan copies jitter
 * and clip around the real number when it enters the viewport and on hover.
 */
export default function GlitchNumber({ value, className = "" }: { value: string; className?: string }) {
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const [red, cyan, main] = el.querySelectorAll<HTMLElement>("[data-layer]");

    const glitch = () => {
      const tl = gsap.timeline();
      for (let i = 0; i < 6; i++) {
        const top = gsap.utils.random(0, 70);
        const clip = `inset(${top}% 0 ${100 - top - gsap.utils.random(10, 30)}% 0)`;
        tl.set(red, { opacity: 1, x: gsap.utils.random(-8, 8), clipPath: clip })
          .set(cyan, { opacity: 1, x: gsap.utils.random(-8, 8), clipPath: clip })
          .set(main, { x: gsap.utils.random(-3, 3) })
          .to({}, { duration: 0.05 });
      }
      tl.set([red, cyan, main], { opacity: (i: number) => (i === 2 ? 1 : 0), x: 0, clipPath: "none" });
      return tl;
    };

    const st = ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => glitch() });
    el.addEventListener("mouseenter", glitch);
    return () => {
      st.kill();
      el.removeEventListener("mouseenter", glitch);
    };
  }, []);

  const layer = "absolute left-0 top-0 whitespace-nowrap";
  return (
    <span ref={root} className={`relative inline-block tabular-nums ${className}`}>
      <span className="sr-only">{value}</span>
      <span aria-hidden className="invisible">{value}</span>
      <span aria-hidden data-layer className={`${layer} opacity-0 text-[rgba(255,40,80,0.9)]`}>{value}</span>
      <span aria-hidden data-layer className={`${layer} opacity-0 text-[rgba(0,190,255,0.9)]`}>{value}</span>
      <span aria-hidden data-layer className={layer}>{value}</span>
    </span>
  );
}
