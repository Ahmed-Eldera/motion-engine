import * as THREE from "three";
import type { Limb } from "../assets/Limb";
import type { StickFigure } from "../assets/StickFigure";
import type { Pose, LimbPose } from "./Pose";

export class SkeletonRetargeter {
  public applyPose(pose: Pose, skeleton: StickFigure): void {
    this.updateUpperArm(pose.leftArm, skeleton.leftArm);

    this.updateUpperArm(pose.rightArm, skeleton.rightArm);

    // this.updateThigh(pose.leftLeg, skeleton.leftLeg);

    // this.updateThigh(pose.rightLeg, skeleton.rightLeg);

    // this.updateShin(pose.leftLeg, skeleton.leftLeg);

    // this.updateShin(pose.rightLeg, skeleton.rightLeg);

    this.updateForearm(pose.leftArm, skeleton.leftArm);

    // this.updateForearm(pose.rightArm, skeleton.rightArm);
  }

  private updateUpperArm(source: LimbPose, target: Limb): void {
    const worldDirection = new THREE.Vector3()
      .subVectors(source.middleJoint, source.parentJoint)
      .normalize();

    const localDirection = this.toLocalDirection(
      worldDirection,
      target.parentBone.getEndJoint(),
    );
    target.parentBone.setDirection(localDirection);
  }
  private updateForearm(source: LimbPose, target: Limb): void {
    const worldDirection = new THREE.Vector3()
      .subVectors(source.endJoint, source.middleJoint)
      .normalize();
    const localDirection = this.toLocalDirection(
      worldDirection,
      target.middleBone.getStartJoint().parent,
    );

    target.middleBone.setDirection(localDirection);
        const upperDirection = new THREE.Vector3()
    .subVectors(source.middleJoint, source.parentJoint)
    .normalize();

const forearmDirection = new THREE.Vector3()
    .subVectors(source.endJoint, source.middleJoint)
    .normalize();
    const elbowAngle = forearmDirection.angleTo(upperDirection);

console.log(
    THREE.MathUtils.radToDeg(elbowAngle)
);
  }

  private toLocalDirection(
    direction: THREE.Vector3,
    parent: THREE.Object3D,
  ): THREE.Vector3 {
    const parentWorldQuat = new THREE.Quaternion();
    
    parent.updateMatrixWorld(true);
    parent.getWorldQuaternion(parentWorldQuat);
    // console.log(parentWorldQuat.toArray());
    return direction.clone().applyQuaternion(parentWorldQuat.invert()).normalize();
  }
}
