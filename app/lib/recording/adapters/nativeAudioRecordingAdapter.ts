import { fixRecordedWebmBlob } from "~/lib/recording/fixRecordedWebmBlob";
import type {
  MediaRecordingAdapter,
  MediaRecordingConfig,
  MediaRecordingError,
  MediaRecordingSnapshot,
} from "~/lib/recording/types";
import { EMPTY_RECORDING_SNAPSHOT } from "~/lib/recording/types";

type SnapshotListener = (patch: Partial<MediaRecordingSnapshot>) => void;

function pickAudioMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) return mimeType;
  }
  return "";
}

function mapGetUserMediaError(err: unknown): MediaRecordingError {
  const name = err instanceof Error ? err.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return {
      code: "MIC_PERMISSION_DENIED",
      message: "Microphone access was denied.",
      recovery: "Allow microphone access in your browser settings and try again.",
    };
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return {
      code: "MIC_NOT_FOUND",
      message: "No microphone was found.",
      recovery: "Connect a microphone and try again.",
    };
  }
  return {
    code: "MIC_INIT_FAILED",
    message: err instanceof Error ? err.message : "Failed to access microphone",
  };
}

/**
 * Audio-only recording via native MediaRecorder + getUserMedia.
 * Reechy does not support mic-only capture (mic is tied to camera init).
 */
export class NativeAudioRecordingAdapter implements MediaRecordingAdapter {
  readonly providerId = "native" as const;

  private listeners = new Set<SnapshotListener>();
  private snapshot: MediaRecordingSnapshot = { ...EMPTY_RECORDING_SNAPSHOT };
  private previewUrl: string | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private durationInterval: ReturnType<typeof setInterval> | null = null;
  private durationMs = 0;
  private maxDurationSec: number | undefined;

  subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): MediaRecordingSnapshot {
    return this.snapshot;
  }

  async init(config: MediaRecordingConfig): Promise<void> {
    if (config.mode !== "audio") {
      throw new Error("NativeAudioRecordingAdapter only supports audio mode");
    }

    this.resetInternal();
    this.maxDurationSec = config.maxDurationSec;
    this.patch({ state: "initializing", error: null });

    const audioConstraints =
      config.audio === false
        ? false
        : {
            echoCancellation: config.audio?.echoCancellation ?? true,
            noiseSuppression: config.audio?.noiseSuppression ?? true,
            autoGainControl: config.audio?.autoGainControl ?? true,
          };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false,
      });
      this.mediaStream = stream;
      this.patch({ state: "ready", isMicMuted: false });
    } catch (err) {
      const error = mapGetUserMediaError(err);
      this.patch({ state: "error", error });
      throw err;
    }
  }

  start(): void {
    if (!this.mediaStream) {
      this.patch({
        state: "error",
        error: {
          code: "RECORDER_NOT_INITIALIZED",
          message: "Recorder not initialized",
          recovery: "Allow microphone access first.",
        },
      });
      return;
    }

    const mimeType = pickAudioMimeType();
    this.chunks = [];
    this.durationMs = 0;

    const recorder = new MediaRecorder(this.mediaStream, mimeType ? { mimeType } : undefined);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };

    recorder.onerror = () => {
      this.patch({
        state: "error",
        error: {
          code: "RECORDING_FAILED",
          message: "Recording failed",
          recovery: "Try recording again.",
        },
      });
    };

    this.mediaRecorder = recorder;
    recorder.start(250);
    this.startDurationTicker();
    this.patch({ state: "recording", durationMs: 0, countdown: null });
  }

  pause(): void {
    if (this.mediaRecorder?.state === "recording") {
      this.mediaRecorder.pause();
      this.stopDurationTicker();
      this.patch({ state: "paused" });
    }
  }

  resume(): void {
    if (this.mediaRecorder?.state === "paused") {
      this.mediaRecorder.resume();
      this.startDurationTicker();
      this.patch({ state: "recording" });
    }
  }

  async stop(): Promise<Blob> {
    const recorder = this.mediaRecorder;
    if (!recorder || (recorder.state !== "recording" && recorder.state !== "paused")) {
      throw new Error("Not recording");
    }

    this.patch({ state: "stopping", countdown: null });
    this.stopDurationTicker();

    const rawBlob = await new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        const type = this.chunks[0]?.type || recorder.mimeType || "audio/webm";
        resolve(new Blob(this.chunks, { type }));
      };
      recorder.onerror = () => reject(new Error("Failed to stop recording"));
      recorder.stop();
    });

    const blob = await fixRecordedWebmBlob(rawBlob, this.durationMs);

    this.mediaRecorder = null;
    this.revokePreviewUrl();
    const previewUrl = URL.createObjectURL(blob);
    this.previewUrl = previewUrl;
    this.patch({
      state: "completed",
      blob,
      previewUrl,
      durationMs: this.durationMs,
      countdown: null,
    });
    return blob;
  }

  reset(): void {
    this.resetInternal();
    this.emit({ ...EMPTY_RECORDING_SNAPSHOT });
  }

  destroy(): void {
    this.resetInternal();
    this.listeners.clear();
    this.snapshot = { ...EMPTY_RECORDING_SNAPSHOT };
  }

  toggleMic(): boolean {
    const track = this.mediaStream?.getAudioTracks()[0];
    if (!track) return false;
    track.enabled = !track.enabled;
    this.patch({ isMicMuted: !track.enabled });
    return track.enabled;
  }

  private startDurationTicker(): void {
    this.stopDurationTicker();
    this.durationInterval = setInterval(() => {
      this.durationMs += 100;
      this.patch({ durationMs: this.durationMs });
      if (this.maxDurationSec != null && this.durationMs >= this.maxDurationSec * 1000) {
        void this.stop().catch(() => undefined);
      }
    }, 100);
  }

  private stopDurationTicker(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
  }

  private resetInternal(): void {
    this.stopDurationTicker();
    if (this.mediaRecorder?.state !== "inactive") {
      try {
        this.mediaRecorder?.stop();
      } catch {
        // ignore
      }
    }
    this.mediaRecorder = null;
    this.chunks = [];
    this.durationMs = 0;
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
    this.revokePreviewUrl();
    this.snapshot = { ...EMPTY_RECORDING_SNAPSHOT };
  }

  private revokePreviewUrl(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }

  private patch(patch: Partial<MediaRecordingSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    this.emit(patch);
  }

  private emit(patch: Partial<MediaRecordingSnapshot>): void {
    for (const listener of this.listeners) {
      listener(patch);
    }
  }
}
