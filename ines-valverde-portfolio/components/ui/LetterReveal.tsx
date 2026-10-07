"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ElementType } from "react";

type Props = {
  /** Each entry renders on its own line. */
  lines: string[];
  as?: ElementType;
  className?: string;
  /** "mount" plays on load (hero); "view" plays when scrolled into view. */
  trigger?: "mount" | "view";
  delay?: number;
  href?: string;
};

/**
 * Splits text into characters that rise out of a mask one after another,
 * like the Framer text effect on the hero name and "Get in touch".
 * Screen readers get the plain string through aria-label.
 */
export default function LetterReveal({
  lines,
  as: Tag = "div",
  className,
  trigger = "view",
  delay = 0,
  href,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const play = trigger === "mount" || inView;
  let index = 0;

  return (
    <Tag ref={ref} className={className} aria-label={lines.join(" ")} href={href}>
      {lines.map((line, li) => (
        <span key={li} aria-hidden className="block whitespace-nowrap">
          {Array.from(line).map((char, ci) => {
            const i = index++;
            return (
              <span key={ci} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span
                  className="inline-block"
                  initial={{ y: "110%" }}
                  animate={play ? { y: "0%" } : undefined}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.035 }}
                >
                  {char === " " ? " " : char}
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
