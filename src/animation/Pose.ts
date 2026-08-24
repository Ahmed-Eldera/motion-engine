import * as THREE from "three";
export interface Pose {

    leftArm: LimbPose;
    rightArm: LimbPose;

    leftLeg: LimbPose;
    rightLeg: LimbPose;
}
export interface LimbPose {
    parentJoint: THREE.Vector3;
    middleJoint: THREE.Vector3;
    endJoint: THREE.Vector3;
}
