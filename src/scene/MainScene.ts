import * as THREE from "three";
import { StickFigure } from "../assets/StickFigure";

export class MainScene {
  private scene: THREE.Scene;
  private figure: any;

  constructor() {
    this.scene = new THREE.Scene();

    this.scene.background = new THREE.Color(0x202020);

    const geometry = new THREE.BoxGeometry();

    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
    });

    this.figure = new StickFigure();

    this.scene.add(this.figure.getObject());

    const axes = new THREE.AxesHelper(5);

    this.scene.add(axes);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }
  public update() {
    this.figure.update(0.01);
  }
}
