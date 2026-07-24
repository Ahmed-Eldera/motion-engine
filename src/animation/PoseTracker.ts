import type { Pose } from "./Pose";

export interface PoseTracker {
  initialize(): Promise<void>;
  update(): Pose;
}
