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
                parentJoint: this.vec(lm[11]),
                middleJoint: this.vec(lm[13]),
                endJoint: this.vec(lm[15])
            },

            rightArm: {
                parentJoint: this.vec(lm[12]),
                middleJoint: this.vec(lm[14]),
                endJoint: this.vec(lm[16])
            },

            leftLeg: {
                parentJoint: this.vec(lm[23]),
                middleJoint: this.vec(lm[25]),
                endJoint: this.vec(lm[27])
            },

            rightLeg: {
                parentJoint: this.vec(lm[24]),
                middleJoint: this.vec(lm[26]),
                endJoint: this.vec(lm[28])
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
                    <span class="coords">(${pose.leftArm.parentJoint.x.toFixed(3)}, ${pose.leftArm.parentJoint.y.toFixed(3)}, ${pose.leftArm.parentJoint.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Elbow:</span>
                    <span class="coords">(${pose.leftArm.middleJoint.x.toFixed(3)}, ${pose.leftArm.middleJoint.y.toFixed(3)}, ${pose.leftArm.middleJoint.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Wrist:</span>
                    <span class="coords">(${pose.leftArm.endJoint.x.toFixed(3)}, ${pose.leftArm.endJoint.y.toFixed(3)}, ${pose.leftArm.endJoint.z.toFixed(3)})</span>
                </div>
            </div>
            <div class="limb">
                <div class="limb-name">RIGHT ARM</div>
                <div class="joint">
                    <span class="joint-label">Shoulder:</span>
                    <span class="coords">(${pose.rightArm.parentJoint.x.toFixed(3)}, ${pose.rightArm.parentJoint.y.toFixed(3)}, ${pose.rightArm.parentJoint.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Elbow:</span>
                    <span class="coords">(${pose.rightArm.middleJoint.x.toFixed(3)}, ${pose.rightArm.middleJoint.y.toFixed(3)}, ${pose.rightArm.middleJoint.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Wrist:</span>
                    <span class="coords">(${pose.rightArm.endJoint.x.toFixed(3)}, ${pose.rightArm.endJoint.y.toFixed(3)}, ${pose.rightArm.endJoint.z.toFixed(3)})</span>
                </div>
            </div>
            <div class="limb">
                <div class="limb-name">LEFT LEG</div>
                <div class="joint">
                    <span class="joint-label">Hip:</span>
                    <span class="coords">(${pose.leftLeg.parentJoint.x.toFixed(3)}, ${pose.leftLeg.parentJoint.y.toFixed(3)}, ${pose.leftLeg.parentJoint.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Knee:</span>
                    <span class="coords">(${pose.leftLeg.middleJoint.x.toFixed(3)}, ${pose.leftLeg.middleJoint.y.toFixed(3)}, ${pose.leftLeg.middleJoint.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Ankle:</span>
                    <span class="coords">(${pose.leftLeg.endJoint.x.toFixed(3)}, ${pose.leftLeg.endJoint.y.toFixed(3)}, ${pose.leftLeg.endJoint.z.toFixed(3)})</span>
                </div>
            </div>
            <div class="limb">
                <div class="limb-name">RIGHT LEG</div>
                <div class="joint">
                    <span class="joint-label">Hip:</span>
                    <span class="coords">(${pose.rightLeg.parentJoint.x.toFixed(3)}, ${pose.rightLeg.parentJoint.y.toFixed(3)}, ${pose.rightLeg.parentJoint.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Knee:</span>
                    <span class="coords">(${pose.rightLeg.middleJoint.x.toFixed(3)}, ${pose.rightLeg.middleJoint.y.toFixed(3)}, ${pose.rightLeg.middleJoint.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Ankle:</span>
                    <span class="coords">(${pose.rightLeg.endJoint.x.toFixed(3)}, ${pose.rightLeg.endJoint.y.toFixed(3)}, ${pose.rightLeg.endJoint.z.toFixed(3)})</span>
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