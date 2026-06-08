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

export function characterMetaLine(character: UserCharacter | null | undefined): string | null {
  if (!character) return null;
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
