import { create } from "zustand";
import {
  formatPlaygroundGenModelDisplayName,
  normalizeRunHistoryItem,
} from "../playgroundRunHistoryUtils";
import { authFetchJson } from "./authFetch";
import { endpoint } from "../utils";
import createUniversalSelectors from "./universalSelectors";
import type {
  PlaygroundRunHistoryModelsResponse,
  PlaygroundSearchFilters,
  PlaygroundStoreState,
  PlaygroundRecentModelsResponse,
  PlaygroundRunHistoryResponse,
  PlaygroundSearchResponse,
  PlaygroundRunResponse,
  PlaygroundCostResponse,
} from "~/types/playground";

const emptyFilters: PlaygroundSearchResponse["filters"] = {
  brands: [],
  model_product: [],
  model_variant: [],
  model_type: [],
};

const toQuery = (filters: PlaygroundSearchFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.model_id?.trim()) params.set("model_id", filters.model_id.trim());
  if (filters.brands?.length) params.set("brands", filters.brands.join(","));
  if (filters.model_product?.length) params.set("model_product", filters.model_product.join(","));
  if (filters.model_variant?.length) params.set("model_variant", filters.model_variant.join(","));
  if (filters.model_type?.length) params.set("model_type", filters.model_type.join(","));
  const qs = params.toString();
  return `${endpoint}/playground${qs ? `?${qs}` : ""}`;
};

