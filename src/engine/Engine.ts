import * as THREE from "three";
import { Renderer } from "../rendering/Renderer";
import { MainScene } from "../scene/MainScene";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class Engine {
  private renderer: Renderer;
  private camera: THREE.PerspectiveCamera;
  private scene: MainScene;
private controls: OrbitControls;
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
        this.renderer.getDomElement()
    );

    this.controls.target.set(0, 1, 0);
    this.controls.enableDamping = true;
  }

public start(): void {

    this.scene.update();
    const animate = () => {

        this.controls.update();

        this.renderer.render(
            this.scene.getScene(),
            this.camera
        );
        this.renderer.render(
            this.scene.getScene(),
            this.camera
        );

        requestAnimationFrame(animate);
        // console.log("Rendering frame");
    };

    animate();

}
}
