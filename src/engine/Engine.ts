import * as THREE from "three";
import { Renderer } from "../rendering/Renderer";
import { MainScene } from "../scene/MainScene";

export class Engine {
  private renderer: Renderer;
  private camera: THREE.PerspectiveCamera;
  private scene: MainScene;
  private x: number;
  private y: number;
  private z: number;

  constructor() {
    this.renderer = new Renderer();

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.x = 5;
    this.y = 5;
    this.z = 5;
    this.camera.position.set(this.x, this.y, this.z);
    this.camera.lookAt(0, 0, 0);

    this.scene = new MainScene();
  }

public start(): void {

    const animate = () => {

        this.scene.update();

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
