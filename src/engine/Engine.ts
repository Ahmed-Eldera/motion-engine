import * as THREE from "three";
import { Renderer } from "../rendering/Renderer";
import { MainScene } from "../scene/MainScene";

export class Engine {
    private renderer: Renderer;
    private camera: THREE.PerspectiveCamera;
    private scene: MainScene;

    constructor() {
        this.renderer = new Renderer();

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);

        this.scene = new MainScene();
    }

    public start(): void {
        this.renderer.render(
            this.scene.getScene(),
            this.camera
        );
    }
}