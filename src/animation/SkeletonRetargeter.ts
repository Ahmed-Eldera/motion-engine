import * as THREE from "three";
import type { Limb } from "../assets/Limb";
import type { StickFigure } from "../assets/StickFigure";
import type { Pose, LimbPose } from "./Pose";
import { ArmCalibrator } from "../animation/ArmCalibrator";

export class SkeletonRetargeter {
  private calibrator!: ArmCalibrator;
  
  // Smoothing: store previous direction quaternions for lerp
  private prevLeftUpperQuat: THREE.Quaternion = new THREE.Quaternion();
  private prevRightUpperQuat: THREE.Quaternion = new THREE.Quaternion();
  private prevLeftForeQuat: THREE.Quaternion = new THREE.Quaternion();
  private prevRightForeQuat: THREE.Quaternion = new THREE.Quaternion();
  
  private readonly SMOOTHING_FACTOR = 0.18; // lower = smoother and less jittery
  private readonly MAX_ELBOW_ANGLE = Math.PI * 0.95; // Max 171 degrees
  
  public applyPose(
    pose: Pose,
    skeleton: StickFigure,
    calibrator: ArmCalibrator,
  ): void {
    this.calibrator = calibrator;

    this.updateShoulderAnchors(
      pose.leftArm.parentJoint,
      pose.rightArm.parentJoint,
      skeleton.spine.getLeftShoulder(),
      skeleton.spine.getRightShoulder(),
    );

    this.updateUpperArm(pose.leftArm, skeleton.leftArm, this.calibrator.getUpperArmLength(), true);
    this.updateUpperArm(pose.rightArm, skeleton.rightArm, this.calibrator.getUpperArmLength(), false);

    this.updateForearm(
      pose.leftArm,
      skeleton.leftArm,
      this.calibrator.getForearmLength(),
      true,
      pose.leftHandSize,
    );
    this.updateForearm(
      pose.rightArm,
      skeleton.rightArm,
      this.calibrator.getForearmLength(),
      false,
      pose.rightHandSize,
    );
  }

  private updateUpperArm(source: LimbPose, target: Limb, mxln: number, isLeft: boolean): void {
    const dx = source.middleJoint.x - source.parentJoint.x;
    const dy = source.middleJoint.y - source.parentJoint.y;

    const projectedLength = Math.sqrt(dx * dx + dy * dy);
    const maxLength = mxln;

    const ratio = THREE.MathUtils.clamp(projectedLength / maxLength, 0, 1);
    const estimatedZ = Math.sqrt(Math.max(0, 1 - ratio * ratio));

    const worldDirection = new THREE.Vector3(dx, dy, estimatedZ).normalize();
    const localDirection = this.toLocalDirection(worldDirection, this.getBoneParent(target));

    const prevQuat = isLeft ? this.prevLeftUpperQuat : this.prevRightUpperQuat;
    this.setDirectionSmoothed(target.parentBone, localDirection, prevQuat, isLeft ? "leftUpper" : "rightUpper");
  }

  private updateForearm(source: LimbPose, target: Limb, mxln: number, isLeft: boolean, handSize?: number): void {
    const dx = source.endJoint.x - source.middleJoint.x;
    const dy = source.endJoint.y - source.middleJoint.y;

    const projectedLength = Math.sqrt(dx * dx + dy * dy);
    const maxLength = mxln;

    const ratio = THREE.MathUtils.clamp(projectedLength / maxLength, 0, 1);
    let estimatedZ = Math.sqrt(Math.max(0, 1 - ratio * ratio));

    if (handSize != null) {
      const handScale = this.calibrator.getHandSizeScale(isLeft ? "left" : "right", handSize);
      const handDepthOffset = THREE.MathUtils.clamp((handScale - 1) * 0.25, -0.15, 0.35);
      estimatedZ = THREE.MathUtils.clamp(estimatedZ + handDepthOffset, 0, 1);
    }

    let worldDirection = new THREE.Vector3(dx, dy, estimatedZ).normalize();

    const upperArmWorldDir = this.getUpperArmWorldDirection(target);
    worldDirection = this.constrainForearmAngle(worldDirection, upperArmWorldDir, this.MAX_ELBOW_ANGLE);

    const localDirection = this.toLocalDirection(worldDirection, target.middleBone.getStartJoint().parent);

    const prevQuat = isLeft ? this.prevLeftForeQuat : this.prevRightForeQuat;
    this.setDirectionSmoothed(target.middleBone, localDirection, prevQuat, isLeft ? "leftFore" : "rightFore");
  }

