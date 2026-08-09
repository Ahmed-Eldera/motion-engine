import * as THREE from "three";
import type { ArmCalibrator } from "./ArmCalibrator";
import { finiteOr, isFiniteVec } from "./sanitize";

interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  landmarks: Landmark[];
  label?: string;
}

export interface ArmDepthPose {
  shoulder: THREE.Vector3;
  elbow: THREE.Vector3;
  wrist: THREE.Vector3;
  handReachMm?: number;
}

export interface DepthEstimate {
  left: ArmDepthPose;
  right: ArmDepthPose;
  calibrated: boolean;
  aiStatus?: string;
}

export interface DepthMap {
  width: number;
  height: number;
  data: Float32Array;
}

export interface DepthSampler {
  sample(normalizedX: number, normalizedY: number): number | undefined;
  readonly label?: string;
  getDepthMap?(): DepthMap | null;
}

const LEFT_SHOULDER = 11;
const LEFT_ELBOW = 13;
const LEFT_WRIST = 15;
const RIGHT_SHOULDER = 12;
const RIGHT_ELBOW = 14;
const RIGHT_WRIST = 16;

export class DepthEstimator {
  public estimate(
    lm: Landmark[],
    hands: HandData[],
    calibrator: ArmCalibrator | undefined,
    sampler?: DepthSampler,
  ): DepthEstimate {
    const calibrated = !!calibrator && calibrator.isCalibrated();

    const upperLen = calibrator?.getUpperArmLength() ?? 0;
    const forearmLen = calibrator?.getForearmLength() ?? 0;

    const left = this.triangulateArm(
      lm,
      hands,
      calibrator,
      sampler,
      LEFT_SHOULDER,
      LEFT_ELBOW,
      LEFT_WRIST,
      "Left",
      upperLen,
      forearmLen,
    );

    const right = this.triangulateArm(
      lm,
      hands,
      calibrator,
      sampler,
      RIGHT_SHOULDER,
      RIGHT_ELBOW,
      RIGHT_WRIST,
      "Right",
      upperLen,
      forearmLen,
    );

    return { left, right, calibrated };
  }

  private triangulateArm(
    lm: Landmark[],
    hands: HandData[],
    calibrator: ArmCalibrator | undefined,
    sampler: DepthSampler | undefined,
    shoulderIdx: number,
    elbowIdx: number,
    wristIdx: number,
    label: "Left" | "Right",
    upperLen: number,
    forearmLen: number,
  ): ArmDepthPose {
    const shoulder = this.safe(lm[shoulderIdx]);
    const elbow = this.safe(lm[elbowIdx]);
    const wristLm = this.safe(lm[wristIdx]);

    if (!shoulder || !elbow || !wristLm) {
      return {
        shoulder: new THREE.Vector3(),
        elbow: new THREE.Vector3(),
        wrist: new THREE.Vector3(),
      };
    }

    const s = new THREE.Vector3(shoulder.x, -shoulder.y, 0);

    const wrist = { ...wristLm };
    const hand = hands.find((h) => h.label === label);

    // Stabilize the wrist with the hand detector when the arm is
    // foreshortened (pointing toward the camera) and the pose landmarks
    // become unreliable.
    if (hand?.landmarks?.length) {
      const handWrist = hand.landmarks[0];

      if (handWrist && isFiniteVec(handWrist.x, handWrist.y, handWrist.z)) {
        const span = upperLen + forearmLen;
        const projSpan = Math.hypot(wrist.x - shoulder.x, wrist.y - shoulder.y);
        const occlusion = 1 - THREE.MathUtils.clamp(projSpan / (span || 1), 0, 1);
        const blend = THREE.MathUtils.clamp(occlusion * 2, 0, 1);

        if (blend > 0) {
          wrist.x += (finiteOr(handWrist.x) - wrist.x) * blend;
          wrist.y += (finiteOr(handWrist.y) - wrist.y) * blend;
        }
      }
    }

    const e = this.extend(s, elbow, upperLen);
    const w = this.extend(e, wrist, forearmLen);

    this.applyDepthMapSign(s, e, w, shoulder, elbow, wristLm, sampler);

    const boost = this.handDepthBoost(hand, calibrator, label);

    if (boost !== 0) {
      const dir = w.clone().sub(e);
      dir.z += boost;
      const len = dir.length() || 1;
      w.copy(e).add(dir.multiplyScalar(forearmLen / len));
    }

    const arm: ArmDepthPose = { shoulder: s, elbow: e, wrist: w };
    arm.handReachMm = this.handReach(hands, label);

    return arm;
  }

