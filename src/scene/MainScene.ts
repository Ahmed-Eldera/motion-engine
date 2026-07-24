import * as THREE from "three";
import { StickFigure } from "../assets/StickFigure";

export class MainScene {
  private scene: THREE.Scene;
  private figure: StickFigure;

  constructor() {
    this.scene = new THREE.Scene();

    this.scene.background = new THREE.Color(0x202020);

    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
    });

    const grid = new THREE.GridHelper(10, 10);

    this.scene.add(grid);

    this.figure = new StickFigure(material);

    this.scene.add(this.figure.getRoot());

    this.figure.getRoot().position.set(0, 5, 0);
    const material1 = new THREE.MeshBasicMaterial({
      color: 0xfff,
    });
    const material2 = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    this.figure.getLeftArm().getUpperArm().changeMaterial(material1);
    this.figure.getRightArm().getUpperArm().changeMaterial(material2);
    const material3 = new THREE.MeshBasicMaterial({
      color: 0xfff,
    });
    const material4 = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    this.figure.getLeftArm().getForearm().changeMaterial(material3);
    this.figure.getRightArm().getForearm().changeMaterial(material4);
    const axes = new THREE.AxesHelper(5);

    this.scene.add(axes);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getFigure(): StickFigure {
    return this.figure;
  }
}
