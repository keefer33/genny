import { create } from "zustand";
import createUniversalSelectors from "./universalSelectors";
import { showNotification } from "../notificationUtils";
import useAppStore from "./appStore";
import { assertAuthFetchOk, authFetch, authFetchJson } from "./authFetch";
import { endpoint } from "../utils";
import {
  mapUserFileToCharacterAudio,
  sortByCreatedAtDesc,
  type CharacterAudioFile,
} from "~/pages/characters/characterFileUtils";
import type { CreateCharacterPayload } from "~/pages/characters/components/CreateCharacterModal";

export type UserCharacter = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  name: string | null;
  description: string | null;
  language: string | null;
  gender: string | null;
  age: number | null;
  accent: string | null;
  category: string | null;
  descriptive: string | null;
  use_case: string | null;
  featured: boolean;
  status: string | null;
  /** ElevenLabs source + merged `generations` from API reads. */
  metadata: unknown;
};

export type SharedVoiceItem = {
  voice_id: string;
  name?: string | null;
  preview_url?: string | null;
  accent?: string | null;
  gender?: string | null;
  age?: string | null;
  language?: string | null;
  description?: string | null;
  use_case?: string | null;
  descriptive?: string | null;
  category?: string | null;
};

/** Filters for `GET /v1/shared-voices` (proxied as `/characters/library`). */
export type VoiceLibraryFilters = {
  gender?: string;
  language?: string;
  accent?: string;
  category?: string;
};

export type LoadVoiceLibraryParams = {
  userId: string;
  search?: string;
  filters?: VoiceLibraryFilters;
  /** Zero-based page index per ElevenLabs API. */
  page?: number;
  pageSize?: number;
  /** If true, append new voices to `libraryVoices` (e.g. infinite scroll). */
  append?: boolean;
};

export const VOICE_LIBRARY_PAGE_SIZE_DEFAULT = 30;

/** Characters list page size (must match `/characters?page=&limit=` usage). */
export const CHARACTERS_PAGE_LIMIT_DEFAULT = 6;

function voiceLibraryHasAnyFilter(filters?: VoiceLibraryFilters): boolean {
  const f = filters;
  if (!f) return false;
  return Boolean(f.gender?.trim() || f.language?.trim() || f.accent?.trim() || f.category?.trim());
}

/** Default browse (no search, no filters) uses ElevenLabs `featured=true`; any criteria omits it. */
function buildVoiceLibraryQueryString(args: {
  search: string;
  filters?: VoiceLibraryFilters;
  page: number;
  pageSize: number;
}): string {
  const q = new URLSearchParams();
  const trimmed = args.search.trim();
  if (trimmed) q.set("search", trimmed);

  const f = args.filters;
  if (f?.gender?.trim()) q.set("gender", f.gender.trim());
  if (f?.language?.trim()) q.set("language", f.language.trim());
  if (f?.accent?.trim()) q.set("accent", f.accent.trim());
  if (f?.category?.trim()) q.set("category", f.category.trim());

  const isDefaultFeaturedList = !trimmed && !voiceLibraryHasAnyFilter(args.filters);
  if (isDefaultFeaturedList) q.set("featured", "true");

  q.set("page", String(args.page));
  q.set("page_size", String(Math.min(100, Math.max(1, args.pageSize))));

  return q.toString();
}

type SharedLibraryPayload = {
  voices?: SharedVoiceItem[];
  has_more?: boolean;
  total_count?: number;
};

