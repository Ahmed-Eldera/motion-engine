import * as THREE from "three";
import type { Arm } from "../assets/Arm";
import type { StickFigure } from "../assets/StickFigure";
import type { Pose,ArmPose,LegPose } from "./Pose";
import type { Leg } from "../assets/Leg";

export class SkeletonRetargeter {
  public applyPose(pose: Pose, skeleton: StickFigure): void {
    this.updateUpperArm(pose.leftArm, skeleton.getLeftArm());

    this.updateUpperArm(pose.rightArm, skeleton.getRightArm());

    this.updateThigh(pose.leftLeg, skeleton.getLeftLeg());

    this.updateThigh(pose.rightLeg, skeleton.getRightLeg());

    this.updateShin(pose.leftLeg, skeleton.getLeftLeg());

    this.updateShin(pose.rightLeg, skeleton.getRightLeg());

    this.updateForearm(pose.leftArm, skeleton.getLeftArm());

    this.updateForearm(pose.rightArm, skeleton.getRightArm());
  }

private updateUpperArm(source: ArmPose, target: Arm): void {

    const upperDirection = new THREE.Vector3()
        .subVectors(source.elbow, source.shoulder)
        .normalize();

    target.getUpperArm().setDirection(upperDirection);
}

private updateThigh(source: LegPose, target: Leg): void {

    const upperDirection = new THREE.Vector3()
        .subVectors(source.knee, source.hip)
        .normalize();

    target.getThigh().setDirection(upperDirection);
}

private updateShin(source: LegPose, target: Leg): void {
    const lowerDirection = new THREE.Vector3()
        .subVectors(source.ankle, source.knee)
        .normalize();

    target.getShine().setDirection(lowerDirection);
}

private updateForearm(source: ArmPose, target: Arm): void {
    const lowerDirection = new THREE.Vector3()
        .subVectors(source.wrist, source.elbow)
        .normalize();

    target.getForearm().setDirection(lowerDirection);
}
}
