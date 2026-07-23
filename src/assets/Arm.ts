import * as THREE from "three";
import { Bone } from "./Bone";
import { GameObject } from "./GameObject";

export class Arm extends GameObject {
  private upperArm: Bone;
  private forearm: Bone;
  private hand: Bone;

  constructor(material: THREE.Material) {
    super();

    this.upperArm = new Bone(
      1.0, // length
      0.08, // radius
      material,
    );

    this.forearm = new Bone(0.8, 0.07, material);

    this.hand = new Bone(0.3, 0.05, material);

    // Shoulder -> Elbow
    this.upperArm.attach(this.forearm);

    // Elbow -> Wrist
    this.forearm.attach(this.hand);
    super.setRoot(this.upperArm.getStartJoint());

  }

  public getUpperArm(): Bone {
    return this.upperArm;
  }

  public getForearm(): Bone {
    return this.forearm;
  }

  public getHand(): Bone {
    return this.hand;
  }
  public moveUpperArm(x: number,y: number,z: number): void {
    this.upperArm.move(x,y,z);
  }
    public moveForearm(x: number,y: number,z: number): void {
    this.forearm.move(x,y,z);
  }
    public moveHand(x: number,y: number,z: number): void {
    this.hand.move(x,y,z);
  }
  public setUpperArm(x: number,y: number,z: number): void {
    this.upperArm.set(x,y,z);
  }
    public setForearm(x: number,y: number,z: number): void {
    this.forearm.set(x,y,z);
  }
    public setHand(x: number,y: number,z: number): void {
    this.hand.set(x,y,z);
  }
}
