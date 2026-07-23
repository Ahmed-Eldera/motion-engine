import * as THREE from "three";
import { Bone } from "./Bone";
import { GameObject } from "./GameObject";

export class Leg extends GameObject {
  private thigh: Bone;
  private shin: Bone;
  private foot: Bone;

  constructor(material: THREE.Material) {
    super();

    this.thigh = new Bone(
      1.0, // length
      0.08, // radius
      material,
    );

    this.shin = new Bone(0.8, 0.07, material);

    this.foot = new Bone(0.3, 0.05, material);

    // Shoulder -> Elbow
    this.thigh.attach(this.shin);

    // Elbow -> Wrist
    this.shin.attach(this.foot);
    super.setRoot(this.thigh.getStartJoint());
  }

  public getThigh(): Bone {
    return this.thigh;
  }

  public getShin(): Bone {
    return this.shin;
  }

  public getFoot(): Bone {
    return this.foot;
  }
  public moveThigh(x: number, y: number, z: number): void {
    this.thigh.move(x, y, z);
  }
  public moveShin(x: number, y: number, z: number): void {
    this.shin.move(x, y, z);
  }
  public moveFoot(x: number, y: number, z: number): void {
    this.foot.move(x, y, z);
  }
  public setThigh(x: number, y: number, z: number): void {
    this.thigh.set(x, y, z);
  }
  public setShin(x: number, y: number, z: number): void {
    this.shin.set(x, y, z);
  }
  public setFoot(x: number, y: number, z: number): void {
    this.foot.set(x, y, z);
  }
}
