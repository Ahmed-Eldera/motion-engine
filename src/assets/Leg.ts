import * as THREE from "three";
import { Bone } from "./Bone";
import { GameObject } from "./GameObject";

export class Leg extends GameObject {
  private thigh: Bone;
  private shin: Bone;
  private foot : Bone;

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

  public getthigh(): Bone {
    return this.thigh;
  }

  public getForearm(): Bone {
    return this.shin;
  }

  public getHand(): Bone {
    return this.foot;
  }
}
