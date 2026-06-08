import { CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD } from "~/pages/characters/characterGenerateLookSchema";
import type { CharacterLookModelOption } from "~/lib/stores/charactersStore";
import type { CharacterLook } from "~/pages/characters/components/CharacterLooksPanel";
import {
  getLookGenerationError,
  lookCanRetry,
  lookHasFailed,
  lookIsIncomplete,
  type CharacterLookView,
} from "~/pages/characters/characterLookGenerationUtils";

export type GenerateLookRetryDraft = {
  lookId: string;
  lookName: string;
  modelId: string;
  lookModelPayload: Record<string, unknown>;
  formSeed: Record<string, unknown>;
};

function lookMetadataRecord(look: CharacterLook): Record<string, unknown> {
  const metadata = look.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  return metadata as Record<string, unknown>;
}

export function lookHasFrontView(look: CharacterLook): boolean {
  return look.items.some((item) => {
    const view = (item.view ?? "").trim().toLowerCase();
    return view === "front" && Boolean(item.file?.file_path?.trim() || item.file?.thumbnail_url?.trim());
  });
}

/** True when generation failed before a usable front view was saved. */
export function lookFrontViewFailed(look: CharacterLook): boolean {
  if (lookHasFrontView(look)) return false;
  if (!lookCanRetry(look)) return false;

  const error = getLookGenerationError(look);
  if (error?.view) {
    return error.view.trim().toLowerCase() === "front";
  }

  return lookHasFailed(look) || lookIsIncomplete(look);
}

export function lookRetryOpensGenerateModal(look: CharacterLook): boolean {
  if (!lookFrontViewFailed(look)) return false;
  const metadataType = lookMetadataRecord(look).type;
  return metadataType === "create_character_look";
}

function normalizePayload(metadata: Record<string, unknown>): Record<string, unknown> {
  const payload = metadata.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }
  return { ...(payload as Record<string, unknown>) };
}

export function extractGenerateLookRetryDraft(
  look: CharacterLook,
  lookModelOptions: CharacterLookModelOption[]
): GenerateLookRetryDraft | null {
  const metadata = lookMetadataRecord(look);
  if (metadata.type !== "create_character_look") return null;

  const modelId = typeof metadata.modelId === "string" ? metadata.modelId.trim() : "";
  if (!modelId) return null;

  const payload = normalizePayload(metadata);
  const option =
    lookModelOptions.find((item) => item.edit_model_id === modelId) ?? lookModelOptions[0];
  if (!option) return null;

  const lookModelPayload: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(option.fields.ui)) {
    if (payload[key] !== undefined) {
      lookModelPayload[key] = payload[key];
    } else if (field.default !== undefined) {
      lookModelPayload[key] = field.default;
    }
  }

  const formSeed: Record<string, unknown> = {};
  if (typeof payload.prompt === "string") {
    formSeed.prompt = payload.prompt;
  }

  if (Array.isArray(payload.images)) {
    const images = payload.images
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
    if (images.length > 0) {
      formSeed[CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD] = images[0];
      if (images.length > 1) {
        formSeed.images = images.slice(1);
      }
    }
  } else if (typeof payload.image === "string" && payload.image.trim()) {
    formSeed[CHARACTER_GENERATE_LOOK_BASE_IMAGE_FIELD] = payload.image.trim();
  }

  if (typeof payload.audio === "string" && payload.audio.trim()) {
    formSeed.characterAudio = payload.audio.trim();
  }

  return {
    lookId: look.id,
    lookName: look.name?.trim() || "",
    modelId,
    lookModelPayload,
    formSeed,
  };
}

export function failedViewLabel(view?: string): string | null {
  if (!view?.trim()) return null;
  const normalized = view.trim().toLowerCase() as CharacterLookView;
  const labels: Record<CharacterLookView, string> = {
    front: "Front",
    back: "Back",
    right: "Right",
    left: "Left",
  };
  return labels[normalized] ?? view;
}
