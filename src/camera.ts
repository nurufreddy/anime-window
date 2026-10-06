export class Camera {
  readonly video = document.createElement("video");
  private stream: MediaStream | null = null;
  private generation = 0;
  constructor() {
    this.video.muted = true;
    this.video.playsInline = true;
  }
  async start() {
    const id = ++this.generation;
    if (!navigator.mediaDevices?.getUserMedia)
      throw new Error(
        "Camera requires localhost or HTTPS and a browser with webcam support.",
      );
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30 },
      },
    });
    if (id !== this.generation) {
      stream.getTracks().forEach((t) => t.stop());
      return false;
    }
    this.stream = stream;
    this.video.srcObject = stream;
    await this.video.play();
    return id === this.generation;
  }
  stop() {
    this.generation++;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video.pause();
    this.video.srcObject = null;
  }
}
