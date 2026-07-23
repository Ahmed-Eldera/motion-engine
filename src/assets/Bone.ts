import * as THREE from "three";
import { GameObject } from "./GameObject";

export class Bone extends GameObject {
  private startJoint: THREE.Object3D;
  private endJoint: THREE.Object3D;
  private mesh: THREE.Mesh;

  constructor(length: number, radius: number, material: THREE.Material) {
    super();
    this.startJoint = new THREE.Object3D();
    this.endJoint = new THREE.Object3D();

    this.mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, length),
      material,
    );

    // Move the cylinder so its top touches the startJoint joint
    this.mesh.position.y = -length / 2;

    // Place the endJoint joint at the bottom of the bone
    this.endJoint.position.y = -length;
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.15), material);

    this.endJoint.add(sphere);
    this.startJoint.add(this.mesh);
    this.startJoint.add(this.endJoint);
    this.setRoot(this.startJoint);
  }

  public getStartJoint(): THREE.Object3D {
    return this.startJoint;
  }

  public getEndJoint(): THREE.Object3D {
    return this.endJoint;
  }
  public update(deltaTime: number): void {
    this.startJoint.rotation.z += deltaTime;
  }
  public attach(child: Bone): void {
    this.endJoint.add(child.getStartJoint());
  }
    public move(x: number,y: number,z: number): void {
    this.startJoint.rotation.x += x;
    this.startJoint.rotation.y += y;
    this.startJoint.rotation.z += z;
  }
    public set(x: number,y: number,z: number): void {
    this.startJoint.rotation.x = x;
    this.startJoint.rotation.y = y;
    this.startJoint.rotation.z = z;
  }
}
