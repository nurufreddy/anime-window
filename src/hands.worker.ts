import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import type { Hand } from "./geometry";
const scope = self as unknown as {
  postMessage: (data: unknown, transfer?: Transferable[]) => void;
  onmessage: ((e: MessageEvent) => void) | null;
};
// MediaPipe's loader uses this hook in module workers; keep local vendor imports opaque to Vite.
(self as unknown as { import: (url: string) => Promise<unknown> }).import = (
  url,
) => import(/* @vite-ignore */ url);
let model: HandLandmarker;
scope.onmessage = async ({ data }) => {
  try {
    if (data.type === "init") {
      model = await HandLandmarker.createFromOptions(
        await FilesetResolver.forVisionTasks("/vendor/mediapipe", true),
        {
          baseOptions: {
            modelAssetPath: "/models/hand_landmarker.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
        },
      );
      scope.postMessage({ type: "ready" });
    } else {
      const start = performance.now();
      const result = model.detectForVideo(data.frame, data.timestamp);
      const hands: Hand[] = result.landmarks.map((l, i) => ({
        wrist: l[0],
        index: l[8],
        thumb: l[4],
        label: result.handedness[i]?.[0]?.categoryName ?? "",
      }));
      scope.postMessage(
        { ...data, type: "result", hands, ms: performance.now() - start },
        [data.frame],
      );
    }
  } catch (error) {
    data.frame?.close();
    scope.postMessage({ type: "error", message: String(error) });
  }
};
