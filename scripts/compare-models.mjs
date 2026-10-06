import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--enable-unsafe-webgpu"],
});
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:5173");
  const portrait = (await readFile("artifacts/portrait.png")).toString(
    "base64",
  );
  const result = await page.evaluate(async (portrait) => {
    const results = [];
    const src = await createImageBitmap(
      await (await fetch("data:image/png;base64," + portrait)).blob(),
    );
    // Consistent close-up source for all models; inspect face quality before integrating.
    const input = new OffscreenCanvas(512, 512);
    input.getContext("2d").drawImage(src, 140, 0, 240, 240, 0, 0, 512, 512);
    for (const model of ["portrait", "ghibli"])
      for (const size of [256, 512]) {
        const w = new Worker("/src/anime.worker.ts", { type: "module" });
        const send = (data) =>
          new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(Error("timeout")), 60000);
            w.onmessage = (e) => {
              clearTimeout(timer);
              e.data.type === "error"
                ? reject(Error(e.data.message))
                : resolve(e.data);
            };
            w.onerror = (e) => {
              clearTimeout(timer);
              reject(Error(e.message));
            };
            w.postMessage(data);
          });
        try {
          const ready = await send({ type: "init", model, size });
          const times = [];
          let output;
          for (let i = 0; i < 3; i++) {
            output = await send({
              type: "frame",
              frame: await createImageBitmap(input),
              timestamp: performance.now(),
              id: i,
            });
            times.push(output.inferenceMs);
          }
          const c = document.createElement("canvas");
          c.width = c.height = size;
          c.getContext("2d").drawImage(output.anime, 0, 0);
          results.push({ model, size, ready, times, png: c.toDataURL() });
        } catch (e) {
          results.push({ model, size, error: String(e) });
        } finally {
          w.terminate();
        }
      }
    return results;
  }, portrait);
  for (const r of result) {
    if (r.png) {
      await writeFile(
        `artifacts/compare-${r.model}-${r.size}.png`,
        Buffer.from(r.png.split(",")[1], "base64"),
      );
      delete r.png;
    }
  }
  console.log(JSON.stringify(result, null, 2));
  await writeFile(
    "artifacts/model-comparison.json",
    JSON.stringify(result, null, 2),
  );
} finally {
  await browser.close();
}
