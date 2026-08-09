import * as THREE from "three";
import { Renderer } from "../rendering/Renderer";
import { MainScene } from "../scene/MainScene";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Camera } from "../camera/Camera";
import { SkeletonRetargeter } from "../animation/SkeletonRetargeter";
import { MediaPipePoseTracker } from "../animation/MediaPipePoseTracker";
import { ArmCalibrator } from "../animation/ArmCalibrator";
import { DepthModelEstimator } from "../ml/DepthModelEstimator";

export class Engine {
  private renderer: Renderer;
  private camera: THREE.PerspectiveCamera;
  private scene: MainScene;
  private controls: OrbitControls;
  private calibrator = new ArmCalibrator();
  private webcam: Camera;
  private tracker!: MediaPipePoseTracker;
  private retargeter: SkeletonRetargeter;
  private depthModel?: DepthModelEstimator;

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
    await this.webcam.start();

    this.tracker = new MediaPipePoseTracker(this.webcam.getVideo());
    this.tracker.setCalibrator(this.calibrator);
    await this.tracker.initialize();

    const depthModel = new DepthModelEstimator();
    depthModel.initialize(this.webcam.getVideo());
    this.tracker.setDepthSampler(depthModel);
    this.depthModel = depthModel;

    console.log("aho");
    this.calibrator.start();
    window.addEventListener("click", () => {
      this.calibrator.beginCapture();
    });
    let lastUpdate = 0;

    window.addEventListener("error", (event) => {
      console.error("Uncaught error:", event.error);
    });

    const animate = () => {
      const now = performance.now();

      if (now - lastUpdate > 2) {
        lastUpdate = now;

        try {
          this.depthModel?.update();

          const pose = this.tracker.update();

          if (pose) {
            this.calibrator.update(pose);

            if (this.calibrator.isCalibrated()) {
              this.retargeter.applyPose(pose, this.scene.getFigure(), this.calibrator);
              this.scene.updateVampireFromPose(pose, this.calibrator);
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
  }
}
