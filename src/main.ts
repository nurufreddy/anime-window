import "./style.css";
import { Camera } from "./camera";
import { ShapeTracker, type Quad, type Region } from "./geometry";
import { composite } from "./render";
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `<main><header><div class="brand"><span class="logo" aria-hidden="true">◫</span> Anime Window</div><span class="privacy"><span class="dot"></span>On your device. Just for you.</span></header><div class="intro"><div><h1>A little more animated.</h1><p>Make an L with each hand to open the anime window.</p></div><span class="tag">LIVE EXPERIMENT / 01</span></div><section class="stage" aria-label="Mirrored webcam"><canvas id="view" width="640" height="480" hidden></canvas><span class="stage-label" id="stage-label">YOUR WORLD, REIMAGINED</span><div class="empty" id="empty"><div class="window-icon" aria-hidden="true"></div><h2>Another side of you.</h2><p>Your fingertips make the frame.<br>Your camera brings it to life.</p></div><span class="mirror-label">Mirrored view</span></section><div class="controls"><div class="buttons"><button id="start" class="primary">Start Camera</button><button id="stop" disabled>Stop Camera</button></div><span id="status" class="status" role="status" aria-live="polite">Ready when you are. Camera stays off until you start.</span></div><details><summary>Settings & diagnostics</summary><div class="settings"><label>Style <select id="model"><option value="ghibli" selected>Anime · Ghibli v3</option><option value="portrait">Painted portrait · legacy</option></select></label><label>AI detail <select id="quality"><option value="192" disabled>Legacy fast · 192 px</option><option value="256">Faster · 256 px</option><option value="512" selected>Detailed · 512 px</option></select></label><label><input id="debug" type="checkbox">Show fingertip guides</label><label><input id="preview" type="checkbox">Fixed window for model testing</label><label>Test a local video <input id="clip" type="file" accept="video/*"></label></div><pre id="metrics">No active session.</pre><p class="note">Local AI stylization. The entire view waits for matching AI frames while the window is open, so movement stays aligned. Speed and style depend on your device. The fixed test window bypasses hand tracking; turn it off to use your hands. No footage is uploaded or recorded.</p></details><footer><span>ANIME WINDOW</span><span>A small window into another world.</span></footer></main>`;
const el = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const start = el<HTMLButtonElement>("start"),
  stop = el<HTMLButtonElement>("stop"),
  view = el<HTMLCanvasElement>("view"),
  ctx = view.getContext("2d")!,
  debug = el<HTMLInputElement>("debug"),
  preview = el<HTMLInputElement>("preview"),
  clip = el<HTMLInputElement>("clip");
const quality = el<HTMLSelectElement>("quality");
const modelChoice = el<HTMLSelectElement>("model");
const camera = new Camera();
let video = camera.video,
  clipUrl = "";
let generation = 0,
  active = false,
  raf = 0,
  handWorker: Worker | null = null,
  animeWorker: Worker | null = null;
let handsReady = false,
  animeReady = false,
  handBusy = false,
  animeBusy = false,
  lastVideoTime = -1,
  tracker = new ShapeTracker();
let currentQuad: Quad | null = null,
  handCount = 0,
  lastHandAt = 0,
  backend = "loading";
type Pair = {
  frame: ImageBitmap;
  anime: ImageBitmap;
  quad: Quad;
  timestamp: number;
  id: number;
  size: number;
  region: Region;
};
let maskEpoch = 0,
  hadWindow = false,
  loadingAt = 0,
  handStartedAt = 0,
  animeStartedAt = 0;
let pair: Pair | null = null,
  id = 0,
  lastAccepted = 0,
  renderCount = 0,
  trackCount = 0,
  animeCount = 0,
  displayChanges = 0,
  lastDisplayed = -1,
  statAt = 0,
  latency = 0,
  inferenceMs = 0,
  trackMs = 0,
  processingMs = 0;
