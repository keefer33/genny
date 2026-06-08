export const CHARACTER_LOOK_VIEW_ORDER = ["front", "back", "right", "left"] as const;
export type CharacterLookView = (typeof CHARACTER_LOOK_VIEW_ORDER)[number];

export type LookGenerationStatus = "pending" | "generating" | "completed" | "failed";

export type LookGenerationError = {
  code?: string;
  message: string;
  view?: string;
  runId?: string;
  at?: string;
};

type LookLike = {
  metadata?: unknown;
  created_at?: string | null;
  items: Array<{
    view?: string | null;
    file?: { file_path?: string | null; thumbnail_url?: string | null } | null;
  }>;
};

const STALE_LOOK_GENERATION_MS = 20 * 60 * 1000;

function lookMetadataRecord(look: LookLike): Record<string, unknown> {
  const metadata = look.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  return metadata as Record<string, unknown>;
}

function completedViewCount(look: LookLike): number {
  const views = new Set(
    look.items
      .map((item) => (item.view ?? "").trim().toLowerCase())
      .filter((view) => CHARACTER_LOOK_VIEW_ORDER.includes(view as CharacterLookView))
  );
  return views.size;
}

export function lookIsIncomplete(look: LookLike): boolean {
  return completedViewCount(look) < CHARACTER_LOOK_VIEW_ORDER.length;
}

function parseGenerationUpdatedAt(
  look: LookLike,
  metadata: Record<string, unknown>
): number | null {
  const raw = metadata.generationUpdatedAt ?? metadata.generationStartedAt ?? look.created_at;
  if (typeof raw !== "string") return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
}

export function isStaleLookGeneration(look: LookLike): boolean {
  const metadata = lookMetadataRecord(look);
  const status = metadata.generationStatus;
  const incomplete = lookIsIncomplete(look);
  if (!incomplete) return false;
  if (status !== "generating" && status !== "pending" && status !== undefined && status !== "") {
    return false;
  }
  const updatedAt = parseGenerationUpdatedAt(look, metadata);
  if (updatedAt == null) return false;
  return Date.now() - updatedAt > STALE_LOOK_GENERATION_MS;
}

export function getLookGenerationError(look: LookLike): LookGenerationError | null {
  const metadata = lookMetadataRecord(look);
  const lastError = metadata.lastError;
  if (!lastError || typeof lastError !== "object" || Array.isArray(lastError)) {
    if (isStaleLookGeneration(look)) {
      return { message: "Generation timed out. You can retry.", code: "stale_generation" };
    }
    return null;
  }
  const record = lastError as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message.trim() : "";
  if (!message) return null;
  return {
    code: typeof record.code === "string" ? record.code : undefined,
    message,
    view: typeof record.view === "string" ? record.view : undefined,
    runId: typeof record.runId === "string" ? record.runId : undefined,
    at: typeof record.at === "string" ? record.at : undefined,
  };
}

export function resolveLookGenerationStatus(look: LookLike): LookGenerationStatus {
  const metadata = lookMetadataRecord(look);
  const status = typeof metadata.generationStatus === "string" ? metadata.generationStatus : "";

  if (status === "failed") return "failed";
  if (status === "completed" || !lookIsIncomplete(look)) return "completed";
  if (isStaleLookGeneration(look)) return "failed";
  if (status === "generating" || status === "pending") return status;
  if (lookIsIncomplete(look)) return "generating";
  return "completed";
}

export function lookIsActivelyGenerating(look: LookLike): boolean {
  const status = resolveLookGenerationStatus(look);
  return status === "pending" || status === "generating";
}

export function lookHasFailed(look: LookLike): boolean {
  return resolveLookGenerationStatus(look) === "failed";
}

export function lookCanRetry(look: LookLike): boolean {
  if (lookIsActivelyGenerating(look)) return false;
  if (lookHasFailed(look)) return true;
  if (isStaleLookGeneration(look)) return true;
  return lookIsIncomplete(look) && !lookIsActivelyGenerating(look);
}

export function shouldPollLook(look: LookLike): boolean {
  return lookIsActivelyGenerating(look);
}