  private applyDepthMapSign(
    s: THREE.Vector3,
    e: THREE.Vector3,
    w: THREE.Vector3,
    shoulder: Landmark,
    elbow: Landmark,
    wrist: Landmark,
    sampler: DepthSampler | undefined,
  ): void {
    if (!sampler) return;

    // Bigger depth-map value = closer to camera.
    const ds = sampler.sample(shoulder.x, shoulder.y);
    const de = sampler.sample(elbow.x, elbow.y);
    const dw = sampler.sample(wrist.x, wrist.y);

    if (ds == null || de == null || dw == null) return;

    const gradUpper = ds - de;
    const gradFore = de - dw;

    const setSign = (value: number, grad: number): number => {
      if (!Number.isFinite(grad) || Math.abs(grad) < 1e-6) return value;

      return Math.abs(value) * Math.sign(grad);
    };

    e.z = setSign(e.z, gradUpper);
    w.z = setSign(w.z - s.z, gradUpper + gradFore) + s.z;
  }

  private safe(landmark: Landmark | undefined): Landmark | undefined {
    if (!landmark) return undefined;

    return {
      x: finiteOr(landmark.x),
      y: finiteOr(landmark.y),
      z: finiteOr(landmark.z),
    };
  }

  private extend(
    base: THREE.Vector3,
    landmark: Landmark,
    maxLen: number,
  ): THREE.Vector3 {
    const target = new THREE.Vector3(landmark.x, -landmark.y, 0);
    const dx = target.x - base.x;
    const dy = target.y - base.y;
    const projected = Math.hypot(dx, dy);

    if (projected <= 1e-6 || maxLen <= 0 || !Number.isFinite(projected)) {
      return new THREE.Vector3(base.x, base.y, base.z + maxLen);
    }

    // Same units as x/y: z = sqrt(trueLength^2 - projectedLength^2).
    // Depth accumulates along the chain (base.z + z).
    const z = Math.sqrt(Math.max(0, maxLen * maxLen - projected * projected));

    return new THREE.Vector3(target.x, target.y, base.z + z);
  }

  private handDepthBoost(
    hand: HandData | undefined,
    calibrator: ArmCalibrator | undefined,
    label: "Left" | "Right",
  ): number {
    if (!hand?.landmarks?.length || !calibrator) return 0;

    const baseline =
      label === "Left"
        ? calibrator.getLeftHandSizeBaseline()
        : calibrator.getRightHandSizeBaseline();

    if (baseline <= 0) return 0;

    const size = this.computeHandSize(hand.landmarks);
    const scale = size / baseline;

    return THREE.MathUtils.clamp((scale - 1) * 0.2, -0.08, 0.3);
  }

  private handReach(hands: HandData[], label: "Left" | "Right"): number | undefined {
    const hand = hands.find((h) => h.label === label);

    if (!hand || !hand.landmarks?.length) return undefined;

    let reach = 0;

    for (const p of hand.landmarks) {
      if (!p) continue;

      const z = finiteOr(p.z, 0);

      if (z > reach) reach = z;
    }

    return reach;
  }

  private computeHandSize(landmarks: Landmark[]): number {
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const landmark of landmarks) {
      if (!landmark) continue;

      const x = finiteOr(landmark.x);
      const y = finiteOr(landmark.y);

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    return Math.hypot(maxX - minX, maxY - minY);
  }
}
