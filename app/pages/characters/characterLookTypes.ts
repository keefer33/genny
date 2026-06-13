import type { CharacterLookView } from "~/pages/characters/characterLookGenerationUtils";

export type CharacterLookItemFile = {
  id: string;
  file_name?: string | null;
  file_path?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  created_at?: string | null;
  thumbnail_url?: string | null;
  upload_type?: string | null;
  status?: string | null;
  generated_info?: unknown;
};

export type CharacterLookItem = {
  id: string;
  created_at?: string | null;
  look_id?: string | null;
  file_id?: string | null;
  view?: CharacterLookView | string | null;
  metadata?: unknown;
  file?: CharacterLookItemFile | null;
};

export type CharacterLook = {
  id: string;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
  character_id?: string | null;
  name?: string | null;
  base_look?: boolean | null;
  metadata?: unknown;
  items: CharacterLookItem[];
};

export const EMPTY_CHARACTER_LOOKS: CharacterLook[] = [];

/** Tracks front-view URLs and base-look flags for thumbnail refresh. */
export function looksVisualSignature(looks: CharacterLook[]): string {
  return looks
    .map((look) => {
      const front = look.items.find((item) => (item.view ?? "").trim().toLowerCase() === "front");
      const file = front?.file;
      const url = file?.file_path?.trim() || file?.thumbnail_url?.trim() || "";
      return `${look.id}:${look.base_look ? 1 : 0}:${url}`;
    })
    .sort()
    .join("|");
}
