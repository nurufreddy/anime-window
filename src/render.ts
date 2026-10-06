import type { Quad, Region } from "./geometry";
import { fitRect } from "./geometry";
export function composite(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  anime: CanvasImageSource | null,
  q: Quad | null,
  w: number,
  h: number,
  debug: boolean,
  modelSize = 512,
  region: Region = { x: 0, y: 0, width: w, height: h },
) {
  ctx.save();
  ctx.setTransform(-1, 0, 0, 1, w, 0);
  ctx.drawImage(source, 0, 0, w, h);
  if (q) {
    const path = new Path2D();
    q.forEach((p, i) =>
      i ? path.lineTo(p.x * w, p.y * h) : path.moveTo(p.x * w, p.y * h),
    );
    path.closePath();
    if (anime) {
      const r = fitRect(region.width, region.height, modelSize);
      ctx.save();
      ctx.clip(path, "evenodd");
      ctx.drawImage(
        anime,
        r.x,
        r.y,
        r.width,
        r.height,
        region.x,
        region.y,
        region.width,
        region.height,
      );
      ctx.restore();
    }
    if (debug) {
      ctx.strokeStyle = "#c4f49a";
      ctx.lineWidth = 2;
      ctx.stroke(path);
      q.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#c4f49a";
        ctx.fill();
      });
    }
  }
  ctx.restore();
}