type CharactersState = {
  /** Set on character detail; used by file picker to pre-filter by character. */
  selectedCharacter: UserCharacter | null;
  characters: UserCharacter[];
  charactersLoading: boolean;
  /** Zero-based page index for `GET /characters`. */
  charactersPage: number;
  charactersLimit: number;
  charactersTotal: number;
  libraryVoices: SharedVoiceItem[];
  libraryLoading: boolean;
  libraryHasMore: boolean;
  libraryTotalCount: number | null;
  libraryPage: number;
  createLoading: boolean;
  speechCreating: boolean;
  error: string | null;

  setError: (error: string | null) => void;
  setSelectedCharacter: (character: UserCharacter | null) => void;
  reset: () => void;
  clearVoiceLibrary: () => void;

  loadCharacters: (userId: string, opts?: { page?: number; limit?: number }) => Promise<void>;
  /** GET `/characters/:id`; returns `null` if missing or not found. */
  fetchCharacterById: (userId: string, characterId: string) => Promise<UserCharacter | null>;
  /** GET `/characters/:id/audio-files` — voice preview + speech clips for the character. */
  fetchCharacterAudioFiles: (userId: string, characterId: string) => Promise<CharacterAudioFile[]>;
  /** POST `/characters/dialogue` — dialogue clip linked to the character. */
  createCharacterSpeech: (
    userId: string,
    characterId: string,
    voiceId: string,
    text: string
  ) => Promise<CharacterAudioFile | null>;
  /** PATCH `/characters/:id` — update name and/or description. */
  updateCharacter: (
    userId: string,
    characterId: string,
    patch: { name?: string; description?: string }
  ) => Promise<UserCharacter | null>;
  /** DELETE `/user/files/:fileId` — removes DB row (Zipline via webhook). */
  deleteCharacterFile: (userId: string, fileId: string, fileName: string) => Promise<boolean>;
  /** DELETE `/characters/:id` (storage + DB). Refetches the current list page. */
  deleteCharacter: (userId: string, characterId: string) => Promise<boolean>;
  loadVoiceLibrary: (params: LoadVoiceLibraryParams) => Promise<void>;
  createCharacter: (
    userId: string,
    payload: CreateCharacterPayload
  ) => Promise<UserCharacter | null>;
};

const initial: Pick<
  CharactersState,
  | "selectedCharacter"
  | "characters"
  | "charactersLoading"
  | "charactersPage"
  | "charactersLimit"
  | "charactersTotal"
  | "libraryVoices"
  | "libraryLoading"
  | "libraryHasMore"
  | "libraryTotalCount"
  | "libraryPage"
  | "createLoading"
  | "speechCreating"
  | "error"
> = {
  selectedCharacter: null,
  characters: [],
  charactersLoading: false,
  charactersPage: 0,
  charactersLimit: CHARACTERS_PAGE_LIMIT_DEFAULT,
  charactersTotal: 0,
  libraryVoices: [],
  libraryLoading: false,
  libraryHasMore: false,
  libraryTotalCount: null,
  libraryPage: 0,
  createLoading: false,
  speechCreating: false,
  error: null,
};

function canCallApi(userId: string): boolean {
  const appStore = useAppStore.getState();
  const session = appStore.getUser();
  return Boolean(session?.user?.id && session.user.id === userId && appStore.getAuthApiKey());
}

