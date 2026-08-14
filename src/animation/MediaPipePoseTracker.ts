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
    private handDetector?: any;
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
                        modelAssetPath: "/pose_landmarker_full.task",
                        delegate: "GPU"
                    },

                    runningMode: "VIDEO",

                    numPoses: 1
                }
            );

        try {
            const handModule = await import("@mediapipe/tasks-vision");
            const HandLandmarker = handModule.HandLandmarker;
            this.handDetector = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "/hand_landmarker.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 2
            });
        } catch (error) {
            console.warn("HandLandmarker unavailable:", error);
            this.handDetector = undefined;
        }
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
        let handLandmarks: Array<{ x: number; y: number }> = [];
        let handSizes: { left?: number; right?: number } = {};

        if (this.handDetector) {
            const handResult = this.handDetector.detectForVideo(
                this.video,
                performance.now()
            );

            if (handResult.landmarks?.length) {
                handLandmarks = handResult.landmarks.flat();
                handSizes = this.extractHandSizes(handResult);
            }
        }

        this.camera.drawLandmarks([...lm, ...handLandmarks]);

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

            leftHandSize: handSizes.left,
            rightHandSize: handSizes.right,
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

        return new THREE.Vector3(
            finiteOr(landmark.x),
            -finiteOr(landmark.y),
            0
        );
    }

    private extractHandSizes(handResult: any): { left?: number; right?: number } {
        if (!handResult || !handResult.landmarks?.length)
            return {};

        const sizes: { left?: number; right?: number } = {};

        for (let i = 0; i < handResult.landmarks.length; i++) {
            const landmarks = handResult.landmarks[i];
            const size = this.computeHandSize(landmarks);
            const label = handResult.handedness?.[i]?.label;

            if (label === "Left") {
                sizes.left = size;
            } else if (label === "Right") {
                sizes.right = size;
            }
        }

        return sizes;
    }

    private computeHandSize(
        landmarks: Array<{ x: number; y: number; z?: number }>
    ): number {
        let minX = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (const landmark of landmarks) {
            minX = Math.min(minX, landmark.x);
            maxX = Math.max(maxX, landmark.x);
            minY = Math.min(minY, landmark.y);
            maxY = Math.max(maxY, landmark.y);
        }

        return Math.hypot(maxX - minX, maxY - minY);
    }
}