/**
 * Invisible sticky spacer ("Empty" in Framer). It adds one viewport of
 * scroll while the Work panel above stays pinned, before About covers it.
 */
export default function ScrollHold() {
  return (
    <div aria-hidden className="pointer-events-none sticky top-0 z-[2] h-svh min-h-[600px] md:min-h-[640px] lg:min-h-[720px]" />
  );
}
