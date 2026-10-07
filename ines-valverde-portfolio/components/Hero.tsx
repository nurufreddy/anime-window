"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Ferrofluid from "@/components/Ferrofluid";
import GridLines from "@/components/ui/GridLines";
import HoverLink from "@/components/ui/HoverLink";
import LetterReveal from "@/components/ui/LetterReveal";
import { hero, socialsPrimary } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger);

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
});

/**
 * Sticky full-height intro. The Work section slides up over it; while
 * that happens the hero content drifts up and dims (GSAP scrub).
 */
export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(inner.current, {
        yPercent: -12,
        opacity: 0.3,
        ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      id="index"
      className="gutter sticky top-0 z-[1] flex h-svh min-h-[600px] flex-col overflow-clip pb-5 md:min-h-[640px] md:pb-6 lg:min-h-[720px] lg:pb-7"
    >
      <GridLines />

      <div ref={inner} className="relative flex flex-1 flex-col">
        {/* Intro row: liquid artwork + name block */}
        <div className="site-grid flex-1 content-center items-center gap-y-8">
          <div className="col-span-4 flex h-[240px] items-center justify-start md:col-span-2 md:h-[200px] lg:col-span-5 lg:h-[460px]">
            <Ferrofluid />
          </div>

          <div className="col-span-4 md:col-span-6 lg:col-span-7">
            <LetterReveal
              as="h1"
              trigger="mount"
              delay={0.2}
              lines={[hero.firstName, hero.lastName]}
              className="text-[clamp(64px,10.6vw,152px)] leading-[0.92] tracking-[-0.045em]"
            />
            <div className="label mt-6 flex justify-between gap-6 lg:mt-8">
              <motion.p {...fadeUp(0.9)}>
                {hero.role}
                <br />
                {hero.location}
              </motion.p>
              <motion.p {...fadeUp(1)}>{hero.edition}</motion.p>
            </div>
          </div>
        </div>

        {/* Footer row: scroll hint + socials */}
        <motion.div {...fadeUp(1.2)} className="site-grid label items-end">
          <div className="hidden lg:col-span-5 lg:block" />
          <div className="col-span-2 md:col-span-4 lg:col-span-4">
            <a href={hero.scrollHint.href} className="inline-block animate-pulse hover:animate-none">
              {hero.scrollHint.label}
            </a>
          </div>
          <ul className="col-span-2 flex flex-col items-end gap-1 md:col-span-4 md:flex-row md:justify-end md:gap-6 lg:col-span-3">
            {socialsPrimary.map((s) => (
              <li key={s.label}>
                <HoverLink href={s.href}>{s.label}</HoverLink>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
