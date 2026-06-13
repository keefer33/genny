/** What to capture — maps to provider-specific recorder config. */
export type MediaRecordingMode = "audio" | "video" | "screen" | "screen-camera";

/** SDK-agnostic recorder lifecycle (UI can bind to these states). */
export type MediaRecordingState =
  | "idle"
  | "initializing"
  | "ready"
  | "countdown"
  | "recording"
  | "paused"
  | "stopping"
  | "completed"
  | "error";

export type MediaRecordingError = {
  code: string;
  message: string;
  recovery?: string;
};

export type MediaRecordingConfig = {
  mode: MediaRecordingMode;
  /** Auto-stop after N seconds. */
  maxDurationSec?: number;
  /** Pre-roll countdown; `0` skips. */
  countdownSec?: number;
  audio?: {
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
  };
};

export type MediaRecordingSnapshot = {
  state: MediaRecordingState;
  durationMs: number;
  countdown: number | null;
  error: MediaRecordingError | null;
  previewUrl: string | null;
  blob: Blob | null;
  isMicMuted: boolean;
};

/** Pluggable recording backend — implement for each SDK (Reechy, RecordRTC, etc.). */
export interface MediaRecordingAdapter {
  readonly providerId: MediaRecordingProviderId;
  init(config: MediaRecordingConfig): Promise<void>;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): Promise<Blob>;
  reset(): void;
  destroy(): void;
  toggleMic?(): boolean;
  subscribe(listener: (patch: Partial<MediaRecordingSnapshot>) => void): () => void;
  getSnapshot(): MediaRecordingSnapshot;
}

export type MediaRecordingProviderId = "reechy" | "native";

export const EMPTY_RECORDING_SNAPSHOT: MediaRecordingSnapshot = {
  state: "idle",
  durationMs: 0,
  countdown: null,
  error: null,
  previewUrl: null,
  blob: null,
  isMicMuted: false,
};
