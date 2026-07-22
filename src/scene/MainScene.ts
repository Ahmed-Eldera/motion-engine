import * as THREE from "three";

export class MainScene {
    private scene: THREE.Scene;

    constructor() {
        this.scene = new THREE.Scene();

        this.scene.background = new THREE.Color(0x202020);

        const geometry = new THREE.BoxGeometry();

        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00
        });

        const cube = new THREE.Mesh(geometry, material);

        this.scene.add(cube);

        const axes = new THREE.AxesHelper(5);

        this.scene.add(axes);
    }

    public getScene(): THREE.Scene {
        return this.scene;
    }
}