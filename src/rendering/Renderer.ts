import * as THREE from "three";

export class Renderer {
  private renderer: THREE.WebGLRenderer;

  constructor() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    const app = document.getElementById("app");

    if (!app) throw new Error("App not found");

    app.appendChild(this.renderer.domElement);
    console.log("Renderer initialized");
  }

  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.render(scene, camera);
  }
}
