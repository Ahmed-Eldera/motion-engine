import * as THREE from "three";
import type { Limb } from "../assets/Limb";
import type { StickFigure } from "../assets/StickFigure";
import type { Pose, ArmPose, LegPose } from "./Pose";

export class SkeletonRetargeter {
  public applyPose(pose: Pose, skeleton: StickFigure): void {
    this.updateUpperArm(pose.leftArm, skeleton.leftArm);

    this.updateUpperArm(pose.rightArm, skeleton.rightArm);

    this.updateThigh(pose.leftLeg, skeleton.leftLeg);

    this.updateThigh(pose.rightLeg, skeleton.rightLeg);

    this.updateShin(pose.leftLeg, skeleton.leftLeg);

    this.updateShin(pose.rightLeg, skeleton.rightLeg);

    this.updateForearm(pose.leftArm, skeleton.leftArm);

    this.updateForearm(pose.rightArm, skeleton.rightArm);
  }

  private updateUpperArm(source: ArmPose, target: Limb): void {
    const worldDirection = new THREE.Vector3()
      .subVectors(source.elbow, source.shoulder)
      .normalize();

    const localDirection = this.toLocalDirection(
      worldDirection,
      target.parentBone.getEndJoint(),
    );
    target.parentBone.setDirection(localDirection);
  }
  private updateForearm(source: ArmPose, target: Limb): void {
    const worldDirection = new THREE.Vector3()
      .subVectors(source.wrist, source.elbow)
      .normalize();
          const localDirection = this.toLocalDirection(
      worldDirection,
      target.middleBone.getEndJoint(),
    );

    target.middleBone.setDirection(localDirection);
  }

  private updateThigh(source: LegPose, target: Limb): void {
    const worldDirection = new THREE.Vector3()
      .subVectors(source.knee, source.hip)
      .normalize();
    const localDirection = this.toLocalDirection(
      worldDirection,
      target.parentBone.getEndJoint(),
    );
    target.parentBone.setDirection(localDirection);
  }


  private updateShin(source: LegPose, target: Limb): void {
    const worldDirection = new THREE.Vector3()
      .subVectors(source.ankle, source.knee)
      .normalize();
    const localDirection = this.toLocalDirection(
      worldDirection,
      target.middleBone.getEndJoint(),
    );
    target.middleBone.setDirection(localDirection);
  }
  private toLocalDirection(
    direction: THREE.Vector3,
    parent: THREE.Object3D,
  ): THREE.Vector3 {
    const parentWorldQuat = new THREE.Quaternion();

    parent.getWorldQuaternion(parentWorldQuat);

    return direction
      .clone()
      .applyQuaternion(parentWorldQuat.invert())
      .normalize();
  }
}
