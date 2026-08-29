import type { Pose } from "./Pose";

export abstract class PoseTracker {
  abstract initialize(): Promise<void>;
  abstract update(): Pose | null;

  protected updateCoordinatesDisplay(pose: Pose): void {
    const displayEl = document.getElementById('coordinates-display');
    if (!displayEl) return;
    
        displayEl.innerHTML = `
            <h3>Pose Coordinates</h3>
            <div class="limb">
                <div class="limb-name">LEFT ARM</div>
                <div class="joint">
                    <span class="joint-label">Shoulder:</span>
                    <span class="coords">(${pose.leftArm.parentJoint.x.toFixed(3)}, ${pose.leftArm.parentJoint.y.toFixed(3)}, ${pose.leftArm.parentJoint.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Elbow:</span>
                    <span class="coords">(${pose.leftArm.middleJoint.x.toFixed(3)}, ${pose.leftArm.middleJoint.y.toFixed(3)}, ${pose.leftArm.middleJoint.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Wrist:</span>
                    <span class="coords">(${pose.leftArm.endJoint.x.toFixed(3)}, ${pose.leftArm.endJoint.y.toFixed(3)}, ${pose.leftArm.endJoint.z.toFixed(3)})</span>
                </div>
            </div>
            <div class="limb">
                <div class="limb-name">RIGHT ARM</div>
                <div class="joint">
                    <span class="joint-label">Shoulder:</span>
                    <span class="coords">(${pose.rightArm.parentJoint.x.toFixed(3)}, ${pose.rightArm.parentJoint.y.toFixed(3)}, ${pose.rightArm.parentJoint.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Elbow:</span>
                    <span class="coords">(${pose.rightArm.middleJoint.x.toFixed(3)}, ${pose.rightArm.middleJoint.y.toFixed(3)}, ${pose.rightArm.middleJoint.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Wrist:</span>
                    <span class="coords">(${pose.rightArm.endJoint.x.toFixed(3)}, ${pose.rightArm.endJoint.y.toFixed(3)}, ${pose.rightArm.endJoint.z.toFixed(3)})</span>
                </div>
            </div>
            <div class="limb">
                <div class="limb-name">LEFT LEG</div>
                <div class="joint">
                    <span class="joint-label">Hip:</span>
                    <span class="coords">(${pose.leftLeg.parentJoint.x.toFixed(3)}, ${pose.leftLeg.parentJoint.y.toFixed(3)}, ${pose.leftLeg.parentJoint.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Knee:</span>
                    <span class="coords">(${pose.leftLeg.middleJoint.x.toFixed(3)}, ${pose.leftLeg.middleJoint.y.toFixed(3)}, ${pose.leftLeg.middleJoint.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Ankle:</span>
                    <span class="coords">(${pose.leftLeg.endJoint.x.toFixed(3)}, ${pose.leftLeg.endJoint.y.toFixed(3)}, ${pose.leftLeg.endJoint.z.toFixed(3)})</span>
                </div>
            </div>
            <div class="limb">
                <div class="limb-name">RIGHT LEG</div>
                <div class="joint">
                    <span class="joint-label">Hip:</span>
                    <span class="coords">(${pose.rightLeg.parentJoint.x.toFixed(3)}, ${pose.rightLeg.parentJoint.y.toFixed(3)}, ${pose.rightLeg.parentJoint.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Knee:</span>
                    <span class="coords">(${pose.rightLeg.middleJoint.x.toFixed(3)}, ${pose.rightLeg.middleJoint.y.toFixed(3)}, ${pose.rightLeg.middleJoint.z.toFixed(3)})</span>
                </div>
                <div class="joint">
                    <span class="joint-label">Ankle:</span>
                    <span class="coords">(${pose.rightLeg.endJoint.x.toFixed(3)}, ${pose.rightLeg.endJoint.y.toFixed(3)}, ${pose.rightLeg.endJoint.z.toFixed(3)})</span>
                </div>
            </div>
        `;
    }
}
