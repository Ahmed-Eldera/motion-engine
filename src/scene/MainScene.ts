import * as THREE from "three";
import { StickFigure } from "../assets/StickFigure";
import type { GameObject } from "../assets/GameObject";
import { SkeletonRetargeter } from "../animation/SkeletonRetargeter";
import type { Pose } from "../animation/Pose";
export class MainScene {
  private scene: THREE.Scene;
  private figure: GameObject;
  private retargeter: SkeletonRetargeter = new SkeletonRetargeter();

  constructor() {
    this.scene = new THREE.Scene();

    this.scene.background = new THREE.Color(0x202020);

    const geometry = new THREE.BoxGeometry();

    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
    });
    const grid = new THREE.GridHelper(
      10, // size
      10, // divisions
    );

    this.scene.add(grid);
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
    const pose: Pose = {
      leftArm: {
        shoulder: new THREE.Vector3(-0.5, 2, 0),
        elbow: new THREE.Vector3(-1.2, 1.3, 0),
        wrist: new THREE.Vector3(-1.8, 0.8, 0),
      },

      rightArm: {
        shoulder: new THREE.Vector3(0.5, 2, 0),
        elbow: new THREE.Vector3(1.2, 1.3, 0),
        wrist: new THREE.Vector3(1.8, 0.8, 0),
      },

      leftLeg: {
        hip: new THREE.Vector3(-0.3, 0, 0),
        knee: new THREE.Vector3(-0.3, -1.0, -1),
        ankle: new THREE.Vector3(-0.3, 0, 0),
      },

      rightLeg: {
        hip: new THREE.Vector3(0.3, 0, 0),
        knee: new THREE.Vector3(0.3, -1.2, 1),
        ankle: new THREE.Vector3(0.3, -2.2, 0),
      },
    };

    this.retargeter.applyPose(pose, this.figure as StickFigure);
  }
}
