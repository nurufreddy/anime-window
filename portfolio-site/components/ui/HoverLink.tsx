import type { ReactNode } from "react";

/**
 * Text link whose label rolls up to reveal a duplicate on hover.
 * Used for socials, nav CTA and footer links.
 */
export default function HoverLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={`group relative inline-flex overflow-hidden ${className}`}
    >
      <span className="block transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-full">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0"
      >
        {children}
      </span>
    </a>
  );
}
