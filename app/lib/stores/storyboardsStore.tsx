import { create } from "zustand";
import { showNotification } from "../notificationUtils";
import { authFetchJson } from "./authFetch";
import { endpoint } from "../utils";
import {
  assignLayerSortValues,
  assignSceneSortValues,
  buildScenePayloadFromRow,
  createDefaultSceneLayer,
  getBaseStoryboardScene,
  isBaseStoryboardScene,
  nextSceneSort,
  regularStoryboardScenes,
  sortLayersBySort,
  sortStoryboardScenes,
  storyboardSettingsFromForm,
  nextSceneTitle,
  scenePayloadFromForm,
  buildScenePayloadWithTransition,
  parseSceneDurationInFrames,
  parseSceneLayers,
  parseTransitionToNext,
  sanitizeLayersForSave,
  totalStoryboardDurationInFrames,
  type SceneLayer,
  type SceneTransitionToNext,
  type StoryboardFormValues,
  type StoryboardSceneFormValues,
  type UserStoryboard,
  type UserStoryboardScene,
} from "~/pages/storyboards/storyboardUtils";
import {
  defaultTransitionToNext,
  normalizeTransitionToNext,
} from "~/pages/storyboards/sceneTransitionTypes";
import type { StoryboardRender } from "~/pages/storyboards/storyboardRenderUtils";

export type EditingTransitionScene = {
  sceneId: string;
  sceneDuration: number;
  nextSceneDuration: number;
};

export type ResolvedEditingTransition = {
  sceneId: string;
  sceneTitle: string;
  sceneDuration: number;
  nextSceneDuration: number;
  transition: SceneTransitionToNext;
};

const transitionSaveTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export function resolveEditingTransition(
  editingTransitionScene: EditingTransitionScene | null,
  storyboardScenes: UserStoryboardScene[]
): ResolvedEditingTransition | null {
  if (!editingTransitionScene) return null;
  const scene = storyboardScenes.find((row) => row.id === editingTransitionScene.sceneId);
  if (!scene) return null;
  const rawTransition = parseTransitionToNext(scene.scene) ?? defaultTransitionToNext();
  return {
    sceneId: editingTransitionScene.sceneId,
    sceneTitle: scene.title?.trim() || "Untitled scene",
    sceneDuration: editingTransitionScene.sceneDuration,
    nextSceneDuration: editingTransitionScene.nextSceneDuration,
    transition: normalizeTransitionToNext(
      rawTransition,
      editingTransitionScene.sceneDuration,
      editingTransitionScene.nextSceneDuration
    ),
  };
}

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
  saveTransitionLoading: boolean;
  renderStoryboardLoading: boolean;
  storyboardRenders: StoryboardRender[];
  storyboardRendersLoading: boolean;
  deletingRenderId: string | null;
  deletingSceneId: string | null;
  error: string | null;
  editingScene: UserStoryboardScene | null;
  editingTransitionScene: EditingTransitionScene | null;
  editingLayerId: string | null;
  selectedSceneId: string | null;
  selectedLayerId: string | null;
  layerItems: SceneLayer[];
  layerEditorOpened: boolean;
  sceneCreateModalOpened: boolean;
  rendersPanelOpened: boolean;
  setSelectedStoryboard: (storyboard: UserStoryboard | null) => void;
  resetStoryboardEditor: () => void;
  openCreateSceneModal: () => void;
  closeCreateSceneModal: () => void;
  openRendersPanel: () => void;
  closeRendersPanel: () => void;
  openEditSceneModal: (scene: UserStoryboardScene) => void;
  closeEditSceneModal: () => void;
  openTransitionModal: (
    storyboardId: string,
    scene: UserStoryboardScene,
    sceneDuration: number,
    nextSceneDuration: number
  ) => void;
  closeTransitionModal: () => void;
  saveEditingTransition: (storyboardId: string, transition: SceneTransitionToNext) => void;
  clearTransitionSaveTimers: () => void;
  setEditingScene: (scene: UserStoryboardScene | null) => void;
  setEditingTransitionScene: (value: EditingTransitionScene | null) => void;
  setEditingLayerId: (layerId: string | null) => void;
  setSelectedSceneId: (
    sceneId: string | null | ((current: string | null) => string | null)
  ) => void;
  setSelectedLayerId: (
    layerId: string | null | ((current: string | null) => string | null)
  ) => void;
  setLayerItems: (layers: SceneLayer[] | ((current: SceneLayer[]) => SceneLayer[])) => void;
  changeLayer: (layerId: string, updater: (layer: SceneLayer) => SceneLayer) => void;
  syncSceneSelection: () => void;
  syncLayersFromSelectedScene: () => void;
  selectStoryboardScene: (storyboardId: string, sceneId: string) => void;
  openLayerEditor: () => void;
  closeLayerEditor: () => void;
  selectStoryboardLayer: (storyboardId: string, sceneId: string, layerId: string) => void;
  addStoryboardLayer: (storyboardId: string, sceneId: string) => Promise<void>;
  deleteStoryboardLayer: (storyboardId: string, sceneId: string, layerId: string) => Promise<void>;
  openStoryboardLayerEditor: (
    storyboardId: string,
    sceneId: string,
    layerId: string
  ) => Promise<void>;
  saveEditingLayer: (
    storyboardId: string,
    layer: SceneLayer,
    options?: { silent?: boolean }
  ) => Promise<void>;
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
    existingScene?: unknown | null,
    options?: { silent?: boolean }
  ) => Promise<boolean>;
  saveStoryboardSceneLayers: (
    storyboardId: string,
    sceneId: string,
    layers: SceneLayer[],
    options?: { silent?: boolean }
  ) => Promise<boolean>;
  saveStoryboardSceneTransition: (
    storyboardId: string,
    sceneId: string,
    transitionToNext: SceneTransitionToNext,
    nextSceneDuration: number,
    options?: { silent?: boolean }
  ) => Promise<boolean>;
  renderStoryboard: (
    storyboardId: string
  ) => Promise<{ render_id?: string; status?: string } | null>;
  loadStoryboardRenders: (
    storyboardId: string,
    options?: { silent?: boolean }
  ) => Promise<void>;
  deleteStoryboardRender: (storyboardId: string, renderId: string) => Promise<boolean>;
  deleteStoryboardScene: (storyboardId: string, sceneId: string) => Promise<boolean>;
  reorderStoryboardScenes: (storyboardId: string, orderedSceneIds: string[]) => Promise<void>;
  reorderStoryboardLayers: (
    storyboardId: string,
    sceneId: string,
    orderedLayerIds: string[]
  ) => Promise<void>;
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
  saveTransitionLoading: false,
  renderStoryboardLoading: false,
  storyboardRenders: [],
  storyboardRendersLoading: false,
  deletingRenderId: null,
  deletingSceneId: null,
  error: null,
  editingScene: null,
  editingTransitionScene: null,
  editingLayerId: null,
  selectedSceneId: null,
  selectedLayerId: null,
  layerItems: [],
  layerEditorOpened: false,
  sceneCreateModalOpened: false,
  rendersPanelOpened: false,

  setSelectedStoryboard: (storyboard) => {
    if (!storyboard) {
      get().resetStoryboardEditor();
    }
    set({ selectedStoryboard: storyboard });
  },

  resetStoryboardEditor: () =>
    set({
      editingScene: null,
      editingTransitionScene: null,
      editingLayerId: null,
      selectedSceneId: null,
      selectedLayerId: null,
      layerItems: [],
      layerEditorOpened: false,
      sceneCreateModalOpened: false,
      rendersPanelOpened: false,
      storyboardRenders: [],
      storyboardRendersLoading: false,
      deletingRenderId: null,
    }),

  openCreateSceneModal: () =>
    set({
      sceneCreateModalOpened: true,
      editingTransitionScene: null,
      selectedLayerId: null,
      rendersPanelOpened: false,
    }),

  closeCreateSceneModal: () => set({ sceneCreateModalOpened: false }),

  openRendersPanel: () =>
    set({
      rendersPanelOpened: true,
      sceneCreateModalOpened: false,
      editingTransitionScene: null,
      selectedLayerId: null,
    }),

  closeRendersPanel: () => set({ rendersPanelOpened: false }),

  openEditSceneModal: (scene) =>
    set({
      editingScene: scene,
      selectedSceneId: scene.id,
      selectedLayerId: null,
      sceneCreateModalOpened: false,
      editingTransitionScene: null,
      rendersPanelOpened: false,
    }),

  closeEditSceneModal: () => set({ editingScene: null }),

  openTransitionModal: (storyboardId, scene, sceneDuration, nextSceneDuration) => {
    const { selectedSceneId, layerItems, saveStoryboardSceneLayers } = get();
    if (selectedSceneId && selectedSceneId !== scene.id) {
      void saveStoryboardSceneLayers(storyboardId, selectedSceneId, layerItems, { silent: true });
    }
    const layers =
      selectedSceneId === scene.id ? layerItems : parseSceneLayers(scene.scene);
    set({
      selectedSceneId: scene.id,
      layerItems: layers,
      selectedLayerId: null,
      sceneCreateModalOpened: false,
      rendersPanelOpened: false,
      editingTransitionScene: {
        sceneId: scene.id,
        sceneDuration,
        nextSceneDuration,
      },
    });
  },

  closeTransitionModal: () => set({ editingTransitionScene: null }),

  saveEditingTransition: (storyboardId, transition) => {
    const editing = resolveEditingTransition(get().editingTransitionScene, get().storyboardScenes);
    if (!editing) return;

    const existingTimer = transitionSaveTimers[editing.sceneId];
    if (existingTimer) clearTimeout(existingTimer);

    transitionSaveTimers[editing.sceneId] = setTimeout(() => {
      delete transitionSaveTimers[editing.sceneId];
      void get().saveStoryboardSceneTransition(
        storyboardId,
        editing.sceneId,
        transition,
        editing.nextSceneDuration,
        { silent: true }
      );
    }, 400);
  },

  clearTransitionSaveTimers: () => {
    for (const timer of Object.values(transitionSaveTimers)) {
      clearTimeout(timer);
    }
    for (const key of Object.keys(transitionSaveTimers)) {
      delete transitionSaveTimers[key];
    }
  },

  setEditingScene: (scene) => set({ editingScene: scene }),

  setEditingTransitionScene: (value) => set({ editingTransitionScene: value }),

  setEditingLayerId: (layerId) => set({ editingLayerId: layerId }),

  setSelectedSceneId: (sceneId) =>
    set((state) => ({
      selectedSceneId: typeof sceneId === "function" ? sceneId(state.selectedSceneId) : sceneId,
    })),

  setSelectedLayerId: (layerId) =>
    set((state) => ({
      selectedLayerId: typeof layerId === "function" ? layerId(state.selectedLayerId) : layerId,
    })),

  setLayerItems: (layers) =>
    set((state) => ({
      layerItems: typeof layers === "function" ? layers(state.layerItems) : layers,
    })),

  changeLayer: (layerId, updater) =>
    set((state) => ({
      layerItems: state.layerItems.map((layer) => (layer.id === layerId ? updater(layer) : layer)),
    })),

  syncSceneSelection: () => {
    const scenes = get().storyboardScenes;
    if (scenes.length === 0) {
      set({ selectedSceneId: null, layerItems: [], selectedLayerId: null });
      return;
    }

    const current = get().selectedSceneId;
    if (current && scenes.some((scene) => scene.id === current)) {
      return;
    }

    const baseScene = getBaseStoryboardScene(scenes);
    const nextSceneId = baseScene?.id ?? scenes[0]?.id ?? null;
    const nextScene = scenes.find((scene) => scene.id === nextSceneId) ?? null;
    set({
      selectedSceneId: nextSceneId,
      layerItems: nextScene ? parseSceneLayers(nextScene.scene) : [],
      selectedLayerId: null,
    });
  },

  syncLayersFromSelectedScene: () => {
    const { storyboardScenes, selectedSceneId, selectedLayerId } = get();
    const selectedScene = storyboardScenes.find((scene) => scene.id === selectedSceneId) ?? null;
    if (!selectedScene) {
      set({ layerItems: [], selectedLayerId: null });
      return;
    }

    const layers = parseSceneLayers(selectedScene.scene);
    const prev = get().layerItems;
    if (JSON.stringify(sanitizeLayersForSave(prev)) === JSON.stringify(layers)) {
      return;
    }

    set({
      layerItems: layers,
      selectedLayerId:
        selectedLayerId && layers.some((layer) => layer.id === selectedLayerId)
          ? selectedLayerId
          : null,
    });
  },

  selectStoryboardScene: (storyboardId, sceneId) => {
    const { selectedSceneId, layerItems, saveStoryboardSceneLayers } = get();
    if (selectedSceneId && selectedSceneId !== sceneId) {
      void saveStoryboardSceneLayers(storyboardId, selectedSceneId, layerItems, { silent: true });
    }

    const scene = get().storyboardScenes.find((row) => row.id === sceneId);
    set({
      selectedSceneId: sceneId,
      selectedLayerId: null,
      layerItems: parseSceneLayers(scene?.scene),
      sceneCreateModalOpened: false,
      editingTransitionScene: null,
      rendersPanelOpened: false,
    });
  },

  openLayerEditor: () => set({ layerEditorOpened: true }),

  closeLayerEditor: () => set({ layerEditorOpened: false, editingLayerId: null }),

  selectStoryboardLayer: (storyboardId, sceneId, layerId) => {
    const { selectedSceneId, layerItems, saveStoryboardSceneLayers, storyboardScenes } = get();
    if (selectedSceneId && selectedSceneId !== sceneId) {
      void saveStoryboardSceneLayers(storyboardId, selectedSceneId, layerItems, { silent: true });
    }

    const scene = storyboardScenes.find((row) => row.id === sceneId);
    const nextLayerItems =
      sceneId === selectedSceneId ? layerItems : parseSceneLayers(scene?.scene);

    set({
      selectedSceneId: sceneId,
      selectedLayerId: layerId,
      layerItems: nextLayerItems,
      sceneCreateModalOpened: false,
      editingTransitionScene: null,
      rendersPanelOpened: false,
    });
  },

  addStoryboardLayer: async (storyboardId, sceneId) => {
    const {
      selectedSceneId,
      layerItems,
      storyboardScenes,
      saveStoryboardSceneLayers,
      setSelectedSceneId,
      setSelectedLayerId,
      setLayerItems,
    } = get();
    if (selectedSceneId && selectedSceneId !== sceneId) {
      await saveStoryboardSceneLayers(storyboardId, selectedSceneId, layerItems, { silent: true });
    }
    const scene = storyboardScenes.find((row) => row.id === sceneId);
    if (!scene) return;
    if (isBaseStoryboardScene(scene) && regularStoryboardScenes(storyboardScenes).length === 0) {
      showNotification({
        title: "Add scene first",
        message: "Global layers need at least one scene to determine the storyboard duration.",
        type: "error",
      });
      return;
    }
    const existingLayers = sceneId === selectedSceneId ? layerItems : parseSceneLayers(scene.scene);
    const duration = isBaseStoryboardScene(scene)
      ? totalStoryboardDurationInFrames(storyboardScenes)
      : parseSceneDurationInFrames(scene.scene);
    const nextLayers = [...existingLayers, createDefaultSceneLayer(existingLayers, duration)];
    setSelectedSceneId(sceneId);
    setLayerItems(nextLayers);
    setSelectedLayerId(nextLayers[nextLayers.length - 1]?.id ?? null);
    await saveStoryboardSceneLayers(storyboardId, sceneId, nextLayers);
  },

  deleteStoryboardLayer: async (storyboardId, sceneId, layerId) => {
    const {
      selectedSceneId,
      selectedLayerId,
      editingLayerId,
      layerItems,
      storyboardScenes,
      saveStoryboardSceneLayers,
      setSelectedSceneId,
      setSelectedLayerId,
      setLayerItems,
      closeLayerEditor,
    } = get();
    if (selectedSceneId && selectedSceneId !== sceneId) {
      await saveStoryboardSceneLayers(storyboardId, selectedSceneId, layerItems, { silent: true });
    }
    const scene = storyboardScenes.find((row) => row.id === sceneId);
    if (!scene) return;
    const existingLayers = sceneId === selectedSceneId ? layerItems : parseSceneLayers(scene.scene);
    const nextLayers = existingLayers.filter((layer) => layer.id !== layerId);
    setSelectedSceneId(sceneId);
    setLayerItems(nextLayers);
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
    if (editingLayerId === layerId) {
      closeLayerEditor();
    }
    await saveStoryboardSceneLayers(storyboardId, sceneId, nextLayers);
  },

  openStoryboardLayerEditor: async (storyboardId, sceneId, layerId) => {
    get().selectStoryboardLayer(storyboardId, sceneId, layerId);
  },

  saveEditingLayer: async (storyboardId, layer, options) => {
    const { selectedSceneId, layerItems, setLayerItems, saveStoryboardSceneLayers } = get();
    if (!selectedSceneId) return;
    const nextLayers = layerItems.map((item) => (item.id === layer.id ? layer : item));
    setLayerItems(nextLayers);
    await saveStoryboardSceneLayers(storyboardId, selectedSceneId, nextLayers, {
      silent: options?.silent,
    });
  },

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

    set({
      selectedStoryboardLoading: true,
      error: null,
      storyboardScenes: [],
      storyboardRenders: [],
      editingScene: null,
      editingTransitionScene: null,
      editingLayerId: null,
      selectedSceneId: null,
      selectedLayerId: null,
      layerItems: [],
      layerEditorOpened: false,
      sceneCreateModalOpened: false,
      rendersPanelOpened: false,
    });
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
      const scenes = sortStoryboardScenes(scenesData.scenes ?? []);
      set({
        selectedStoryboard: storyboard,
        storyboardScenes: scenes,
        selectedStoryboardLoading: false,
      });
      void get().loadStoryboardRenders(id, { silent: true });
      return storyboard;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load storyboard";
      set({
        selectedStoryboard: null,
        storyboardScenes: [],
        storyboardRenders: [],
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
    const sort = nextSceneSort(get().storyboardScenes);
    set({ createSceneLoading: true, error: null });
    try {
      const data = await authFetchJson<{ scene?: UserStoryboardScene }>(
        `${endpoint}/storyboards/${encodeURIComponent(id)}/scenes`,
        {
          method: "POST",
          body: JSON.stringify({
            title,
            sort,
            scene: scenePayloadFromForm(values),
          }),
        },
        { errorMessage: "Failed to create scene" }
      );
      set({ createSceneLoading: false });
      const scene = data.scene ?? null;
      if (scene?.id) {
        set({
          storyboardScenes: sortStoryboardScenes([...get().storyboardScenes, scene]),
        });
      }
      return scene;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create scene";
      set({ createSceneLoading: false, error: message });
      showNotification({ title: "Add scene", message, type: "error" });
      return null;
    }
  },

  updateStoryboardScene: async (storyboardId, sceneId, values, existingScene, options) => {
    const sbid = storyboardId.trim();
    const sid = sceneId.trim();
    if (!sbid || !sid) return false;

    const scenes = get().storyboardScenes;
    const regularScenes = regularStoryboardScenes(scenes);
    const regularIndex = regularScenes.findIndex((row) => row.id === sid);
    const nextSceneDuration =
      regularIndex >= 0 && regularIndex < regularScenes.length - 1
        ? parseSceneDurationInFrames(regularScenes[regularIndex + 1]?.scene)
        : undefined;

    const title = values.title.trim() || nextSceneTitle(scenes);
    const { selectedSceneId, layerItems } = get();
    const existingRow = scenes.find((row) => row.id === sid);
    const layers =
      selectedSceneId === sid
        ? layerItems
        : parseSceneLayers(existingScene ?? existingRow?.scene);
    set({ updateSceneLoading: true, error: null });
    try {
      const data = await authFetchJson<{ scene?: UserStoryboardScene }>(
        `${endpoint}/storyboards/${encodeURIComponent(sbid)}/scenes/${encodeURIComponent(sid)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title,
            scene: scenePayloadFromForm(values, existingScene ?? existingRow?.scene, {
              nextSceneDuration,
              layers: sanitizeLayersForSave(layers),
            }),
          }),
        },
        { errorMessage: "Failed to update scene" }
      );
      set({ updateSceneLoading: false });
      const updated = data.scene ?? null;
      if (updated?.id) {
        let nextScenes = get().storyboardScenes.map((row) =>
          row.id === updated.id ? updated : row
        );

        if (regularIndex > 0) {
          const prevScene = regularScenes[regularIndex - 1];
          const prevTransition = parseTransitionToNext(prevScene?.scene);
          if (prevTransition?.enabled) {
            const prevDuration = parseSceneDurationInFrames(prevScene?.scene);
            const newNextDuration = parseSceneDurationInFrames(updated.scene);
            const reclamped = normalizeTransitionToNext(
              prevTransition,
              prevDuration,
              newNextDuration
            );
            if (reclamped.durationInFrames !== prevTransition.durationInFrames) {
              const prevData = await authFetchJson<{ scene?: UserStoryboardScene }>(
                `${endpoint}/storyboards/${encodeURIComponent(sbid)}/scenes/${encodeURIComponent(prevScene.id)}`,
                {
                  method: "PATCH",
                  body: JSON.stringify({
                    title: prevScene.title?.trim() || null,
                    scene: buildScenePayloadWithTransition(
                      prevScene.scene,
                      reclamped,
                      newNextDuration
                    ),
                  }),
                },
                { errorMessage: "Failed to update adjacent transition" }
              );
              const prevUpdated = prevData.scene ?? null;
              if (prevUpdated?.id) {
                nextScenes = nextScenes.map((row) =>
                  row.id === prevUpdated.id ? prevUpdated : row
                );
              }
            }
          }
        }

        set({ storyboardScenes: nextScenes });
        if (!options?.silent) {
          showNotification({
            title: "Scene updated",
            message: "Your changes were saved.",
            type: "success",
          });
        }
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
            scene: buildScenePayloadFromRow(existing, layers),
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

  saveStoryboardSceneTransition: async (
    storyboardId,
    sceneId,
    transitionToNext,
    nextSceneDuration,
    options
  ) => {
    const sbid = storyboardId.trim();
    const sid = sceneId.trim();
    if (!sbid || !sid) return false;

    const existing = get().storyboardScenes.find((row) => row.id === sid);
    if (!existing) return false;

    set({ saveTransitionLoading: true, error: null });
    try {
      const data = await authFetchJson<{ scene?: UserStoryboardScene }>(
        `${endpoint}/storyboards/${encodeURIComponent(sbid)}/scenes/${encodeURIComponent(sid)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: existing.title?.trim() || null,
            scene: buildScenePayloadWithTransition(
              existing.scene,
              transitionToNext,
              nextSceneDuration
            ),
          }),
        },
        { errorMessage: "Failed to save transition" }
      );
      set({ saveTransitionLoading: false });
      const updated = data.scene ?? null;
      if (updated?.id) {
        set({
          storyboardScenes: get().storyboardScenes.map((row) =>
            row.id === updated.id ? updated : row
          ),
        });
        if (!options?.silent) {
          showNotification({
            title: "Transition saved",
            message: "Scene transition was updated.",
            type: "success",
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save transition";
      set({ saveTransitionLoading: false, error: message });
      showNotification({ title: "Save transition", message, type: "error" });
      return false;
    }
  },

  renderStoryboard: async (storyboardId) => {
    const sbid = storyboardId.trim();
    if (!sbid) return null;

    set({ renderStoryboardLoading: true, error: null });
    try {
      const result = await authFetchJson<{
        render_id?: string;
        status?: string;
        storyboard_id?: string;
      }>(
        `${endpoint}/storyboards/${encodeURIComponent(sbid)}/renders`,
        { method: "POST", body: JSON.stringify({}) },
        { errorMessage: "Failed to start storyboard render" }
      );
      set({ renderStoryboardLoading: false });
      get().openRendersPanel();
      showNotification({
        title: "Render started",
        message: "Your storyboard video is rendering.",
        type: "success",
      });
      await get().loadStoryboardRenders(sbid, { silent: true });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start storyboard render";
      set({ renderStoryboardLoading: false, error: message });
      showNotification({ title: "Render video", message, type: "error" });
      return null;
    }
  },

  loadStoryboardRenders: async (storyboardId, options) => {
    const sbid = storyboardId.trim();
    if (!sbid) return;

    if (!options?.silent) set({ storyboardRendersLoading: true, error: null });
    try {
      const data = await authFetchJson<{ renders?: StoryboardRender[] }>(
        `${endpoint}/storyboards/${encodeURIComponent(sbid)}/renders`,
        undefined,
        { errorMessage: "Failed to load storyboard renders" }
      );
      set({
        storyboardRenders: data.renders ?? [],
        storyboardRendersLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load storyboard renders";
      if (!options?.silent) {
        set({ storyboardRendersLoading: false, error: message });
        showNotification({ title: "Renders", message, type: "error" });
      } else {
        set({ storyboardRendersLoading: false });
      }
    }
  },

  deleteStoryboardRender: async (storyboardId, renderId) => {
    const sbid = storyboardId.trim();
    const rid = renderId.trim();
    if (!sbid || !rid) return false;

    set({ deletingRenderId: rid, error: null });
    try {
      await authFetchJson<{ ok?: boolean }>(
        `${endpoint}/storyboards/${encodeURIComponent(sbid)}/renders/${encodeURIComponent(rid)}`,
        { method: "DELETE" },
        { errorMessage: "Failed to delete render" }
      );
      set((state) => ({
        storyboardRenders: state.storyboardRenders.filter((row) => row.id !== rid),
        deletingRenderId: null,
      }));
      showNotification({
        title: "Render deleted",
        message: "The render was removed.",
        type: "success",
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete render";
      set({ deletingRenderId: null, error: message });
      showNotification({ title: "Delete render", message, type: "error" });
      return false;
    }
  },

  deleteStoryboardScene: async (storyboardId, sceneId) => {
    const sbid = storyboardId.trim();
    const sid = sceneId.trim();
    if (!sbid || !sid) return false;

    const existing = get().storyboardScenes.find((scene) => scene.id === sid);
    if (existing && isBaseStoryboardScene(existing)) {
      showNotification({
        title: "Delete scene",
        message: "The base scene cannot be deleted.",
        type: "error",
      });
      return false;
    }

    set({ deletingSceneId: sid, error: null });
    try {
      await authFetchJson(
        `${endpoint}/storyboards/${encodeURIComponent(sbid)}/scenes/${encodeURIComponent(sid)}`,
        { method: "DELETE" },
        { errorMessage: "Failed to delete scene" }
      );
      const remaining = assignSceneSortValues(
        get().storyboardScenes.filter((scene) => scene.id !== sid)
      );
      set({ deletingSceneId: null, storyboardScenes: remaining });
      void get().reorderStoryboardScenes(
        sbid,
        regularStoryboardScenes(remaining).map((row) => row.id)
      );
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete scene";
      set({ deletingSceneId: null, error: message });
      showNotification({ title: "Delete scene", message, type: "error" });
      return false;
    }
  },

  reorderStoryboardScenes: async (storyboardId, orderedSceneIds) => {
    const sbid = storyboardId.trim();
    if (!sbid || orderedSceneIds.length === 0) return;

    const { selectedSceneId, layerItems, saveStoryboardSceneLayers, storyboardScenes } = get();
    if (selectedSceneId && layerItems.length > 0) {
      await saveStoryboardSceneLayers(sbid, selectedSceneId, layerItems, { silent: true });
    }

    const base = getBaseStoryboardScene(storyboardScenes);
    const regular = regularStoryboardScenes(storyboardScenes);
    const byId = new Map(regular.map((row) => [row.id, row]));
    const reorderedRegular = orderedSceneIds
      .map((id) => byId.get(id))
      .filter((row): row is UserStoryboardScene => Boolean(row));
    if (reorderedRegular.length !== regular.length) return;

    const withSort = reorderedRegular.map((row, index) => ({ ...row, sort: index + 1 }));
    const nextScenes = base ? [{ ...base, sort: 0 }, ...withSort] : withSort;
    set({ storyboardScenes: nextScenes });

    await Promise.all(
      withSort.map((row) =>
        authFetchJson<{ scene?: UserStoryboardScene }>(
          `${endpoint}/storyboards/${encodeURIComponent(sbid)}/scenes/${encodeURIComponent(row.id)}`,
          {
            method: "PATCH",
            body: JSON.stringify({ sort: row.sort }),
          },
          { errorMessage: "Failed to reorder scenes" }
        )
      )
    );
  },

  reorderStoryboardLayers: async (storyboardId, sceneId, orderedLayerIds) => {
    const sbid = storyboardId.trim();
    const sid = sceneId.trim();
    if (!sbid || !sid || orderedLayerIds.length === 0) return;

    const {
      selectedSceneId,
      layerItems,
      storyboardScenes,
      saveStoryboardSceneLayers,
      setLayerItems,
    } = get();
    const scene = storyboardScenes.find((row) => row.id === sid);
    if (!scene) return;

    const currentLayers =
      sid === selectedSceneId ? layerItems : sortLayersBySort(parseSceneLayers(scene.scene));
    const byId = new Map(currentLayers.map((layer) => [layer.id, layer]));
    const reordered = orderedLayerIds
      .map((id) => byId.get(id))
      .filter((layer): layer is SceneLayer => Boolean(layer));
    if (reordered.length !== currentLayers.length) return;

    const nextLayers = assignLayerSortValues(reordered);
    if (sid === selectedSceneId) {
      setLayerItems(nextLayers);
    }
    await saveStoryboardSceneLayers(sbid, sid, nextLayers, { silent: true });
  },
}));

export default useStoryboardsStore;
