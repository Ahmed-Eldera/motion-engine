import type { DepthEstimate, DepthMap } from "../animation/DepthEstimator";
import { isFiniteVec } from "../animation/sanitize";

const NEAR_COLOR: [number, number, number] = [255, 50, 50];
const FAR_COLOR: [number, number, number] = [50, 90, 255];

interface DepthRange {
  min: number;
  max: number;
}

export class DepthVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private heatCanvas: HTMLCanvasElement | null = null;
  private heatCtx: CanvasRenderingContext2D | null = null;

  constructor() {
    this.canvas = document.createElement("canvas");

    this.canvas.width = 1280;
    this.canvas.height = 720;

    this.canvas.style.position = "fixed";
    this.canvas.style.bottom = "10px";
    this.canvas.style.left = "10px";
    this.canvas.style.width = "320px";
    this.canvas.style.height = "180px";
    this.canvas.style.zIndex = "1001";
    this.canvas.style.border = "5px solid cyan";

    document.body.appendChild(this.canvas);

    const ctx = this.canvas.getContext("2d");

    if (!ctx) throw new Error("Couldn't create depth canvas");

    this.ctx = ctx;
  }

  public draw(estimate: DepthEstimate, depthMap?: DepthMap | null): void {
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.fillStyle = "rgba(10, 10, 15, 0.9)";
    this.ctx.fillRect(0, 0, w, h);

    if (depthMap && depthMap.width > 0 && depthMap.height > 0 && depthMap.data) {
      const range = this.computeRange(depthMap);
      this.renderHeatMap(depthMap, range, w, h);
      this.overlayArms(estimate, depthMap, range, w, h);
      this.drawLegend(w, h);
    } else {
      this.drawPlaceholder(estimate, w, h);
    }
  }

  private computeRange(depthMap: DepthMap): DepthRange {
    const data = depthMap.data;

    let min = Infinity;
    let max = -Infinity;

    for (let i = 0; i < data.length; i++) {
      const v = data[i];

      if (Number.isFinite(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }

    if (!Number.isFinite(min) || !Number.isFinite(max) || max - min < 1e-9) {
      min = 0;
      max = 1;
    }

    return { min, max };
  }

  private renderHeatMap(depthMap: DepthMap, range: DepthRange, w: number, h: number): void {
    const dw = depthMap.width;
    const dh = depthMap.height;
    const data = depthMap.data;
    const span = range.max - range.min;

    if (!this.heatCanvas || this.heatCanvas.width !== dw || this.heatCanvas.height !== dh) {
      this.heatCanvas = document.createElement("canvas");
      this.heatCanvas.width = dw;
      this.heatCanvas.height = dh;
      this.heatCtx = this.heatCanvas.getContext("2d");
    }

    if (!this.heatCtx) return;

    const img = this.heatCtx.createImageData(dw, dh);
    const px = img.data;

    for (let i = 0; i < data.length; i++) {
      const v = data[i];
      const t = Number.isFinite(v) ? Math.min(1, Math.max(0, (v - range.min) / span)) : 0.5;
      const o = i * 4;

      px[o] = FAR_COLOR[0] + (NEAR_COLOR[0] - FAR_COLOR[0]) * t;
      px[o + 1] = FAR_COLOR[1] + (NEAR_COLOR[1] - FAR_COLOR[1]) * t;
      px[o + 2] = FAR_COLOR[2] + (NEAR_COLOR[2] - FAR_COLOR[2]) * t;
      px[o + 3] = 255;
    }

    this.heatCtx.putImageData(img, 0, 0);

    this.ctx.save();
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.translate(w, 0);
    this.ctx.scale(-1, 1);
    this.ctx.drawImage(this.heatCanvas, 0, 0, w, h);
    this.ctx.restore();
  }

  private overlayArms(estimate: DepthEstimate, depthMap: DepthMap, range: DepthRange, w: number, h: number): void {
    const dw = depthMap.width;
    const dh = depthMap.height;
    const span = range.max - range.min;

    const depthAt = (x: number, y: number): number | undefined => {
      const px = Math.round(x * (dw - 1));
      const py = Math.round(y * (dh - 1));

      if (px < 0 || py < 0 || px >= dw || py >= dh) return undefined;

      return depthMap.data[py * dw + px];
    };

    for (const arm of [estimate.left, estimate.right]) {
      const pts = [arm.shoulder, arm.elbow, arm.wrist];

      for (const p of pts) {
        if (!isFiniteVec(p.x, p.y, p.z)) continue;

        const sx = (1 - p.x) * w;
        const sy = p.y * h;
        const v = depthAt(p.x, p.y);
        const t = typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, (v - range.min) / span)) : 0.5;

        this.ctx.fillStyle = this.depthColor(t);
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = "rgba(255,255,255,0.9)";
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    }
  }

  private drawLegend(w: number, h: number): void {
    const y = h - 28;
    const barW = w - 120;
    const barX = 20;

    const grad = this.ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, `rgb(${FAR_COLOR[0]},${FAR_COLOR[1]},${FAR_COLOR[2]})`);
    grad.addColorStop(1, `rgb(${NEAR_COLOR[0]},${NEAR_COLOR[1]},${NEAR_COLOR[2]})`);

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(barX, y, barW, 12);

    this.ctx.strokeStyle = "rgba(255,255,255,0.6)";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX, y, barW, 12);

    this.ctx.font = "22px monospace";
    this.ctx.fillStyle = "rgba(255,255,255,0.85)";
    this.ctx.textAlign = "left";
    this.ctx.fillText("far", barX, y - 6);
    this.ctx.textAlign = "right";
    this.ctx.fillText("near", barX + barW, y - 6);
  }

  private drawPlaceholder(estimate: DepthEstimate, w: number, h: number): void {
    this.ctx.font = "28px monospace";
    this.ctx.textAlign = "center";

    if (estimate.aiStatus) {
      this.ctx.fillStyle = "rgba(0, 255, 200, 0.9)";
      this.ctx.fillText(estimate.aiStatus, w / 2, h / 2 - 10);
    } else {
      this.ctx.fillStyle = "rgba(255,255,255,0.9)";
      this.ctx.fillText("Depth heat map", w / 2, h / 2 - 20);
      this.ctx.font = "22px monospace";
      this.ctx.fillStyle = "rgba(255,255,255,0.7)";
      this.ctx.fillText("waiting for depth model", w / 2, h / 2 + 20);
    }
  }

  private depthColor(value: number): string {
    const t = Math.min(1, Math.max(0, value));

    const r = Math.round(FAR_COLOR[0] + (NEAR_COLOR[0] - FAR_COLOR[0]) * t);
    const g = Math.round(FAR_COLOR[1] + (NEAR_COLOR[1] - FAR_COLOR[1]) * t);
    const b = Math.round(FAR_COLOR[2] + (NEAR_COLOR[2] - FAR_COLOR[2]) * t);

    return `rgb(${r},${g},${b})`;
  }
}
