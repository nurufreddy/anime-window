import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
await mkdir("artifacts", { recursive: true });
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--enable-unsafe-webgpu"],
});
const hands = (await readFile("artifacts/hands.jpg")).toString("base64");
const portrait = (await readFile("artifacts/portrait.png")).toString("base64");
const checks = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 1000 },
  });
  await page.addInitScript(
    ({ hands }) => {
      globalThis.fixtureVisible = true;
      globalThis.fixtureTracks = [];
      navigator.mediaDevices.getUserMedia = async () => {
        const image = new Image();
        image.src = `data:image/jpeg;base64,${hands}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const c = canvas.getContext("2d");
        const paint = () => {
          c.fillStyle = "white";
          c.fillRect(0, 0, 640, 480);
          if (globalThis.fixtureVisible)
            c.drawImage(
              image,
              6 * Math.sin(performance.now() / 400),
              70,
              630,
              334,
            );
        };
        paint();
        const timer = setInterval(paint, 33),
          stream = canvas.captureStream(30);
        globalThis.fixtureTracks.push(...stream.getTracks());
        for (const track of stream.getTracks()) {
          const stop = track.stop.bind(track);
          track.stop = () => {
            clearInterval(timer);
            stop();
          };
        }
        return stream;
      };
    },
    { hands },
  );
  await page.goto(base);
  await page.locator("#start").click();
  await page.waitForFunction(
    () =>
      document.querySelector("#status").textContent.startsWith("Window open"),
    {},
    { timeout: 60000 },
  );
  await page.getByText("Settings & diagnostics").click();
  await page.locator("#debug").check();
  await page.screenshot({ path: "artifacts/two-hands.png" });
  checks.push(
    "Actual MediaPipe → moving two-hand source → live fingertip mask → actual AnimeGAN → composite",
  );
  await page.evaluate(() => {
    globalThis.fixtureVisible = false;
  });
  await page.waitForFunction(
    () => document.querySelector("#status").textContent.includes("0/2 hands"),
    {},
    { timeout: 5000 },
  );
  checks.push(
    "Hand removal clears the window while inference may be in flight",
  );
  await page.evaluate(() => {
    globalThis.fixtureVisible = true;
  });
  await page.waitForFunction(
    () =>
      document.querySelector("#status").textContent.startsWith("Window open"),
    {},
    { timeout: 10000 },
  );
  checks.push("Tracking reacquires after loss");
  await page.locator("#stop").click();
  assert.ok(
    await page.evaluate(() =>
      globalThis.fixtureTracks.every((t) => t.readyState === "ended"),
    ),
  );
  checks.push("Synthetic source tracks stop");
  // Generate a moving public portrait clip, not user footage, then use the real file-input flow.
  const encoded = await page.evaluate(
    async ({ portrait }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${portrait}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const c = canvas.getContext("2d"),
        stream = canvas.captureStream(15),
        chunks = [];
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      recorder.ondataavailable = (e) => chunks.push(e.data);
      const done = new Promise(
        (resolve) =>
          (recorder.onstop = async () => {
            const bytes = new Uint8Array(await new Blob(chunks).arrayBuffer());
            let binary = "";
            for (const b of bytes) binary += String.fromCharCode(b);
            resolve(btoa(binary));
          }),
      );
      recorder.start();
      const start = performance.now();
      while (performance.now() - start < 1200) {
        c.fillStyle = "#888";
        c.fillRect(0, 0, 512, 512);
        c.drawImage(image, 8 * Math.sin(performance.now() / 200), 0);
        await new Promise((r) => setTimeout(r, 66));
      }
      recorder.stop();
      stream.getTracks().forEach((t) => t.stop());
      return done;
    },
    { portrait },
  );
  const clip = Buffer.from(encoded, "base64");
  await writeFile("artifacts/moving-portrait.webm", clip);
  await page.locator("#preview").check();
  await page.locator("#clip").setInputFiles({
    name: "moving-portrait.webm",
    mimeType: "video/webm",
    buffer: clip,
  });
  await page.waitForFunction(
    () =>
      document.querySelector("#status").textContent.startsWith("Test window"),
    {},
    { timeout: 60000 },
  );
  assert.equal(
    await page.locator("#stage-label").innerText(),
    "LOCAL TEST VIDEO",
  );
  await page.screenshot({ path: "artifacts/local-video.png" });
  checks.push(
    "Local video import, real anime processing, aspect alignment, and looping",
  );
  await page.locator("#stop").click();
  await writeFile(
    "artifacts/flow-tests.json",
    JSON.stringify({ base, checks }, null, 2),
  );
  console.log(checks);
} finally {
  await browser.close();
}
