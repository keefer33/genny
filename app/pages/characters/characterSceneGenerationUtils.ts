import type {
  LookGenerationError,
  LookGenerationStatus,
} from "~/pages/characters/characterLookGenerationUtils";

export type CharacterSceneFile = {
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

export type CharacterScene = {
  id: string;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
  character_id?: string | null;
  name?: string | null;
  metadata?: unknown;
  gen_model_run_id?: string | null;
  run_status?: string | null;
  file?: CharacterSceneFile | null;
};

const STALE_SCENE_GENERATION_MS = 20 * 60 * 1000;

function sceneMetadataRecord(scene: CharacterScene): Record<string, unknown> {
  const metadata = scene.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  return metadata as Record<string, unknown>;
}

function sceneHasImage(scene: CharacterScene): boolean {
  const file = scene.file;
  return Boolean(file?.file_path?.trim() || file?.thumbnail_url?.trim());
}

function parseGenerationUpdatedAt(
  scene: CharacterScene,
  metadata: Record<string, unknown>
): number | null {
  const raw = metadata.generationUpdatedAt ?? metadata.generationStartedAt ?? scene.created_at;
  if (typeof raw !== "string") return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
}

export function isStaleSceneGeneration(scene: CharacterScene): boolean {
  if (sceneHasImage(scene)) return false;
  const metadata = sceneMetadataRecord(scene);
  const status = metadata.generationStatus;
  if (status !== "generating" && status !== "pending" && status !== undefined && status !== "") {
    return false;
  }
  const updatedAt = parseGenerationUpdatedAt(scene, metadata);
  if (updatedAt == null) return false;
  return Date.now() - updatedAt > STALE_SCENE_GENERATION_MS;
}

export function getSceneGenerationError(scene: CharacterScene): LookGenerationError | null {
  const metadata = sceneMetadataRecord(scene);
  const lastError = metadata.lastError;
  if (!lastError || typeof lastError !== "object" || Array.isArray(lastError)) {
    if (isStaleSceneGeneration(scene)) {
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

export function resolveSceneGenerationStatus(scene: CharacterScene): LookGenerationStatus {
  const metadata = sceneMetadataRecord(scene);
  const status = typeof metadata.generationStatus === "string" ? metadata.generationStatus : "";

  if (status === "failed") return "failed";
  if (status === "completed" || sceneHasImage(scene)) return "completed";
  if (isStaleSceneGeneration(scene)) return "failed";
  if (status === "generating" || status === "pending") return status;
  if (!sceneHasImage(scene)) return "generating";
  return "completed";
}

export function sceneIsActivelyGenerating(scene: CharacterScene): boolean {
  const status = resolveSceneGenerationStatus(scene);
  return status === "pending" || status === "generating";
}

export function sceneHasFailed(scene: CharacterScene): boolean {
  return resolveSceneGenerationStatus(scene) === "failed";
}

export function shouldPollScene(scene: CharacterScene): boolean {
  return sceneIsActivelyGenerating(scene);
}
