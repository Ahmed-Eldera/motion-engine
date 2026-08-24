import * as THREE from "three";
import { Renderer } from "../rendering/Renderer";
import { MainScene } from "../scene/MainScene";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Camera } from "../camera/Camera";
import { SkeletonRetargeter } from "../animation/SkeletonRetargeter";
import { MediaPipePoseTracker } from "../animation/MediaPipePoseTracker";
import { ArmCalibrator } from "../animation/ArmCalibrator";

export class Engine {
  private renderer: Renderer;
  private camera: THREE.PerspectiveCamera;
  private scene: MainScene;
  private controls: OrbitControls;
  private calibrator = new ArmCalibrator();
  private webcam: Camera;
  private tracker!: MediaPipePoseTracker;
  private retargeter: SkeletonRetargeter;

  constructor() {
    this.renderer = new Renderer();

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);

    this.scene = new MainScene();

    this.controls = new OrbitControls(
      this.camera,
      this.renderer.getDomElement(),
    );

    this.controls.target.set(0, 1, 0);
    this.controls.enableDamping = true;

    this.webcam = Camera.getInstance();
    this.retargeter = new SkeletonRetargeter();
  }

  public async start(): Promise<void> {
    try {
      this.setLoading("Initializing 3D scene...");
      await this.nextFrame();

      this.setLoading("Loading video feed...");
      await this.webcam.start();

      this.tracker = new MediaPipePoseTracker(this.webcam.getVideo());
      this.setLoading("Loading pose model...");
      await this.tracker.initialize();

      this.setLoading("Starting motion capture...");
      await this.nextFrame();

      console.log("aho");
      this.calibrator.start();
      document.getElementById("calibrate-btn")?.addEventListener("click", () => {
        this.startCalibrationCountdown();
      });
      let lastUpdate = 0;
      let firstFrame = true;

      window.addEventListener("error", (event) => {
        console.error("Uncaught error:", event.error);
      });

      const animate = () => {
        const now = performance.now();

        if (firstFrame) {
          firstFrame = false;
          this.hideLoading();
        }

        if (now - lastUpdate > 2) {
        lastUpdate = now;

        try {
          const pose = this.tracker.update();

          if (pose) {
            this.calibrator.update(pose);

            if (this.calibrator.isCalibrated()) {
              this.retargeter.applyPose(pose, this.scene.getFigure(), this.calibrator);
            }
          }
        } catch (error) {
          console.error("Pose update failed:", error);
        }
      }

      try {
        this.controls.update();
        this.renderer.render(this.scene.getScene(), this.camera);
      } catch (error) {
        console.error("Render failed:", error);
      }

      requestAnimationFrame(animate);
    };

    animate();
    } catch (error) {
      console.error("Failed to start engine:", error);
      this.showLoadingError(error);
    }
  }

  private setLoading(message: string): void {
    const el = document.getElementById("loading-message");
    if (el) el.textContent = message;
  }

  private hideLoading(): void {
    const el = document.getElementById("loading-screen");
    if (el) el.classList.add("hidden");
  }

  private showLoadingError(error: unknown): void {
    const el = document.getElementById("loading-message");
    if (!el) return;

    el.textContent = `Failed to start: ${(error as Error)?.message ?? String(error)}`;
    el.classList.add("error");
  }

  private nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  private countdownTimer: number | null = null;

  private startCalibrationCountdown(): void {
    if (this.calibrator.isCalibrated() || this.countdownTimer !== null) return;

    let remaining = 5;
    this.showCountdown(remaining);

    const tick = () => {
      remaining -= 1;

      if (remaining > 0) {
        this.showCountdown(remaining);
        this.countdownTimer = window.setTimeout(tick, 1000);
      } else {
        this.hideCountdown();
        this.countdownTimer = null;
        this.calibrator.beginCapture();
      }
    };

    this.countdownTimer = window.setTimeout(tick, 1000);
  }

  private showCountdown(seconds: number): void {
    const el = document.getElementById("countdown");

    if (!el) return;

    el.textContent = String(seconds);
    el.style.display = "flex";
  }

  private hideCountdown(): void {
    const el = document.getElementById("countdown");

    if (el) el.style.display = "none";
  }
}
