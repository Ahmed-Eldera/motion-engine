import * as THREE from "three";
import { Bone } from "./Bone";
import { GameObject } from "./GameObject";

export class Spine extends GameObject {
  private neck: Bone;
  private upperSpine: Bone;
  private lowerSpine: Bone;
private leftShoulder = new THREE.Object3D();
private rightShoulder = new THREE.Object3D();

private leftHip = new THREE.Object3D();
private rightHip = new THREE.Object3D();
  constructor(material: THREE.Material) {
    super();

    this.lowerSpine = new Bone(0.8, 0.1, material);

    this.upperSpine = new Bone(1.2, 0.09, material);

    this.neck = new Bone(0.5, 0.08, material);

    this.neck.attach(this.upperSpine);
    this.upperSpine.attach(this.lowerSpine);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3), material);
    head.position.y = 0.3;
    this.neck.getStartJoint().add(head);

const shoulderWidth = 0.45;
const hipWidth = 0.25;

this.leftShoulder.position.set(
    -shoulderWidth,
    0,
    0
);

this.rightShoulder.position.set(
    shoulderWidth,
    0,
    0);

this.leftHip.position.set(
    -hipWidth,
    0,
    0
);

this.rightHip.position.set(
    hipWidth,
    0,
    0
);

this.upperSpine.getStartJoint().add(this.leftShoulder);
this.upperSpine.getStartJoint().add(this.rightShoulder);

this.lowerSpine.getEndJoint().add(this.leftHip);
this.lowerSpine.getEndJoint().add(this.rightHip);
    super.setRoot(this.neck.getStartJoint());
  }


  public getLeftShoulder(): THREE.Object3D {
    return this.leftShoulder;
}

public getRightShoulder(): THREE.Object3D {
    return this.rightShoulder;
}

public getLeftHip(): THREE.Object3D {
    return this.leftHip;
}

public getRightHip(): THREE.Object3D {
    return this.rightHip;
}
}
