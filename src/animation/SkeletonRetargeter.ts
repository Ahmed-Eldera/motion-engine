import * as THREE from "three";
import type { Arm } from "../assets/Arm";
import type { StickFigure } from "../assets/StickFigure";
import type { Pose, ArmPose, LegPose } from "./Pose";
import type { Leg } from "../assets/Leg";

export class SkeletonRetargeter {
  public applyPose(pose: Pose, skeleton: StickFigure): void {
    this.updateUpperArm(pose.leftArm, skeleton.getLeftArm());

    // this.updateUpperArm(pose.rightArm, skeleton.getRightArm());

    // this.updateThigh(pose.leftLeg, skeleton.getLeftLeg());

    // this.updateThigh(pose.rightLeg, skeleton.getRightLeg());

    // this.updateShin(pose.leftLeg, skeleton.getLeftLeg());

    // this.updateShin(pose.rightLeg, skeleton.getRightLeg());

    this.updateForearm(pose.leftArm, skeleton.getLeftArm());

    // this.updateForearm(pose.rightArm, skeleton.getRightArm());
  }

  private updateUpperArm(source: ArmPose, target: Arm): void {
    const worldDirection = new THREE.Vector3()
      .subVectors(source.elbow, source.shoulder)
      .normalize();

    const localDirection = this.toLocalDirection(
      worldDirection,
      target.getUpperArm().getStartJoint().parent,
    );
    // console.log("localDirection", localDirection);
    // console.log("worldDirection", worldDirection);
    target.getUpperArm().setDirection(localDirection);
  }
  private updateForearm(source: ArmPose, target: Arm): void {
    const worldDirection = new THREE.Vector3()
      .subVectors(source.wrist, source.elbow)
      .normalize();
    const localDirection = this.toLocalDirection(
      worldDirection,
      target.getForearm().getStartJoint().parent,
    );

    target.getForearm().setDirection(localDirection);
    const upperDirection = new THREE.Vector3()
    .subVectors(source.elbow, source.shoulder)
    .normalize();

const forearmDirection = new THREE.Vector3()
    .subVectors(source.wrist, source.elbow)
    .normalize();
    const elbowAngle = forearmDirection.angleTo(upperDirection);

console.log(
    THREE.MathUtils.radToDeg(elbowAngle)
);
  }

  private updateThigh(source: LegPose, target: Leg): void {
    const worldDirection = new THREE.Vector3()
      .subVectors(source.knee, source.hip)
      .normalize();
    const localDirection = this.toLocalDirection(
      worldDirection,
      target.getThigh().getEndJoint(),
    );
    target.getThigh().setDirection(localDirection);
  }

  private updateShin(source: LegPose, target: Leg): void {
    const worldDirection = new THREE.Vector3()
      .subVectors(source.ankle, source.knee)
      .normalize();
    const localDirection = this.toLocalDirection(
      worldDirection,
      target.getShin().getEndJoint(),
    );
    target.getShin().setDirection(localDirection);
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
