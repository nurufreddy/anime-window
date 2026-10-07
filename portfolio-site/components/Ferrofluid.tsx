"use client";

import { useEffect, useRef } from "react";

/**
 * Ferrofluid-style metaball blob drawn on a low-res canvas and scaled up.
 * Blobs orbit a center point and one follows the pointer, merging and
 * splitting like liquid. Shading fakes a glossy highlight from the field
 * gradient. Pauses when off screen and respects reduced motion.
 */
export default function Ferrofluid({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const RES = 180; // internal resolution (square)
    canvas.width = RES;
    canvas.height = RES;
    const img = ctx.createImageData(RES, RES);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const blobs = Array.from({ length: 7 }, (_, i) => ({
      r: i === 0 ? 34 : 14 + Math.random() * 12,
      orbit: i === 0 ? 0 : 18 + Math.random() * 38,
      speed: 0.3 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      x: RES / 2,
      y: RES / 2,
    }));
    const pointer = { x: RES / 2, y: RES / 2, tx: RES / 2, ty: RES / 2, active: false };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.tx = ((e.clientX - rect.left) / rect.width) * RES;
      pointer.ty = ((e.clientY - rect.top) / rect.height) * RES;
      pointer.active = true;
    };
    window.addEventListener("pointermove", onMove);

    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(canvas);

    let raf = 0;
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      const time = reduced ? 0 : t / 1000;

      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      blobs.forEach((b, i) => {
        if (i === 1 && pointer.active) {
          const dx = Math.max(-60, Math.min(60, pointer.x - RES / 2));
          const dy = Math.max(-60, Math.min(60, pointer.y - RES / 2));
          b.x = RES / 2 + dx;
          b.y = RES / 2 + dy;
          return;
        }
        b.x = RES / 2 + Math.cos(time * b.speed + b.phase) * b.orbit;
        b.y = RES / 2 + Math.sin(time * b.speed * 1.3 + b.phase) * b.orbit;
      });

      const d = img.data;
      for (let y = 0; y < RES; y++) {
        for (let x = 0; x < RES; x++) {
          let f = 0, gx = 0, gy = 0;
          for (const b of blobs) {
            const dx = x - b.x, dy = y - b.y;
            const v = (b.r * b.r) / (dx * dx + dy * dy + 1);
            f += v;
            gx += v * dx;
            gy += v * dy;
          }
          const i = (y * RES + x) * 4;
          const a = Math.min(1, Math.max(0, (f - 1) * 14)); // crisp liquid edge
          // light from the top-left: brighter where the surface faces it
          const len = Math.hypot(gx, gy) || 1;
          const rim = Math.min(1, Math.max(0, (2.2 - f) / 1.2)); // only near the surface
          const light = Math.max(0, (-gx - gy) / len / Math.SQRT2) ** 8 * rim;
          const c = 10 + light * 70;
          d[i] = c; d[i + 1] = c; d[i + 2] = c;
          d[i + 3] = a * 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none aspect-square h-full max-w-full [image-rendering:auto] ${className}`}
    />
  );
}
