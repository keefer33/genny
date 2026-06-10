import type {
  LookGenerationError,
  LookGenerationStatus,
} from "~/pages/characters/characterLookGenerationUtils";

export type CharacterVideoFile = {
  id: string;
  file_name?: string | null;
  file_path?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  created_at?: string | null;
  thumbnail_url?: string | null;
  upload_type?: string | null;
  status?: string | null;
};

export type CharacterVideo = {
  id: string;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
  character_id?: string | null;
  name?: string | null;
  metadata?: unknown;
  gen_model_run_id?: string | null;
  run_status?: string | null;
  file?: CharacterVideoFile | null;
};

const STALE_VIDEO_GENERATION_MS = 20 * 60 * 1000;

function videoMetadataRecord(video: CharacterVideo): Record<string, unknown> {
  const metadata = video.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  return metadata as Record<string, unknown>;
}

function videoHasOutput(video: CharacterVideo): boolean {
  const file = video.file;
  return Boolean(file?.file_path?.trim() || file?.thumbnail_url?.trim());
}

function parseGenerationUpdatedAt(
  video: CharacterVideo,
  metadata: Record<string, unknown>
): number | null {
  const raw = metadata.generationUpdatedAt ?? metadata.generationStartedAt ?? video.created_at;
  if (typeof raw !== "string") return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
}

export function isStaleVideoGeneration(video: CharacterVideo): boolean {
  if (videoHasOutput(video)) return false;
  const metadata = videoMetadataRecord(video);
  const status = metadata.generationStatus;
  if (status !== "generating" && status !== "pending" && status !== undefined && status !== "") {
    return false;
  }
  const updatedAt = parseGenerationUpdatedAt(video, metadata);
  if (updatedAt == null) return false;
  return Date.now() - updatedAt > STALE_VIDEO_GENERATION_MS;
}

export function getVideoGenerationError(video: CharacterVideo): LookGenerationError | null {
  const metadata = videoMetadataRecord(video);
  const lastError = metadata.lastError;
  if (!lastError || typeof lastError !== "object" || Array.isArray(lastError)) {
    if (isStaleVideoGeneration(video)) {
      return { message: "Generation timed out.", code: "stale_generation" };
    }
    return null;
  }
  const record = lastError as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message.trim() : "";
  if (!message) return null;
  return {
    code: typeof record.code === "string" ? record.code : undefined,
    message,
    runId: typeof record.runId === "string" ? record.runId : undefined,
    at: typeof record.at === "string" ? record.at : undefined,
  };
}

export function resolveVideoGenerationStatus(video: CharacterVideo): LookGenerationStatus {
  const metadata = videoMetadataRecord(video);
  const status = typeof metadata.generationStatus === "string" ? metadata.generationStatus : "";

  if (status === "failed") return "failed";
  if (status === "completed" || videoHasOutput(video)) return "completed";
  if (isStaleVideoGeneration(video)) return "failed";
  if (status === "generating" || status === "pending") return status;
  if (!videoHasOutput(video)) return "generating";
  return "completed";
}

export function videoIsActivelyGenerating(video: CharacterVideo): boolean {
  const status = resolveVideoGenerationStatus(video);
  return status === "pending" || status === "generating";
}

export function videoHasFailed(video: CharacterVideo): boolean {
  return resolveVideoGenerationStatus(video) === "failed";
}

export function shouldPollVideo(video: CharacterVideo): boolean {
  return videoIsActivelyGenerating(video);
}
