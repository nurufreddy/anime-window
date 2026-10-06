export type Point = { x: number; y: number };
export type Hand = { wrist: Point; index: Point; thumb: Point; label: string };
export type Quad = [Point, Point, Point, Point];
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (p: Point): Point => ({
  x: Math.max(0, Math.min(1, p.x)),
  y: Math.max(0, Math.min(1, p.y)),
});
export function fitRect(w: number, h: number, size: number) {
  const scale = Math.min(size / w, size / h),
    width = w * scale,
    height = h * scale;
  return { x: (size - width) / 2, y: (size - height) / 2, width, height };
}
export function mirror(p: Point): Point {
  return { x: 1 - p.x, y: p.y };
}
export function usable(q: Quad) {
  // Sum of triangle areas, not signed shoelace: a bow-tie must not cancel itself.
  const cross = (a: Point, b: Point, c: Point) =>
    Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
  return (
    q.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)) &&
    cross(q[0], q[1], q[2]) + cross(q[0], q[2], q[3]) > 0.0003
  );
}
export class ShapeTracker {
  private hands: Hand[] = [];
  private quad: Quad | null = null;
  private seen = -Infinity;
  private updated = 0;
  readonly grace = 160;
  update(input: Hand[], now: number): Quad | null {
    if (
      input.length !== 2 ||
      input.some((h) =>
        [h.wrist, h.index, h.thumb].some(
          (p) => !Number.isFinite(p.x) || !Number.isFinite(p.y),
        ),
      )
    )
      return this.current(now);
    let hands = [...input];
    if (this.hands.length === 2 && now - this.seen <= this.grace) {
      const cost = (h: Hand, p: Hand) =>
        distance(h.wrist, p.wrist) + (h.label !== p.label ? 0.15 : 0);
      if (
        cost(hands[0], this.hands[1]) + cost(hands[1], this.hands[0]) <
        cost(hands[0], this.hands[0]) + cost(hands[1], this.hands[1])
      )
        hands.reverse();
    } else {
      hands.sort((a, b) => a.wrist.x - b.wrist.x);
      this.quad = null;
    }
    const next: Quad = [
      hands[0].index,
      hands[1].index,
      hands[1].thumb,
      hands[0].thumb,
    ].map(clamp) as Quad;
    const alpha = 1 - Math.exp(-Math.max(1, now - this.updated) / 28);
    this.quad = this.quad
      ? (next.map((p, i) => ({
          x: this.quad![i].x + alpha * (p.x - this.quad![i].x),
          y: this.quad![i].y + alpha * (p.y - this.quad![i].y),
        })) as Quad)
      : next;
    this.hands = hands;
    this.seen = now;
    this.updated = now;
    return this.current(now);
  }
  current(now: number): Quad | null {
    return now - this.seen <= this.grace && this.quad && usable(this.quad)
      ? this.quad
      : null;
  }
}
export type Region = { x: number; y: number; width: number; height: number };
/** Padded source-pixel bounds: spend model resolution on the visible window. */
export function windowRegion(
  q: Quad | undefined,
  w: number,
  h: number,
): Region {
  if (!q) return { x: 0, y: 0, width: w, height: h };
  const xs = q.map((p) => p.x * w),
    ys = q.map((p) => p.y * h);
  const left = Math.min(...xs),
    right = Math.max(...xs),
    top = Math.min(...ys),
    bottom = Math.max(...ys);
  const width = Math.min(w, Math.max(128, (right - left) * 1.16)),
    height = Math.min(h, Math.max(128, (bottom - top) * 1.16));
  return {
    x: Math.max(0, Math.min(w - width, (left + right - width) / 2)),
    y: Math.max(0, Math.min(h - height, (top + bottom - height) / 2)),
    width,
    height,
  };
}
