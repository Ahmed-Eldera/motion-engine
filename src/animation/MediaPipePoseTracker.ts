import {
    FilesetResolver,
    PoseLandmarker
} from "@mediapipe/tasks-vision";

import * as THREE from "three";

import { PoseTracker } from "./PoseTracker";
import type { Pose } from "./Pose";
import { Camera } from "../camera/Camera";
import { finiteOr } from "./sanitize";

export class MediaPipePoseTracker extends PoseTracker {

    private detector!: PoseLandmarker;
    private readonly video: HTMLVideoElement;
    private readonly camera :Camera = Camera.getInstance();

    constructor(video: HTMLVideoElement) {
        super();
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
                        modelAssetPath: `${import.meta.env.BASE_URL}pose_landmarker_full.task`,
                        delegate: "GPU"
                    },

                    runningMode: "VIDEO",

                    numPoses: 1
                }
            );
    }

    public update(): Pose {
        if (this.video.readyState < 2 || this.video.videoWidth === 0) {
            return null;
        }

        const result =
            this.detector.detectForVideo(
                this.video,
                performance.now()
            );

        if (result.landmarks.length === 0)
            return null;

        const lm = result.landmarks[0];

        this.camera.drawLandmarks(lm);

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
            },
        };
        
        // Update on-screen display
        this.updateCoordinatesDisplay(pose);
        
        return pose;
    }



    private vec(
        landmark: {
            x: number;
            y: number;
            z: number;
        }
    ): THREE.Vector3 {

        // Mirror x so the pose matches the mirrored video preview:
        // the figure mimics you like your reflection, not like a
        // person facing you. (Raw MediaPipe x: your left = image right.)
        return new THREE.Vector3(
            1 - finiteOr(landmark.x),
            -finiteOr(landmark.y),
            0
        );
    }
}