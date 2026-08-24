import * as THREE from "three";
import { StickFigure } from "../assets/StickFigure";

export class MainScene {
  private scene: THREE.Scene;
  private figure: StickFigure;

  constructor() {
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x202020);
    this.scene.fog = new THREE.Fog(0x202020, 4, 18);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(3, 6, 4);
    this.scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xffccaa, 0.45, 12);
    fillLight.position.set(0, 3, 2);
    this.scene.add(fillLight);

    const grid = new THREE.GridHelper(10, 10);
    this.scene.add(grid);

    this.figure = new StickFigure(material);
    this.figure.getRoot().position.set(0, 5, 0);
    this.figure.getRoot().rotation.y = 0;
    this.scene.add(this.figure.getRoot());

    const axes = new THREE.AxesHelper(5);
    this.scene.add(axes);

    const armMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    this.figure.rightArm.parentBone.changeMaterial(armMaterial);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getFigure(): StickFigure {
    return this.figure;
  }
}
