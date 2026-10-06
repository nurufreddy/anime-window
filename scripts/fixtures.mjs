import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
await mkdir("artifacts", { recursive: true });
for (const fixture of JSON.parse(
  await readFile(new URL("./fixtures.json", import.meta.url)),
)) {
  const hash = (b) => createHash("sha256").update(b).digest("hex"),
    path = `artifacts/${fixture.file}`;
  let bytes = await readFile(path).catch(() => null);
  if (!bytes || hash(bytes) !== fixture.sha256) {
    const response = await fetch(fixture.url);
    if (!response.ok)
      throw Error(`Fixture download failed: ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    if (hash(bytes) !== fixture.sha256)
      throw Error(`Fixture checksum mismatch: ${fixture.file}`);
    await writeFile(path, bytes);
  }
  console.log(`Verified public fixture: ${fixture.file}`);
}
