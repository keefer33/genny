import { create } from "zustand";
import { showNotification } from "../notificationUtils";
import { authFetchJson } from "./authFetch";
import { endpoint } from "../utils";

export type UserVoiceFile = {
  id: string;
  file_name?: string | null;
  file_path?: string | null;
  file_type?: string | null;
  upload_type?: string | null;
  created_at?: string | null;
};

export type UserVoiceSpeech = {
  id: string;
  voice_id?: string | null;
  title?: string | null;
  transcript?: string | null;
  metadata?: unknown;
  file_id?: string | null;
  created_at?: string | null;
  file: UserVoiceFile | null;
};

export type SynthesizeSpeechResult = {
  speech: UserVoiceSpeech;
  file: UserVoiceFile;
  voice: UserVoice;
};

export type UserVoice = {
  id: string;
  name?: string | null;
  description?: string | null;
  language?: string | null;
  gender?: string | null;
  age?: string | null;
  accent?: string | null;
  type?: string | null;
  metadata?: unknown;
  created_at?: string | null;
  files?: UserVoiceFile[];
  source?: string | null;
};

export type DesignPreviewVoice = {
  voiceId: string;
  previewText: string;
  previewAudio: string;
};

export type DesignVoiceResult = {
  langCode: string;
  previewVoices: DesignPreviewVoice[];
};

export const USER_VOICES_PAGE_SIZE = 9;

export type LoadUserVoicesOptions = {
  page?: number;
  search?: string;
  /** When false, loads every voice (e.g. pickers). Default: last used mode. */
  paginate?: boolean;
};

export type VoiceDesignAssistResult = {
  designPrompt: string;
  previewText: string;
  gender: string | null;
  age: string | null;
  accent: string | null;
  defaultName: string;
};

type VoicesState = {
  userVoices: UserVoice[];
  userVoicesTotal: number;
  userVoicesPage: number;
  userVoicesSearch: string;
  userVoicesPaginated: boolean;
  selectedVoice: UserVoice | null;
  setSelectedVoice: (voice: UserVoice | null) => void;
  voiceSpeeches: UserVoiceSpeech[];
  loadVoiceSpeeches: () => Promise<void>;
  prependVoiceSpeech: (speech: UserVoiceSpeech) => void;
  patchVoiceSpeech: (speech: UserVoiceSpeech) => void;
  removeVoiceSpeech: (speechId: string) => void;
  libraryVoices: UserVoice[];
  userVoicesLoading: boolean;
  libraryVoicesLoading: boolean;
  voiceLoading: boolean;
  speechesLoading: boolean;
  speechSynthesizeLoading: boolean;
  speechDeleteLoading: boolean;
  speechUpdateLoading: boolean;
  designLoading: boolean;
  assistLoading: boolean;
  publishLoading: boolean;
  cloneLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  error: string | null;
  loadUserVoices: (opts?: LoadUserVoicesOptions) => Promise<void>;
  loadLibraryVoices: () => Promise<void>;
  getVoiceById: (voiceId: string) => Promise<UserVoice | null>;
  getVoiceSpeeches: (voiceId: string) => Promise<UserVoiceSpeech[]>;
  deleteVoiceSpeech: (speechId: string) => Promise<boolean>;
  updateVoiceSpeech: (speechId: string, title: string) => Promise<UserVoiceSpeech | null>;
  synthesizeSpeech: (payload: {
    voiceId: string;
    inworldVoiceId: string;
    text: string;
    title?: string | null;
  }) => Promise<SynthesizeSpeechResult | null>;
  designVoice: (payload: {
    designPrompt: string;
    previewText: string;
    numberOfSamples?: number;
  }) => Promise<DesignVoiceResult | null>;
  assistVoiceDesign: (payload: {
    designPrompt?: string;
    previewText?: string;
    gender?: string | null;
    age?: string | null;
    accent?: string | null;
    defaultName?: string;
  }) => Promise<VoiceDesignAssistResult | null>;
  publishVoices: (
    items: Array<{
      voiceId: string;
      displayName: string;
      previewAudio: string;
      previewText?: string;
      designPrompt?: string;
      description?: string;
      gender?: string;
      age?: string;
      accent?: string;
    }>
  ) => Promise<boolean>;
  cloneVoice: (payload: {
    audio: string;
    name: string;
    language?: string | null;
    description?: string | null;
    gender?: string | null;
    age?: string | null;
    accent?: string | null;
    type?: string | null;
    metadata?: unknown;
  }) => Promise<UserVoice | null>;
  updateVoice: (
    voiceId: string,
    payload: {
      name: string;
      description: string;
      gender: string | null;
      age: string | null;
      accent: string | null;
    }
  ) => Promise<boolean>;
  deleteVoice: (voiceId: string) => Promise<boolean>;
  editVoiceOpened: boolean;
  openEditVoice: () => void;
  closeEditVoice: () => void;
  cloneVoiceOpened: boolean;
  openCloneVoice: () => void;
  closeCloneVoice: () => void;
  deleteVoiceOpened: boolean;
  openDeleteVoice: () => void;
  closeDeleteVoice: () => void;
  libraryVoiceOpened: boolean;
  openLibraryVoice: () => void;
  closeLibraryVoice: () => void;
  designVoiceOpened: boolean;
  openDesignVoice: () => void;
  closeDesignVoice: () => void;
};

