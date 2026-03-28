import { create } from "zustand";
import createUniversalSelectors from "./universalSelectors";
import useAppStore from "./appStore";
import { assertAuthFetchOk, authFetch, authFetchJson } from "./authFetch";
import { endpoint } from "../utils";
import { showNotification } from "../notificationUtils";

export interface Model {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  slug: string;
  generation_type: string;
  meta?: { tags?: string[] };
  config: {
    api: string;
    cost_per_generation?: number;
    pricing?: any;
  };
  schema: any;
  brands?: {
    id: string;
    name: string;
    logo: string;
  };
  api?: any;
}

export interface GenerationFile {
  id: string;
  user_id: string;
  model_id: string;
  payload: any;
  response: any;
  task_id: string | null;
  status: "pending" | "processing" | "completed" | "failed" | "error" | null;
  polling_response: any;
  duration: number | null;
  cost: number | null;
  generation_type: string | null;
  created_at: string;
  updated_at: string | null;
  models: {
    name: string;
  };
  user_generation_files: {
    file_id: string;
    user_files: any;
  }[];
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  total: number;
}

interface GenerateStoreState {
  // Loading states
  modelLoading: boolean;
  generating: boolean;
  loadingGenerations: boolean;

  // Data
  models: Model[];
  selectedModel: Model | null;
  generationType: string | null;
  currentTaskId: string | undefined;
  generations: GenerationFile[];
  hasMoreGenerations: boolean;
  totalGenerations: number;
  tokensCost: number;
  activeTab: string;
  pagination: PaginationData;
  // Filter state
  selectedFilterModelId: string | null;
  selectedGenerationType: string | null;

  // Actions
  setModelLoading: (loading: boolean) => void;
  setGenerating: (generating: boolean) => void;
  setModels: (models: Model[]) => void;
  setSelectedModel: (model: Model | null) => void;
  setGenerationType: (type: string | null) => void;
  setCurrentTaskId: (taskId: string | undefined) => void;
  setGenerations: (generations: GenerationFile[]) => void;
  setHasMoreGenerations: (hasMore: boolean) => void;
  setTotalGenerations: (total: number) => void;
  setLoadingGenerations: (loading: boolean) => void;
  setTokensCost: (cost: number) => void;
  setActiveTab: (tab: string) => void;
  setSelectedFilterModelId: (modelId: string | null) => void;
  setSelectedGenerationType: (type: string | null) => void;
  getSelectedModel: () => Model | null;
  getTokensCost: () => number;
  getModelLoading: () => boolean;
  getGenerating: () => boolean;
  getLoadingGenerations: () => boolean;
  getModels: () => Model[];
  getGenerationType: () => string | null;
  getCurrentTaskId: () => string | undefined;
  getGenerations: () => GenerationFile[];
  getHasMoreGenerations: () => boolean;
  // Async actions
  loadGenerationModels: () => Promise<void>;
  loadModel: (slug: string) => Model | null;
  generateContent: (
    modelId: string,
    values: any
  ) => Promise<{ success: boolean; error?: string; data?: any }>;
  loadGenerations: (
    page?: number,
    modelId?: string,
    fileTypeFilter?: string | null,
    append?: boolean,
    selectedTags?: string[]
  ) => Promise<void>;
  handlePageChange: (page: number) => void;
  refreshGeneration: (generationId: string) => Promise<void>;
  deleteGeneration: (generationId: string) => Promise<boolean>;
  calculateCost: (formValues: any) => void;

  // Reset
  resetGenerateState: () => void;
}

