import { create } from "zustand";
import createUniversalSelectors from "./universalSelectors";
import { showNotification } from "../notificationUtils";
import useAppStore from "./appStore";
import { authFetchJson } from "./authFetch";
import { endpoint } from "../utils";

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
  files: unknown;
};

export type SharedVoiceItem = {
  voice_id: string;
  name?: string | null;
  preview_url?: string | null;
  accent?: string | null;
  gender?: string | null;
  language?: string | null;
  description?: string | null;
  use_case?: string | null;
  descriptive?: string | null;
  category?: string | null;
};

/** Filters for `GET /v1/shared-voices` (proxied as `/characters/voices/library`). */
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
  error: string | null;

  setError: (error: string | null) => void;
  reset: () => void;
  clearVoiceLibrary: () => void;

  loadCharacters: (userId: string, opts?: { page?: number; limit?: number }) => Promise<void>;
  /** GET `/characters/:id`; returns `null` if missing or not found. */
  fetchCharacterById: (userId: string, characterId: string) => Promise<UserCharacter | null>;
  /** DELETE `/characters/:id` (storage + DB). Refetches the current list page. */
  deleteCharacter: (userId: string, characterId: string) => Promise<boolean>;
  loadVoiceLibrary: (params: LoadVoiceLibraryParams) => Promise<void>;
  createCharacterFromVoiceId: (userId: string, voiceId: string) => Promise<UserCharacter | null>;
};

const initial: Pick<
  CharactersState,
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
  | "error"
> = {
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
        `${endpoint}/characters/voices/library?${qs}`,
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

  createCharacterFromVoiceId: async (userId, voiceId) => {
    if (!userId || !canCallApi(userId)) return null;
    const id = voiceId.trim();
    if (!id) {
      showNotification({
        title: "Voice required",
        message: "Choose a voice from the library.",
        type: "error",
      });
      return null;
    }

    set({ createLoading: true, error: null });
    try {
      const row = await authFetchJson<UserCharacter>(`${endpoint}/characters/create`, {
        method: "POST",
        body: JSON.stringify({ voice_id: id }),
      });
      await get().loadCharacters(userId, {
        page: 0,
        limit: get().charactersLimit ?? CHARACTERS_PAGE_LIMIT_DEFAULT,
      });

      showNotification({
        title: "Character created",
        message: row.name ? `"${row.name}" is ready.` : "Your character is ready.",
        type: "success",
      });
      return row;
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
