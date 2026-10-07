/**
 * Dashed vertical column guides (4px dash / 4px gap) drawn on each
 * column edge of the 12-column grid. Purely decorative.
 */
export default function GridLines({ tone = "line" }: { tone?: "line" | "light" }) {
  const color = tone === "light" ? "rgba(244,243,239,0.12)" : "var(--color-line)";
  const dash = {
    backgroundImage: `linear-gradient(to bottom, ${color} 4px, transparent 4px)`,
    backgroundSize: "1px 8px",
  };

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 gutter">
      <div className="site-grid h-full">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className={`relative h-full ${i >= 8 ? "hidden lg:block" : i >= 4 ? "hidden md:block" : ""}`}
          >
            <span className="absolute inset-y-0 left-0 w-px" style={dash} />
            <span className="absolute inset-y-0 right-0 w-px" style={dash} />
          </div>
        ))}
      </div>
    </div>
  );
}
