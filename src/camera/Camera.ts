export class Camera {
  private video: HTMLVideoElement;
  private stream: MediaStream | null = null;
  private canvas: HTMLCanvasElement;
private ctx: CanvasRenderingContext2D;
private static instance: Camera | null = null;
private static readonly TEST_VIDEO_PATH = "/TestDrive.mp4";
private useTestVideo = true;
private sourceButton: HTMLButtonElement | null = null;
private controlsBar: HTMLDivElement | null = null;
  private constructor() {
    this.video = document.createElement("video");

    this.video.style.position = "fixed";
    this.video.style.top = "0";
    this.video.style.left = "0";
    this.video.style.width = "320px";
    this.video.style.height = "180px";
    this.video.style.zIndex = "999";
    this.video.style.background = "red";
    this.video.style.border = "5px solid yellow";
    document.body.appendChild(this.video);
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.muted = true;
    this.canvas = document.createElement("canvas");

    this.canvas.width = 1280;
    this.canvas.height = 720;

    this.canvas.style.position = "fixed";
    this.canvas.style.top = "10px";
    this.canvas.style.left = "10px";
    this.canvas.style.width = "320px";
    this.canvas.style.height = "180px";
    this.canvas.style.zIndex = "1001";

    document.body.appendChild(this.canvas);

    const ctx = this.canvas.getContext("2d");

    if (!ctx) throw new Error("Couldn't create canvas");

    this.ctx = ctx;

    this.createSourceToggleButton();
  }
  public static getInstance(): Camera {
    if (!Camera.instance) {
      Camera.instance = new Camera();
    }

    return Camera.instance;
  }
  public async start(): Promise<void> {
    this.canvas.style.transform = "scaleX(-1)";
    this.video.style.transform = "scaleX(-1)";

    if (this.useTestVideo) {
      this.createTestControls();
      await this.startTestVideo();
    } else {
      await this.startCamera();
    }

    if (this.sourceButton) this.sourceButton.disabled = false;
  }

  private async startTestVideo(): Promise<void> {
    console.log("Using test video:", Camera.TEST_VIDEO_PATH);

    this.useTestVideo = true;
    this.stopStream();
    this.video.srcObject = null;
    this.video.src = Camera.TEST_VIDEO_PATH;
    this.video.loop = true;

    if (this.controlsBar) this.controlsBar.style.display = "flex";

    await this.waitForReady();
    await this.video.play();

    console.log("Playing test video");
  }

  private async startCamera(): Promise<void> {
    console.log("Requesting camera");

    this.useTestVideo = false;
    this.video.pause();
    this.video.removeAttribute("src");
    this.video.load();

    if (this.controlsBar) this.controlsBar.style.display = "none";

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 1280,
        height: 720,
        facingMode: "user",
      },
      audio: false,
    });

    this.video.srcObject = this.stream;
    await this.waitForReady();
    await this.video.play();

    console.log("Playing camera feed");
  }

  private waitForReady(): Promise<void> {
    if (this.video.readyState >= 2 && this.video.videoWidth > 0) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Video ready timeout"));
      }, 5000);

      const onCanPlay = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error("Video failed to load"));
      };

      const cleanup = () => {
        clearTimeout(timeout);
        this.video.removeEventListener("canplay", onCanPlay);
        this.video.removeEventListener("error", onError);
      };

      this.video.addEventListener("canplay", onCanPlay);
      this.video.addEventListener("error", onError);
    });
  }

  private stopStream(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }

  private createSourceToggleButton(): void {
    const btn = document.createElement("button");

    btn.textContent = "Use Camera";
    btn.disabled = true;
    btn.style.position = "fixed";
    btn.style.top = "244px";
    btn.style.left = "10px";
    btn.style.zIndex = "1002";
    btn.style.padding = "6px 10px";
    btn.style.cursor = "pointer";
    btn.style.fontFamily = "'Courier New', monospace";
    btn.style.background = "rgba(0, 0, 0, 0.75)";
    btn.style.color = "#ffffff";
    btn.style.border = "1px solid #888888";
    btn.style.borderRadius = "4px";

    btn.addEventListener("click", () => {
      this.toggleSource(btn);
    });

    this.sourceButton = btn;
    document.body.appendChild(btn);
  }

  private async toggleSource(btn: HTMLButtonElement): Promise<void> {
    if (btn.disabled) return;

    btn.disabled = true;

    try {
      if (this.useTestVideo) {
        await this.startCamera();
        btn.textContent = "Use Test Video";
      } else {
        await this.startTestVideo();
        btn.textContent = "Use Camera";
      }
    } catch (error) {
      console.error("Failed to switch video source:", error);
      alert(`Failed to switch: ${(error as Error).message}`);
    } finally {
      btn.disabled = false;
    }
  }

  public stop(): void {
    this.stopStream();
  }

  private playPauseButton: HTMLButtonElement | null = null;
  private scrubber: HTMLInputElement | null = null;
  private timeLabel: HTMLSpanElement | null = null;

  private createTestControls(): void {
    const bar = document.createElement("div");

    bar.style.position = "fixed";
    bar.style.top = "200px";
    bar.style.left = "10px";
    bar.style.zIndex = "1002";
    bar.style.display = "flex";
    bar.style.alignItems = "center";
    bar.style.gap = "6px";
    bar.style.padding = "6px 8px";
    bar.style.background = "rgba(0, 0, 0, 0.75)";
    bar.style.borderRadius = "4px";

    const makeButton = (label: string): HTMLButtonElement => {
      const btn = document.createElement("button");

      btn.textContent = label;
      btn.style.fontFamily = "'Courier New', monospace";
      btn.style.cursor = "pointer";

      return btn;
    };

    this.playPauseButton = makeButton("Pause");
    this.playPauseButton.addEventListener("click", () => {
      if (this.video.paused) {
        this.video.play();
        this.playPauseButton!.textContent = "Pause";
      } else {
        this.video.pause();
        this.playPauseButton!.textContent = "Play";
      }
    });

    const stepBack = makeButton("-1f");
    const stepFwd = makeButton("+1f");
    const FRAME_STEP = 1 / 30;

    stepBack.addEventListener("click", () => {
      this.video.pause();
      this.playPauseButton!.textContent = "Play";
      this.video.currentTime = Math.max(0, this.video.currentTime - FRAME_STEP);
    });

    stepFwd.addEventListener("click", () => {
      this.video.pause();
      this.playPauseButton!.textContent = "Play";
      this.video.currentTime = Math.min(
        this.video.duration || 0,
        this.video.currentTime + FRAME_STEP,
      );
    });

    this.scrubber = document.createElement("input");

    this.scrubber.type = "range";
    this.scrubber.min = "0";
    this.scrubber.max = "100";
    this.scrubber.step = "0.01";
    this.scrubber.value = "0";
    this.scrubber.style.width = "140px";

    this.scrubber.addEventListener("input", () => {
      this.video.pause();
      this.playPauseButton!.textContent = "Play";
      this.video.currentTime = parseFloat(this.scrubber!.value);
    });

    this.timeLabel = document.createElement("span");
    this.timeLabel.textContent = "0.00s";
    this.timeLabel.style.color = "#ffffff";
    this.timeLabel.style.fontSize = "12px";

    this.video.addEventListener("loadedmetadata", () => {
      if (this.scrubber && Number.isFinite(this.video.duration)) {
        this.scrubber.max = String(this.video.duration);
      }
    });

    this.video.addEventListener("timeupdate", () => this.syncTimeDisplay());

    bar.appendChild(this.playPauseButton);
    bar.appendChild(stepBack);
    bar.appendChild(stepFwd);
    bar.appendChild(this.scrubber);
    bar.appendChild(this.timeLabel);

    this.controlsBar = bar;
    document.body.appendChild(bar);
  }

  private syncTimeDisplay(): void {
    if (!this.scrubber || !this.timeLabel) return;

    this.scrubber.value = String(this.video.currentTime);
    this.timeLabel.textContent = `${this.video.currentTime.toFixed(2)}s`;
  }

  public getVideo(): HTMLVideoElement {
    return this.video;
  }

  public isRunning(): boolean {
    return this.stream !== null;
  }
  public drawLandmarks(landmarks: {x:number;y:number}[]): void {

    this.ctx.clearRect(
        0,
        0,
        this.canvas.width,
        this.canvas.height
    );

    this.ctx.fillStyle = "red";

    for (const p of landmarks) {

        this.ctx.beginPath();

        this.ctx.arc(
            p.x * this.canvas.width,
            p.y * this.canvas.height,
            5,
            0,
            Math.PI * 2
        );

        this.ctx.fill();
    }
}
}
