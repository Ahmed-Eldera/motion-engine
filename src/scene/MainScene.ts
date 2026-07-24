import * as THREE from "three";
import { StickFigure } from "../assets/StickFigure";

export class MainScene {
  private scene: THREE.Scene;
  private figure: StickFigure;

  constructor() {
    const material = new THREE.MeshBasicMaterial({color: 0x00ff00,});
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x202020);
    
    const grid = new THREE.GridHelper(10,10);
    this.scene.add(grid);
    
    this.figure = new StickFigure(material);
    this.figure.getRoot().position.set(0, 5, 0);
    this.figure.getRoot().rotation.y = 1;
    this.scene.add(this.figure.getRoot());
    
    const axes = new THREE.AxesHelper(5);
    this.scene.add(axes);
        const material1 = new THREE.MeshBasicMaterial({
      color: 0xfff,
    });
    const material2 = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
        const material3 = new THREE.MeshBasicMaterial({
      color: 0xfff,
    });
    const material4 = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getFigure(): StickFigure {
    return this.figure;
  }
}
