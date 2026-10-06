# Verification report

Core tests ran October 5, 2026; the fallback check was completed October 6, 2026. Hardware inspected locally: Apple M3 MacBook Pro, 8 CPU cores, 8 GB memory, macOS 26.6.2, arm64. Node 24.20.0. Automated browser: installed Chrome 154.0.8037.97 in headless mode. WebGPU reported Apple / metal-3 / non-fallback adapter. Tests explicitly enabled WebGPU; regular Chrome must expose a usable GPU adapter or the application falls back to WASM.

## October 6 model replacement

The default changed to **AnimeGANv3 Ghibli-c1, 512 px**. The previous metrics below remain a clearly labeled historical v2 baseline. A same-input close-up comparison used a crop from the public NASA astronaut fixture, the same browser worker, and three inference frames per case:

| Model              | 256 px inference | 512 px inference |
| ------------------ | ---------------- | ---------------- |
| Legacy v2 portrait | 212–259 ms       | 786–896 ms       |
| New v3 Ghibli-c1   | 89–120 ms        | 352–397 ms       |

Both used Apple WebGPU. The v2 timings differ from the earlier run; these are short measurements under the current machine load, not universal benchmarks. The images were visually inspected: v3 has cleaner outlines and more legible facial features. The 256-pixel output still showed facial distortion; 512 is the quality-first default. Evidence: `artifacts/model-comparison.json` and `artifacts/compare-{portrait,ghibli}-{256,512}.png`. These static close-ups do not verify blinking, expression fidelity or temporal consistency.

The new default was subsequently verified in the application: **3.0–3.9 anime FPS** at 512 px, 235–261 ms inference, 258–288 ms capture-to-result, about 29–30 hand updates/s, and 60 render callbacks/s. These five short fake-camera samples use the window crop and differ from the model-only close-up comparison. All eleven browser checks, the moving-hand/removal/reacquisition flow, and local-video import passed with v3. The 256-pixel CPU fallback also produced a real frame: about 498 ms inference / 522 ms capture-to-result (single observed result, not sustained FPS). `browser-tests.json`, `flow-tests.json`, `local-video.png`, and `fallback.txt` now describe the **new default**, replacing earlier generated baseline artifacts. The earlier production-flow run below was on v2; the new v3 production bundle passes the build check and its live flows were verified on the development server.

## Original v2 measured performance

These are short development measurements, not a sustained thermal benchmark or a promise for other machines. Warm-up is excluded from model timings.

| Test                                                                     | Observed result                                                                    |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 192×192 model, 6 translated public-portrait frames                       | 74–80 ms inference per frame; 77–305 ms request-to-result (one scheduling outlier) |
| 256×256 model, 6 translated public-portrait frames                       | 133–143 ms inference; 135–148 ms request-to-result                                 |
| 512×512 model, 6 translated public-portrait frames                       | 538–565 ms inference; 545–585 ms request-to-result                                 |
| Integrated 256 mode, fake webcam, fixed test mask, five 1-second samples | 5.9–6.9 anime FPS; 60 render FPS; 5.9–6.9 changed display frames/s                 |
| Hand tracking during integrated 256 test                                 | 29.5–30.5 updates/s; about 18 ms per detection on the no-hand fake-camera scene    |
| Integrated capture-to-result delay                                       | 154–159 ms; displayed matched-frame age sampled at 166–316 ms                      |
| Queue behavior                                                           | Zero queued frames, at most one job per worker; busy inputs skipped                |

Do not interpret 60 render callbacks/s as 60 anime images/s. The smooth ~30 anime FPS goal is **not achieved**. The whole view intentionally updates at the anime completion rate while a window is active, so the original and stylized images remain matched. Without a window, the camera is displayed normally. True glass-to-glass latency has not been measured; sensor buffering and display scanout are outside these counters.

The model-only resolution test uses a public astronaut image with a small synthetic translation, without tracking or window cropping. The integrated test includes tracking, window-region cropping, inference and rendering on a fake camera. These are different conditions. Real hand detection and a looping portrait video were separately tested end to end, but those runs are not sustained performance benchmarks.

CPU fallback was additionally verified October 6 in Chrome with the WebGPU API hidden only in the test worker. The real WASM model produced a 192×192 result at about 725 ms inference / 748 ms capture-to-result. This is a single observed result, not a steady-state FPS benchmark. The original Chrome disable flag was ignored; the capability-only test override is used instead. The development HMR websocket logged a connection error during this instrumented test; this did not prevent model output and is separate from the clean normal-browser checks below.

## Verified

- TypeScript and Vite production build pass.
- Nine focused tests pass (including the added v3 NHWC channel-order test): detector-order stability, smoothing, tracking-loss expiry/reacquisition, bow-tie and degenerate geometry, mirror/letterbox coordinates, tensor channel/normalization conversion, invalid-landmark recovery, crop coverage/bounds.
- Eleven browser checks pass: permission-on-click, repeated real neural inference, no-hand state, track cleanup, stop during startup, crossed-mask pixel checks, crop-to-source pixel alignment, missing-model failure, permission denial, narrow-screen layout and no uncaught JavaScript errors.
- Real MediaPipe detects **two** hands in Google's public test image. The sample contains two images of a right hand, so this also exercises repeated handedness labels; it is not evidence of actual left/right-hand performance on the user's webcam.
- End-to-end moving-hand fixture passes: actual detector → fingertips → crossed mask → actual AnimeGAN → composite. Removing the hands hides the effect; reintroducing them recovers tracking.
- The real local-file input accepts a looping WebM generated from a translated public portrait, runs AI inference, and displays its fixed test window.
- Automatic CPU/WASM fallback produces real model output when WebGPU is unavailable.
- The full hand/video flow passes against both the development server and the packaged production build at localhost:4173.
- Screenshots were visually inspected: desktop and narrow layout, crossed fingertip guides, transformed public portrait, and local-video composite. Pixel tests additionally establish unchanged exterior pixels and consistent mirroring.

Generated evidence is in ignored `artifacts/`: `browser-tests.json`, `flow-tests.json`, `probe.json`, `initial.png`, `running.png`, `mobile.png`, `two-hands.png`, `local-video.png`, and `anime-portrait-{192,256,512}.png`. Reproduce it with the commands in README. Test scripts record only their generated public-image fixtures; the application itself does not record footage.

## Limitations and live acceptance checks

No physical webcam was accessed. The reference video was absent. The synthetic portrait translation establishes processing of changing input, **not** preservation of biological motion. A physical-camera session must still check:

1. Both real hands in upright L shapes, then rotation, expansion, pinching, and crossing.
2. Fast wrist movement and partial occlusion; hands crossing at the wrists can defeat nearest-position association.
3. Blink, open/closed mouth, smile, head yaw and pitch; compare 256 and 512 detail. Low-resolution faces can lose eyes and mouth detail, as seen in the public portrait test.
4. Flicker when the crop changes or the face moves. This model has no temporal loss or optical-flow consistency mechanism.
5. Natural-looking contrast between original and stylized content. The legacy model's output is painterly; the new default is illustrated/cartoon-like and is not a verified match for the requested reference.
6. Sustained use and device temperature. Real-camera exposure, image quality, battery mode, GPU availability, and other applications may affect performance.

The static-photo-derived hand sequence does not demonstrate every human gesture. MediaPipe confidence thresholds, hand-loss timing and resource cleanup are implemented, but real tracking quality remains scene-dependent. Other browser engines and phone cameras have not been validated.
