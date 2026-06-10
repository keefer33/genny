import { create } from "zustand";
import { looksVisualSignature, type CharacterLook } from "~/pages/characters/characterLookTypes";
import { showNotification } from "../notificationUtils";
import { authFetchJson } from "./authFetch";
import { endpoint } from "../utils";

export type {
  CharacterLook,
  CharacterLookItem,
  CharacterLookItemFile,
} from "~/pages/characters/characterLookTypes";

export type UserCharacter = {
  id: string;
  user_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  name: string;
  description: string;
  gender?: string | null;
  age?: string | null;
  ethnicity?: string | null;
  voice_id?: string | null;
  baseLookThumbnailUrl?: string | null;
};

export type CharacterLookModelUiField = {
  type?: string;
  enum?: string[];
  default?: unknown;
  description?: string;
};

export type CharacterLookModelOption = {
  label: string;
  create_model_id: string;
  edit_model_id: string;
  fields: {
    default: Record<string, unknown>;
    ui: Record<string, CharacterLookModelUiField>;
  };
};

export type CharacterLookModelSelection = {
  createModelId: string;
  editModelId: string;
  payload: Record<string, unknown>;
};

export type CharacterFormValues = {
  name: string;
  description: string;
  voiceId?: string | null;
  gender: string | null;
  age: string | null;
  ethnicity: string | null;
  lookModel?: CharacterLookModelSelection;
};

export type CharacterDesignAssistResult = {
  description: string;
  name: string;
  gender: string | null;
  age: string | null;
  ethnicity: string | null;
};

export const USER_CHARACTERS_PAGE_SIZE = 9;

export type LoadCharactersOptions = {
  page?: number;
  search?: string;
  /** When false, loads every character (e.g. pickers). Default: last used mode. */
  paginate?: boolean;
};

type CharactersState = {
  characters: UserCharacter[];
  charactersTotal: number;
  charactersPage: number;
  charactersSearch: string;
  charactersPaginated: boolean;
  charactersLoading: boolean;
  selectedCharacter: UserCharacter | null;
  setSelectedCharacter: (character: UserCharacter | null) => void;
  selectedCharacterLoading: boolean;
  assistLoading: boolean;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  generateLookLoading: boolean;
  generateSceneLoading: boolean;
  generateVideoLoading: boolean;
  lookModelOptions: CharacterLookModelOption[];
  lookModelOptionsLoading: boolean;
  videoModelOptions: CharacterLookModelOption[];
  videoModelOptionsLoading: boolean;
  characterLooksById: Record<string, CharacterLook[]>;
  characterLooksLoadingById: Record<string, boolean>;
  characterLooksErrorById: Record<string, string | null>;
  error: string | null;
  loadCharacters: (opts?: LoadCharactersOptions) => Promise<void>;
  loadLookModelOptions: () => Promise<CharacterLookModelOption[]>;
  loadVideoModelOptions: () => Promise<CharacterLookModelOption[]>;
  fetchCharacterById: (
    characterId: string,
    opts?: { silent?: boolean }
  ) => Promise<UserCharacter | null>;
  refreshCharacterInStore: (characterId: string) => Promise<UserCharacter | null>;
  fetchCharacterLooks: (
    characterId: string,
    opts?: { silent?: boolean }
  ) => Promise<CharacterLook[]>;
  clearCharacterLooks: (characterId: string) => void;
  assistCharacterDesign: (payload: {
    description?: string;
    name?: string;
    gender?: string | null;
    age?: string | null;
    ethnicity?: string | null;
  }) => Promise<CharacterDesignAssistResult | null>;
  createCharacter: (values: CharacterFormValues) => Promise<UserCharacter | null>;
  updateCharacter: (characterId: string, values: CharacterFormValues) => Promise<boolean>;
  deleteCharacter: (characterId: string) => Promise<boolean>;
  generateCharacterLook: (
    characterId: string,
    values: {
      modelId: string;
      payload: Record<string, unknown>;
      name: string;
    }
  ) => Promise<boolean>;
  generateCharacterScene: (
    characterId: string,
    values: {
      modelId: string;
      payload: Record<string, unknown>;
      name: string;
    }
  ) => Promise<boolean>;
  generateCharacterVideo: (
    characterId: string,
    values: {
      modelId: string;
      payload: Record<string, unknown>;
      name: string;
    }
  ) => Promise<boolean>;
  deleteCharacterScene: (sceneId: string, characterId: string) => Promise<boolean>;
  updateCharacterSceneName: (
    sceneId: string,
    characterId: string,
    name: string
  ) => Promise<boolean>;
  deleteCharacterVideo: (videoId: string, characterId: string) => Promise<boolean>;
  updateCharacterVideoName: (
    videoId: string,
    characterId: string,
    name: string
  ) => Promise<boolean>;
  switchCharacterBaseLook: (lookId: string, characterId: string) => Promise<boolean>;
  deleteCharacterLook: (lookId: string, characterId: string) => Promise<boolean>;
  updateCharacterLookName: (lookId: string, characterId: string, name: string) => Promise<boolean>;
  retryCharacterLookGeneration: (
    characterId: string,
    lookId: string,
    input?: { modelId: string; payload: Record<string, unknown>; name?: string }
  ) => Promise<boolean>;
};

