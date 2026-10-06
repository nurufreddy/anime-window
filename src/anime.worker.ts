import * as ort from "onnxruntime-web/webgpu";
import { fitRect, windowRegion } from "./geometry";
import { toTensor, fromTensor } from "./tensors";
const scope = self as unknown as {
  postMessage: (data: unknown, transfer?: Transferable[]) => void;
  onmessage: ((e: MessageEvent) => void) | null;
};
let session: ort.InferenceSession,
  backend = "wasm";
let size = 256,
  nhwc = false;
const dimensions = () => (nhwc ? [1, size, size, 3] : [1, 3, size, size]);
const canvas = new OffscreenCanvas(size, size),
  ctx = canvas.getContext("2d", { willReadFrequently: true })!;
ort.env.wasm.wasmPaths = "/vendor/ort/";
ort.env.wasm.numThreads = 1;
scope.onmessage = async ({ data }) => {
  try {
    if (data.type === "init") {
      size = [192, 256, 512].includes(data.size) ? data.size : 256;
      nhwc = data.model === "ghibli";
      if (nhwc) size = Math.max(256, size);
      canvas.width = canvas.height = size;
      // Fetch explicitly: a missing model must not become Vite's HTML fallback.
      const response = await fetch(
        nhwc
          ? "/models/ghibli-c1.onnx"
          : size === 512
            ? "/models/animegan.onnx"
            : `/models/animegan-${size}.onnx`,
      );
      if (!response.ok)
        throw new Error("Anime model missing. Run npm run setup.");
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength < 1_000_000)
        throw new Error("Invalid/missing anime model. Run npm run setup.");
      try {
        session = await ort.InferenceSession.create(bytes, {
          executionProviders: ["webgpu"],
        });
        backend = "webgpu";
      } catch {
        session = await ort.InferenceSession.create(bytes, {
          executionProviders: ["wasm"],
        });
      }
      // Warm up: some WebGPU operator failures only appear on first run.
      const warm = new ort.Tensor(
        "float32",
        new Float32Array(3 * size * size),
        dimensions(),
      );
      try {
        const outputs = await session.run({ [session.inputNames[0]]: warm });
        Object.values(outputs).forEach((t) => t.dispose());
      } catch (error) {
        if (backend === "wasm") throw error;
        await session.release();
        session = await ort.InferenceSession.create(bytes, {
          executionProviders: ["wasm"],
        });
        backend = "wasm";
        const outputs = await session.run({ [session.inputNames[0]]: warm });
        Object.values(outputs).forEach((t) => t.dispose());
      }
      warm.dispose();
      scope.postMessage({ type: "ready", backend, size });
    } else {
      const start = performance.now(),
        region = windowRegion(data.quad, data.frame.width, data.frame.height),
        r = fitRect(region.width, region.height, size);
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(
        data.frame,
        region.x,
        region.y,
        region.width,
        region.height,
        r.x,
        r.y,
        r.width,
        r.height,
      );
      const input = new ort.Tensor(
        "float32",
        toTensor(ctx.getImageData(0, 0, size, size).data, nhwc),
        dimensions(),
      );
      const inferenceStart = performance.now();
      const result = await session.run({ [session.inputNames[0]]: input });
      const inferenceMs = performance.now() - inferenceStart;
      const output = result[session.outputNames[0]];
      ctx.putImageData(
        new ImageData(
          fromTensor(output.data as Float32Array, nhwc),
          size,
          size,
        ),
        0,
        0,
      );
      input.dispose();
      Object.values(result).forEach((t) => t.dispose());
      const anime = canvas.transferToImageBitmap();
      scope.postMessage(
        {
          ...data,
          type: "result",
          anime,
          size,
          region,
          inferenceMs,
          ms: performance.now() - start,
        },
        [data.frame, anime],
      );
    }
  } catch (error) {
    data.frame?.close();
    scope.postMessage({ type: "error", message: String(error) });
  }
};
