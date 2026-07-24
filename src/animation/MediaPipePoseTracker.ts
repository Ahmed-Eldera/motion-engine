import {
    FilesetResolver,
    PoseLandmarker
} from "@mediapipe/tasks-vision";

import * as THREE from "three";

import type { PoseTracker } from "./PoseTracker";
import type { Pose } from "./Pose";
import { Camera } from "../camera/Camera";

export class MediaPipePoseTracker implements PoseTracker {

    private detector!: PoseLandmarker;
    private readonly video: HTMLVideoElement;
    private readonly camera :Camera = Camera.getInstance();

    constructor(video: HTMLVideoElement) {
        this.video = video;
    }

    public async initialize(): Promise<void> {

        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );

        this.detector =
            await PoseLandmarker.createFromOptions(
                vision,
                {
                    baseOptions: {
                        modelAssetPath: "/pose_landmarker_lite.task"
                    },

                    runningMode: "VIDEO",

                    numPoses: 1
                }
            );
    }

    public update(): Pose {

        const result =
            this.detector.detectForVideo(
                this.video,
                performance.now()
            );

        if (result.landmarks.length === 0)
            return null;

        const lm = result.landmarks[0];
        this.camera.drawLandmarks(result.landmarks[0]);
        
        const pose = {

            leftArm: {
                shoulder: this.vec(lm[11]),
                elbow: this.vec(lm[13]),
                wrist: this.vec(lm[15])
            },

            rightArm: {
                shoulder: this.vec(lm[12]),
                elbow: this.vec(lm[14]),
                wrist: this.vec(lm[16])
            },

            leftLeg: {
                hip: this.vec(lm[23]),
                knee: this.vec(lm[25]),
                ankle: this.vec(lm[27])
            },

            rightLeg: {
                hip: this.vec(lm[24]),
                knee: this.vec(lm[26]),
                ankle: this.vec(lm[28])
            }
        };
        
        // Update on-screen display
        this.updateCoordinatesDisplay(pose);
        
        return pose;
    }

    private updateCoordinatesDisplay(pose: Pose): void {
        const displayEl = document.getElementById('coordinates-display');
        
        displayEl.innerHTML = `
            <h3>Pose Coordinates</h3>
            <div class="limb">
                <div class="limb-name">LEFT ARM</div>
                <div class="joint">
                    <span class="joint-label">Shoulder:</span>
                    <span class="coords">(${pose.leftArm.shoulder.x.toFixed(3)}, ${pose.leftArm.shoulder.y.toFixed(3)}, ${pose.leftArm.shoulder.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Elbow:</span>
                    <span class="coords">(${pose.leftArm.elbow.x.toFixed(3)}, ${pose.leftArm.elbow.y.toFixed(3)}, ${pose.leftArm.elbow.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Wrist:</span>
                    <span class="coords">(${pose.leftArm.wrist.x.toFixed(3)}, ${pose.leftArm.wrist.y.toFixed(3)}, ${pose.leftArm.wrist.z.toFixed(3)})</span>
                </div>
            </div>
            <div class="limb">
                <div class="limb-name">RIGHT ARM</div>
                <div class="joint">
                    <span class="joint-label">Shoulder:</span>
                    <span class="coords">(${pose.rightArm.shoulder.x.toFixed(3)}, ${pose.rightArm.shoulder.y.toFixed(3)}, ${pose.rightArm.shoulder.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Elbow:</span>
                    <span class="coords">(${pose.rightArm.elbow.x.toFixed(3)}, ${pose.rightArm.elbow.y.toFixed(3)}, ${pose.rightArm.elbow.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Wrist:</span>
                    <span class="coords">(${pose.rightArm.wrist.x.toFixed(3)}, ${pose.rightArm.wrist.y.toFixed(3)}, ${pose.rightArm.wrist.z.toFixed(3)})</span>
                </div>
            </div>
            <div class="limb">
                <div class="limb-name">LEFT LEG</div>
                <div class="joint">
                    <span class="joint-label">Hip:</span>
                    <span class="coords">(${pose.leftLeg.hip.x.toFixed(3)}, ${pose.leftLeg.hip.y.toFixed(3)}, ${pose.leftLeg.hip.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Knee:</span>
                    <span class="coords">(${pose.leftLeg.knee.x.toFixed(3)}, ${pose.leftLeg.knee.y.toFixed(3)}, ${pose.leftLeg.knee.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Ankle:</span>
                    <span class="coords">(${pose.leftLeg.ankle.x.toFixed(3)}, ${pose.leftLeg.ankle.y.toFixed(3)}, ${pose.leftLeg.ankle.z.toFixed(3)})</span>
                </div>
            </div>
            <div class="limb">
                <div class="limb-name">RIGHT LEG</div>
                <div class="joint">
                    <span class="joint-label">Hip:</span>
                    <span class="coords">(${pose.rightLeg.hip.x.toFixed(3)}, ${pose.rightLeg.hip.y.toFixed(3)}, ${pose.rightLeg.hip.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Knee:</span>
                    <span class="coords">(${pose.rightLeg.knee.x.toFixed(3)}, ${pose.rightLeg.knee.y.toFixed(3)}, ${pose.rightLeg.knee.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Ankle:</span>
                    <span class="coords">(${pose.rightLeg.ankle.x.toFixed(3)}, ${pose.rightLeg.ankle.y.toFixed(3)}, ${pose.rightLeg.ankle.z.toFixed(3)})</span>
                </div>
            </div>
        `;
    }

    private vec(
        landmark: {
            x: number;
            y: number;
            z: number;
        }
    ): THREE.Vector3 {

        return new THREE.Vector3(
            landmark.x,
            -landmark.y,
            landmark.z
        );
    }
}