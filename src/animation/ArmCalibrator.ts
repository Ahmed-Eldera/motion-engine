import type { Pose } from "./Pose";

export const CalibrationState = {
    WAITING: "WAITING",
    CAPTURING: "CAPTURING",
    DONE: "DONE"
}

export class ArmCalibrator {

    private state = CalibrationState.WAITING;

    private readonly SAMPLE_COUNT = 30;

    private upperSamples: number[] = [];
    private forearmSamples: number[] = [];

    private upperArmLength = 0;
    private forearmLength = 0;

    private leftHandSize = 0;
    private rightHandSize = 0;

    private leftHandSizeSamples: number[] = [];
    private rightHandSizeSamples: number[] = [];

    public start(): void {
        this.showMessage(
            "Calibration: Extend your LEFT arm sideways and hold your left hand open toward the camera, then click when ready."
        );
    }

    public beginCapture(): void {

        if (this.state !== CalibrationState.WAITING)
            return;

        this.state = CalibrationState.CAPTURING;

        this.upperSamples = [];
        this.forearmSamples = [];
        this.leftHandSizeSamples = [];
        this.rightHandSizeSamples = [];

        this.showMessage("Hold still...");
    }

    public update(pose: Pose): void {

        if (this.state !== CalibrationState.CAPTURING)
            return;

        const upper =
            pose.leftArm.parentJoint.distanceTo(
                pose.leftArm.middleJoint
            );

        const forearm =
            pose.leftArm.middleJoint.distanceTo(
                pose.leftArm.endJoint
            );

        this.upperSamples.push(upper);
        this.forearmSamples.push(forearm);

        if (pose.leftHandSize != null) {
            this.leftHandSizeSamples.push(pose.leftHandSize);
        }

        if (pose.rightHandSize != null) {
            this.rightHandSizeSamples.push(pose.rightHandSize);
        }

        if (this.upperSamples.length < this.SAMPLE_COUNT)
            return;

        this.upperArmLength = this.average(this.upperSamples);
        this.forearmLength = this.average(this.forearmSamples);
        this.leftHandSize = this.leftHandSizeSamples.length > 0 ? this.average(this.leftHandSizeSamples) : 0;
        this.rightHandSize = this.rightHandSizeSamples.length > 0 ? this.average(this.rightHandSizeSamples) : 0;

        this.state = CalibrationState.DONE;

        this.showMessage("Calibration complete!");
    }

    private average(values: number[]): number {

        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    public isCalibrated(): boolean {
        return this.state === CalibrationState.DONE;
    }

    public getUpperArmLength(): number {
        return this.upperArmLength;
    }

    public getForearmLength(): number {
        return this.forearmLength;
    }

    public getLeftHandSizeBaseline(): number {
        return this.leftHandSize;
    }

    public getRightHandSizeBaseline(): number {
        return this.rightHandSize;
    }

    public getHandSizeScale(hand: "left" | "right", currentSize: number): number {
        const baseline = hand === "left" ? this.leftHandSize : this.rightHandSize;
        return baseline > 0 ? currentSize / baseline : 1;
    }

    private showMessage(message: string): void {

        let div = document.getElementById("calibration");

        if (!div) {

            div = document.createElement("div");

            div.id = "calibration";

            div.style.position = "fixed";
            div.style.top = "20px";
            div.style.left = "50%";
            div.style.transform = "translateX(-50%)";
            div.style.padding = "12px";
            div.style.background = "black";
            div.style.color = "white";
            div.style.fontSize = "20px";

            document.body.appendChild(div);
        }

        div.textContent = message;
    }
}