import type { DepthSampler } from "../animation/DepthEstimator";

const MAX_RESOLUTION = 256;
const INTERVAL_MS = 150;

export class DepthModelEstimator implements DepthSampler {
  private worker: Worker;
  private ready = false;
  private error?: string;
  private backend = "loading...";
  private progress = 0;

  private width = 0;
  private height = 0;
  private depth: Float32Array | null = null;
  private lastRunAt = 0;
  private running = false;
  private video?: HTMLVideoElement;
  private canvas = document.createElement("canvas");
  private ctx = this.canvas.getContext("2d");

  constructor() {
    this.worker = new Worker(new URL("./depth.worker.ts", import.meta.url), {
      type: "module",
    });

    this.worker.onmessage = (event: MessageEvent) => {
      const { type, payload } = event.data;

      if (type === "ready") {
        this.ready = true;
        this.backend = payload?.backend ?? "unknown";
      } else if (type === "progress") {
        this.progress = payload?.progress ?? 0;
        this.backend = payload?.backend ?? this.backend;
      } else if (type === "result") {
        this.running = false;
        this.width = payload?.width ?? 0;
        this.height = payload?.height ?? 0;
        this.depth = payload?.data ?? null;
      } else if (type === "error") {
        this.running = false;
        this.error = payload?.message ?? "Unknown worker error";
        console.error("Depth worker error:", this.error);
      }
    };

    this.worker.postMessage({ type: "init" });
  }

  public initialize(video: HTMLVideoElement): void {
    this.video = video;
  }

  public get isReady(): boolean {
    return this.ready;
  }

  public get backendLabel(): string {
    return this.error ? "error" : this.ready ? this.backend : `loading ${Math.round(this.progress * 100)}%`;
  }

  public get label(): string {
    return `AI depth: ${this.backendLabel}`;
  }

  public get hasError(): boolean {
    return !!this.error;
  }

  public update(): void {
    if (!this.ready || !this.video || this.error || this.running) return;

    const now = performance.now();

    if (now - this.lastRunAt < INTERVAL_MS) return;

    this.lastRunAt = now;
    this.running = true;

    const vw = this.video.videoWidth;
    const vh = this.video.videoHeight;

    if (vw === 0 || vh === 0 || !this.ctx) return;

    const scale = Math.min(1, MAX_RESOLUTION / Math.max(vw, vh));
    const outW = Math.max(1, Math.round(vw * scale));
    const outH = Math.max(1, Math.round(vh * scale));

    if (this.canvas.width !== outW) this.canvas.width = outW;
    if (this.canvas.height !== outH) this.canvas.height = outH;

    this.ctx.drawImage(this.video, 0, 0, outW, outH);

    const imageData = this.ctx.getImageData(0, 0, outW, outH);

    this.worker.postMessage({ type: "run", payload: { imageData } }, [imageData.data.buffer]);
  }

  public getDepthMap(): { width: number; height: number; data: Float32Array } | null {
    if (!this.depth || this.width === 0 || this.height === 0) return null;

    return { width: this.width, height: this.height, data: this.depth };
  }

  public sample(normalizedX: number, normalizedY: number): number | undefined {
    if (!this.depth || this.width === 0 || this.height === 0) return undefined;

    const cx = normalizedX * (this.width - 1);
    const cy = normalizedY * (this.height - 1);

    if (cx < 0 || cy < 0 || cx >= this.width || cy >= this.height) return undefined;

    const radius = 2;
    let sum = 0;
    let count = 0;

    for (let dy = -radius; dy <= radius; dy++) {
      const y = Math.round(cy) + dy;

      if (y < 0 || y >= this.height) continue;

      for (let dx = -radius; dx <= radius; dx++) {
        const x = Math.round(cx) + dx;

        if (x < 0 || x >= this.width) continue;

        const v = this.depth[y * this.width + x];

        if (Number.isFinite(v)) {
          sum += v;
          count++;
        }
      }
    }

    return count > 0 ? sum / count : undefined;
  }

  public dispose(): void {
    this.worker.terminate();
  }
}
