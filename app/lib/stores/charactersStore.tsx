import { create } from "zustand";
import { showNotification } from "../notificationUtils";
import { authFetchJson } from "./authFetch";
import { endpoint } from "../utils";

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

export type CharacterFormValues = {
  name: string;
  description: string;
  voiceId?: string | null;
  gender: string | null;
  age: string | null;
  ethnicity: string | null;
};

export type CharacterDesignAssistResult = {
  description: string;
  name: string;
  gender: string | null;
  age: string | null;
  ethnicity: string | null;
};

type CharactersState = {
  characters: UserCharacter[];
  charactersLoading: boolean;
  assistLoading: boolean;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  generateLookLoading: boolean;
  error: string | null;
  loadCharacters: () => Promise<void>;
  fetchCharacterById: (characterId: string) => Promise<UserCharacter | null>;
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
  switchCharacterBaseLook: (lookId: string, characterId: string) => Promise<boolean>;
  deleteCharacterLook: (lookId: string, characterId: string) => Promise<boolean>;
  updateCharacterLookName: (lookId: string, characterId: string, name: string) => Promise<boolean>;
};

const useCharactersStore = create<CharactersState>((set, get) => ({
  characters: [],
  charactersLoading: false,
  assistLoading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  generateLookLoading: false,
  error: null,

  loadCharacters: async () => {
    set({ charactersLoading: true, error: null });
    try {
      const data = await authFetchJson<{ characters?: UserCharacter[] }>(
        `${endpoint}/characters`,
        undefined,
        { errorMessage: "Failed to load characters" }
      );
      set({ characters: data.characters ?? [], charactersLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load characters";
      set({ charactersLoading: false, error: message });
      showNotification({ title: "Could not load characters", message, type: "error" });
    }
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

  fetchCharacterById: async (characterId) => {
    const id = characterId.trim();
    if (!id) return null;
    try {
      const data = await authFetchJson<{ character?: UserCharacter }>(
        `${endpoint}/characters/${encodeURIComponent(id)}`,
        undefined,
        { errorMessage: "Failed to load character" }
      );
      return data.character ?? null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load character";
      showNotification({ title: "Could not load character", message, type: "error" });
      return null;
    }
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
        await get().loadCharacters();
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

  deleteCharacter: async (characterId) => {
    set({ deleteLoading: true, error: null });
    try {
      await authFetchJson(
        `${endpoint}/characters/${encodeURIComponent(characterId)}`,
        { method: "DELETE" },
        { errorMessage: "Failed to delete character" }
      );
      set({
        deleteLoading: false,
        characters: get().characters.filter((c) => c.id !== characterId),
      });
      showNotification({
        title: "Character deleted",
        message: "The character was removed.",
        type: "success",
      });
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
