import { Limb, LimbType } from "./Limb";
import { GameObject } from "./GameObject";
import { Spine } from "./Spine";
import * as THREE from "three";

export class StickFigure extends GameObject {
  public readonly spine: Spine;

  public readonly leftArm: Limb;
  public readonly rightArm: Limb;
  public readonly leftLeg: Limb;
  public readonly rightLeg: Limb;

  constructor(material: THREE.Material) {
    super();
    
    this.spine = new Spine(material);
    this.leftArm = new Limb(material, LimbType.Arm);
    this.rightArm = new Limb(material, LimbType.Arm);
    this.leftLeg = new Limb(material, LimbType.Leg);
    this.rightLeg = new Limb(material, LimbType.Leg);

    this.spine.getChest().add(this.leftArm.getRoot()).add(this.rightArm.getRoot());
    this.spine.getHip().add(this.leftLeg.getRoot()).add(this.rightLeg.getRoot());

    super.setRoot(this.spine.getRoot());
  }
}
