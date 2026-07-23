import * as THREE from "three";

export abstract class GameObject {
  private root: THREE.Object3D;

    public update(deltaTime: number): void {
        this.root.rotation.z += deltaTime;
    }
    public setRoot(root: THREE.Object3D): void {
        this.root = root;
    }

    public getRoot(): THREE.Object3D{
        return this.root;
    };

}