function voicePreviewUrl(voice: UserVoice): string | null {
  const file = voice.files?.[0];
  const path = file?.file_path?.trim();
  return path || null;
}

export function getVoicePreviewUrl(voice: UserVoice): string | null {
  return voicePreviewUrl(voice);
}

export function previewAudioDataUrl(base64: string, mime = "audio/mpeg"): string {
  const trimmed = base64.trim();
  if (trimmed.startsWith("data:")) return trimmed;
  return `data:${mime};base64,${trimmed.replace(/\s/g, "")}`;
}

const useVoicesStore = create<VoicesState>((set, get) => ({
  userVoices: [],
  userVoicesTotal: 0,
  userVoicesPage: 1,
  userVoicesSearch: "",
  userVoicesPaginated: true,
  selectedVoice: null,
  voiceSpeeches: [],
  libraryVoices: [],
  userVoicesLoading: false,
  libraryVoicesLoading: false,
  voiceLoading: false,
  speechesLoading: false,
  speechSynthesizeLoading: false,
  speechDeleteLoading: false,
  speechUpdateLoading: false,
  designLoading: false,
  assistLoading: false,
  publishLoading: false,
  cloneLoading: false,
  updateLoading: false,
  deleteLoading: false,
  error: null,
  editVoiceOpened: false,
  openEditVoice: () => set({ editVoiceOpened: true }),
  closeEditVoice: () => set({ editVoiceOpened: false }),
  cloneVoiceOpened: false,
  openCloneVoice: () => set({ cloneVoiceOpened: true }),
  closeCloneVoice: () => set({ cloneVoiceOpened: false }),
  deleteVoiceOpened: false,
  openDeleteVoice: () => set({ deleteVoiceOpened: true }),
  closeDeleteVoice: () => set({ deleteVoiceOpened: false }),
  libraryVoiceOpened: false,
  openLibraryVoice: () => set({ libraryVoiceOpened: true }),
  closeLibraryVoice: () => set({ libraryVoiceOpened: false }),
  designVoiceOpened: false,
  openDesignVoice: () => set({ designVoiceOpened: true }),
  closeDesignVoice: () => set({ designVoiceOpened: false }),

  setSelectedVoice: (voice: UserVoice | null) => {
    set({ selectedVoice: voice });
  },

  loadVoiceSpeeches: async () => {
    const voiceId = get().selectedVoice?.id?.trim();
    if (!voiceId) {
      set({ voiceSpeeches: [] });
      return;
    }
    const speeches = await get().getVoiceSpeeches(voiceId);
    if (get().selectedVoice?.id?.trim() === voiceId) {
      set({ voiceSpeeches: speeches });
    }
  },

  prependVoiceSpeech: (speech) => {
    const voiceId = get().selectedVoice?.id?.trim();
    const speechVoiceId = speech.voice_id?.trim();
    if (voiceId && speechVoiceId && voiceId !== speechVoiceId) return;
    set({ voiceSpeeches: [speech, ...get().voiceSpeeches] });
  },

  patchVoiceSpeech: (speech) => {
    const id = speech.id?.trim();
    if (!id) return;
    set({
      voiceSpeeches: get().voiceSpeeches.map((row) =>
        row.id === id ? { ...row, ...speech, file: speech.file ?? row.file } : row
      ),
    });
  },

  removeVoiceSpeech: (speechId) => {
    const id = speechId.trim();
    if (!id) return;
    set({ voiceSpeeches: get().voiceSpeeches.filter((row) => row.id !== id) });
  },

  loadUserVoices: async (opts) => {
    const state = get();
    const paginate = opts?.paginate ?? state.userVoicesPaginated;
    const page = opts?.page ?? (paginate ? state.userVoicesPage : 1);
    const search = opts?.search ?? state.userVoicesSearch;

    set({ userVoicesLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (paginate) {
        params.set("limit", String(USER_VOICES_PAGE_SIZE));
        params.set("page", String(Math.max(0, page - 1)));
      }
      const trimmedSearch = search.trim();
      if (trimmedSearch) params.set("search", trimmedSearch);

      const query = params.toString();
      const url = query ? `${endpoint}/voices?${query}` : `${endpoint}/voices`;
      const data = await authFetchJson<{ voices?: UserVoice[]; total?: number }>(url, undefined, {
        errorMessage: "Failed to load your voices",
      });
      const voices = data.voices ?? [];
      const total = typeof data.total === "number" ? data.total : voices.length;
      set({
        userVoices: voices,
        userVoicesTotal: total,
        userVoicesPage: page,
        userVoicesSearch: search,
        userVoicesPaginated: paginate,
        userVoicesLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load your voices";
      set({ userVoicesLoading: false, error: message });
      showNotification({ title: "Could not load voices", message, type: "error" });
    }
  },

  loadLibraryVoices: async () => {
    set({ libraryVoicesLoading: true, error: null });
    try {
      const data = await authFetchJson<{ voices?: UserVoice[] }>(
        `${endpoint}/voices/library`,
        undefined,
        { errorMessage: "Failed to load voice library" }
      );
      set({ libraryVoices: data.voices ?? [], libraryVoicesLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load voice library";
      set({ libraryVoicesLoading: false, error: message });
      showNotification({ title: "Could not load voice library", message, type: "error" });
    }
  },

  getVoiceById: async (voiceId: string) => {
    const id = voiceId.trim();
    if (!id) return null;

    set({ voiceLoading: true, error: null });
    try {
      const data = await authFetchJson<{ voice?: UserVoice | null }>(
        `${endpoint}/voices/${encodeURIComponent(id)}`,
        undefined,
        { errorMessage: "Failed to load voice" }
      );
      set({ voiceLoading: false });
      return data.voice ?? null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load voice";
      set({ voiceLoading: false, error: message });
      showNotification({ title: "Could not load voice", message, type: "error" });
      return null;
    }
  },

  getVoiceSpeeches: async (voiceId: string) => {
    const id = voiceId.trim();
    if (!id) return [];

    set({ speechesLoading: true, error: null });
    try {
      const data = await authFetchJson<{ speeches?: UserVoiceSpeech[] }>(
        `${endpoint}/voices/speech/${encodeURIComponent(id)}`,
        undefined,
        { errorMessage: "Failed to load speeches" }
      );
      set({ speechesLoading: false });
      return data.speeches ?? [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load speeches";
      set({ speechesLoading: false, error: message });
      showNotification({ title: "Could not load speeches", message, type: "error" });
      return [];
    }
  },

  deleteVoiceSpeech: async (speechId: string) => {
    const id = speechId.trim();
    if (!id) return false;

    set({ speechDeleteLoading: true, error: null });
    try {
      await authFetchJson(
        `${endpoint}/voices/speech/entry/${encodeURIComponent(id)}`,
        { method: "DELETE" },
        { errorMessage: "Failed to delete speech" }
      );
      set({ speechDeleteLoading: false });
      showNotification({
        title: "Speech deleted",
        message: "The speech was removed.",
        type: "success",
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete speech";
      set({ speechDeleteLoading: false, error: message });
      showNotification({ title: "Could not delete speech", message, type: "error" });
      return false;
    }
  },

  updateVoiceSpeech: async (speechId, title) => {
    const id = speechId.trim();
    const nextTitle = title.trim();
    if (!id || !nextTitle) return null;

    set({ speechUpdateLoading: true, error: null });
    try {
      const data = await authFetchJson<{ speech?: UserVoiceSpeech }>(
        `${endpoint}/voices/speech/entry/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ title: nextTitle }),
        },
        { errorMessage: "Failed to update speech" }
      );
      set({ speechUpdateLoading: false });
      const speech = data.speech ?? null;
      if (speech?.id) {
        showNotification({
          title: "Speech updated",
          message: "The speech name was saved.",
          type: "success",
        });
        return {
          ...speech,
          id: speech.id,
          file: speech.file ?? null,
        };
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update speech";
      set({ speechUpdateLoading: false, error: message });
      showNotification({ title: "Could not update speech", message, type: "error" });
      return null;
    }
  },

  synthesizeSpeech: async (payload) => {
    const voiceId = payload.voiceId.trim();
    const inworldVoiceId = payload.inworldVoiceId.trim();
    const text = payload.text.trim();
    if (!voiceId || !inworldVoiceId || !text) return null;

    set({ speechSynthesizeLoading: true, error: null });
    try {
      const data = await authFetchJson<SynthesizeSpeechResult>(
        `${endpoint}/voices/speech`,
        {
          method: "POST",
          body: JSON.stringify({
            voiceId,
            inworldVoiceId,
            text,
            title: payload.title?.trim() || undefined,
          }),
        },
        { errorMessage: "Failed to generate speech" }
      );
      set({ speechSynthesizeLoading: false });
      showNotification({
        title: "Speech generated",
        message: "Your audio was saved to this voice.",
        type: "success",
      });
      const speech: UserVoiceSpeech = {
        ...data.speech,
        id: data.speech.id ?? "",
        file: data.file ?? data.speech.file ?? null,
      };
      return { ...data, speech };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate speech";
      set({ speechSynthesizeLoading: false, error: message });
      showNotification({ title: "Could not generate speech", message, type: "error" });
      return null;
    }
  },

  assistVoiceDesign: async (payload) => {
    set({ assistLoading: true, error: null });
    try {
      const data = await authFetchJson<VoiceDesignAssistResult>(
        `${endpoint}/voices/design/assist`,
        {
          method: "POST",
          body: JSON.stringify({
            designPrompt: payload.designPrompt?.trim() || undefined,
            previewText: payload.previewText?.trim() || undefined,
            gender: payload.gender?.trim() || undefined,
            age: payload.age?.trim() || undefined,
            accent: payload.accent?.trim() || undefined,
            defaultName: payload.defaultName?.trim() || undefined,
          }),
        },
        { errorMessage: "AI assist failed" }
      );
      set({ assistLoading: false });
      showNotification({
        title: "AI assist",
        message: "Voice description and preview script are ready.",
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

  designVoice: async (payload) => {
    set({ designLoading: true, error: null });
    try {
      const data = await authFetchJson<DesignVoiceResult>(
        `${endpoint}/voices/design`,
        {
          method: "POST",
          body: JSON.stringify({
            designPrompt: payload.designPrompt,
            previewText: payload.previewText,
            language: "EN_US",
            numberOfSamples: payload.numberOfSamples ?? 3,
          }),
        },
        { errorMessage: "Voice design failed" }
      );
      set({ designLoading: false });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Voice design failed";
      set({ designLoading: false, error: message });
      showNotification({ title: "Could not design voice", message, type: "error" });
      return null;
    }
  },

  publishVoices: async (items) => {
    if (items.length === 0) return false;
    set({ publishLoading: true, error: null });
    try {
      for (const item of items) {
        await authFetchJson(
          `${endpoint}/voices/publish`,
          {
            method: "POST",
            body: JSON.stringify({
              voiceId: item.voiceId,
              displayName: item.displayName,
              previewAudio: item.previewAudio,
              previewText: item.previewText,
              designPrompt: item.designPrompt,
              description: item.description ?? item.designPrompt,
              language: "EN_US",
              gender: item.gender,
              age: item.age,
              accent: item.accent,
            }),
          },
          { errorMessage: "Failed to publish voice" }
        );
      }
      set({ publishLoading: false });
      showNotification({
        title: "Voices published",
        message:
          items.length === 1
            ? "Your voice was saved to your library."
            : `${items.length} voices were saved to your library.`,
        type: "success",
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to publish voice";
      set({ publishLoading: false, error: message });
      showNotification({ title: "Could not publish voice", message, type: "error" });
      return false;
    }
  },

  cloneVoice: async (payload) => {
    set({ cloneLoading: true, error: null });
    try {
      const data = await authFetchJson<{ voice?: UserVoice }>(
        `${endpoint}/voices/clone`,
        {
          method: "POST",
          body: JSON.stringify({
            audio: payload.audio.trim(),
            name: payload.name.trim(),
            language: payload.language?.trim() || undefined,
            description: payload.description?.trim() || undefined,
            gender: payload.gender?.trim() || undefined,
            age: payload.age?.trim() || undefined,
            accent: payload.accent?.trim() || undefined,
            type: payload.type?.trim() || undefined,
            metadata: payload.metadata,
          }),
        },
        { errorMessage: "Failed to clone voice" }
      );
      const voice = data.voice ?? null;
      set({ cloneLoading: false });
      if (voice?.id) {
        showNotification({
          title: "Voice cloned",
          message: "The cloned voice was saved to your library.",
          type: "success",
        });
        return voice;
      }
      showNotification({
        title: "Clone failed",
        message: "No voice was returned from the server.",
        type: "error",
      });
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to clone voice";
      set({ cloneLoading: false, error: message });
      showNotification({ title: "Could not clone voice", message, type: "error" });
      return null;
    }
  },

  updateVoice: async (voiceId, payload) => {
    set({ updateLoading: true, error: null });
    try {
      await authFetchJson(
        `${endpoint}/voices/${encodeURIComponent(voiceId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: payload.name,
            description: payload.description,
            gender: payload.gender,
            age: payload.age,
            accent: payload.accent,
          }),
        },
        { errorMessage: "Failed to update voice" }
      );
      set({ updateLoading: false });
      showNotification({
        title: "Voice updated",
        message: "Your voice was saved.",
        type: "success",
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update voice";
      set({ updateLoading: false, error: message });
      showNotification({ title: "Could not update voice", message, type: "error" });
      return false;
    }
  },

  deleteVoice: async (voiceId) => {
    set({ deleteLoading: true, error: null });
    try {
      await authFetchJson(
        `${endpoint}/voices/${encodeURIComponent(voiceId)}`,
        { method: "DELETE" },
        { errorMessage: "Failed to delete voice" }
      );
      set({ deleteLoading: false });
      showNotification({
        title: "Voice deleted",
        message: "The voice was removed from your library.",
        type: "success",
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete voice";
      set({ deleteLoading: false, error: message });
      showNotification({ title: "Could not delete voice", message, type: "error" });
      return false;
    }
  },
}));

export default useVoicesStore;
