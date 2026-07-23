import { Arm } from "./Arm";
import { GameObject } from "./GameObject";
import { Leg } from "./Leg";
import { Spine } from "./Spine";
import * as THREE from "three";

export class StickFigure extends GameObject {
  private spine: Spine;

  private leftArm: Arm;
    public getLeftArm(): Arm {
        return this.leftArm;
    }
    public setLeftArm(value: Arm) {
        this.leftArm = value;
    }
  private rightArm: Arm;
    public getRightArm(): Arm {
        return this.rightArm;
    }
    public setRightArm(value: Arm) {
        this.rightArm = value;
    }

  private leftLeg: Leg;
    public getLeftLeg(): Leg {
        return this.leftLeg;
    }
    public setLeftLeg(value: Leg) {
        this.leftLeg = value;
    }
  private rightLeg: Leg;
    public getRightLeg(): Leg {
        return this.rightLeg;
    }
    public setRightLeg(value: Leg) {
        this.rightLeg = value;
    }

  constructor(material: THREE.Material) {
    super();

    this.spine = new Spine(material);

    this.leftArm = new Arm(material);
    this.rightArm = new Arm(material);

    this.leftLeg = new Leg(material);
    this.rightLeg = new Leg(material);

    this.spine.getChest().add(this.leftArm.getRoot());

    this.spine.getChest().add(this.rightArm.getRoot());

    this.leftArm.getRoot().rotation.z = Math.PI / 2;
    this.rightArm.getRoot().rotation.z = -Math.PI / 2;

    this.spine.getHip().add(this.leftLeg.getRoot());

    this.spine.getHip().add(this.rightLeg.getRoot());
    this.leftLeg.getRoot().rotation.z = 0.2;
    this.rightLeg.getRoot().rotation.z = -0.2;

    super.setRoot(this.spine.getRoot());
  }

  
}
