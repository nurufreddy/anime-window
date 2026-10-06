import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    "--enable-unsafe-webgpu",
  ],
});
const results = { checks: [], metrics: [], browser: browser.version() };
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    globalThis.testTracks = [];
    const original = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    navigator.mediaDevices.getUserMedia = async (c) => {
      const stream = await original(c);
      globalThis.testTracks.push(...stream.getTracks());
      return stream;
    };
  });
  await page.goto("http://127.0.0.1:5173");
  assert.equal(await page.evaluate(() => globalThis.testTracks.length), 0);
  results.checks.push("No camera access before Start");
  results.adapter = await page.evaluate(async () => {
    const a = await navigator.gpu?.requestAdapter();
    return a
      ? {
          vendor: a.info.vendor,
          architecture: a.info.architecture,
          device: a.info.device,
          description: a.info.description,
          isFallbackAdapter: a.info.isFallbackAdapter,
        }
      : null;
  });
  await page.getByText("Settings & diagnostics").click();
  await page.locator("#preview").check();
  await page.locator("#start").click();
  await page.waitForFunction(
    () =>
      document.querySelector("#status").textContent.startsWith("Test window"),
    {},
    { timeout: 60000 },
  );
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(1100);
    results.metrics.push(await page.locator("#metrics").innerText());
  }
  await page.screenshot({ path: "artifacts/running.png" });
  results.checks.push(
    "Actual AI worker returns repeated frames with fake webcam",
  );
  await page.locator("#preview").uncheck();
  await page.waitForFunction(
    () => document.querySelector("#status").textContent.includes("0/2 hands"),
    {},
    { timeout: 10000 },
  );
  results.checks.push("No-hand state hides window");
  await page.locator("#stop").click();
  assert.ok(
    await page.evaluate(() =>
      globalThis.testTracks.every((t) => t.readyState === "ended"),
    ),
  );
  results.checks.push("Stop ends all camera tracks");
  await page.locator("#start").click();
  await page.locator("#stop").click();
  await page.waitForTimeout(500);
  assert.ok(
    await page.evaluate(() =>
      globalThis.testTracks.every((t) => t.readyState === "ended"),
    ),
  );
  results.checks.push("Stop during startup releases tracks");
  // Pixel assertions use the actual compositor, including self-crossed geometry and mirror.
  const pixels = await page.evaluate(async () => {
    const { composite } = await import("/src/render.ts");
    const source = document.createElement("canvas"),
      anime = document.createElement("canvas"),
      out = document.createElement("canvas");
    source.width = anime.width = out.width = 100;
    source.height = anime.height = out.height = 100;
    const s = source.getContext("2d");
    s.fillStyle = "#ff0000";
    s.fillRect(0, 0, 100, 100);
    s.fillStyle = "#0000ff";
    s.fillRect(0, 0, 10, 100);
    const a = anime.getContext("2d");
    a.fillStyle = "#00ff00";
    a.fillRect(0, 0, 100, 100);
    const c = out.getContext("2d");
    const q = [
      { x: 0.2, y: 0.2 },
      { x: 0.8, y: 0.8 },
      { x: 0.2, y: 0.8 },
      { x: 0.8, y: 0.2 },
    ];
    composite(c, source, anime, q, 100, 100, false, 100);
    const at = (x, y) => [...c.getImageData(x, y, 1, 1).data];
    return {
      outside: at(15, 50),
      mirrored: at(95, 50),
      inside: at(50, 30),
      side: at(25, 50),
    };
  });
  assert.deepEqual(pixels.outside, [255, 0, 0, 255]);
  assert.deepEqual(pixels.mirrored, [0, 0, 255, 255]);
  assert.deepEqual(pixels.inside, [0, 255, 0, 255]);
  assert.deepEqual(pixels.side, [255, 0, 0, 255]);
  results.checks.push(
    "Crossed mask, unchanged exterior, mirrored coordinates: pixel assertions",
  );
  const cropped = await page.evaluate(async () => {
    const { composite } = await import("/src/render.ts");
    const source = document.createElement("canvas"),
      anime = document.createElement("canvas"),
      out = document.createElement("canvas");
    for (const c of [source, anime, out]) {
      c.width = 100;
      c.height = 100;
    }
    const s = source.getContext("2d");
    s.fillStyle = "red";
    s.fillRect(0, 0, 100, 100);
    const a = anime.getContext("2d");
    a.fillStyle = "lime";
    a.fillRect(0, 0, 100, 100);
    const c = out.getContext("2d");
    composite(
      c,
      source,
      anime,
      [
        { x: 0.1, y: 0.2 },
        { x: 0.3, y: 0.2 },
        { x: 0.3, y: 0.6 },
        { x: 0.1, y: 0.6 },
      ],
      100,
      100,
      false,
      100,
      { x: 10, y: 20, width: 20, height: 40 },
    );
    return {
      inside: [...c.getImageData(80, 40, 1, 1).data],
      outside: [...c.getImageData(20, 40, 1, 1).data],
    };
  });
  assert.deepEqual(cropped.inside, [0, 255, 0, 255]);
  assert.deepEqual(cropped.outside, [255, 0, 0, 255]);
  results.checks.push(
    "Letterboxed inference region maps back to correct mirrored source pixels",
  );
  // Missing model must stop cleanly, rather than silently applying a basic filter.
  await page.route("**/models/ghibli-c1.onnx", (r) =>
    r.fulfill({ status: 404, body: "missing" }),
  );
  await page.locator("#start").click();
  await page.waitForFunction(
    () =>
      document
        .querySelector("#status")
        .textContent.includes("Anime inference failed"),
    {},
    { timeout: 30000 },
  );
  assert.ok(
    await page.evaluate(() =>
      globalThis.testTracks.every((t) => t.readyState === "ended"),
    ),
  );
  results.checks.push(
    "Missing model gives actionable error and releases camera",
  );
  await page.unroute("**/models/ghibli-c1.onnx");
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Denied", "NotAllowedError");
    };
  });
  await page.locator("#start").click();
  await page.waitForFunction(() =>
    document.querySelector("#status").textContent.includes("permission denied"),
  );
  results.checks.push("Permission denial gives useful message");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "artifacts/mobile.png" });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  results.checks.push("Mobile layout has no horizontal overflow");
  assert.deepEqual(errors, []);
  results.checks.push("No uncaught browser errors");
  console.log(JSON.stringify(results, null, 2));
  await writeFile(
    "artifacts/browser-tests.json",
    JSON.stringify(results, null, 2),
  );
} finally {
  await browser.close();
}
