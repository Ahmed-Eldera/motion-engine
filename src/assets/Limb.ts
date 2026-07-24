import * as THREE from "three";
import { Bone } from "./Bone";
import { GameObject } from "./GameObject";

export class Limb extends GameObject {
  public readonly parentBone: Bone;
  public readonly middleBone: Bone;
  public readonly endBone: Bone;

  constructor(material: THREE.Material, limbType: string) {
    super();

    if (limbType === LimbType.Arm) {
        this.parentBone = new Bone(1.0,0.08,material);
        this.middleBone = new Bone(0.8, 0.07, material);
        this.endBone = new Bone(0.3, 0.05, material);
  }else if (limbType === LimbType.Leg) {
        this.parentBone = new Bone(1.2,0.1,material);
        this.middleBone = new Bone(1.0, 0.09, material);
        this.endBone = new Bone(0.4, 0.08, material);
    }

    this.parentBone.attach(this.middleBone);
    this.middleBone.attach(this.endBone);
    super.setRoot(this.parentBone.getStartJoint());
  }
}

export const LimbType = {
  Arm: "Arm",
  Leg: "Leg",
};