const useGenerateStoreBase = create<GenerateStoreState>((set, get) => ({
  // Initial state
  modelLoading: false,
  generating: false,
  loadingGenerations: false,
  models: [],
  selectedModel: null,
  generationType: null,
  currentTaskId: undefined,
  generations: [],
  hasMoreGenerations: false,
  totalGenerations: 0,
  tokensCost: 0,
  activeTab: "form",
  pagination: {
    currentPage: 1,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
    total: 0,
  },
  selectedFilterModelId: null,
  selectedGenerationType: null,

  // Basic setters
  setModelLoading: (loading) => set({ modelLoading: loading }),
  setGenerating: (generating) => set({ generating }),
  setModels: (models) => set({ models }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setGenerationType: (type) => set({ generationType: type }),
  setCurrentTaskId: (taskId) => set({ currentTaskId: taskId }),
  setGenerations: (generations) => set({ generations }),
  setHasMoreGenerations: (hasMore) => set({ hasMoreGenerations: hasMore }),
  setTotalGenerations: (total) => set({ totalGenerations: total }),
  setLoadingGenerations: (loading) => set({ loadingGenerations: loading }),
  setTokensCost: (cost) => set({ tokensCost: cost }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedFilterModelId: (selectedFilterModelId) => set({ selectedFilterModelId }),
  setSelectedGenerationType: (selectedGenerationType) => set({ selectedGenerationType }),

  getSelectedModel: () => get().selectedModel,
  getModelLoading: () => get().modelLoading,
  getGenerating: () => get().generating,
  getLoadingGenerations: () => get().loadingGenerations,
  getModels: () => get().models,
  getGenerationType: () => get().generationType,
  getCurrentTaskId: () => get().currentTaskId,
  getGenerations: () => get().generations,
  getHasMoreGenerations: () => get().hasMoreGenerations,
  getTokensCost: () => get().tokensCost,
  // Load specific model by slug
  loadModel: (slug) => {
    set({ modelLoading: true });
    const state = get();
    // Find the model from the preloaded models array
    const model = state.models.find((m) => m.slug === slug);
    if (!model) {
      console.error("Model not found with slug:", slug);
      return null;
    }
    set({ selectedModel: model, modelLoading: false });
    return model;
  },

  loadGenerationModels: async () => {
    try {
      const json = await authFetchJson<{ success?: boolean; data?: Model[]; error?: string }>(
        `${endpoint}/generations/models`,
        undefined,
        { errorMessage: "Failed to load models" }
      );
      if (json.success) {
        set({ models: json.data ?? [] });
      } else {
        showNotification({
          title: "Error",
          message: json.error ?? "Failed to load models",
          type: "error",
        });
        set({ models: [] });
      }
    } catch (err) {
      console.error("[generateStore] loadGenerationModels:", err);
      showNotification({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to load models",
        type: "error",
      });
      set({ models: [] });
    }
  },

  // Generate content
  generateContent: async (modelId, values) => {
    const session = useAppStore.getState().getUser();
    set({ generating: true });
    get().calculateCost(values);
    try {
      const result = await authFetchJson<{
        success?: boolean;
        data?: unknown;
        error?: string;
      }>(
        `${endpoint}/generations/generate`,
        {
          method: "POST",
          body: JSON.stringify({
            model_id: modelId,
            payload: {
              ...values,
            },
            tokensCost: get().tokensCost,
          }),
        },
        { errorMessage: "Generation failed" }
      );

      if (result.success) {
        useAppStore.getState().userProfile(session);
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || "Generation failed" };
      }
    } catch (error) {
      console.error("Generation error:", error);
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      set({ generating: false });
    }
  },

  loadGenerations: async (
    page = 1,
    modelId?: string,
    fileTypeFilter?: string | null,
    append?: boolean,
    selectedTags?: string[]
  ) => {
    const session = useAppStore.getState().getUser();
    const userId = session?.user?.id;
    if (!userId || !useAppStore.getState().getAuthApiKey()) return;

    const limit = 9;

    set({ loadingGenerations: true });
    if (page === 1) {
      set({ generations: [] });
    }
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (modelId) {
        params.set("modelId", modelId);
      }
      if (fileTypeFilter && fileTypeFilter !== "all") {
        params.set("fileTypeFilter", fileTypeFilter);
      }
      if (selectedTags && selectedTags.length > 0) {
        params.set("tags", selectedTags.join(","));
      }

      const json = await authFetchJson<{
        success?: boolean;
        data?: {
          generations: GenerationFile[];
          pagination: PaginationData;
        };
      }>(`${endpoint}/generations/list?${params.toString()}`, undefined, {
        errorMessage: "Failed to load generations",
      });

      const payload = json.data;
      if (!payload) {
        set({ loadingGenerations: false });
        return;
      }

      set({
        generations: payload.generations ?? [],
        pagination: payload.pagination ?? {
          currentPage: page,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
          total: 0,
        },
      });
    } catch (err: unknown) {
      console.error("Error fetching generations:", err);
    } finally {
      set({ loadingGenerations: false });
    }
  },

  handlePageChange: (page: number, fileTypeFilter?: string | null, selectedTags?: string[]) => {
    const session = useAppStore.getState().getUser();
    const userId = session?.user?.id;
    if (!userId) return;
    get().loadGenerations(
      page,
      get().selectedFilterModelId || undefined,
      fileTypeFilter || undefined,
      false,
      selectedTags || []
    );
  },

  // Refresh a specific generation
  refreshGeneration: async (generationId) => {
    if (!generationId || !useAppStore.getState().getAuthApiKey()) return;

    try {
      const json = await authFetchJson<{ success?: boolean; data?: GenerationFile }>(
        `${endpoint}/generations/${encodeURIComponent(generationId)}`,
        undefined,
        { errorMessage: "Failed to refresh generation" }
      );
      const data = json.data;
      if (!data) return;

      const state = get();
      const updatedGenerations = state.generations.map((gen) =>
        gen.id === generationId ? data : gen
      );
      set({ generations: updatedGenerations });
    } catch (err: unknown) {
      console.error("Error refreshing generation:", err);
    }
  },

  // Delete a generation (only for failed/error status)
  deleteGeneration: async (generationId) => {
    const session = useAppStore.getState().getUser();
    const userId = session?.user?.id;
    if (!userId || !generationId || !useAppStore.getState().getAuthApiKey()) {
      showNotification({
        title: "Error",
        message: "Unable to delete generation. Missing user information.",
        type: "error",
      });
      return false;
    }

    try {
      const res = await authFetch(`${endpoint}/generations/${encodeURIComponent(generationId)}`, {
        method: "DELETE",
      });
      await assertAuthFetchOk(res, "Failed to delete generation");

      const state = get();
      const updatedGenerations = state.generations.filter((gen) => gen.id !== generationId);
      const total = Math.max(0, state.pagination.total - 1);
      const pageLimit = 9;
      const totalPages = Math.ceil(total / pageLimit);

      set({
        generations: updatedGenerations,
        pagination: {
          ...state.pagination,
          total,
          totalPages,
        },
      });

      showNotification({
        title: "Success",
        message: "Generation deleted successfully",
        type: "success",
      });

      return true;
    } catch (err: unknown) {
      console.error("Error deleting generation:", err);
      showNotification({
        title: "Error",
        message: err instanceof Error ? err.message : "An unexpected error occurred",
        type: "error",
      });
      return false;
    }
  },

  // Calculate cost based on form values
  calculateCost: async (formValues) => {
    const pricing = get().selectedModel?.api?.pricing || {};
    try {
      const json = await authFetchJson<unknown>(
        `${endpoint}/generations/calculate-cost`,
        {
          method: "POST",
          body: JSON.stringify({ formValues, pricing }),
        },
        { errorMessage: "Failed to calculate cost" }
      );
      const tokensCost = (json as { data?: { cost?: number } })?.data?.cost ?? 0;
      set({ tokensCost });
    } catch (err) {
      console.error("Error calculating cost:", err);
      set({ tokensCost: 0 });
    }
  },

  // Reset state
  resetGenerateState: () => {
    set({
      modelLoading: false,
      generating: false,
      selectedModel: null,
      generationType: null,
      currentTaskId: undefined,
      generations: [],
      hasMoreGenerations: false,
      totalGenerations: 0,
      tokensCost: 0,
      activeTab: "form",
      selectedFilterModelId: null,
      selectedGenerationType: null,
    });
  },
}));

export default createUniversalSelectors(useGenerateStoreBase);
