import {
  BrowserRecorder,
  type RecorderConfig,
  type RecorderError,
  type RecorderState,
} from "@reechy-tools/recorder";
import type {
  MediaRecordingAdapter,
  MediaRecordingConfig,
  MediaRecordingError,
  MediaRecordingSnapshot,
  MediaRecordingState,
} from "~/lib/recording/types";
import { EMPTY_RECORDING_SNAPSHOT } from "~/lib/recording/types";

type SnapshotListener = (patch: Partial<MediaRecordingSnapshot>) => void;

function mapRecorderError(error: RecorderError): MediaRecordingError {
  return {
    code: error.code,
    message: error.message,
    recovery: error.recovery,
  };
}

function mapRecorderState(state: RecorderState): MediaRecordingState {
  if (state === "initializing") return "initializing";
  return state;
}

function toReechyConfig(config: MediaRecordingConfig): RecorderConfig {
  const audio =
    config.audio === undefined
      ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      : config.audio;

  const shared = {
    audio,
    countdown: config.countdownSec ?? 0,
    maxDuration: config.maxDurationSec,
  };

  switch (config.mode) {
    case "audio":
      return { ...shared, camera: false, screen: false };
    case "video":
      return { ...shared, camera: true, screen: false, countdown: config.countdownSec ?? 3 };
    case "screen":
      return { ...shared, camera: false, screen: true, countdown: config.countdownSec ?? 3 };
    case "screen-camera":
      return {
        ...shared,
        camera: true,
        screen: true,
        pip: { shape: "rounded", mirrored: true },
        countdown: config.countdownSec ?? 3,
      };
  }
}

export class ReechyRecordingAdapter implements MediaRecordingAdapter {
  readonly providerId = "reechy" as const;

  private recorder: BrowserRecorder | null = null;
  private listeners = new Set<SnapshotListener>();
  private snapshot: MediaRecordingSnapshot = { ...EMPTY_RECORDING_SNAPSHOT };
  private previewUrl: string | null = null;

  private readonly onStateChange = (state: RecorderState) => {
    this.patch({ state: mapRecorderState(state) });
  };

  private readonly onCountdown = (seconds: number) => {
    this.patch({ countdown: seconds });
  };

  private readonly onDuration = (ms: number) => {
    this.patch({ durationMs: ms });
  };

  private readonly onError = (error: RecorderError) => {
    this.patch({
      state: "error",
      error: mapRecorderError(error),
    });
  };

  subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): MediaRecordingSnapshot {
    return this.snapshot;
  }

  async init(config: MediaRecordingConfig): Promise<void> {
    this.destroyRecorder();
    this.revokePreviewUrl();
    this.snapshot = { ...EMPTY_RECORDING_SNAPSHOT };

    const recorder = new BrowserRecorder(toReechyConfig(config));
    recorder.on("state-change", this.onStateChange);
    recorder.on("countdown", this.onCountdown);
    recorder.on("duration", this.onDuration);
    recorder.on("error", this.onError);
    this.recorder = recorder;

    try {
      await recorder.init();
      this.patch({ state: mapRecorderState(recorder.getState()), error: null });
    } catch (err) {
      const mapped =
        err instanceof Error && "code" in err
          ? mapRecorderError(err as RecorderError)
          : {
              code: "INIT_FAILED",
              message: err instanceof Error ? err.message : "Failed to initialize recorder",
            };
      this.patch({ state: "error", error: mapped });
      throw err;
    }
  }

  start(): void {
    this.recorder?.start();
  }

  pause(): void {
    this.recorder?.pause();
  }

  resume(): void {
    this.recorder?.resume();
  }

  async stop(): Promise<Blob> {
    if (!this.recorder) {
      throw new Error("Recorder not initialized");
    }

    this.patch({ state: "stopping", countdown: null });
    const blob = await this.recorder.stop();
    this.revokePreviewUrl();
    const previewUrl = URL.createObjectURL(blob);
    this.previewUrl = previewUrl;
    this.patch({
      state: "completed",
      blob,
      previewUrl,
      countdown: null,
    });
    return blob;
  }

  reset(): void {
    this.destroyRecorder();
    this.revokePreviewUrl();
    this.snapshot = { ...EMPTY_RECORDING_SNAPSHOT };
    this.emit({ ...EMPTY_RECORDING_SNAPSHOT });
  }

  destroy(): void {
    this.destroyRecorder();
    this.revokePreviewUrl();
    this.listeners.clear();
    this.snapshot = { ...EMPTY_RECORDING_SNAPSHOT };
  }

  toggleMic(): boolean {
    return this.recorder?.toggleMic() ?? false;
  }

  private destroyRecorder(): void {
    if (!this.recorder) return;
    this.recorder.off("state-change", this.onStateChange);
    this.recorder.off("countdown", this.onCountdown);
    this.recorder.off("duration", this.onDuration);
    this.recorder.off("error", this.onError);
    this.recorder.destroy();
    this.recorder = null;
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
