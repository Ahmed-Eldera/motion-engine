import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { StickFigure } from "../assets/StickFigure";
import type { Pose, LimbPose } from "../animation/Pose";
import type { ArmCalibrator } from "../animation/ArmCalibrator";
import { isFiniteVec } from "../animation/sanitize";

export class MainScene {
  private scene: THREE.Scene;
  private figure: StickFigure;
  private vampireModel?: THREE.Group;
  private vampireBones: {
    leftUpper?: THREE.Bone;
    rightUpper?: THREE.Bone;
    leftFore?: THREE.Bone;
    rightFore?: THREE.Bone;
  } = {};
  private vampirePrevQuats = {
    leftUpper: new THREE.Quaternion(),
    rightUpper: new THREE.Quaternion(),
    leftFore: new THREE.Quaternion(),
    rightFore: new THREE.Quaternion(),
  };
  private bindQuats = {
    leftUpper: new THREE.Quaternion(),
    rightUpper: new THREE.Quaternion(),
    leftFore: new THREE.Quaternion(),
    rightFore: new THREE.Quaternion(),
  };

  constructor() {
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x202020);
    this.scene.fog = new THREE.Fog(0x202020, 4, 18);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(3, 6, 4);
    this.scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xffccaa, 0.45, 12);
    fillLight.position.set(0, 3, 2);
    this.scene.add(fillLight);

    const grid = new THREE.GridHelper(10, 10);
    this.scene.add(grid);

    this.figure = new StickFigure(material);
    this.figure.getRoot().position.set(0, 5, 0);
    this.figure.getRoot().rotation.y = Math.PI;
    this.scene.add(this.figure.getRoot());

    this.loadVampireModel();

    const axes = new THREE.AxesHelper(5);
    this.scene.add(axes);
    const material1 = new THREE.MeshBasicMaterial({
      color: 0xfff,
    });
    this.figure.rightArm.parentBone.changeMaterial(material1);
    const material2 = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const material3 = new THREE.MeshBasicMaterial({
      color: 0xfff,
    });
    const material4 = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
  }

  private loadVampireModel(): void {
    const loader = new FBXLoader();
    const modelPath = encodeURI("/Vampire A Lusth.fbx");

    loader.load(
      modelPath,
      (object) => {
        this.vampireModel = object as THREE.Group;
        this.vampireModel.scale.setScalar(0.03);
        this.vampireModel.position.set(0, -0.2, 0);
        // this.vampireModel.rotation.y = Math.PI;

        this.findVampireBones();
        this.scene.add(this.vampireModel);
        this.figure.getRoot().visible = true;
      },
      undefined,
      (error) => {
        console.error("Failed to load vampire model:", error);
      },
    );
  }

  private findVampireBones(): void {
    if (!this.vampireModel) return;

    this.vampireModel.traverse((child) => {
      // console.log(child);
      if (!(child as THREE.Bone).isBone) return;

      const bone = child as THREE.Bone;
      const name = bone.name.toLowerCase();
      

      if (name.includes("mixamorigleftarm")) {
        this.vampireBones.leftUpper ??= bone;
        this.bindQuats.leftUpper.copy(bone.quaternion);
        const bindAxis =
    bone.children
        .find(c => c instanceof THREE.Bone)!
        .position
        .clone()
        .normalize();
        console.log(
    name,
    "bindAxis",
    bindAxis.toArray()
);
      }

      if (name.includes("mixamorigrightarm")) {
        this.vampireBones.rightUpper ??= bone;
        this.bindQuats.rightUpper.copy(bone.quaternion);
                const bindAxis =
    bone.children
        .find(c => c instanceof THREE.Bone)!
        .position
        .clone()
        .normalize();
        console.log(
    name,
    "bindAxis",
    bindAxis.toArray()
);
      }

      if (name.includes("mixamorigleftforearm")) {
        this.vampireBones.leftFore ??= bone;
        this.bindQuats.leftFore.copy(bone.quaternion);
                const bindAxis =
    bone.children
        .find(c => c instanceof THREE.Bone)!
        .position
        .clone()
        .normalize();
        console.log(
    name,
    "bindAxis",
    bindAxis.toArray()
);
      }

      if (name.includes("mixamorigrightforearm")) {
        this.vampireBones.rightFore ??= bone;
        this.bindQuats.rightFore.copy(bone.quaternion);
                const bindAxis =
    bone.children
        .find(c => c instanceof THREE.Bone)!
        .position
        .clone()
        .normalize();
        console.log(
    name,
    "bindAxis",
    bindAxis.toArray()
);
      }
    });
  }

  public updateVampireFromPose(pose: Pose, calibrator: ArmCalibrator): void {
    if (!this.vampireModel) return;

    const depth = pose.armDepth;
    const left = depth?.left ?? this.armFromPose(pose.leftArm, calibrator);
    const right = depth?.right ?? this.armFromPose(pose.rightArm, calibrator);

    this.applyBoneFromPose(this.vampireBones.leftUpper, left.shoulder, left.elbow, "leftUpper");
    this.applyBoneFromPose(this.vampireBones.rightUpper, right.shoulder, right.elbow, "rightUpper");
    this.applyBoneFromPose(this.vampireBones.leftFore, left.elbow, left.wrist, "leftFore");
    this.applyBoneFromPose(this.vampireBones.rightFore, right.elbow, right.wrist, "rightFore");
  }

  private armFromPose(limb: LimbPose, calibrator: ArmCalibrator): { shoulder: THREE.Vector3; elbow: THREE.Vector3; wrist: THREE.Vector3 } {
    const upperLen = calibrator.getUpperArmLength();
    const forearmLen = calibrator.getForearmLength();

    const s = limb.parentJoint.clone().setZ(0);
    const e = this.extendJoint(s, limb.middleJoint, upperLen);
    const w = this.extendJoint(e, limb.endJoint, forearmLen);

    return { shoulder: s, elbow: e, wrist: w };
  }

  private extendJoint(base: THREE.Vector3, target: THREE.Vector3, maxLen: number): THREE.Vector3 {
    const projected = Math.hypot(target.x - base.x, target.y - base.y);
    const dir = new THREE.Vector3(target.x - base.x, target.y - base.y, 0);

    if (projected <= 1e-6 || maxLen <= 0) {
      return new THREE.Vector3(base.x, base.y, base.z + maxLen);
    }

    const z = Math.sqrt(Math.max(0, maxLen * maxLen - projected * projected));

    return dir.normalize().multiplyScalar(projected).add(base).setZ(base.z + z);
  }

  private applyBoneFromPose(
    bone: THREE.Bone | undefined,
    start: THREE.Vector3,
    end: THREE.Vector3,
    key: "leftUpper" | "rightUpper" | "leftFore" | "rightFore",
  ): void {
    if (!bone) return;

    const worldDirection = end.clone().sub(start);

    if (worldDirection.lengthSq() < 1e-9 || !isFiniteVec(worldDirection.x, worldDirection.y, worldDirection.z)) return;

    const parentQuat = new THREE.Quaternion();

bone.parent!.getWorldQuaternion(parentQuat);

const localDirection = worldDirection
    .clone()
    .applyQuaternion(parentQuat.invert())
    .normalize();
    const poseQuat = new THREE.Quaternion();
const bindAxis =
    bone.children
        .find(c => c instanceof THREE.Bone)!
        .position
        .clone()
        .normalize();
poseQuat.setFromUnitVectors(
    bindAxis,
    localDirection
);
    const targetQuat = this.bindQuats[key].clone().multiply(poseQuat);
    const prevQuat = this.vampirePrevQuats[key];

    if (prevQuat.dot(targetQuat) < 0) {
      targetQuat.x *= -1;
      targetQuat.y *= -1;
      targetQuat.z *= -1;
      targetQuat.w *= -1;
    }

    const smoothedQuat = new THREE.Quaternion()
      .copy(prevQuat)
      .slerp(targetQuat, 0.25);

    bone.quaternion.copy(smoothedQuat);
    prevQuat.copy(smoothedQuat);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getFigure(): StickFigure {
    return this.figure;
  }
}
