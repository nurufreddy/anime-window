import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
  ],
});
try {
  const page = await browser.newPage();
  page.on("console", (m) => console.log(m.type(), m.text().slice(0, 400)));
  page.on("pageerror", (e) => console.log(String(e)));
  // Alter only the browser capability in the test worker, not inference.
  // A Blob wrapper with top-level dynamic import loses early worker messages.
  await page.route(/\/src\/anime\.worker\.ts(?:\?.*)?$/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body:
        'Object.defineProperty(navigator, "gpu", {value: undefined});\n' +
        (await response.text()),
    });
  });
  await page.goto("http://127.0.0.1:5173");
  await page.getByText("Settings & diagnostics").click();
  await page.locator("#quality").selectOption("256");
  await page.locator("#preview").check();
  await page.locator("#start").click();
  await page.waitForFunction(
    () =>
      document.querySelector("#status").textContent.includes("Test window") ||
      document.querySelector("#status").classList.contains("error"),
    {},
    { timeout: 60000 },
  );
  console.log(await page.locator("#status").innerText());
  const metrics = await page.locator("#metrics").innerText();
  console.log(metrics);
  if (!metrics.includes("wasm"))
    throw new Error("CPU fallback did not produce a frame");
  await writeFile("artifacts/fallback.txt", metrics);
  await page.locator("#stop").click();
} finally {
  await browser.close();
}
