import { create } from "zustand";
import createUniversalSelectors from "./universalSelectors";
import useAppStore from "./appStore";
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
  refreshGeneration: (generationId: string, userId: string, supabase: any) => Promise<void>;
  deleteGeneration: (generationId: string) => Promise<boolean>;
  calculateTokens: (formValues: any) => void;

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

  // Generate content
  generateContent: async (modelId, values) => {
    const session = useAppStore.getState().getUser();
    const apiKey = useAppStore.getState().getAuthApiKey();
    set({ generating: true });
    get().calculateTokens(values);
    try {
      const response = await fetch(`${endpoint}/generations/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey || ""}`,
        },
        body: JSON.stringify({
          model_id: modelId,
          payload: {
            ...values,
          },
          tokensCost: get().tokensCost,
        }),
      });

      const result = await response.json();

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
    const supabase = useAppStore.getState().getApi();
    if (!userId || !supabase) return;

    const limit = 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    set({ loadingGenerations: true });
    try {
      // If filtering by file type or tags, we need to filter by the files within generations
      if (fileTypeFilter && fileTypeFilter !== "all") {
        // First get file IDs that match the file type filter
        let fileTypeQuery = supabase
          .from("user_files")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "active")
          .eq("upload_type", "generation");

        if (fileTypeFilter === "images") {
          fileTypeQuery = fileTypeQuery.ilike("file_type", "image/%");
        } else if (fileTypeFilter === "videos") {
          fileTypeQuery = fileTypeQuery.ilike("file_type", "video/%");
        }

        const { data: matchingFiles, error: fileError } = await fileTypeQuery;

        if (fileError) {
          console.error("Error fetching files for filter:", fileError);
          set({ loadingGenerations: false });
          return;
        }

        if (!matchingFiles || matchingFiles.length === 0) {
          // No files match, so no generations to show
          set({
            generations: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
              total: 0,
            },
          });
          set({ loadingGenerations: false });
          return;
        }

        const matchingFileIds = matchingFiles.map((f) => f.id);

        // Now get generation file IDs that reference these files
        const { data: generationFiles, error: genFileError } = await supabase
          .from("user_generation_files")
          .select("generation_id")
          .in("file_id", matchingFileIds);

        if (genFileError) {
          console.error("Error fetching generation files:", genFileError);
          set({ loadingGenerations: false });
          return;
        }

        if (!generationFiles || generationFiles.length === 0) {
          set({
            generations: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
              total: 0,
            },
          });
          set({ loadingGenerations: false });
          return;
        }

        const generationIds = [...new Set(generationFiles.map((gf) => gf.generation_id))];

        // If also filtering by tags, further filter the file IDs
        if (selectedTags && selectedTags.length > 0) {
          const { data: taggedFiles } = await supabase
            .from("user_file_tags")
            .select("file_id")
            .in("tag_id", selectedTags);

          const taggedFileIds = taggedFiles?.map((ft) => ft.file_id) || [];
          const intersection = matchingFileIds.filter((id) => taggedFileIds.includes(id));

          if (intersection.length === 0) {
            set({
              generations: [],
              pagination: {
                currentPage: page,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false,
                total: 0,
              },
            });
            set({ loadingGenerations: false });
            return;
          }

          // Get generation IDs for the intersected files
          const { data: filteredGenFiles } = await supabase
            .from("user_generation_files")
            .select("generation_id")
            .in("file_id", intersection);

          const filteredGenIds = filteredGenFiles
            ? [...new Set(filteredGenFiles.map((gf) => gf.generation_id))]
            : [];

          // Query generations with these IDs
          let query = supabase
            .from("user_generations")
            .select(
              `
            *,
            models(*),
            user_generation_files(
              file_id,
              user_files(
                *,
                user_file_tags(
                  tag_id,
                  created_at,
                  user_tags(*)
                )
              )
            )
          `,
              { count: "exact" }
            )
            .eq("user_id", userId)
            .in("id", filteredGenIds)
            .order("created_at", { ascending: false });

          if (modelId) {
            query = query.eq("model_id", modelId);
          }

          const { data, error, count } = await query.range(from, to);

          if (error) {
            console.error("Error fetching generations:", error);
            set({ loadingGenerations: false });
            return;
          }

          const total = count || 0;
          const totalPages = Math.ceil(total / limit);
          set({
            generations: data || [],
            pagination: {
              currentPage: page,
              totalPages,
              hasNextPage: page < totalPages,
              hasPrevPage: page > 1,
              total,
            },
          });
          set({ loadingGenerations: false });
          return;
        }

        // Query generations with filtered IDs
        let query = supabase
          .from("user_generations")
          .select(
            `
            *,
            models(*),
            user_generation_files(
              file_id,
              user_files(
                *,
                user_file_tags(
                  tag_id,
                  created_at,
                  user_tags(*)
                )
              )
            )
          `,
            { count: "exact" }
          )
          .eq("user_id", userId)
          .in("id", generationIds)
          .order("created_at", { ascending: false });

        if (modelId) {
          query = query.eq("model_id", modelId);
        }

        const { data, error, count } = await query.range(from, to);

        if (error) {
          console.error("Error fetching generations:", error);
          set({ loadingGenerations: false });
          return;
        }

        const total = count || 0;
        const totalPages = Math.ceil(total / limit);
        set({
          generations: data || [],
          pagination: {
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            total,
          },
        });
        set({ loadingGenerations: false });
        return;
      }

      // If filtering by tags only (no file type filter)
      if (selectedTags && selectedTags.length > 0) {
        // Get file IDs with selected tags
        const { data: taggedFiles } = await supabase
          .from("user_file_tags")
          .select("file_id")
          .in("tag_id", selectedTags);

        const taggedFileIds = taggedFiles?.map((ft) => ft.file_id) || [];

        if (taggedFileIds.length === 0) {
          set({
            generations: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
              total: 0,
            },
          });
          set({ loadingGenerations: false });
          return;
        }

        // Get generation IDs for these files
        const { data: generationFiles } = await supabase
          .from("user_generation_files")
          .select("generation_id")
          .in("file_id", taggedFileIds);

        const generationIds = generationFiles
          ? [...new Set(generationFiles.map((gf) => gf.generation_id))]
          : [];

        if (generationIds.length === 0) {
          set({
            generations: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
              total: 0,
            },
          });
          set({ loadingGenerations: false });
          return;
        }

        let query = supabase
          .from("user_generations")
          .select(
            `
            *,
            models(*),
            user_generation_files(
              file_id,
              user_files(
                *,
                user_file_tags(
                  tag_id,
                  created_at,
                  user_tags(*)
                )
              )
            )
          `,
            { count: "exact" }
          )
          .eq("user_id", userId)
          .in("id", generationIds)
          .order("created_at", { ascending: false });

        if (modelId) {
          query = query.eq("model_id", modelId);
        }

        const { data, error, count } = await query.range(from, to);

        if (error) {
          console.error("Error fetching generations:", error);
          set({ loadingGenerations: false });
          return;
        }

        const total = count || 0;
        const totalPages = Math.ceil(total / limit);
        set({
          generations: data || [],
          pagination: {
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            total,
          },
        });
        set({ loadingGenerations: false });
        return;
      }

      // No file type or tag filtering - standard query
      let query = supabase
        .from("user_generations")
        .select(
          `
          *,
          models(*),
          user_generation_files(
            file_id,
            user_files(
              *,
              user_file_tags(
                tag_id,
                created_at,
                user_tags(*)
              )
            )
          )
        `,
          { count: "exact" }
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Filter by model if modelId is provided
      if (modelId) {
        query = query.eq("model_id", modelId);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) {
        console.error("Error fetching polling files:", error);
        return;
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);
      set({
        generations: data || [],
        pagination: {
          currentPage: page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          total,
        },
      });
    } catch (err: any) {
      console.error("Error fetching polling files:", err);
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
  refreshGeneration: async (generationId, userId, supabase) => {
    if (!userId || !supabase || !generationId) return;

    try {
      const { data, error } = await supabase
        .from("user_generations")
        .select(
          `
          *,
          models(*),
          user_generation_files(
            file_id,
            user_files(
              *,
              user_file_tags(
                tag_id,
                created_at,
                user_tags(*)
              )
            )
          )
        `
        )
        .eq("id", generationId)
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error refreshing generation:", error);
        return;
      }

      // Update the specific generation in the generations array
      const state = get();
      const updatedGenerations = state.generations.map((gen) =>
        gen.id === generationId ? data : gen
      );
      set({ generations: updatedGenerations });
    } catch (err: any) {
      console.error("Error refreshing generation:", err);
    }
  },

  // Delete a generation (only for failed/error status)
  deleteGeneration: async (generationId) => {
    const session = useAppStore.getState().getUser();
    const userId = session?.user?.id;
    const supabase = useAppStore.getState().getApi();
    if (!userId || !supabase || !generationId) {
      showNotification({
        title: "Error",
        message: "Unable to delete generation. Missing user information.",
        type: "error",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from("user_generations")
        .delete()
        .eq("id", generationId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error deleting generation:", error);
        showNotification({
          title: "Error",
          message: error.message || "Failed to delete generation",
          type: "error",
        });
        return false;
      }

      // Remove the generation from the local state
      const state = get();
      const updatedGenerations = state.generations.filter((gen) => gen.id !== generationId);
      const total = state.pagination.total - 1;
      const totalPages = Math.ceil(total / 5); // limit is 5

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
    } catch (err: any) {
      console.error("Error deleting generation:", err);
      showNotification({
        title: "Error",
        message: err.message || "An unexpected error occurred",
        type: "error",
      });
      return false;
    }
  },

  // Calculate tokens based on form values
  calculateTokens: (formValues) => {
    const pricing = get().selectedModel?.api?.pricing || {};
    let tokensCost: number = 0;

    // Recursive helper function for multiFields lookup
    const lookupMultiFields = (config: any, formValues: any): number => {
      // If we've reached a tokens value, return it
      if (config.tokens !== undefined) {
        return config.tokens;
      }

      // If we have a field and values, continue the lookup
      if (config.field && config.values) {
        const fieldValue = formValues[config.field];

        // Handle undefined, null, or missing values
        if (fieldValue === undefined || fieldValue === null) {
          return 0;
        }

        // Convert value to string for lookup (handles booleans, numbers, and strings)
        const fieldKey = String(fieldValue);
        const nextConfig = config.values[fieldKey];

        // If no matching value found, return 0
        if (!nextConfig) {
          return 0;
        }

        // Recursively continue the lookup
        return lookupMultiFields(nextConfig, formValues);
      }

      // If structure is invalid, return 0
      return 0;
    };

    switch (pricing.type) {
      case "per":
        tokensCost = pricing.tokens;
        break;
      case "perMulti":
        if (formValues.num_images || formValues.max_images) {
          tokensCost = pricing.tokens * (formValues.num_images || formValues.max_images);
        }
        break;
      case "singleField":
        tokensCost = pricing.tokens[formValues[pricing.field]] || 0;
        break;
      case "multiFields":
        if (pricing.tokens) {
          tokensCost = lookupMultiFields(pricing.tokens, formValues);
        }
        break;
      case "twoFieldLookup": {
        // Check if both fields exist (including false values)
        const field1Value = formValues[pricing.tokens.field1];
        const field2Value = formValues[pricing.tokens.field2];

        if (
          field1Value !== undefined &&
          field1Value !== null &&
          field2Value !== undefined &&
          field2Value !== null
        ) {
          // Convert values to strings for lookup (handles booleans, numbers, and strings)
          const field1Key = String(field1Value);
          const field2Key = String(field2Value);

          tokensCost = pricing.tokens.prices[field1Key]?.[field2Key] || 0;
        }
        break;
      }
      default:
        tokensCost = 0;
    }
    set({ tokensCost });
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