  private getUpperArmWorldDirection(target: Limb): THREE.Vector3 {
    const upperBone = target.parentBone;
    const startJoint = upperBone.getStartJoint();
    const endJoint = upperBone.getEndJoint();

    startJoint.updateWorldMatrix(true, false);
    endJoint.updateWorldMatrix(true, false);

    const startWorldPos = new THREE.Vector3();
    const endWorldPos = new THREE.Vector3();

    startJoint.getWorldPosition(startWorldPos);
    endJoint.getWorldPosition(endWorldPos);

    return endWorldPos.sub(startWorldPos).normalize();
  }

  private constrainForearmAngle(
    forearmDir: THREE.Vector3,
    upperArmDir: THREE.Vector3,
    maxAngle: number
  ): THREE.Vector3 {
    const angle = Math.acos(THREE.MathUtils.clamp(forearmDir.dot(upperArmDir), -1, 1));

    if (angle <= maxAngle) {
      return forearmDir;
    }

    const delta = angle - maxAngle;
    const axis = new THREE.Vector3().crossVectors(upperArmDir, forearmDir).normalize();

    if (axis.lengthSq() < 1e-6) {
      const fallback = new THREE.Vector3(0, 1, 0);
      axis.copy(fallback);
    }

    const rotated = forearmDir.clone().applyAxisAngle(axis, delta);
    return rotated.normalize();
  }

  private setDirectionSmoothed(
    bone: any,
    targetDirection: THREE.Vector3,
    prevQuat: THREE.Quaternion,
    boneKey: "leftUpper" | "rightUpper" | "leftFore" | "rightFore",
  ): void {
    const localAxis = new THREE.Vector3(0, -1, 0);
    const targetQuat = new THREE.Quaternion();
    targetQuat.setFromUnitVectors(localAxis, targetDirection.normalize());

    const smoothedQuat = new THREE.Quaternion().copy(prevQuat);
    smoothedQuat.slerp(targetQuat, this.SMOOTHING_FACTOR);

    bone.getStartJoint().quaternion.copy(smoothedQuat);

    if (boneKey === "leftUpper") this.prevLeftUpperQuat.copy(smoothedQuat);
    else if (boneKey === "rightUpper") this.prevRightUpperQuat.copy(smoothedQuat);
    else if (boneKey === "leftFore") this.prevLeftForeQuat.copy(smoothedQuat);
    else if (boneKey === "rightFore") this.prevRightForeQuat.copy(smoothedQuat);
  }

  private updateShoulderAnchors(
    leftShoulder: THREE.Vector3,
    rightShoulder: THREE.Vector3,
    leftAnchor: THREE.Object3D,
    rightAnchor: THREE.Object3D,
  ): void {
    const leftX = THREE.MathUtils.clamp((leftShoulder.x - 0.5) * 2, -1, 1) * 0.45;
    const rightX = THREE.MathUtils.clamp((rightShoulder.x - 0.5) * 2, -1, 1) * 0.45;
    const y = (leftAnchor.position.y + rightAnchor.position.y) / 2;

    leftAnchor.position.set(leftX, y, 0);
    rightAnchor.position.set(rightX, y, 0);
  }

  private getBoneParent(target: Limb): THREE.Object3D {
    return target.parentBone.getStartJoint().parent ?? target.parentBone.getStartJoint();
  }

  private toLocalDirection(
    direction: THREE.Vector3,
    parent: THREE.Object3D,
  ): THREE.Vector3 {
    const parentWorldQuat = new THREE.Quaternion();

    parent.updateMatrixWorld(true);
    parent.getWorldQuaternion(parentWorldQuat);
    return direction
      .clone()
      .applyQuaternion(parentWorldQuat.invert())
      .normalize();
  }
}