const usePlaygroundStoreBase = create<PlaygroundStoreState>((set, get) => ({
  items: [],
  filters: emptyFilters,
  total: 0,
  loading: false,
  runLoading: false,
  costLoading: false,
  error: null,
  runError: null,
  costError: null,
  latestCost: null,
  runHistory: [],
  runHistoryTotal: 0,
  runHistoryPage: 1,
  runHistoryLimit: 9,
  runHistoryLoading: false,
  runHistoryError: null,
  runHistoryGenModelFilter: null,
  runHistoryFileTypeFilter: "all",
  runHistoryTagIds: [],
  runHistoryFilterModels: [],
  recentPlaygroundModels: [],
  recentPlaygroundModelsLoading: false,
  selectedModel: null,
  selectedRunHistoryModelId: null,
  setSelectedRunHistoryModelId: (id) => set({ selectedRunHistoryModelId: id }),
  setLoading: (loading) => set({ loading }),
  setRunHistoryGenModelFilter: (id) => set({ runHistoryGenModelFilter: id }),
  setRunHistoryFileTypeFilter: (v) => set({ runHistoryFileTypeFilter: v }),
  setRunHistoryTagIds: (ids) => set({ runHistoryTagIds: ids }),
  fetchPlaygroundRunHistoryFilterModels: async () => {
    try {
      const data = await authFetchJson<PlaygroundRunHistoryModelsResponse>(
        `${endpoint}/playground/runs/models`,
        undefined,
        { errorMessage: "Failed to load run history models" }
      );
      const opts = (data.items ?? []).map((row) => ({
        id: row.id,
        name: formatPlaygroundGenModelDisplayName(row),
      }));
      set({ runHistoryFilterModels: opts });
    } catch {
      set({ runHistoryFilterModels: [] });
    }
  },
  fetchRecentPlaygroundModels: async () => {
    set({ recentPlaygroundModelsLoading: true });
    try {
      const data = await authFetchJson<PlaygroundRecentModelsResponse>(
        `${endpoint}/playground/models/recent?limit=12`,
        undefined,
        { errorMessage: "Failed to load recent playground models" }
      );
      set({
        recentPlaygroundModels: data.items ?? [],
        recentPlaygroundModelsLoading: false,
      });
    } catch {
      set({ recentPlaygroundModels: [], recentPlaygroundModelsLoading: false });
    }
  },
  fetchPlaygroundRunHistory: async (opts = {}) => {
    const {
      runHistoryPage: currentPage,
      runHistoryLimit: currentLimit,
      runHistoryGenModelFilter,
      runHistoryFileTypeFilter,
      runHistoryTagIds,
    } = get();
    const page = Math.max(1, opts.page ?? currentPage);
    const limit = Math.min(100, Math.max(1, opts.limit ?? currentLimit));
    set({ runHistoryLoading: true, runHistoryError: null });
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      const genModelId = opts.gen_model_id?.trim() ?? runHistoryGenModelFilter?.trim();
      if (genModelId) {
        params.set("gen_model_id", genModelId);
      }
      const fileType = opts.file_type_filter ?? runHistoryFileTypeFilter;
      if (fileType && fileType !== "all") {
        params.set("file_type_filter", fileType);
      }
      const tagIds = opts.tag_ids ?? runHistoryTagIds;
      if (tagIds.length > 0) {
        params.set("tags", tagIds.join(","));
      }
      const data = await authFetchJson<PlaygroundRunHistoryResponse>(
        `${endpoint}/playground/runs?${params.toString()}`,
        undefined,
        { errorMessage: "Failed to load run history" }
      );
      set({
        runHistory: (data.items ?? []).map(normalizeRunHistoryItem),
        runHistoryTotal: data.total ?? 0,
        runHistoryPage: data.page ?? page,
        runHistoryLimit: data.limit ?? limit,
        runHistoryLoading: false,
      });
    } catch (err) {
      set({
        runHistory: [],
        runHistoryTotal: 0,
        runHistoryLoading: false,
        runHistoryError: err instanceof Error ? err.message : "Failed to load run history",
      });
    }
  },
  deletePlaygroundRun: async (runId: string) => {
    const { runHistoryPage, runHistoryLimit, runHistoryTotal } = get();
    await authFetchJson<{ ok: boolean }>(
      `${endpoint}/playground/runs/${encodeURIComponent(runId)}`,
      { method: "DELETE" },
      { errorMessage: "Failed to delete run" }
    );
    const newTotal = Math.max(0, runHistoryTotal - 1);
    const maxPage = Math.max(1, Math.ceil(newTotal / runHistoryLimit));
    const page = Math.min(runHistoryPage, maxPage);
    await get().fetchPlaygroundRunHistory({ page });
  },
  searchPlayground: async (filters = {}, opts) => {
    const silent = Boolean(opts?.silent);
    if (!silent) {
      set({ loading: true, error: null });
    } else {
      set({ error: null });
    }
    try {
      const data = await authFetchJson<PlaygroundSearchResponse>(toQuery(filters), undefined, {
        errorMessage: "Failed to load playground models",
      });
      set({
        items: data.items ?? [],
        filters: data.filters ?? emptyFilters,
        total: data.total ?? 0,
        ...(silent ? {} : { loading: false }),
      });
    } catch (err) {
      set({
        items: [],
        filters: emptyFilters,
        total: 0,
        ...(silent ? {} : { loading: false }),
        error: err instanceof Error ? err.message : "Failed to load playground models",
      });
    }
  },
  runPlaygroundModel: async (input) => {
    set({ runLoading: true, runError: null });
    try {
      const data = await authFetchJson<PlaygroundRunResponse>(
        `${endpoint}/playground/run`,
        {
          method: "POST",
          body: JSON.stringify(input),
        },
        { errorMessage: "Failed to run playground model" }
      );
      set({ runLoading: false });
      void get().fetchPlaygroundRunHistory({ page: 1 });
      void get().fetchPlaygroundRunHistoryFilterModels();
      void get().fetchRecentPlaygroundModels();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to run playground model";
      set({ runLoading: false, runError: message });
      throw err;
    }
  },
  calculatePlaygroundRunCost: async (input) => {
    console.log("input", input);
    set({ costLoading: true, costError: null });
    try {
      const data = await authFetchJson<PlaygroundCostResponse>(
        `${endpoint}/playground/cost`,
        {
          method: "POST",
          body: JSON.stringify(input),
        },
        { errorMessage: "Failed to calculate playground cost" }
      );
      const cost = typeof data?.cost === "number" ? data.cost : 0;
      set({ costLoading: false, latestCost: cost });
      return cost;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to calculate playground cost";
      set({ costLoading: false, costError: message, latestCost: null });
      throw err;
    }
  },
  setSelectedModel: (model) => set({ selectedModel: model }),
  setSelectedModelById: (id) =>
    set((state) => ({
      selectedModel: state.items.find((item) => item.id === id || item.model_id === id) ?? null,
    })),
  setSelectedModelByRoute: ({ brand_slug, model_product, model_variant }) =>
    set((state) => ({
      selectedModel:
        state.items.find((item) => {
          const brand = item.brand_name?.slug ?? "";
          const product = (item.model_product ?? "").trim();
          const variant = (item.model_variant ?? "").trim();
          return brand === brand_slug && product === model_product && variant === model_variant;
        }) ?? null,
    })),
  reset: () =>
    set({
      items: [],
      filters: emptyFilters,
      total: 0,
      loading: false,
      runLoading: false,
      costLoading: false,
      error: null,
      runError: null,
      costError: null,
      latestCost: null,
      runHistory: [],
      runHistoryTotal: 0,
      runHistoryPage: 1,
      runHistoryLimit: 9,
      runHistoryLoading: false,
      runHistoryError: null,
      runHistoryGenModelFilter: null,
      runHistoryFileTypeFilter: "all",
      runHistoryTagIds: [],
      runHistoryFilterModels: [],
      recentPlaygroundModels: [],
      recentPlaygroundModelsLoading: false,
      selectedModel: null,
    }),
}));

export default createUniversalSelectors(usePlaygroundStoreBase);
