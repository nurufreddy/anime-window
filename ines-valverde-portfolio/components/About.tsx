"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GlitchNumber from "@/components/ui/GlitchNumber";
import HoverLink from "@/components/ui/HoverLink";
import SectionLabel from "@/components/ui/SectionLabel";
import { about, site } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger);

/**
 * Statement words light up from 16% to full opacity as you scroll
 * (GSAP scrub), followed by two short paragraphs and glitching stats.
 */
export default function About() {
  const statement = useRef<HTMLHeadingElement>(null);
  const details = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to("[data-word]", {
        opacity: 1,
        stagger: 0.1,
        ease: "none",
        scrollTrigger: { trigger: statement.current, start: "top 80%", end: "bottom 45%", scrub: true },
      });
      gsap.from("[data-fade]", {
        opacity: 0,
        y: 24,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: details.current, start: "top 85%" },
      });
    });
    return () => ctx.revert();
  }, []);

  const words = about.statement.split(" ");

  return (
    <section
      id="about"
      className="gutter relative z-[2] flex flex-col gap-14 bg-paper pb-28 pt-24 md:gap-[72px] md:pb-[140px] md:pt-[120px] lg:gap-24 lg:pb-[180px] lg:pt-40"
    >
      <div className="flex flex-col gap-7">
        <SectionLabel>{about.label}</SectionLabel>
        <h2
          ref={statement}
          aria-label={about.statement}
          className="indent-[33.6%] text-[clamp(28px,3.5vw,50px)] leading-[1.06] tracking-[-0.035em]"
        >
          {words.map((w, i) => (
            <span key={i} aria-hidden>
              <span data-word className="opacity-[0.16]">{w}</span>{" "}
            </span>
          ))}
        </h2>
      </div>

      <div ref={details} className="site-grid gap-y-10 text-[16px] leading-[1.4] lg:text-[17px]">
        <div className="hidden lg:col-span-6 lg:block" />
        <div data-fade className="col-span-4 flex flex-col gap-6 md:col-span-4 lg:col-span-3">
          <p>{about.practice}</p>
          <HoverLink href={site.cvUrl} className="label items-center">
            <span className="inline-flex items-center gap-2">
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                <path d="M5 0v8M1 4.5 5 8.5l4-4" stroke="currentColor" fill="none" />
              </svg>
              {about.cvLabel}
            </span>
          </HoverLink>
        </div>
        <p data-fade className="col-span-4 text-muted md:col-span-4 lg:col-span-3">{about.offDuty}</p>
      </div>

      <div className="grid grid-cols-3 gap-x-2 border-t border-line pt-4 md:grid-cols-8 md:pt-10 lg:grid-cols-12">
        <div className="hidden lg:col-span-3 lg:block" />
        {about.stats.map((s, i) => (
          <div
            key={s.label}
            className={`col-span-1 flex flex-col gap-3 md:col-span-2 lg:col-span-3 ${i === 0 ? "md:col-start-3 lg:col-start-4" : ""}`}
          >
            <p className="label text-muted">{s.label}</p>
            <GlitchNumber value={s.value} className="text-[clamp(40px,7.5vw,108px)] leading-none tracking-[-0.06em]" />
          </div>
        ))}
      </div>
    </section>
  );
}
