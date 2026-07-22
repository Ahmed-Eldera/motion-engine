import * as THREE from "three";

export class StickFigure {
    private group: THREE.Group;

    private head: THREE.Mesh;
    private torso: THREE.Mesh;
    private leftArm: THREE.Mesh;
    private rightArm: THREE.Mesh;

    constructor() {
        this.group = new THREE.Group();

        /*
         * Materials
         */

        const material = new THREE.MeshNormalMaterial();

        /*
         * Head
         */

        this.head = new THREE.Mesh(
            new THREE.SphereGeometry(0.25),
            material
        );

        this.head.position.set(0, 1.6, 0);

        /*
         * Torso
         */

        this.torso = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 1.0),
            material
        );

        this.torso.position.set(0, 0.9, 0);

        /*
         * Left Arm
         */

        this.leftArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.8),
            material
        );

        this.leftArm.rotation.z = Math.PI / 2;
        this.leftArm.position.set(-0.55, 1.25, 0);

        /*
         * Right Arm
         */

        this.rightArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.8),
            material
        );

        this.rightArm.rotation.z = Math.PI / 2;
        this.rightArm.position.set(0.55, 1.25, 0);

        /*
         * Build hierarchy
         */

        this.group.add(this.head);
        this.group.add(this.torso);
        this.group.add(this.leftArm);
        this.group.add(this.rightArm);
    }

    public getObject(): THREE.Group {
        return this.group;
    }

    public update(deltaTime: number): void {
        this.group.rotation.y += deltaTime;
    }
}