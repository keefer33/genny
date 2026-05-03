import { create } from "zustand";
import { authFetchJson } from "./authFetch";
import { endpoint } from "../utils";
import createUniversalSelectors from "./universalSelectors";
import type {
  GenerationsHistoryResponse,
  ModelSearchFilters,
  GenerationsStoreState,
  GenModelsSearchResponse,
  GenerateResponse,
  GenerateCostResponse,
} from "~/types/generations";

const emptyFilters: GenModelsSearchResponse["filters"] = {
  brands: [],
  model_product: [],
  model_variant: [],
  model_type: [],
};

const toQuery = (filters: ModelSearchFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.model_id?.trim()) params.set("model_id", filters.model_id.trim());
  if (filters.brands?.length) params.set("brands", filters.brands.join(","));
  if (filters.model_product?.length) params.set("model_product", filters.model_product.join(","));
  if (filters.model_variant?.length) params.set("model_variant", filters.model_variant.join(","));
  if (filters.model_type?.length) params.set("model_type", filters.model_type.join(","));
  if (filters.generation_type?.length) {
    params.set("generation_type", filters.generation_type.join(","));
  }
  const qs = params.toString();
  return `${endpoint}/playground${qs ? `?${qs}` : ""}`;
};

let generationsHistoryInFlight: { key: string; promise: Promise<void> } | null = null;

