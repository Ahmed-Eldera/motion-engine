import * as THREE from "three";
import type { Limb } from "../assets/Limb";
import type { StickFigure } from "../assets/StickFigure";
import type { Pose, LimbPose } from "./Pose";
import { ArmCalibrator } from "../animation/ArmCalibrator";

export class SkeletonRetargeter {
  private calibrator: ArmCalibrator;
  public applyPose(
    pose: Pose,
    skeleton: StickFigure,
    calibrator: ArmCalibrator,
  ): void {
    this.calibrator = calibrator;
    this.updateUpperArm(pose.leftArm, skeleton.leftArm, this.calibrator.getUpperArmLength());

    this.updateUpperArm(pose.rightArm, skeleton.rightArm, this.calibrator.getUpperArmLength());

    // this.updateThigh(pose.leftLeg, skeleton.leftLeg);

    // this.updateThigh(pose.rightLeg, skeleton.rightLeg);

    // this.updateShin(pose.leftLeg, skeleton.leftLeg);

    // this.updateShin(pose.rightLeg, skeleton.rightLeg);

  //   this.updateForearm(pose.leftArm, skeleton.leftArm);

  //   this.updateForearm(pose.rightArm, skeleton.rightArm);
  }

private updateUpperArm(source: LimbPose, target: Limb,mxln:number): void {
  console.log(source);
    const dx = source.middleJoint.x - source.parentJoint.x;
    const dy = source.middleJoint.y - source.parentJoint.y;

    // Length visible in the image
    const projectedLength = Math.sqrt(dx * dx + dy * dy);

    // During calibration you'll replace this with the calibrated length
    const maxLength = mxln;

    const ratio = THREE.MathUtils.clamp(
        projectedLength / maxLength,
        0,
        1
    );

    // Estimate forward movement
    const estimatedZ = Math.sqrt(1 - ratio * ratio);

    const worldDirection = new THREE.Vector3(
        dx,
        dy,
        estimatedZ
    ).normalize();

    const localDirection = this.toLocalDirection(
        worldDirection,
        target.parentBone.getStartJoint().parent
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
    const currentLength = source.middleJoint.distanceTo(source.endJoint);

    const ratio = THREE.MathUtils.clamp(
      currentLength / this.calibrator.getForearmLength(),
      0,
      1,
    );
    console.log("ratio: " + ratio);
    const forwardAngle = Math.acos(ratio);

    worldDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), forwardAngle);
    target.middleBone.setDirection(localDirection);
    
    const upperDirection = new THREE.Vector3()
      .subVectors(source.middleJoint, source.parentJoint)
      .normalize();

    const forearmDirection = new THREE.Vector3()
      .subVectors(source.endJoint, source.middleJoint)
      .normalize();
    const elbowAngle = forearmDirection.angleTo(upperDirection);

    // console.log(THREE.MathUtils.radToDeg(elbowAngle));
  }

  private toLocalDirection(
    direction: THREE.Vector3,
    parent: THREE.Object3D,
  ): THREE.Vector3 {
    const parentWorldQuat = new THREE.Quaternion();

    parent.updateMatrixWorld(true);
    parent.getWorldQuaternion(parentWorldQuat);
    // console.log(parentWorldQuat.toArray());
    return direction
      .clone()
      .applyQuaternion(parentWorldQuat.invert())
      .normalize();
  }
}