const fixed: Quad = [
  { x: 0.22, y: 0.16 },
  { x: 0.78, y: 0.16 },
  { x: 0.78, y: 0.86 },
  { x: 0.22, y: 0.86 },
];
function status(text: string, error = false) {
  el("status").textContent = text;
  el("status").classList.toggle("error", error);
}
function releasePair() {
  pair?.frame.close();
  pair?.anime.close();
  pair = null;
}
function end(
  message = "Camera stopped. All processing resources released.",
  error = false,
) {
  generation++;
  active = false;
  cancelAnimationFrame(raf);
  camera.stop();
  video.pause();
  video.removeAttribute("src");
  video.load();
  if (clipUrl) URL.revokeObjectURL(clipUrl);
  clipUrl = "";
  handWorker?.terminate();
  animeWorker?.terminate();
  handWorker = null;
  animeWorker = null;
  releasePair();
  start.disabled = false;
  stop.disabled = true;
  clip.disabled = false;
  quality.disabled = false;
  modelChoice.disabled = false;
  view.hidden = true;
  el("empty").hidden = false;
  el("stage-label").textContent = "YOUR WORLD, REIMAGINED";
  status(message, error);
}
function workerError(kind: string, message: string) {
  end(
    `${kind} failed. ${message} Stop/restart to retry; missing models: run npm run setup.`,
    true,
  );
}
async function begin(file?: File) {
  end();
  const token = ++generation;
  active = true;
  start.disabled = true;
  stop.disabled = false;
  clip.disabled = true;
  quality.disabled = true;
  modelChoice.disabled = true;
  handsReady = animeReady = handBusy = animeBusy = false;
  lastVideoTime = -1;
  tracker = new ShapeTracker();
  currentQuad = null;
  maskEpoch = 0;
  hadWindow = false;
  handCount = 0;
  lastHandAt = 0;
  backend = "loading";
  id =
    lastAccepted =
    renderCount =
    trackCount =
    animeCount =
    displayChanges =
      0;
  lastDisplayed = -1;
  latency = inferenceMs = trackMs = processingMs = 0;
  statAt = performance.now();
  status(file ? "Opening local test video…" : "Waiting for camera permission…");
  try {
    if (file) {
      video = document.createElement("video");
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      clipUrl = URL.createObjectURL(file);
      video.src = clipUrl;
      await video.play();
    } else {
      video = camera.video;
      if (!(await camera.start())) return;
    }
    if (token !== generation) return;
    view.width = video.videoWidth;
    view.height = video.videoHeight;
    view.hidden = false;
    el("empty").hidden = true;
    el("stage-label").textContent = file ? "LOCAL TEST VIDEO" : "LIVE / LOCAL";
    video.onended = () => end("Video ended.");
    if (!file)
      (video.srcObject as MediaStream).getVideoTracks().forEach(
        (t) =>
          (t.onended = () => {
            if (active)
              end(
                "Camera disconnected. Reconnect and press Start Camera.",
                true,
              );
          }),
      );
    status("Loading hand tracking and warming up the anime model…");
    loadingAt = performance.now();
    handWorker = new Worker(new URL("./hands.worker.ts", import.meta.url), {
      type: "module",
    });
    animeWorker = new Worker(new URL("./anime.worker.ts", import.meta.url), {
      type: "module",
    });
    handWorker.onerror = (e) => {
      if (token === generation) workerError("Hand tracking", e.message);
    };
    animeWorker.onerror = (e) => {
      if (token === generation) workerError("Anime inference", e.message);
    };
    handWorker.onmessage = ({ data }) => {
      if (token !== generation) {
        data.frame?.close();
        return;
      }
      if (data.type === "error") {
        workerError("Hand tracking", data.message);
        return;
      }
      if (data.type === "ready") {
        handsReady = true;
        return;
      }
      handBusy = false;
      trackCount++;
      trackMs = data.ms;
      handCount = data.hands.length;
      lastHandAt = performance.now();
      currentQuad = tracker.update(data.hands, data.timestamp);
      const q = preview.checked ? fixed : currentQuad;
      if (animeReady && !animeBusy && q) {
        animeBusy = true;
        animeStartedAt = performance.now();
        animeWorker!.postMessage(
          {
            type: "frame",
            maskEpoch,
            frame: data.frame,
            quad: q,
            timestamp: data.timestamp,
            id: data.id,
          },
          [data.frame],
        );
      } else data.frame.close();
    };
    animeWorker.onmessage = ({ data }) => {
      if (token !== generation) {
        data.frame?.close();
        data.anime?.close();
        return;
      }
      if (data.type === "error") {
        workerError("Anime inference", data.message);
        return;
      }
      if (data.type === "ready") {
        animeReady = true;
        backend = data.backend;
        return;
      }
      animeBusy = false;
      animeCount++;
      inferenceMs = data.inferenceMs;
      processingMs = data.ms;
      latency = performance.now() - data.timestamp;
      if (data.id > lastAccepted && data.maskEpoch === maskEpoch) {
        releasePair();
        pair = data;
        lastAccepted = data.id;
      } else {
        data.frame.close();
        data.anime.close();
      }
    };
    handWorker.postMessage({ type: "init" });
    animeWorker.postMessage({
      type: "init",
      size: Number(quality.value),
      model: modelChoice.value,
    });
    raf = requestAnimationFrame(tick);
  } catch (error) {
    if (token === generation) {
      const name = (error as DOMException).name;
      end(
        name === "NotAllowedError"
          ? "Camera permission denied. Allow camera access in your browser, then press Start Camera."
          : `Unable to start: ${String(error)}`,
        true,
      );
    }
  }
}
function tick(now: number) {
  if (!active) return;
  if (
    ((!handsReady || !animeReady) && now - loadingAt > 60000) ||
    (handBusy && now - handStartedAt > 5000) ||
    (animeBusy && now - animeStartedAt > 15000)
  ) {
    end(
      "Processing timed out. Try Fast detail or restart your browser, then press Start Camera.",
      true,
    );
    return;
  }
  if (video.readyState >= 2) {
    const q = preview.checked
      ? fixed
      : now - lastHandAt < 400
        ? tracker.current(now)
        : null;
    if (hadWindow && !q) {
      maskEpoch++;
      releasePair();
    }
    hadWindow = Boolean(q);
    const aligned = pair && q && now - pair.timestamp < 3000 ? pair : null;
    composite(
      ctx,
      aligned ? aligned.frame : video,
      aligned?.anime ?? null,
      aligned ? aligned.quad : q,
      view.width,
      view.height,
      debug.checked,
      aligned?.size ?? Number(quality.value),
      aligned?.region,
    );
    const displayed = aligned ? aligned.id : video.currentTime;
    if (displayed !== lastDisplayed) {
      displayChanges++;
      lastDisplayed = displayed;
    }
    renderCount++;
    if (handsReady && !handBusy && video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      handBusy = true;
      handStartedAt = now;
      const token = generation,
        captured = performance.now(),
        frameId = ++id;
      createImageBitmap(video)
        .then((frame) => {
          if (token !== generation) {
            frame.close();
            return;
          }
          handWorker!.postMessage(
            { type: "frame", frame, timestamp: captured, id: frameId },
            [frame],
          );
        })
        .catch((error) => {
          if (token === generation) workerError("Frame capture", String(error));
        });
    }
    if (now - statAt >= 1000) {
      const seconds = (now - statAt) / 1000,
        rate = (n: number) => (n / seconds).toFixed(1);
      el("metrics").textContent =
        `Render: ${rate(renderCount)} FPS · Changed display frames: ${rate(displayChanges)}/s\nHands: ${rate(trackCount)} updates/s · ${trackMs.toFixed(0)} ms · ${handCount}/2 detected\nAnime: ${rate(animeCount)} FPS · ${inferenceMs.toFixed(0)} ms inference · ${backend}\nAnime processing: ${processingMs.toFixed(0)} ms · Capture → result: ${latency.toFixed(0)} ms\nDisplayed pair age: ${aligned ? (now - aligned.timestamp).toFixed(0) : "—"} ms · Queued frames: 0 · In flight: ${Number(animeBusy)}\n${preview.checked ? "Fixed test mask (not hand controlled)" : "Live fingertip mask"} · Model: ${modelChoice.value === "ghibli" ? "Ghibli v3" : "Face Portrait v2"}, ${quality.value} × ${quality.value}`;
      renderCount = trackCount = animeCount = displayChanges = 0;
      statAt = now;
      if (!animeReady || !handsReady)
        status("Loading local models and warming up inference…");
      else if (!q)
        status(
          `Ready · ${handCount}/2 hands. Show both thumbs and index fingers.`,
        );
      else if (!aligned)
        status("Hands ready · waiting for a matching anime frame…");
      else
        status(
          `${preview.checked ? "Test window" : "Window open"} · ${backend === "webgpu" ? "GPU" : "CPU"} · ${latency.toFixed(0)} ms processing delay${latency > 300 ? " — slower than real time" : ""}`,
        );
    }
  }
  raf = requestAnimationFrame(tick);
}
start.onclick = () => void begin();
stop.onclick = () => end();
clip.onchange = () => {
  const file = clip.files?.[0];
  if (file) void begin(file);
  clip.value = "";
};
preview.onchange = () => {
  maskEpoch++;
  hadWindow = false;
  releasePair();
};
window.addEventListener("pagehide", () => end());
document.addEventListener("visibilitychange", () => {
  if (document.hidden && active)
    end(
      "Paused to release the camera while this tab is hidden. Press Start Camera to resume.",
    );
});

modelChoice.onchange = () => {
  quality.options[0].disabled = modelChoice.value === "ghibli";
  if (modelChoice.value === "ghibli" && quality.value === "192")
    quality.value = "256";
};
