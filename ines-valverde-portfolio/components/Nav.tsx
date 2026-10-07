"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Clock from "@/components/ui/Clock";
import HoverLink from "@/components/ui/HoverLink";
import { nav, site } from "@/lib/content";

/**
 * Fixed top bar. mix-blend-difference keeps it legible over both the
 * light hero and the dark work section, like the Framer original.
 */
export default function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <nav className="gutter label fixed inset-x-0 top-0 z-50 flex items-center justify-between py-3 text-paper mix-blend-difference lg:py-[14px]">
        <a href="#" className="flex gap-3" aria-label={`${site.name}, home`}>
          <span>{site.handle}</span>
          <Clock timeZone={site.timeZone} />
        </a>
        <div className="flex items-center gap-6">
          <span className="hidden md:block">
            <HoverLink href={nav.cta.href}>{nav.cta.label}</HoverLink>
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            className="group relative inline-flex cursor-pointer overflow-hidden uppercase"
          >
            <span className="block transition-transform duration-500 group-hover:-translate-y-full">
              {open ? "Close" : "Menu"}
            </span>
            <span aria-hidden className="absolute inset-0 translate-y-full transition-transform duration-500 group-hover:translate-y-0">
              {open ? "Close" : "Menu"}
            </span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="site-menu"
            className="gutter fixed inset-0 z-40 flex flex-col justify-end bg-ink pb-10 text-paper"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <ul>
              {nav.menu.map((item, i) => (
                <li key={item.href} className="overflow-hidden">
                  <motion.a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block text-[clamp(56px,11vw,160px)] leading-[0.92] tracking-[-0.045em] hover:text-muted"
                    initial={{ y: "100%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "100%" }}
                    transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {item.label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
