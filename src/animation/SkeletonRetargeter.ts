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
  private prevLeftUpperLegQuat: THREE.Quaternion = new THREE.Quaternion();
  private prevRightUpperLegQuat: THREE.Quaternion = new THREE.Quaternion();
  private prevLeftLowerLegQuat: THREE.Quaternion = new THREE.Quaternion();
  private prevRightLowerLegQuat: THREE.Quaternion = new THREE.Quaternion();
  
  private readonly SMOOTHING_FACTOR = 0.6; // higher = more responsive, less lag
  private readonly MAX_ELBOW_ANGLE = Math.PI * 0.95; // Max 171 degrees
  private readonly MAX_KNEE_ANGLE = Math.PI * 0.98; // Max ~176 degrees
  private readonly FILTER_ALPHA = 0.35;
  private readonly DEAD_ZONE = 0.92;
  private readonly ASPECT = 1280 / 720;

  private filteredLengths: Record<string, number> = {
    leftUpper: 0,
    rightUpper: 0,
    leftFore: 0,
    rightFore: 0,
    leftUpperLeg: 0,
    rightUpperLeg: 0,
    leftLowerLeg: 0,
    rightLowerLeg: 0,
  };

  private filteredInit: Record<string, boolean> = {
    leftUpper: false,
    rightUpper: false,
    leftFore: false,
    rightFore: false,
    leftUpperLeg: false,
    rightUpperLeg: false,
    leftLowerLeg: false,
    rightLowerLeg: false,
  };

  private filterLength(key: string, raw: number): number {
    if (!this.filteredInit[key]) {
      this.filteredInit[key] = true;
      this.filteredLengths[key] = raw;
      return raw;
    }

    const prev = this.filteredLengths[key];
    const filtered = prev + this.FILTER_ALPHA * (raw - prev);
    this.filteredLengths[key] = filtered;
    return filtered;
  }

  private computeEstimatedZ(filteredLength: number, maxLength: number): number {
    if (maxLength <= 1e-6) return 0;

    const ratio = THREE.MathUtils.clamp(filteredLength / maxLength, 0, 1);
    if (ratio > this.DEAD_ZONE) return 0;

    return Math.sqrt(Math.max(0, 1 - ratio * ratio));
  }
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

    this.updateForearm(pose.leftArm, skeleton.leftArm, this.calibrator.getForearmLength(), true);
    this.updateForearm(pose.rightArm, skeleton.rightArm, this.calibrator.getForearmLength(), false);

    this.updateUpperLeg(pose.leftLeg, skeleton.leftLeg, this.calibrator.getUpperLegLength(), true);
    this.updateUpperLeg(pose.rightLeg, skeleton.rightLeg, this.calibrator.getUpperLegLength(), false);

    this.updateLowerLeg(
      pose.leftLeg,
      skeleton.leftLeg,
      this.calibrator.getLowerLegLength(),
      true,
    );
    this.updateLowerLeg(
      pose.rightLeg,
      skeleton.rightLeg,
      this.calibrator.getLowerLegLength(),
      false,
    );
  }

  private updateUpperArm(source: LimbPose, target: Limb, mxln: number, isLeft: boolean): void {
    const dx = source.middleJoint.x - source.parentJoint.x;
    const dy = source.middleJoint.y - source.parentJoint.y;

    const rawLength = Math.hypot(dx * this.ASPECT, dy);
    const key = isLeft ? "leftUpper" : "rightUpper";
    const projectedLength = this.filterLength(key, rawLength);
    const estimatedZ = this.computeEstimatedZ(projectedLength, mxln);

    const worldDirection = new THREE.Vector3(dx, dy, estimatedZ).normalize();
    const localDirection = this.toLocalDirection(worldDirection, this.getBoneParent(target));

    const prevQuat = isLeft ? this.prevLeftUpperQuat : this.prevRightUpperQuat;
    this.setDirectionSmoothed(target.parentBone, localDirection, prevQuat, isLeft ? "leftUpper" : "rightUpper");
  }

  private updateForearm(source: LimbPose, target: Limb, mxln: number, isLeft: boolean): void {
    const dx = source.endJoint.x - source.middleJoint.x;
    const dy = source.endJoint.y - source.middleJoint.y;

    const rawLength = Math.hypot(dx * this.ASPECT, dy);
    const key = isLeft ? "leftFore" : "rightFore";
    const projectedLength = this.filterLength(key, rawLength);
    const estimatedZ = this.computeEstimatedZ(projectedLength, mxln);

    let worldDirection = new THREE.Vector3(dx, dy, estimatedZ).normalize();

    const upperArmWorldDir = this.getUpperArmWorldDirection(target);
    worldDirection = this.constrainAngle(worldDirection, upperArmWorldDir, this.MAX_ELBOW_ANGLE);

    const localDirection = this.toLocalDirection(worldDirection, target.middleBone.getStartJoint().parent!);

    const prevQuat = isLeft ? this.prevLeftForeQuat : this.prevRightForeQuat;
    this.setDirectionSmoothed(target.middleBone, localDirection, prevQuat, isLeft ? "leftFore" : "rightFore");
  }

  private updateUpperLeg(source: LimbPose, target: Limb, mxln: number, isLeft: boolean): void {
    const dx = source.middleJoint.x - source.parentJoint.x;
    const dy = source.middleJoint.y - source.parentJoint.y;

    const rawLength = Math.hypot(dx * this.ASPECT, dy);
    const key = isLeft ? "leftUpperLeg" : "rightUpperLeg";
    const projectedLength = this.filterLength(key, rawLength);
    const estimatedZ = this.computeEstimatedZ(projectedLength, mxln);

    const worldDirection = new THREE.Vector3(dx, dy, estimatedZ).normalize();
    const localDirection = this.toLocalDirection(worldDirection, this.getBoneParent(target));

    const prevQuat = isLeft ? this.prevLeftUpperLegQuat : this.prevRightUpperLegQuat;
    this.setDirectionSmoothed(target.parentBone, localDirection, prevQuat, isLeft ? "leftUpperLeg" : "rightUpperLeg");
  }

  private updateLowerLeg(source: LimbPose, target: Limb, mxln: number, isLeft: boolean): void {
    const dx = source.endJoint.x - source.middleJoint.x;
    const dy = source.endJoint.y - source.middleJoint.y;

    const rawLength = Math.hypot(dx * this.ASPECT, dy);
    const key = isLeft ? "leftLowerLeg" : "rightLowerLeg";
    const projectedLength = this.filterLength(key, rawLength);
    const estimatedZ = this.computeEstimatedZ(projectedLength, mxln);

    let worldDirection = new THREE.Vector3(dx, dy, estimatedZ).normalize();

    const upperLegWorldDir = this.getUpperArmWorldDirection(target);
    worldDirection = this.constrainAngle(worldDirection, upperLegWorldDir, this.MAX_KNEE_ANGLE);

    const localDirection = this.toLocalDirection(worldDirection, target.middleBone.getStartJoint().parent!);

    const prevQuat = isLeft ? this.prevLeftLowerLegQuat : this.prevRightLowerLegQuat;
    this.setDirectionSmoothed(target.middleBone, localDirection, prevQuat, isLeft ? "leftLowerLeg" : "rightLowerLeg");
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

  private constrainAngle(
    direction: THREE.Vector3,
    referenceDir: THREE.Vector3,
    maxAngle: number
  ): THREE.Vector3 {
    const angle = Math.acos(THREE.MathUtils.clamp(direction.dot(referenceDir), -1, 1));

    if (angle <= maxAngle) {
      return direction;
    }

    const delta = angle - maxAngle;
    const axis = new THREE.Vector3().crossVectors(referenceDir, direction).normalize();

    if (axis.lengthSq() < 1e-6) {
      const fallback = new THREE.Vector3(0, 1, 0);
      axis.copy(fallback);
    }

    const rotated = direction.clone().applyAxisAngle(axis, delta);
    return rotated.normalize();
  }

  private setDirectionSmoothed(
    bone: any,
    targetDirection: THREE.Vector3,
    prevQuat: THREE.Quaternion,
    boneKey: "leftUpper" | "rightUpper" | "leftFore" | "rightFore" | "leftUpperLeg" | "rightUpperLeg" | "leftLowerLeg" | "rightLowerLeg",
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
    else if (boneKey === "leftUpperLeg") this.prevLeftUpperLegQuat.copy(smoothedQuat);
    else if (boneKey === "rightUpperLeg") this.prevRightUpperLegQuat.copy(smoothedQuat);
    else if (boneKey === "leftLowerLeg") this.prevLeftLowerLegQuat.copy(smoothedQuat);
    else if (boneKey === "rightLowerLeg") this.prevRightLowerLegQuat.copy(smoothedQuat);
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
