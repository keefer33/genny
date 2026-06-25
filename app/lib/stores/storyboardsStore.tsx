import { create } from "zustand";
import { showNotification } from "../notificationUtils";
import { authFetchJson } from "./authFetch";
import { endpoint } from "../utils";
import {
  storyboardSettingsFromForm,
  nextSceneTitle,
  scenePayloadFromForm,
  buildScenePayloadFromExisting,
  type SceneLayer,
  type StoryboardFormValues,
  type StoryboardSceneFormValues,
  type UserStoryboard,
  type UserStoryboardScene,
} from "~/pages/storyboards/storyboardUtils";

type StoryboardsState = {
  storyboards: UserStoryboard[];
  storyboardsLoading: boolean;
  selectedStoryboard: UserStoryboard | null;
  storyboardScenes: UserStoryboardScene[];
  selectedStoryboardLoading: boolean;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  createSceneLoading: boolean;
  updateSceneLoading: boolean;
  saveLayersLoading: boolean;
  renderStoryboardLoading: boolean;
  deletingSceneId: string | null;
  error: string | null;
  setSelectedStoryboard: (storyboard: UserStoryboard | null) => void;
  loadStoryboards: () => Promise<void>;
  loadStoryboardDetail: (storyboardId: string) => Promise<UserStoryboard | null>;
  createStoryboard: (values: StoryboardFormValues) => Promise<UserStoryboard | null>;
  updateStoryboard: (storyboardId: string, values: StoryboardFormValues) => Promise<boolean>;
  deleteStoryboard: (storyboardId: string) => Promise<boolean>;
  createStoryboardScene: (
    storyboardId: string,
    values: StoryboardSceneFormValues
  ) => Promise<UserStoryboardScene | null>;
  updateStoryboardScene: (
    storyboardId: string,
    sceneId: string,
    values: StoryboardSceneFormValues,
    existingScene?: unknown | null
  ) => Promise<boolean>;
  saveStoryboardSceneLayers: (
    storyboardId: string,
    sceneId: string,
    layers: SceneLayer[],
    options?: { silent?: boolean }
  ) => Promise<boolean>;
  renderStoryboard: (
    storyboardId: string
  ) => Promise<{ file_id?: string; file_url?: string; file_name?: string } | null>;
  deleteStoryboardScene: (storyboardId: string, sceneId: string) => Promise<boolean>;
};

