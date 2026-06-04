import type { UserCharacter } from "~/lib/stores/charactersStore";

/** Shape expected by `MemberFilesCard` / `FileDetailModal`. */
export type CharacterMemberFile = {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
  thumbnail_url?: string;
  upload_type?: string | null;
  generated_info?: unknown;
};

export { VOICE_AGE_OPTIONS as CHARACTER_AGE_OPTIONS } from "~/pages/voices/voiceFormOptions";
export { VOICE_GENDER_OPTIONS as CHARACTER_GENDER_OPTIONS } from "~/pages/voices/voiceFormOptions";

/** Aligns with gennyapi `assistCharacterDesign`. */
export const CHARACTER_DESCRIPTION_MIN = 120;
export const MAX_CHARACTER_NAME_LENGTH = 120;
export const MAX_CHARACTER_DESCRIPTION_LENGTH = 4000;
export const MAX_CHARACTER_ETHNICITY_LENGTH = 120;

/** `user_files.upload_type` and `user_gen_model_runs.app` for character assets. */
export const CHARACTER_UPLOAD_TYPE = "character";

export const CHARACTER_GENERATE_LOOK_IMAGE_MODELS = [
  { value: "bf5a5370-d39c-4d28-9b63-c67f4685b567", label: "Google Nano Banana 2" },
  { value: "377a54f4-0c4f-4316-9f00-631f4f34abde", label: "OpenAI GPT Image 2" },
  { value: "6cac6e6a-e1cd-4192-97c6-9ca0b607f917", label: "Pruna AI P-Image" },
  { value: "0a71319e-0fc1-46b7-9c50-f3e64146ed19", label: "Grok Imagen" },
] as const;

/** @deprecated Use `CHARACTER_GENERATE_LOOK_IMAGE_MODELS` */
export const CHARACTER_GENERATE_LOOK_MODELS = CHARACTER_GENERATE_LOOK_IMAGE_MODELS;

export function getDefaultCharacterGenerateModelId(): string {
  return CHARACTER_GENERATE_LOOK_IMAGE_MODELS[0].value;
}

export const CHARACTER_GENERATE_LOOK_ASPECT_RATIOS = [
  "9:16",
  "16:9",
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
] as const;

export const DEFAULT_CHARACTER_GENERATE_LOOK_MODEL_ID =
  CHARACTER_GENERATE_LOOK_IMAGE_MODELS[0].value;
export const DEFAULT_CHARACTER_GENERATE_LOOK_ASPECT_RATIO = "9:16";

/** Full-resolution URL for generation / reference inputs (never prefers thumbnail). */
export function characterMemberFileGenerationUrl(file: CharacterMemberFile): string {
  return file.file_path?.trim() || file.thumbnail_url?.trim() || "";
}

/** Thumbnail URL for UI previews (falls back to full image when no thumbnail). */
export function characterMemberFileThumbnailUrl(file: CharacterMemberFile): string {
  return file.thumbnail_url?.trim() || file.file_path?.trim() || "";
}

/** URL used for image-to-image / reference inputs (prefers full file path). */
export function characterMemberFileImageUrl(file: CharacterMemberFile): string {
  return characterMemberFileGenerationUrl(file);
}

export function characterMetaLine(character: UserCharacter): string | null {
  const bits = [character.gender, character.age, character.ethnicity].filter(Boolean);
  return bits.length > 0 ? bits.join(" · ") : null;
}

export function characterFormValuesFromRow(character: UserCharacter) {
  return {
    name: character.name?.trim() ?? "",
    description: character.description?.trim() ?? "",
    voiceId: character.voice_id?.trim() || null,
    gender: character.gender?.trim() || null,
    age: character.age?.trim() || null,
    ethnicity: character.ethnicity?.trim() || null,
  };
}
