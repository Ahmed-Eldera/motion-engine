import { pipeline, env, RawImage } from "@huggingface/transformers";

const DEFAULT_MODEL_ID = "onnx-community/depth-anything-v2-small";

let estimator: any = null;

interface WorkerScope {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  onmessage: ((event: MessageEvent) => void) | null;
}

const scope = self as unknown as WorkerScope;

scope.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data;

  if (type === "init") {
    try {
      env.allowLocalModels = false;

      let device = "wasm";
      let dtype = "fp32";

      const gpu = (navigator as any)?.gpu;

      if (gpu) {
        try {
          const adapter = await gpu.requestAdapter();

          if (adapter) {
            device = "webgpu";
            dtype = "q4f16";
          }
        } catch {
          // WebGPU unavailable, fall back to WASM
        }
      }

      estimator = await pipeline("depth-estimation", DEFAULT_MODEL_ID, {
        device,
        dtype,
        progress_callback: (progress: any) => {
          if (progress?.status === "progress") {
            scope.postMessage({
              type: "progress",
              payload: {
                progress: progress.progress ?? 0,
                backend: device,
              },
            });
          }
        },
      } as any);

      scope.postMessage({
        type: "ready",
        payload: { backend: device, dtype },
      });
    } catch (error) {
      scope.postMessage({
        type: "error",
        payload: { message: (error as Error)?.message ?? String(error) },
      });
    }
    return;
  }

  if (type === "run") {
    try {
      if (!estimator) {
        scope.postMessage({ type: "error", payload: { message: "Not initialized" } });
        return;
      }

      const { imageData } = payload;

      const raw = new RawImage(imageData.data, imageData.width, imageData.height, 4);

      const output = await estimator(raw);

      const tensor = output?.predicted_depth ?? output?.depth;

      if (!tensor || !tensor.data) {
        scope.postMessage({ type: "error", payload: { message: "Unexpected depth output" } });
        return;
      }

      const dims = tensor.dims ?? [];
      const width = dims[dims.length - 1] ?? imageData.width;
      const height = dims[dims.length - 2] ?? imageData.height;

      const data = tensor.data instanceof Float32Array
        ? tensor.data
        : new Float32Array(tensor.data);

      const buffer = data.buffer.slice(
        data.byteOffset,
        data.byteOffset + data.byteLength,
      );

      scope.postMessage(
        {
          type: "result",
          payload: { width, height, data },
        },
        [buffer],
      );
    } catch (error) {
      scope.postMessage({
        type: "error",
        payload: { message: (error as Error)?.message ?? String(error) },
      });
    }
    return;
  }
};
