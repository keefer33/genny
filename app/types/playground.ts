import type { ReactNode } from "react";

export type PlaygroundItem = {
  id: string;
  brands: {
    slug: string | null;
    name: string | null;
    logo: string | null;
    sort_order?: number | null;
  };
  model_id: string | null;
  model_name: string | null;
  model_description: string | null;
  model_type: string | null;
  generation_type?: string | null;
  brand_name: string | null;
  model_product?: string | null;
  model_variant?: string | null;
  sort_order: number | null;
  /** JSON Schema–like object for playground run inputs (from gen_models.function_schema). */
  function_schema?: unknown;
};

export type PlaygroundSearchFilters = {
  search?: string;
  model_id?: string;
  brands?: string[];
  model_product?: string[];
  model_variant?: string[];
  model_type?: string[];
};

export type PlaygroundSearchResponse = {
  items: PlaygroundItem[];
  filters: {
    brands: string[];
    model_product: string[];
    model_variant: string[];
    model_type: string[];
  };
  total: number;
};

export type PlaygroundRecentModelsResponse = {
  items: PlaygroundItem[];
  total?: number;
};

export type PlaygroundRunResponse = unknown;
export type PlaygroundCostResponse = { cost?: number };

export type PlaygroundRunHistoryItem = {
  id: string;
  created_at: string;
  user_id: string;
  gen_model_id: string | null;
  status: string | null;
  task_id: string | null;
  cost: number | null;
  duration: number | null;
  gen_models: {
    generation_type: string | null;
    model_name: string | null;
    model_id: string | null;
    brand_name: any | null;
    model_product: string | null;
    model_variant: string | null;
  } | null;
  thumbnail_url: string | null;
  preview_urls: string[];
  /** Same length as `preview_urls` — short labels for file-type badges. */
  preview_file_types: string[];
  preview_files: Array<{ id: string; file_name: string }>;
};

export type PlaygroundRunHistoryResponse = {
  items: PlaygroundRunHistoryItem[];
  total: number;
  page: number;
  limit: number;
};

export type PlaygroundRunByIdResponse = {
  item: PlaygroundRunHistoryItem;
};

export type PlaygroundRunHistoryModelsResponse = {
  items: Array<{
    id: string;
    brand_name: string | null;
    model_product: string | null;
    model_variant: string | null;
  }>;
};

export type PlaygroundRunHistoryFilterModelOption = { id: string; name: string };

export interface PlaygroundStoreState {
  items: PlaygroundItem[];
  filters: PlaygroundSearchResponse["filters"];
  total: number;
  loading: boolean;
  runLoading: boolean;
  costLoading: boolean;
  error: string | null;
  runError: string | null;
  costError: string | null;
  latestCost: number | null;
  runHistory: PlaygroundRunHistoryItem[];
  runHistoryTotal: number;
  runHistoryPage: number;
  runHistoryLimit: number;
  runHistoryLoading: boolean;
  runHistoryError: string | null;
  runHistoryGenModelFilter: string | null;
  runHistoryFileTypeFilter: "all" | "images" | "videos";
  runHistoryTagIds: string[];
  /** Distinct models from the user's full run history (not route-scoped `items`). */
  runHistoryFilterModels: PlaygroundRunHistoryFilterModelOption[];
  /** Recent playground models for this user (distinct gen_model_id by latest run). */
  recentPlaygroundModels: PlaygroundItem[];
  recentPlaygroundModelsLoading: boolean;
  selectedRunHistoryModelId: string | null;
  setSelectedRunHistoryModelId: (id: string | null) => void;
  setRunHistoryGenModelFilter: (id: string | null) => void;
  setRunHistoryFileTypeFilter: (v: "all" | "images" | "videos") => void;
  setRunHistoryTagIds: (ids: string[]) => void;
  fetchPlaygroundRunHistoryFilterModels: () => Promise<void>;
  fetchRecentPlaygroundModels: () => Promise<void>;
  selectedModel: PlaygroundItem | null;
  setLoading: (loading: boolean) => void;
  searchPlayground: (
    filters?: PlaygroundSearchFilters,
    opts?: { silent?: boolean }
  ) => Promise<void>;
  fetchPlaygroundRunHistory: (opts?: {
    page?: number;
    limit?: number;
    gen_model_id?: string | null;
    file_type_filter?: "all" | "images" | "videos";
    tag_ids?: string[];
  }) => Promise<void>;
  deletePlaygroundRun: (runId: string) => Promise<void>;
  runPlaygroundModel: (input: {
    id: string;
    payload: Record<string, unknown>;
  }) => Promise<PlaygroundRunResponse>;
  calculatePlaygroundRunCost: (input: {
    modelId: string;
    payload: Record<string, unknown>;
  }) => Promise<number>;
  setSelectedModel: (model: PlaygroundItem | null) => void;
  setSelectedModelById: (id: string) => void;
  setSelectedModelByRoute: (route: {
    brand_slug: string;
    model_product: string;
    model_variant: string;
  }) => void;
  reset: () => void;
}

export type JsonSchemaProperty = {
  type?: string;
  title?: string;
  description?: string;
  enum?: Array<string | number | boolean>;
  default?: unknown;
  items?: { type?: string };
  minItems?: number;
  maxItems?: number;
  max?: number;
  minimum?: number;
  maximum?: number;
  step?: number;
  maxLength?: number;
  readOnly?: boolean;
  placeholder?: string;
  "x-placeholder"?: string;
  /** Legacy string (e.g. `"uploaders"`) or structured `{ type, settings }`. */
  "x-ui-component"?: any;
  types?: "images" | "videos" | "all";
};

export type StructuredXUiComponent = { type: string; settings: Record<string, unknown> };

export type PlaygroundMediaFilePickerInputProps = {
  fieldName: string;
  fieldSchema?: JsonSchemaProperty;
  description?: ReactNode;
  error?: ReactNode;
  isRequired?: boolean;
};

export type NumberSliderProps = {
  fieldName: string;
  label: string;
  description?: ReactNode;
  error?: ReactNode;
  isRequired?: boolean;
  min: number;
  max: number;
  step: number;
  readOnly?: boolean;
  /** JSON Schema `default` for initial display when value is unset. */
  defaultValue?: unknown;
};

/** `x-ui-component` type `SizePicker` — form value is `"width*height"` (string). */
export type SizePickerProps = {
  fieldName: string;
  label: string;
  description?: ReactNode;
  error?: ReactNode;
  isRequired?: boolean;
  min: number;
  max: number;
  readOnly?: boolean;
  /** JSON Schema `default`, e.g. `"1024*768"`. */
  defaultValue?: unknown;
};

export type PlayGroundModelBrowserProps = {
  /** `segments` — brand / product / variant each link to their route. `run` — whole card goes to the run page. */
  linkMode?: "segments" | "run";
  onAfterNavigate?: () => void;
  showSearchLabel?: boolean;
  /**
   * When false, does not call `searchPlayground` on mount (parent already loaded the catalog).
   * @default true
   */
  fetchOnMount?: boolean;
  /** Force one model card per row (narrow container / modal). */
  singleColumnGrid?: boolean;
};

export type BrandGroup = {
  brandKey: string;
  brandLabel: string;
  brandLogo: string | null | undefined;
  products: {
    productKey: string;
    productLabel: string;
    generationType: string | null;
    items: PlaygroundItem[];
  }[];
};

export type FunctionSchema = {
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  "x-order-properties"?: string[];
};
