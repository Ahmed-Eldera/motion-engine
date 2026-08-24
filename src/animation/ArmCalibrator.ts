import type { Pose } from "./Pose";

export const CalibrationState = {
    WAITING: "WAITING",
    CAPTURING: "CAPTURING",
    DONE: "DONE"
}

export class ArmCalibrator {

    private state = CalibrationState.WAITING;

    private readonly SAMPLE_COUNT = 30;
    private readonly ASPECT = 1280 / 720;

    private upperSamples: number[] = [];
    private forearmSamples: number[] = [];
    private upperLegSamples: number[] = [];
    private lowerLegSamples: number[] = [];

    private upperArmLength = 0;
    private forearmLength = 0;
    private upperLegLength = 0;
    private lowerLegLength = 0;

    public start(): void {
        this.showMessage(
            "Calibration: Extend your LEFT arm sideways and keep your legs straight, then click to start the 5-second countdown."
        );
    }

    public beginCapture(): void {

        if (this.state !== CalibrationState.WAITING)
            return;

        this.state = CalibrationState.CAPTURING;

        this.upperSamples = [];
        this.forearmSamples = [];
        this.upperLegSamples = [];
        this.lowerLegSamples = [];

        this.showMessage("Hold still...");
    }

    public update(pose: Pose): void {

        if (this.state !== CalibrationState.CAPTURING)
            return;

        const upper = this.lengthWithAspect(pose.leftArm.parentJoint, pose.leftArm.middleJoint);

        const forearm = this.lengthWithAspect(pose.leftArm.middleJoint, pose.leftArm.endJoint);

        this.upperSamples.push(upper);
        this.forearmSamples.push(forearm);

        const upperLeg = this.lengthWithAspect(pose.leftLeg.parentJoint, pose.leftLeg.middleJoint);

        const lowerLeg = this.lengthWithAspect(pose.leftLeg.middleJoint, pose.leftLeg.endJoint);

        this.upperLegSamples.push(upperLeg);
        this.lowerLegSamples.push(lowerLeg);

        if (this.upperSamples.length < this.SAMPLE_COUNT)
            return;

        this.upperArmLength = this.average(this.upperSamples);
        this.forearmLength = this.average(this.forearmSamples);
        this.upperLegLength = this.average(this.upperLegSamples);
        this.lowerLegLength = this.average(this.lowerLegSamples);

        this.state = CalibrationState.DONE;

        this.showMessage("Calibration complete!");
    }

    private average(values: number[]): number {

        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    private lengthWithAspect(a: { x: number; y: number }, b: { x: number; y: number }): number {
        const dx = (a.x - b.x) * this.ASPECT;
        const dy = a.y - b.y;
        return Math.hypot(dx, dy);
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

    public getUpperLegLength(): number {
        return this.upperLegLength;
    }

    public getLowerLegLength(): number {
        return this.lowerLegLength;
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