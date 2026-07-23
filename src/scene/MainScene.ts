import * as THREE from "three";
import { StickFigure } from "../assets/StickFigure";
import { Bone } from "../assets/Bone";
import { Arm } from "../assets/Arm";
import type { GameObject } from "../assets/GameObject";

export class MainScene {
  private scene: THREE.Scene;
  private figure: GameObject;

  constructor() {
    this.scene = new THREE.Scene();

    this.scene.background = new THREE.Color(0x202020);

    const geometry = new THREE.BoxGeometry();

    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
    });

    // this.figure = new Arm(material);
    // this.figure = new Bone(2, 0.2, material);
    this.figure = new StickFigure(material);

    this.scene.add(this.figure.getRoot());

    const axes = new THREE.AxesHelper(5);

    this.scene.add(axes);
    this.figure.getRoot().position.set(0, 0, 0);
    this.figure.getRoot().rotation.y = 1;

  }

  public getScene(): THREE.Scene {
    return this.scene;
  }
  public update() {
    (this.figure as StickFigure).getRightArm().moveUpperArm(0.02, 0.03, 0.07);
        (this.figure as StickFigure).getLeftArm().moveUpperArm(0.02, 0.03, 0.07);
            (this.figure as StickFigure).getRightArm().moveForearm(0.02, 0.03, 0.07);
        (this.figure as StickFigure).getLeftArm().moveForearm(0.02, 0.03, 0.07);
  }
}