const useCharactersStoreBase = create<CharactersState>((set, get) => ({
  ...initial,

  setError: (error) => set({ error }),

  setSelectedCharacter: (selectedCharacter) => set({ selectedCharacter }),

  reset: () => set({ ...initial }),

  clearVoiceLibrary: () =>
    set({
      libraryVoices: [],
      libraryHasMore: false,
      libraryTotalCount: null,
      libraryPage: 0,
    }),

  loadCharacters: async (userId, opts) => {
    if (!userId || !canCallApi(userId)) return;

    const page = opts?.page ?? get().charactersPage;
    const limit = opts?.limit ?? get().charactersLimit;

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    set({ charactersLoading: true, error: null });
    try {
      const json = await authFetchJson<{ characters: UserCharacter[]; total: number }>(
        `${endpoint}/characters?${params.toString()}`,
        undefined,
        { errorMessage: "Failed to load characters" }
      );
      const list = json.characters ?? [];
      const total = typeof json.total === "number" ? json.total : list.length;
      set({
        characters: list,
        charactersTotal: total,
        charactersPage: page,
        charactersLimit: limit,
      });
    } catch (err: unknown) {
      console.error("loadCharacters:", err);
      set({
        error: err instanceof Error ? err.message : "Failed to load characters",
      });
    } finally {
      set({ charactersLoading: false });
    }
  },

  fetchCharacterById: async (userId, characterId) => {
    if (!userId || !canCallApi(userId)) return null;
    const id = characterId.trim();
    if (!id) return null;
    try {
      const json = await authFetchJson<{ character: UserCharacter }>(
        `${endpoint}/characters/${encodeURIComponent(id)}`,
        undefined,
        { errorMessage: "Failed to load character" }
      );
      return json.character ?? null;
    } catch {
      return null;
    }
  },

  fetchCharacterAudioFiles: async (userId, characterId) => {
    if (!userId || !canCallApi(userId)) return [];
    const id = characterId.trim();
    if (!id) return [];
    try {
      const json = await authFetchJson<{ files: CharacterAudioFile[] }>(
        `${endpoint}/characters/${encodeURIComponent(id)}/audio-files`,
        undefined,
        { errorMessage: "Failed to load character audio" }
      );
      const files = (json.files ?? []).filter((f): f is CharacterAudioFile =>
        Boolean(f?.id?.trim())
      );
      return sortByCreatedAtDesc(files);
    } catch {
      return [];
    }
  },

  createCharacterSpeech: async (userId, characterId, voiceId, text) => {
    if (!userId || !canCallApi(userId)) return null;
    const charId = characterId.trim();
    const vId = voiceId.trim();
    const trimmedText = text.trim();
    if (!charId || !vId || !trimmedText) {
      showNotification({
        title: "Missing fields",
        message: "Voice and dialogue text are required.",
        type: "error",
      });
      return null;
    }

    set({ speechCreating: true, error: null });
    try {
      const json = await authFetchJson<{ file?: Record<string, unknown> }>(
        `${endpoint}/characters/dialogue`,
        {
          method: "POST",
          body: JSON.stringify({
            character_id: charId,
            inputs: [{ text: trimmedText, voice_id: vId }],
          }),
        },
        { errorMessage: "Failed to create dialogue audio" }
      );
      const mapped = json.file ? mapUserFileToCharacterAudio(json.file) : null;
      if (!mapped) {
        showNotification({
          title: "Audio created",
          message: "Dialogue was generated but could not be loaded. Refresh the page.",
          type: "warning",
        });
        return null;
      }
      showNotification({
        title: "Audio created",
        message: "New dialogue clip is ready for video generation.",
        type: "success",
      });
      return mapped;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create dialogue audio";
      set({ error: message });
      showNotification({
        title: "Could not create audio",
        message,
        type: "error",
      });
      return null;
    } finally {
      set({ speechCreating: false });
    }
  },

  updateCharacter: async (userId, characterId, patch) => {
    if (!userId || !canCallApi(userId)) return null;
    const id = characterId.trim();
    if (!id) return null;
    const body: Record<string, string> = {};
    if (patch.name !== undefined) body.name = patch.name;
    if (patch.description !== undefined) body.description = patch.description;
    if (Object.keys(body).length === 0) return null;

    try {
      const json = await authFetchJson<{ character: UserCharacter }>(
        `${endpoint}/characters/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
        { errorMessage: "Failed to update character" }
      );
      const updated = json.character ?? null;
      if (updated) {
        set({
          characters: get().characters.map((c) =>
            c.id === id
              ? {
                  ...c,
                  name: updated.name,
                  description: updated.description,
                  updated_at: updated.updated_at,
                }
              : c
          ),
        });
      }
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update character";
      set({ error: message });
      showNotification({
        title: "Could not update character",
        message,
        type: "error",
      });
      return null;
    }
  },

  deleteCharacterFile: async (userId, fileId, fileName) => {
    if (!userId || !canCallApi(userId)) return false;
    const id = fileId.trim();
    const name = fileName.trim();
    if (!id || !name) {
      showNotification({
        title: "Cannot delete file",
        message: "File id and name are required.",
        type: "error",
      });
      return false;
    }
    try {
      const deleteRes = await authFetch(`${endpoint}/user/files/${encodeURIComponent(id)}`, {
        method: "DELETE",
        body: JSON.stringify({ idOrName: name }),
      });
      await assertAuthFetchOk(deleteRes, "Failed to delete file");
      showNotification({
        title: "Deleted",
        message: "File removed.",
        type: "success",
      });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete file";
      showNotification({
        title: "Could not delete file",
        message,
        type: "error",
      });
      return false;
    }
  },

  deleteCharacter: async (userId, characterId) => {
    if (!userId || !canCallApi(userId)) return false;
    const id = characterId.trim();
    if (!id) return false;
    try {
      await authFetchJson<{ ok: boolean }>(
        `${endpoint}/characters/${encodeURIComponent(id)}`,
        { method: "DELETE" },
        { errorMessage: "Failed to delete character" }
      );
      const page = get().charactersPage;
      const limit = get().charactersLimit;
      await get().loadCharacters(userId, { page, limit });
      if (get().characters.length === 0 && page > 0) {
        await get().loadCharacters(userId, { page: page - 1, limit });
      }
      return true;
    } catch (err: unknown) {
      console.error("deleteCharacter:", err);
      set({
        error: err instanceof Error ? err.message : "Failed to delete character",
      });
      return false;
    }
  },

  loadVoiceLibrary: async (params) => {
    const {
      userId,
      search = "",
      filters,
      page = 0,
      pageSize = VOICE_LIBRARY_PAGE_SIZE_DEFAULT,
      append = false,
    } = params;
    if (!userId || !canCallApi(userId)) return;

    const qs = buildVoiceLibraryQueryString({
      search,
      filters,
      page,
      pageSize,
    });

    set({ libraryLoading: true, error: null });
    try {
      const payload = await authFetchJson<SharedLibraryPayload>(
        `${endpoint}/characters/library?${qs}`,
        undefined,
        { errorMessage: "Failed to load voice library" }
      );
      const voices = (payload.voices ?? []).filter(
        (v): v is SharedVoiceItem => typeof v?.voice_id === "string" && v.voice_id.length > 0
      );
      const hasMore = Boolean(payload.has_more);
      const totalCount = typeof payload.total_count === "number" ? payload.total_count : null;

      if (append) {
        const existing = get().libraryVoices;
        const seen = new Set(existing.map((v) => v.voice_id));
        const merged = [...existing];
        for (const v of voices) {
          if (!seen.has(v.voice_id)) {
            seen.add(v.voice_id);
            merged.push(v);
          }
        }
        set({
          libraryVoices: merged,
          libraryHasMore: hasMore,
          libraryTotalCount: totalCount,
          libraryPage: page,
        });
      } else {
        set({
          libraryVoices: voices,
          libraryHasMore: hasMore,
          libraryTotalCount: totalCount,
          libraryPage: page,
        });
      }
    } catch (err: unknown) {
      console.error("loadVoiceLibrary:", err);
      set({
        error: err instanceof Error ? err.message : "Failed to load voice library",
        libraryVoices: [],
        libraryHasMore: false,
        libraryTotalCount: null,
        libraryPage: 0,
      });
    } finally {
      set({ libraryLoading: false });
    }
  },

  createCharacter: async (userId, payload) => {
    if (!userId || !canCallApi(userId)) return null;

    const voiceId = payload.voice_id.trim();
    if (!voiceId) {
      showNotification({
        title: "Missing voice",
        message: "Select a voice from the library.",
        type: "error",
      });
      return null;
    }

    set({ createLoading: true, error: null });
    try {
      const json = await authFetchJson<{ character: UserCharacter }>(
        `${endpoint}/characters/create`,
        {
          method: "POST",
          body: JSON.stringify({ voice_id: voiceId }),
        },
        { errorMessage: "Failed to create character" }
      );

      const character = json.character;
      if (!character?.id?.trim()) {
        throw new Error("Character was not returned");
      }

      await get().loadCharacters(userId, {
        page: 0,
        limit: get().charactersLimit ?? CHARACTERS_PAGE_LIMIT_DEFAULT,
      });

      showNotification({
        title: "Character created",
        message: character.name ? `"${character.name}" is ready.` : "Your character is ready.",
        type: "success",
      });
      return character;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create character";
      set({ error: message });
      showNotification({
        title: "Could not create character",
        message,
        type: "error",
      });
      return null;
    } finally {
      set({ createLoading: false });
    }
  },
}));

export default createUniversalSelectors(useCharactersStoreBase);
