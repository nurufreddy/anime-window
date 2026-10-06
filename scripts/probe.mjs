import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
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
    ),
    hands = (await readFile("artifacts/hands.jpg")).toString("base64");
  const result = await page.evaluate(
    async ({ portrait, hands }) => {
      const worker = (url) => {
        const w = new Worker(url, { type: "module" });
        return {
          w,
          send: (data) =>
            new Promise((res, rej) => {
              const t = setTimeout(() => rej(Error("Worker timed out")), 60000);
              w.onmessage = (e) => {
                clearTimeout(t);
                e.data.type === "error"
                  ? rej(Error(e.data.message))
                  : res(e.data);
              };
              w.onerror = (e) => {
                clearTimeout(t);
                rej(Error(e.message));
              };
              w.postMessage(data);
            }),
        };
      };
      const picture = async (data, type) =>
        createImageBitmap(
          await (await fetch(`data:image/${type};base64,${data}`)).blob(),
        );
      const hand = worker("/src/hands.worker.ts");
      await hand.send({ type: "init" });
      const detected = await hand.send({
        type: "frame",
        frame: await picture(hands, "jpeg"),
        timestamp: performance.now(),
        id: 1,
      });
      hand.w.terminate();
      const runs = [];
      for (const size of [192, 256, 512]) {
        const anime = worker("/src/anime.worker.ts"),
          ready = await anime.send({ type: "init", size });
        const frames = [];
        let output;
        const src = await picture(portrait, "png");
        const moved = new OffscreenCanvas(512, 512),
          mc = moved.getContext("2d");
        for (let i = 0; i < 6; i++) {
          mc.fillStyle = "#808080";
          mc.fillRect(0, 0, 512, 512);
          mc.drawImage(src, Math.sin(i) * 8, 0);
          const t = performance.now();
          output = await anime.send({
            type: "frame",
            frame: await createImageBitmap(moved),
            timestamp: t,
            id: i,
          });
          frames.push({
            inference: output.inferenceMs,
            total: performance.now() - t,
          });
        }
        const c = document.createElement("canvas");
        c.width = size;
        c.height = size;
        c.getContext("2d").drawImage(output.anime, 0, 0);
        runs.push({ size, ready, frames, png: c.toDataURL() });
        anime.w.terminate();
        src.close();
      }
      const a = await navigator.gpu?.requestAdapter();
      return {
        hands: detected.hands,
        runs,
        adapter: a
          ? {
              vendor: a.info.vendor,
              architecture: a.info.architecture,
              description: a.info.description,
              isFallbackAdapter: a.info.isFallbackAdapter,
            }
          : null,
      };
    },
    { portrait, hands },
  );
  assert.equal(result.hands.length, 2);
  for (const run of result.runs) {
    await writeFile(
      `artifacts/anime-portrait-${run.size}.png`,
      Buffer.from(run.png.split(",")[1], "base64"),
    );
    delete run.png;
  }
  console.log(JSON.stringify(result, null, 2));
  await writeFile("artifacts/probe.json", JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
