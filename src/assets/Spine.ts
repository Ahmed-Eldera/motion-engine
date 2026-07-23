import * as THREE from "three";
import { Bone } from "./Bone";
import { GameObject } from "./GameObject";

export class Spine extends GameObject {
  private neck: Bone;
  private upperSpine: Bone;
  private lowerSpine: Bone;

  constructor(material: THREE.Material) {
    super();

    this.lowerSpine = new Bone(0.8, 0.1, material);

    this.upperSpine = new Bone(1.2, 0.09, material);

    this.neck = new Bone(0.5, 0.08, material);

    this.neck.attach(this.upperSpine);
    this.upperSpine.attach(this.lowerSpine);

    super.setRoot(this.neck.getStartJoint());
  }

  public getChest(): THREE.Object3D {
    return this.upperSpine.getStartJoint();
  }

  public getHip(): THREE.Object3D {
    return this.lowerSpine.getEndJoint();
  }
}
