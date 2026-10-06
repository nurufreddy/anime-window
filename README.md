# Anime Window

A local webcam experiment: two index fingertips and two thumb tips control a window containing **real AnimeGANv3 Ghibli neural stylization**. Everything outside the window remains the matching original camera frame. No backend, account, API key, uploads, or recording.

## Start on your Mac

Use Node.js 22.12+ (tested with Node 24). In Terminal:

```sh
cd /Users/nurufreddy/Documents/KSU/Projects/anime-window
npm ci
npm run setup
npm run dev
```

Open **http://127.0.0.1:5173**, press **Start Camera**, and allow camera access. Make an inward-facing L with each hand. Good lighting and visible wrists help. **Stop Camera** releases the camera and both processing workers. Switching away from the tab also stops the session.

`setup` downloads checksum-verified public models and copies the installed WebAssembly runtimes locally. Internet is needed for installation, not for processing. Run setup again if a model is missing. No `.env` file is needed. Use Chrome for the tested WebGPU path; browsers without compatible WebGPU fall back to slower local CPU/WASM inference. Other browsers have not been verified.

Settings are optional: fingertip guides, style and inference detail (256/512; 192 for legacy), a clearly labeled fixed test window, and a local video file input. Change detail while stopped. The fixed window bypasses hand control for checking stylization. Imported videos stay on your device and are not saved by the application.

## Updated model (October 6)

The default is now **AnimeGANv3 Ghibli-c1 at 512 px**, replacing the painted-portrait v2 model after the original result was rejected. On the same close-up public portrait, the new model produced cleaner contours, flatter shading, and more legible facial features. It took 352–397 ms per 512-pixel inference in that comparison (three frames, Apple WebGPU); this is not a 30 FPS claim. The integrated 512-pixel application test measured about **3–4 anime FPS**, not 30. Choose **Faster · 256 px** for speed; that comparison measured 89–120 ms but showed more facial distortion.

The Style control retains the old model as **Painted portrait · legacy** for comparison. The 192-pixel mode is only available for that legacy model. Both model downloads are local, checksum verified, and covered by the model/license notes.

## What it does, and what it does not prove

The integrated model transforms each incoming frame, including face, hair, clothing, and surroundings; it is not an edge filter or a static portrait. The new default has an illustrated/cartoon look; similarity to a particular anime or the missing reference is not guaranteed. The portrait-trained network can lose detail in backgrounds and small faces. Smaller input sizes improve speed at the cost of detail. It has no temporal training or optical-flow stabilization, so flicker and expression distortions remain possible.

The requested reference video was **not attached**; only its written description was available. Exact style similarity, blinking, mouth motion, head turns, and the intended fingertip ordering still need a real-camera/reference comparison. Automated testing uses public test images, a moving portrait fixture, and a fake camera, not your physical webcam. See [verification and measured performance](docs/VERIFICATION.md).

## Pipeline

- `src/camera.ts`: permission-on-click capture and cancellation-safe track cleanup.
- `src/hands.worker.ts`: local MediaPipe Hand Landmarker, two hands, landmark 8 (index) and 4 (thumb), with CPU detection off the UI thread.
- `src/geometry.ts`: nearest-wrist plus handedness association, 28 ms exponential smoothing, normalized coordinates, 160 ms tracking-loss grace. Connection order is hand A index → hand B index → hand B thumb → hand A thumb. Initial A is the leftmost wrist in the unmirrored input. This order is an explicit interpretation of the brief, not a verified observation of the absent reference.
- `src/anime.worker.ts`: replaceable ONNX processor supporting AnimeGANv3 Ghibli and the legacy AnimeGANv2 Face Portrait model. Prefers WebGPU, warms up the real model, falls back to WASM if GPU initialization/run fails. RGB inputs in [-1,1], NHWC layout for v3 and NCHW for legacy v2. A padded bounding box around the fingertip window is cropped from the same captured frame, then letterboxed without stretching. Output is unletterboxed and placed back into those exact source coordinates. This spends model resolution on the visible region rather than distant background. Changing the window can change model context and produce flicker.
- `src/render.ts`: same-frame original + anime + mask, Canvas even-odd clipping for crossed polygons, one shared mirror transform. Thin/degenerate windows hide. Display resizing uses contain-fit so coordinates stay aligned.
- `src/main.ts`: session lifecycle, worker scheduling, UI and performance counters.

**Deliberate timing tradeoff:** when the effect is visible, the entire view displays the camera snapshot belonging to the finished anime result and its fingertip mask. It holds this matched trio until the next one arrives. This introduces whole-view delay, but never pastes an old anime face over a newer original. Hand tracking runs independently on recent input and hides the effect after loss. With no window, ordinary camera display continues. Results older than three seconds are not displayed.

Each worker has at most one frame in flight and **zero queued frames**. Busy workers cause incoming opportunities to be skipped. Frame IDs, mask epochs, and session generations reject old results; disappearing hands invalidate pending masks. Worker timeouts release the session with a retry message; stopping terminates workers and closes retained bitmaps. This bounds memory and prevents a growing processing backlog.

Diagnostics distinguish render callbacks, changed displayed frames, hand updates, anime results, inference time, processing time, capture-to-result latency, and displayed frame age. Capture timing begins when a decoded browser frame is sampled; it excludes sensor exposure, camera-driver buffering, and screen scanout. High render FPS does **not** mean high anime FPS.

## Reproduce checks

```sh
npm test                  # geometry, timing of loss, mapping, tensors
npm run build             # TypeScript + production bundle
# Keep npm run dev running in a second terminal:
npm run test:browser      # installed Google Chrome, fake camera, no physical camera access
npm run test:fixtures     # public test images, downloaded locally
npm run test:models       # legacy v2 baseline and two-hand model test
npm run test:comparison   # same close-up portrait through v2 and v3
npm run test:flow         # real hand/video pipeline with public synthetic footage
npm run test:fallback     # real WASM model with WebGPU hidden by the test
```

Browser tests require Google Chrome installed. Generated screenshots, images, and JSON reports go in ignored `artifacts/`. `npm run preview` serves the production build at the URL it prints. For deployment use HTTPS and serve the isolation headers in `vite.config.ts`; the development and preview servers already do this. There is no deployment or remote inference configured.

## Models and licenses

See [model selection and license notes](docs/MODELS.md). `scripts/models.json` records pinned URLs and SHA-256 hashes. `setup` derives legacy v2 192/256 variants by changing only input/output shape metadata of the fully convolutional graph; weights and operations remain identical. Native and browser inference verify the output sizes. No model training is performed.

The Ghibli model accepts dynamic spatial dimensions directly; its trained weights and graph are used unchanged.