const useGenerationsStoreBase = create<GenerationsStoreState>((set, get) => ({
  items: [],
  filters: emptyFilters,
  allGenModels: [],
  allGenModelsFilters: emptyFilters,
  total: 0,
  loading: false,
  runLoading: false,
  costLoading: false,
  error: null,
  runError: null,
  costError: null,
  latestCost: null,
  generationsHistory: [],
  generationsHistoryTotal: 0,
  generationsHistoryPage: 1,
  generationsHistoryLimit: 12,
  generationsHistoryLoading: false,
  generationsHistoryError: null,
  generationsHistoryGenModelFilter: null,
  generationsHistoryBrandFilters: [],
  generationsHistoryModelProductFilters: [],
  generationsHistoryModelTypeFilters: [],
  generationsHistoryGenerationIdsFilter: [],
  generationsHistoryFilterModels: [],
  recentGenModels: [],
  recentGenModelsLoading: false,
  catalogGenerationType: null,
  generateSearchQuery: "",
  generateBrandFilters: [],
  generateTypeFilters: [],
  generateFiltersOpened: false,
  selectedModel: null,
  selectedGenerationsHistoryGenModelId: null,
  setGenerateSearchQuery: (value) => set({ generateSearchQuery: value }),
  setGenerateBrandFilters: (values) => set({ generateBrandFilters: values }),
  setGenerateTypeFilters: (values) => set({ generateTypeFilters: values }),
  openGenerateFilters: () => set({ generateFiltersOpened: true }),
  closeGenerateFilters: () => set({ generateFiltersOpened: false }),
  setSelectedGenerationsHistoryGenModelId: (id) =>
    set({ selectedGenerationsHistoryGenModelId: id }),
  setLoading: (loading) => set({ loading }),
  setGenerationsHistoryGenModelFilter: (id) => set({ generationsHistoryGenModelFilter: id }),
  setGenerationsHistoryBrandFilters: (values) => set({ generationsHistoryBrandFilters: values }),
  setGenerationsHistoryModelProductFilters: (values) =>
    set({ generationsHistoryModelProductFilters: values }),
  setGenerationsHistoryModelTypeFilters: (values) =>
    set({ generationsHistoryModelTypeFilters: values }),
  setGenerationsHistoryGenerationIdsFilter: (values) =>
    set({ generationsHistoryGenerationIdsFilter: values }),
  clearGenerationsHistoryFilters: () =>
    set({
      generationsHistoryGenModelFilter: null,
      generationsHistoryBrandFilters: [],
      generationsHistoryModelProductFilters: [],
      generationsHistoryModelTypeFilters: [],
      generationsHistoryGenerationIdsFilter: [],
    }),
  fetchGenerationsHistory: async (opts = {}) => {
    const {
      generationsHistoryPage: currentPage,
      generationsHistoryLimit: currentLimit,
      generationsHistoryGenModelFilter,
      generationsHistoryBrandFilters,
      generationsHistoryModelProductFilters,
      generationsHistoryModelTypeFilters,
      generationsHistoryGenerationIdsFilter,
    } = get();
    const hasGenerationIdsOverride = Object.prototype.hasOwnProperty.call(opts, "generation_ids");
    const generationIds = (
      hasGenerationIdsOverride ? (opts.generation_ids ?? []) : generationsHistoryGenerationIdsFilter
    )
      .map((s) => s.trim())
      .filter(Boolean);
    if (hasGenerationIdsOverride) {
      set({ generationsHistoryGenerationIdsFilter: generationIds });
      if (generationIds.length === 0) {
        set({
          generationsHistory: [],
          generationsHistoryTotal: 0,
          generationsHistoryPage: 1,
          generationsHistoryLoading: false,
          generationsHistoryError: null,
        });
        return;
      }
    }
    const page = Math.max(1, opts.page ?? currentPage);
    const limit = Math.min(100, Math.max(1, opts.limit ?? currentLimit));
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (generationIds.length > 0) {
      params.set("generation_ids", generationIds.join(","));
    }
    const genModelId = opts.gen_model_id?.trim() ?? generationsHistoryGenModelFilter?.trim();
    if (genModelId) {
      params.set("gen_model_id", genModelId);
    }
    const brands = (opts.brands ?? generationsHistoryBrandFilters)
      .map((s) => s.trim())
      .filter(Boolean);
    if (brands.length > 0) {
      params.set("brands", brands.join(","));
    }
    const products = (opts.model_product ?? generationsHistoryModelProductFilters)
      .map((s) => s.trim())
      .filter(Boolean);
    if (products.length > 0) {
      params.set("model_product", products.join(","));
    }
    const modelTypes = (opts.model_type ?? generationsHistoryModelTypeFilters)
      .map((s) => s.trim())
      .filter(Boolean);
    if (modelTypes.length > 0) {
      params.set("model_type", modelTypes.join(","));
    }

    const requestUrl = `${endpoint}/playground/runs?${params.toString()}`;
    if (generationsHistoryInFlight?.key === requestUrl) {
      return generationsHistoryInFlight.promise;
    }

    set({ generationsHistoryLoading: true, generationsHistoryError: null });
    const request = (async () => {
      try {
        const data = await authFetchJson<GenerationsHistoryResponse>(requestUrl, undefined, {
          errorMessage: "Failed to load run history",
        });
        set({
          generationsHistory: data.items ?? [],
          generationsHistoryTotal: data.total ?? 0,
          generationsHistoryPage: data.page ?? page,
          generationsHistoryLimit: data.limit ?? limit,
          generationsHistoryLoading: false,
        });
      } catch (err) {
        set({
          generationsHistory: [],
          generationsHistoryTotal: 0,
          generationsHistoryLoading: false,
          generationsHistoryError:
            err instanceof Error ? err.message : "Failed to load run history",
        });
      }
    })();
    generationsHistoryInFlight = { key: requestUrl, promise: request };
    try {
      await request;
    } finally {
      if (generationsHistoryInFlight?.promise === request) {
        generationsHistoryInFlight = null;
      }
    }
  },
  deleteGenerate: async (runId: string) => {
    await authFetchJson<{ ok: boolean }>(
      `${endpoint}/playground/runs/${encodeURIComponent(runId)}`,
      { method: "DELETE" },
      { errorMessage: "Failed to delete run" }
    );
  },
  searchGenModels: async (filters = {}, opts) => {
    const silent = Boolean(opts?.silent);
    const clearItems = Boolean(opts?.clearItems);
    if (!silent) {
      set({
        loading: true,
        error: null,
        ...(clearItems ? { items: [], total: 0, filters: emptyFilters } : {}),
      });
    } else {
      set({ error: null });
    }
    try {
      const data = await authFetchJson<GenModelsSearchResponse>(toQuery(filters), undefined, {
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
  loadGenModels: async () => {
    try {
      const data = await authFetchJson<GenModelsSearchResponse>(
        `${endpoint}/playground`,
        undefined,
        {
          errorMessage: "Failed to load gen models",
        }
      );
      set({
        allGenModels: data.items ?? [],
        allGenModelsFilters: data.filters ?? emptyFilters,
      });
    } catch {
      set({
        allGenModels: [],
        allGenModelsFilters: emptyFilters,
      });
    }
  },
  generateFromGenModel: async (input) => {
    set({ runLoading: true, runError: null });
    try {
      const data = await authFetchJson<GenerateResponse>(
        `${endpoint}/playground/run`,
        {
          method: "POST",
          body: JSON.stringify(input),
        },
        { errorMessage: "Failed to run playground model" }
      );
      set({ runLoading: false });
      void get().fetchGenerationsHistory({ page: 1 });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to run playground model";
      set({ runLoading: false, runError: message });
      throw err;
    }
  },
  calculateGenerateCost: async (input) => {
    console.log("input", input);
    set({ costLoading: true, costError: null });
    try {
      const data = await authFetchJson<GenerateCostResponse>(
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
  setCatalogGenerationType: (generationType) => set({ catalogGenerationType: generationType }),
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
  clearGenerateCatalogForGenerationType: () =>
    set({
      items: [],
      filters: emptyFilters,
      allGenModels: [],
      allGenModelsFilters: emptyFilters,
      total: 0,
      error: null,
      catalogGenerationType: null,
      selectedModel: null,
      latestCost: null,
      costError: null,
    }),
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
      generationsHistory: [],
      generationsHistoryTotal: 0,
      generationsHistoryPage: 1,
      generationsHistoryLimit: 9,
      generationsHistoryLoading: false,
      generationsHistoryError: null,
      generationsHistoryGenModelFilter: null,
      generationsHistoryBrandFilters: [],
      generationsHistoryModelProductFilters: [],
      generationsHistoryModelTypeFilters: [],
      generationsHistoryGenerationIdsFilter: [],
      generationsHistoryFilterModels: [],
      recentGenModels: [],
      recentGenModelsLoading: false,
      catalogGenerationType: null,
      generateSearchQuery: "",
      generateBrandFilters: [],
      generateTypeFilters: [],
      generateFiltersOpened: false,
      selectedModel: null,
    }),
}));

export default createUniversalSelectors(useGenerationsStoreBase);
