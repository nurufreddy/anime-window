"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GridLines from "@/components/ui/GridLines";
import HoverLink from "@/components/ui/HoverLink";
import LetterReveal from "@/components/ui/LetterReveal";
import { contact, site, socialsPrimary, socialsSecondary, type Social } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger);

function LinkList({ links }: { links: Social[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {links.map((l) => (
        <li key={l.label}>
          <HoverLink href={l.href}>{l.label}</HoverLink>
        </li>
      ))}
    </ul>
  );
}

/**
 * Footer / contact. The media frame opens from a clipped strip and its
 * image zooms out as it scrolls in (GSAP scrub). The giant "Get in touch"
 * mailto link reveals letter by letter.
 */
export default function Contact() {
  const media = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        media.current,
        { clipPath: "inset(20% 20% 20% 20%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "none",
          scrollTrigger: { trigger: media.current, start: "top bottom", end: "top 50%", scrub: true },
        },
      );
      gsap.fromTo(
        "[data-media]",
        { scale: 1.3 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: media.current, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <footer
      id="contact"
      className="gutter relative z-[3] flex flex-col gap-16 bg-paper pb-6 pt-20 md:gap-24 md:pb-8 md:pt-24 lg:gap-[120px] lg:pb-10 lg:pt-[120px]"
    >
      <GridLines />

      <div className="site-grid relative">
        <div className="hidden md:col-span-2 md:block lg:col-span-6" />
        <div ref={media} className="relative col-span-4 aspect-[4/3] overflow-hidden md:col-span-4 lg:col-span-3">
          {contact.video ? (
            <video
              data-media
              src={contact.video}
              poster={contact.poster}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <Image data-media src={contact.poster} alt="" fill sizes="(min-width:1200px) 25vw, 100vw" className="object-cover" />
          )}
        </div>
      </div>

      <div className="relative flex flex-col gap-10 lg:gap-14">
        <LetterReveal
          as="a"
          href={`mailto:${site.email}`}
          lines={[contact.heading]}
          className="block w-full text-[clamp(56px,15.6vw,226px)] leading-[0.9] tracking-[-0.045em] transition-colors hover:text-muted [&>span]:whitespace-normal md:[&>span]:whitespace-nowrap"
        />

        <div className="site-grid label gap-y-8">
          <div className="hidden lg:col-span-6 lg:block" />
          <div className="col-span-2 md:col-span-4 lg:col-span-3">
            <LinkList links={socialsPrimary} />
          </div>
          <div className="col-span-2 md:col-span-4 lg:col-span-3">
            <LinkList links={socialsSecondary} />
          </div>

          <div className="hidden lg:col-span-6 lg:block" />
          <p className="col-span-2 md:col-span-4 lg:col-span-3">
            {contact.credits.prefix}
            <span>{site.name}</span>
            <br />
            {contact.credits.builtIn}
            <span>{contact.credits.builtWith}</span>
          </p>
          <p className="col-span-2 text-muted md:col-span-4 lg:col-span-3">{contact.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
