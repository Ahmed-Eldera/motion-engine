import * as THREE from "three";
export interface Pose {

    leftArm: ArmPose;
    rightArm: ArmPose;

    leftLeg: LegPose;
    rightLeg: LegPose;
}
export interface ArmPose {
    shoulder: THREE.Vector3;
    elbow: THREE.Vector3;
    wrist: THREE.Vector3;
}
export interface LegPose {
    hip: THREE.Vector3;
    knee: THREE.Vector3;
    ankle: THREE.Vector3;
}