let lookModelOptionsInFlight: Promise<CharacterLookModelOption[]> | null = null;
let videoModelOptionsInFlight: Promise<CharacterLookModelOption[]> | null = null;
const characterLooksVisualSignatures = new Map<string, string>();

function applyCharacterToStore(
  set: (
    partial: Partial<CharactersState> | ((state: CharactersState) => Partial<CharactersState>)
  ) => void,
  get: () => CharactersState,
  character: UserCharacter
) {
  const { characters, selectedCharacter } = get();
  set({
    characters: characters.some((row) => row.id === character.id)
      ? characters.map((row) => (row.id === character.id ? character : row))
      : characters,
    selectedCharacter: selectedCharacter?.id === character.id ? character : selectedCharacter,
  });
}

const useCharactersStore = create<CharactersState>((set, get) => ({
  characters: [],
  charactersTotal: 0,
  charactersPage: 1,
  charactersSearch: "",
  charactersPaginated: true,
  charactersLoading: false,
  selectedCharacter: null,
  selectedCharacterLoading: false,
  assistLoading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  generateLookLoading: false,
  generateSceneLoading: false,
  generateVideoLoading: false,
  lookModelOptions: [],
  lookModelOptionsLoading: false,
  videoModelOptions: [],
  videoModelOptionsLoading: false,
  characterLooksById: {},
  characterLooksLoadingById: {},
  characterLooksErrorById: {},
  error: null,

  setSelectedCharacter: (character) => set({ selectedCharacter: character }),
  loadCharacters: async (opts) => {
    const state = get();
    const paginate = opts?.paginate ?? state.charactersPaginated;
    const page = opts?.page ?? (paginate ? state.charactersPage : 1);
    const search = opts?.search ?? state.charactersSearch;

    set({ charactersLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (paginate) {
        params.set("limit", String(USER_CHARACTERS_PAGE_SIZE));
        params.set("page", String(Math.max(0, page - 1)));
      }
      const trimmedSearch = search.trim();
      if (trimmedSearch) params.set("search", trimmedSearch);

      const query = params.toString();
      const url = query ? `${endpoint}/characters?${query}` : `${endpoint}/characters`;
      const data = await authFetchJson<{ characters?: UserCharacter[]; total?: number }>(
        url,
        undefined,
        { errorMessage: "Failed to load characters" }
      );
      const characters = data.characters ?? [];
      const total = typeof data.total === "number" ? data.total : characters.length;
      set({
        characters,
        charactersTotal: total,
        charactersPage: page,
        charactersSearch: search,
        charactersPaginated: paginate,
        charactersLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load characters";
      set({ charactersLoading: false, error: message });
      showNotification({ title: "Could not load characters", message, type: "error" });
    }
  },

  loadLookModelOptions: async () => {
    if (lookModelOptionsInFlight) {
      return lookModelOptionsInFlight;
    }

    set({ lookModelOptionsLoading: true });
    lookModelOptionsInFlight = (async () => {
      try {
        const data = await authFetchJson<{ options?: CharacterLookModelOption[] }>(
          `${endpoint}/characters/look-model-options`,
          undefined,
          { errorMessage: "Failed to load look models" }
        );
        const options = data.options ?? [];
        set({ lookModelOptions: options, lookModelOptionsLoading: false });
        return options;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load look models";
        set({ lookModelOptions: [], lookModelOptionsLoading: false });
        showNotification({ title: "Could not load look models", message, type: "error" });
        return [];
      } finally {
        lookModelOptionsInFlight = null;
      }
    })();

    return lookModelOptionsInFlight;
  },

  loadVideoModelOptions: async () => {
    if (videoModelOptionsInFlight) {
      return videoModelOptionsInFlight;
    }

    set({ videoModelOptionsLoading: true });
    videoModelOptionsInFlight = (async () => {
      try {
        const data = await authFetchJson<{ options?: CharacterLookModelOption[] }>(
          `${endpoint}/characters/video-model-options`,
          undefined,
          { errorMessage: "Failed to load video models" }
        );
        const options = data.options ?? [];
        set({ videoModelOptions: options, videoModelOptionsLoading: false });
        return options;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load video models";
        set({ videoModelOptions: [], videoModelOptionsLoading: false });
        showNotification({ title: "Could not load video models", message, type: "error" });
        return [];
      } finally {
        videoModelOptionsInFlight = null;
      }
    })();

    return videoModelOptionsInFlight;
  },

  assistCharacterDesign: async (payload) => {
    set({ assistLoading: true, error: null });
    try {
      const data = await authFetchJson<CharacterDesignAssistResult>(
        `${endpoint}/characters/assist`,
        {
          method: "POST",
          body: JSON.stringify({
            description: payload.description?.trim() || undefined,
            name: payload.name?.trim() || undefined,
            gender: payload.gender?.trim() || undefined,
            age: payload.age?.trim() || undefined,
            ethnicity: payload.ethnicity?.trim() || undefined,
          }),
        },
        { errorMessage: "AI assist failed" }
      );
      set({ assistLoading: false });
      showNotification({
        title: "AI assist",
        message: "Character description and details are ready.",
        type: "success",
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI assist failed";
      set({ assistLoading: false, error: message });
      showNotification({ title: "AI assist", message, type: "error" });
      return null;
    }
  },

  fetchCharacterById: async (characterId, opts) => {
    const silent = Boolean(opts?.silent);
    if (!silent) {
      set({ selectedCharacterLoading: true, error: null });
    }
    const id = characterId.trim();
    if (!id) {
      if (!silent) set({ selectedCharacterLoading: false });
      return null;
    }
    try {
      const data = await authFetchJson<{ character?: UserCharacter }>(
        `${endpoint}/characters/${encodeURIComponent(id)}`,
        undefined,
        { errorMessage: "Failed to load character" }
      );
      const character = data.character ?? null;
      if (!silent) set({ selectedCharacterLoading: false });
      if (character?.id) {
        applyCharacterToStore(set, get, character);
      }
      return character;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load character";
      if (!silent) set({ selectedCharacterLoading: false });
      showNotification({ title: "Could not load character", message, type: "error" });
      return null;
    }
  },

  refreshCharacterInStore: async (characterId) => {
    const id = characterId.trim();
    if (!id) return null;
    try {
      const data = await authFetchJson<{ character?: UserCharacter }>(
        `${endpoint}/characters/${encodeURIComponent(id)}`,
        undefined,
        { errorMessage: "Failed to load character" }
      );
      const character = data.character ?? null;
      if (character?.id) {
        applyCharacterToStore(set, get, character);
      }
      return character;
    } catch {
      return null;
    }
  },

  fetchCharacterLooks: async (characterId, opts) => {
    const id = characterId.trim();
    if (!id) return [];

    if (!opts?.silent) {
      set((state) => ({
        characterLooksLoadingById: { ...state.characterLooksLoadingById, [id]: true },
        characterLooksErrorById: { ...state.characterLooksErrorById, [id]: null },
      }));
    }

    try {
      const data = await authFetchJson<{ looks?: CharacterLook[] }>(
        `${endpoint}/characters/${encodeURIComponent(id)}/looks`,
        undefined,
        { errorMessage: "Failed to load character looks" }
      );
      const nextLooks = data.looks ?? [];
      const signature = looksVisualSignature(nextLooks);
      const previousSignature = characterLooksVisualSignatures.get(id) ?? "";

      set((state) => ({
        characterLooksById: { ...state.characterLooksById, [id]: nextLooks },
        characterLooksLoadingById: { ...state.characterLooksLoadingById, [id]: false },
        characterLooksErrorById: { ...state.characterLooksErrorById, [id]: null },
      }));

      if (previousSignature !== "" && signature !== previousSignature) {
        await get().refreshCharacterInStore(id);
      }
      characterLooksVisualSignatures.set(id, signature);

      return nextLooks;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load character looks";
      set((state) => ({
        characterLooksById: { ...state.characterLooksById, [id]: [] },
        characterLooksLoadingById: { ...state.characterLooksLoadingById, [id]: false },
        characterLooksErrorById: { ...state.characterLooksErrorById, [id]: message },
      }));
      return [];
    }
  },

  clearCharacterLooks: (characterId) => {
    const id = characterId.trim();
    if (!id) return;
    characterLooksVisualSignatures.delete(id);
    set((state) => {
      const { [id]: _looks, ...characterLooksById } = state.characterLooksById;
      const { [id]: _loading, ...characterLooksLoadingById } = state.characterLooksLoadingById;
      const { [id]: _error, ...characterLooksErrorById } = state.characterLooksErrorById;
      return { characterLooksById, characterLooksLoadingById, characterLooksErrorById };
    });
  },

  createCharacter: async (values) => {
    set({ createLoading: true, error: null });
    try {
      const data = await authFetchJson<{ character?: UserCharacter }>(
        `${endpoint}/characters`,
        {
          method: "POST",
          body: JSON.stringify({
            name: values.name.trim(),
            description: values.description.trim(),
            voiceId: values.voiceId?.trim() || undefined,
            gender: values.gender?.trim() || undefined,
            age: values.age?.trim() || undefined,
            ethnicity: values.ethnicity?.trim() || undefined,
            lookModel: values.lookModel,
          }),
        },
        { errorMessage: "Failed to create character" }
      );
      set({ createLoading: false });
      const character = data.character ?? null;
      if (character?.id) {
        showNotification({
          title: "Character created",
          message: `"${character.name}" was saved.`,
          type: "success",
        });
        const { charactersPaginated, charactersSearch } = get();
        await get().loadCharacters({ page: 1, paginate: charactersPaginated, search: charactersSearch });
      }
      return character;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create character";
      set({ createLoading: false, error: message });
      showNotification({ title: "Could not create character", message, type: "error" });
      return null;
    }
  },

  updateCharacter: async (characterId, values) => {
    set({ updateLoading: true, error: null });
    try {
      const data = await authFetchJson<{ character?: UserCharacter }>(
        `${endpoint}/characters/${encodeURIComponent(characterId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: values.name.trim(),
            description: values.description.trim(),
            voiceId: values.voiceId,
            gender: values.gender,
            age: values.age,
            ethnicity: values.ethnicity,
          }),
        },
        { errorMessage: "Failed to update character" }
      );
      set({ updateLoading: false });
      const updated = data.character ?? null;
      if (updated?.id) {
        set({
          characters: get().characters.map((c) => (c.id === updated.id ? updated : c)),
          selectedCharacter:
            get().selectedCharacter?.id === updated.id ? updated : get().selectedCharacter,
        });
        showNotification({
          title: "Character updated",
          message: "Your changes were saved.",
          type: "success",
        });
        return true;
      }
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update character";
      set({ updateLoading: false, error: message });
      showNotification({ title: "Could not update character", message, type: "error" });
      return false;
    }
  },

  generateCharacterLook: async (characterId, values) => {
    set({ generateLookLoading: true, error: null });
    try {
      await authFetchJson(
        `${endpoint}/characters/${encodeURIComponent(characterId)}/generate-look`,
        {
          method: "POST",
          body: JSON.stringify({
            modelId: values.modelId,
            payload: values.payload,
            name: values.name.trim(),
          }),
        },
        { errorMessage: "Failed to start look generation" }
      );
      set({ generateLookLoading: false });
      showNotification({
        title: "Generating look",
        message: "Your look is being generated with front, back, right, and left views.",
        type: "success",
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start look generation";
      set({ generateLookLoading: false, error: message });
      showNotification({
        title: "Could not generate look",
        message,
        type: "error",
      });
      return false;
    }
  },

  generateCharacterScene: async (characterId, values) => {
    set({ generateSceneLoading: true, error: null });
    try {
      await authFetchJson(
        `${endpoint}/characters/${encodeURIComponent(characterId)}/generate-scene`,
        {
          method: "POST",
          body: JSON.stringify({
            modelId: values.modelId,
            payload: values.payload,
            name: values.name.trim(),
          }),
        },
        { errorMessage: "Failed to start scene generation" }
      );
      set({ generateSceneLoading: false });
      showNotification({
        title: "Generating scene",
        message: "Your scene is being generated.",
        type: "success",
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start scene generation";
      set({ generateSceneLoading: false, error: message });
      showNotification({
        title: "Could not generate scene",
        message,
        type: "error",
      });
      return false;
    }
  },

  deleteCharacterScene: async (sceneId, characterId) => {
    try {
      await authFetchJson(
        `${endpoint}/characters/${encodeURIComponent(characterId)}/scenes/${encodeURIComponent(sceneId)}`,
        { method: "DELETE" },
        { errorMessage: "Failed to delete scene" }
      );
      showNotification({
        title: "Scene deleted",
        message: "The scene was removed.",
        type: "success",
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete scene";
      showNotification({ title: "Could not delete scene", message, type: "error" });
      return false;
    }
  },

  updateCharacterSceneName: async (sceneId, characterId, name) => {
    try {
      await authFetchJson(
        `${endpoint}/characters/${encodeURIComponent(characterId)}/scenes/${encodeURIComponent(sceneId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ name: name.trim() }),
        },
        { errorMessage: "Failed to update scene name" }
      );
      showNotification({
        title: "Scene updated",
        message: "Scene name was saved.",
        type: "success",
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update scene name";
      showNotification({ title: "Could not update scene", message, type: "error" });
      return false;
    }
  },

  generateCharacterVideo: async (characterId, values) => {
    set({ generateVideoLoading: true, error: null });
    try {
      await authFetchJson(
        `${endpoint}/characters/${encodeURIComponent(characterId)}/generate-video`,
        {
          method: "POST",
          body: JSON.stringify({
            modelId: values.modelId,
            payload: values.payload,
            name: values.name.trim(),
          }),
        },
        { errorMessage: "Failed to start video generation" }
      );
      set({ generateVideoLoading: false });
      showNotification({
        title: "Generating video",
        message: "Your video is being generated.",
        type: "success",
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start video generation";
      set({ generateVideoLoading: false, error: message });
      showNotification({
        title: "Could not generate video",
        message,
        type: "error",
      });
      return false;
    }
  },

  deleteCharacterVideo: async (videoId, characterId) => {
    try {
      await authFetchJson(
        `${endpoint}/characters/${encodeURIComponent(characterId)}/videos/${encodeURIComponent(videoId)}`,
        { method: "DELETE" },
        { errorMessage: "Failed to delete video" }
      );
      showNotification({
        title: "Video deleted",
        message: "The video was removed.",
        type: "success",
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete video";
      showNotification({ title: "Could not delete video", message, type: "error" });
      return false;
    }
  },

  updateCharacterVideoName: async (videoId, characterId, name) => {
    try {
      await authFetchJson(
        `${endpoint}/characters/${encodeURIComponent(characterId)}/videos/${encodeURIComponent(videoId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ name: name.trim() }),
        },
        { errorMessage: "Failed to update video name" }
      );
      showNotification({
        title: "Video updated",
        message: "Video name was saved.",
        type: "success",
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update video name";
      showNotification({ title: "Could not update video", message, type: "error" });
      return false;
    }
  },

  switchCharacterBaseLook: async (lookId, characterId) => {
    set({ updateLoading: true, error: null });
    try {
      await authFetchJson(
        `${endpoint}/characters/${encodeURIComponent(characterId)}/switch-base-look`,
        {
          method: "POST",
          body: JSON.stringify({ lookId }),
        },
        { errorMessage: "Failed to switch base look" }
      );
      set({ updateLoading: false });
      showNotification({
        title: "Base look updated",
        message: "Character base look was switched.",
        type: "success",
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to switch base look";
      set({ updateLoading: false, error: message });
      showNotification({ title: "Could not switch base look", message, type: "error" });
      return false;
    }
  },

  deleteCharacterLook: async (lookId, characterId) => {
    try {
      await authFetchJson(
        `${endpoint}/characters/${encodeURIComponent(characterId)}/looks/${encodeURIComponent(lookId)}`,
        { method: "DELETE" },
        { errorMessage: "Failed to delete look" }
      );
      showNotification({
        title: "Look deleted",
        message: "The look, its views, and files were removed.",
        type: "success",
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete look";
      showNotification({ title: "Could not delete look", message, type: "error" });
      return false;
    }
  },

  updateCharacterLookName: async (lookId, characterId, name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    try {
      await authFetchJson(
        `${endpoint}/characters/${encodeURIComponent(characterId)}/looks/${encodeURIComponent(lookId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ name: trimmed }),
        },
        { errorMessage: "Failed to update look name" }
      );
      showNotification({
        title: "Look updated",
        message: "Look name was saved.",
        type: "success",
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update look name";
      showNotification({ title: "Could not update look", message, type: "error" });
      return false;
    }
  },

  retryCharacterLookGeneration: async (characterId, lookId, input) => {
    try {
      await authFetchJson(
        `${endpoint}/characters/${encodeURIComponent(characterId)}/looks/${encodeURIComponent(lookId)}/retry-generation`,
        {
          method: "POST",
          body: JSON.stringify({
            modelId: input?.modelId,
            payload: input?.payload,
            name: input?.name?.trim() || undefined,
          }),
        },
        { errorMessage: "Failed to retry look generation" }
      );
      showNotification({
        title: "Retrying look generation",
        message: input?.payload
          ? "Your look is being generated with the updated settings."
          : "Your look is being generated again.",
        type: "success",
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to retry look generation";
      showNotification({ title: "Could not retry look", message, type: "error" });
      return false;
    }
  },

  deleteCharacter: async (characterId) => {
    set({ deleteLoading: true, error: null });
    try {
      await authFetchJson(
        `${endpoint}/characters/${encodeURIComponent(characterId)}`,
        { method: "DELETE" },
        { errorMessage: "Failed to delete character" }
      );
      const { charactersPage, charactersPaginated, charactersSearch } = get();
      set({
        deleteLoading: false,
        selectedCharacter:
          get().selectedCharacter?.id === characterId ? null : get().selectedCharacter,
      });
      showNotification({
        title: "Character deleted",
        message: "The character was removed.",
        type: "success",
      });
      await get().loadCharacters({
        page: charactersPage,
        paginate: charactersPaginated,
        search: charactersSearch,
      });
      if (get().characters.length === 0 && charactersPage > 1 && charactersPaginated) {
        await get().loadCharacters({
          page: charactersPage - 1,
          paginate: true,
          search: charactersSearch,
        });
      }
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete character";
      set({ deleteLoading: false, error: message });
      showNotification({ title: "Could not delete character", message, type: "error" });
      return false;
    }
  },
}));

export default useCharactersStore;
