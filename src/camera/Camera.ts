export class Camera {
  private video: HTMLVideoElement;
  private stream: MediaStream | null = null;
  private canvas: HTMLCanvasElement;
private ctx: CanvasRenderingContext2D;
private static instance: Camera | null = null;
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
  }
  public static getInstance(): Camera {
    if (!Camera.instance) {
      Camera.instance = new Camera();
    }

    return Camera.instance;
  }
  public async start(): Promise<void> {
    console.log("Requesting camera");

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 1280,
        height: 720,
        facingMode: "user",
      },
      audio: false,
    });

    console.log("Got stream", this.stream);

    this.video.srcObject = this.stream;

    this.video.onloadedmetadata = () => {
      console.log("Metadata loaded");
      console.log(this.video.videoWidth, this.video.videoHeight);
    };
this.canvas.style.transform = "scaleX(-1)";
this.video.style.transform = "scaleX(-1)";
    await this.video.play();

    console.log("Playing");
  }

  public stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
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
