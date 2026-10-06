import {
  mkdir,
  readFile,
  writeFile,
  copyFile,
  readdir,
} from "node:fs/promises";
import proto from "onnx-proto";
import { createHash } from "node:crypto";
const hash = (b) => createHash("sha256").update(b).digest("hex");
await mkdir("public/models", { recursive: true });
for (const model of JSON.parse(
  await readFile(new URL("./models.json", import.meta.url)),
)) {
  const path = `public/models/${model.file}`;
  let data = await readFile(path).catch(() => null);
  if (!data || hash(data) !== model.sha256) {
    console.log(`Downloading ${model.file}…`);
    const r = await fetch(model.url);
    if (!r.ok) throw Error(`Download failed: ${r.status}`);
    data = Buffer.from(await r.arrayBuffer());
    if (hash(data) !== model.sha256)
      throw Error(`Checksum mismatch: ${model.file}`);
    await writeFile(path, data);
  }
  console.log(`Verified ${model.file}`);
}
for (const [from, to] of [
  ["node_modules/@mediapipe/tasks-vision/wasm", "public/vendor/mediapipe"],
  ["node_modules/onnxruntime-web/dist", "public/vendor/ort"],
]) {
  await mkdir(to, { recursive: true });
  for (const name of await readdir(from))
    if (
      /\.(wasm|mjs|js)$/.test(name) &&
      (!to.endsWith("ort") || name.startsWith("ort-wasm"))
    )
      await copyFile(`${from}/${name}`, `${to}/${name}`);
}
console.log("Local models and runtimes ready.");

// The fully convolutional graph computes Resize shapes from its input. Only
// change shape metadata; preserve every trained weight and graph operation.
const model = proto.onnx.ModelProto.decode(
  await readFile("public/models/animegan.onnx"),
);
for (const size of [192, 256]) {
  for (const v of [...model.graph.input, ...model.graph.output]) {
    v.type.tensorType.shape.dim[2].dimValue = size;
    v.type.tensorType.shape.dim[3].dimValue = size;
  }
  await writeFile(
    `public/models/animegan-${size}.onnx`,
    proto.onnx.ModelProto.encode(model).finish(),
  );
}