const useStoryboardsStore = create<StoryboardsState>((set, get) => ({
  storyboards: [],
  storyboardsLoading: false,
  selectedStoryboard: null,
  storyboardScenes: [],
  selectedStoryboardLoading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  createSceneLoading: false,
  updateSceneLoading: false,
  saveLayersLoading: false,
  renderStoryboardLoading: false,
  deletingSceneId: null,
  error: null,

  setSelectedStoryboard: (storyboard) => set({ selectedStoryboard: storyboard }),

  loadStoryboards: async () => {
    set({ storyboardsLoading: true, error: null });
    try {
      const data = await authFetchJson<{ storyboards?: UserStoryboard[] }>(
        `${endpoint}/storyboards`,
        undefined,
        { errorMessage: "Failed to load storyboards" }
      );
      set({
        storyboards: data.storyboards ?? [],
        storyboardsLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load storyboards";
      set({ storyboardsLoading: false, error: message });
      showNotification({ title: "Storyboards", message, type: "error" });
    }
  },

  loadStoryboardDetail: async (storyboardId) => {
    const id = storyboardId.trim();
    if (!id) return null;

    set({ selectedStoryboardLoading: true, error: null, storyboardScenes: [] });
    try {
      const [storyboardData, scenesData] = await Promise.all([
        authFetchJson<{ storyboard?: UserStoryboard }>(
          `${endpoint}/storyboards/${encodeURIComponent(id)}`,
          undefined,
          { errorMessage: "Failed to load storyboard" }
        ),
        authFetchJson<{ scenes?: UserStoryboardScene[] }>(
          `${endpoint}/storyboards/${encodeURIComponent(id)}/scenes`,
          undefined,
          { errorMessage: "Failed to load scenes" }
        ),
      ]);

      const storyboard = storyboardData.storyboard ?? null;
      const scenes = scenesData.scenes ?? [];
      set({
        selectedStoryboard: storyboard,
        storyboardScenes: scenes,
        selectedStoryboardLoading: false,
      });
      return storyboard;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load storyboard";
      set({
        selectedStoryboard: null,
        storyboardScenes: [],
        selectedStoryboardLoading: false,
        error: message,
      });
      showNotification({ title: "Storyboard", message, type: "error" });
      return null;
    }
  },

  createStoryboard: async (values) => {
    set({ createLoading: true, error: null });
    try {
      const data = await authFetchJson<{ storyboard?: UserStoryboard }>(
        `${endpoint}/storyboards`,
        {
          method: "POST",
          body: JSON.stringify({
            title: values.title.trim() || null,
            settings: storyboardSettingsFromForm(values),
          }),
        },
        { errorMessage: "Failed to create storyboard" }
      );
      set({ createLoading: false });
      const storyboard = data.storyboard ?? null;
      if (storyboard?.id) {
        set({ storyboards: [storyboard, ...get().storyboards] });
        showNotification({
          title: "Storyboard created",
          message: storyboard.title?.trim()
            ? `"${storyboard.title.trim()}" was saved.`
            : "Your storyboard was saved.",
          type: "success",
        });
      }
      return storyboard;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create storyboard";
      set({ createLoading: false, error: message });
      showNotification({ title: "Create storyboard", message, type: "error" });
      return null;
    }
  },

  updateStoryboard: async (storyboardId, values) => {
    set({ updateLoading: true, error: null });
    try {
      const data = await authFetchJson<{ storyboard?: UserStoryboard }>(
        `${endpoint}/storyboards/${encodeURIComponent(storyboardId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: values.title.trim() || null,
            settings: storyboardSettingsFromForm(values),
          }),
        },
        { errorMessage: "Failed to update storyboard" }
      );
      set({ updateLoading: false });
      const updated = data.storyboard ?? null;
      if (updated?.id) {
        set({
          storyboards: get().storyboards.map((row) => (row.id === updated.id ? updated : row)),
        });
        showNotification({
          title: "Storyboard updated",
          message: "Your changes were saved.",
          type: "success",
        });
        return true;
      }
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update storyboard";
      set({ updateLoading: false, error: message });
      showNotification({ title: "Update storyboard", message, type: "error" });
      return false;
    }
  },

  deleteStoryboard: async (storyboardId) => {
    set({ deleteLoading: true, error: null });
    try {
      await authFetchJson(
        `${endpoint}/storyboards/${encodeURIComponent(storyboardId)}`,
        { method: "DELETE" },
        { errorMessage: "Failed to delete storyboard" }
      );
      set({
        deleteLoading: false,
        storyboards: get().storyboards.filter((row) => row.id !== storyboardId),
      });
      showNotification({
        title: "Storyboard deleted",
        message: "The storyboard was removed.",
        type: "success",
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete storyboard";
      set({ deleteLoading: false, error: message });
      showNotification({ title: "Delete storyboard", message, type: "error" });
      return false;
    }
  },

  createStoryboardScene: async (storyboardId, values) => {
    const id = storyboardId.trim();
    if (!id) return null;

    const title = values.title.trim() || nextSceneTitle(get().storyboardScenes);
    set({ createSceneLoading: true, error: null });
    try {
      const data = await authFetchJson<{ scene?: UserStoryboardScene }>(
        `${endpoint}/storyboards/${encodeURIComponent(id)}/scenes`,
        {
          method: "POST",
          body: JSON.stringify({
            title,
            scene: scenePayloadFromForm(values),
          }),
        },
        { errorMessage: "Failed to create scene" }
      );
      set({ createSceneLoading: false });
      const scene = data.scene ?? null;
      if (scene?.id) {
        set({ storyboardScenes: [...get().storyboardScenes, scene] });
      }
      return scene;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create scene";
      set({ createSceneLoading: false, error: message });
      showNotification({ title: "Add scene", message, type: "error" });
      return null;
    }
  },

  updateStoryboardScene: async (storyboardId, sceneId, values, existingScene) => {
    const sbid = storyboardId.trim();
    const sid = sceneId.trim();
    if (!sbid || !sid) return false;

    const title = values.title.trim() || nextSceneTitle(get().storyboardScenes);
    set({ updateSceneLoading: true, error: null });
    try {
      const data = await authFetchJson<{ scene?: UserStoryboardScene }>(
        `${endpoint}/storyboards/${encodeURIComponent(sbid)}/scenes/${encodeURIComponent(sid)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title,
            scene: scenePayloadFromForm(values, existingScene),
          }),
        },
        { errorMessage: "Failed to update scene" }
      );
      set({ updateSceneLoading: false });
      const updated = data.scene ?? null;
      if (updated?.id) {
        set({
          storyboardScenes: get().storyboardScenes.map((row) =>
            row.id === updated.id ? updated : row
          ),
        });
        showNotification({
          title: "Scene updated",
          message: "Your changes were saved.",
          type: "success",
        });
        return true;
      }
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update scene";
      set({ updateSceneLoading: false, error: message });
      showNotification({ title: "Update scene", message, type: "error" });
      return false;
    }
  },

  saveStoryboardSceneLayers: async (storyboardId, sceneId, layers, options) => {
    const sbid = storyboardId.trim();
    const sid = sceneId.trim();
    if (!sbid || !sid) return false;

    const existing = get().storyboardScenes.find((row) => row.id === sid);
    if (!existing) return false;

    set({ saveLayersLoading: true, error: null });
    try {
      const data = await authFetchJson<{ scene?: UserStoryboardScene }>(
        `${endpoint}/storyboards/${encodeURIComponent(sbid)}/scenes/${encodeURIComponent(sid)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: existing.title?.trim() || null,
            scene: buildScenePayloadFromExisting(existing.scene, layers),
          }),
        },
        { errorMessage: "Failed to save layers" }
      );
      set({ saveLayersLoading: false });
      const updated = data.scene ?? null;
      if (updated?.id) {
        set({
          storyboardScenes: get().storyboardScenes.map((row) =>
            row.id === updated.id ? updated : row
          ),
        });
        if (!options?.silent) {
          showNotification({
            title: "Layers saved",
            message: "Scene layers were updated.",
            type: "success",
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save layers";
      set({ saveLayersLoading: false, error: message });
      showNotification({ title: "Save layers", message, type: "error" });
      return false;
    }
  },

  renderStoryboard: async (storyboardId) => {
    const sbid = storyboardId.trim();
    if (!sbid) return null;

    set({ renderStoryboardLoading: true, error: null });
    try {
      const result = await authFetchJson<{
        file_id?: string;
        file_url?: string;
        file_name?: string;
      }>(
        `${endpoint}/remotion/render`,
        {
          method: "POST",
          body: JSON.stringify({ storyboardId: sbid }),
        },
        { errorMessage: "Failed to render storyboard video" }
      );
      set({ renderStoryboardLoading: false });
      showNotification({
        title: "Video rendered",
        message: result.file_url
          ? `Saved ${result.file_name ?? "video"} to your files.`
          : "Your storyboard video was rendered.",
        type: "success",
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to render storyboard video";
      set({ renderStoryboardLoading: false, error: message });
      showNotification({ title: "Render video", message, type: "error" });
      return null;
    }
  },

  deleteStoryboardScene: async (storyboardId, sceneId) => {
    const sbid = storyboardId.trim();
    const sid = sceneId.trim();
    if (!sbid || !sid) return false;

    set({ deletingSceneId: sid, error: null });
    try {
      await authFetchJson(
        `${endpoint}/storyboards/${encodeURIComponent(sbid)}/scenes/${encodeURIComponent(sid)}`,
        { method: "DELETE" },
        { errorMessage: "Failed to delete scene" }
      );
      set({
        deletingSceneId: null,
        storyboardScenes: get().storyboardScenes.filter((scene) => scene.id !== sid),
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete scene";
      set({ deletingSceneId: null, error: message });
      showNotification({ title: "Delete scene", message, type: "error" });
      return false;
    }
  },
}));

export default useStoryboardsStore;
