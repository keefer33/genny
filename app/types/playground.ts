import type { ReactNode } from "react";

export type PlaygroundGenModelsApisEmbed = {
  id?: number | string | null;
  api_schema?: unknown;
  vendor_apis?: unknown;
  model_pricing?: unknown;
  function_schema?: unknown;
};

export type PlaygroundItem = {
  id: string;
  brand_name?: {
    id?: string | null;
    slug?: string | null;
    name: string | null;
    logo: string | null;
    sort_order: number | null;
  } | null;
  model_id: string | null;
  model_name: string | null;
  model_description: string | null;
  model_type: string | null;
  generation_type?: string | null;
  model_product?: string | null;
  model_variant?: string | null;
  sort_order: number | null;
  gen_models_apis_id?: number | string | null;
  gen_models_apis?: PlaygroundGenModelsApisEmbed | null;
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

/** Embedded gen model on a run row (`gen_model_id` object from API). */
export type PlaygroundRunHistoryGenModelEmbed = {
  id: string;
  model_id?: string | null;
  model_name?: string | null;
  /** image | video | … from catalog */
  generation_type?: string | null;
  brand_name?:
    | string
    | null
    | { name?: string | null; logo?: string | null; slug?: string | null }
    | null;
  model_product?: string | null;
  model_variant?: string | null;
};

export type PlaygroundRunHistoryItem = {
  id: string;
  created_at: string;
  user_id: string;
  gen_model_id: string | PlaygroundRunHistoryGenModelEmbed | null;
  status: string | null;
  task_id: string | null;
  cost: number | null;
  duration: number | null;
  /** Legacy flat embed; newer payloads may only nest under `gen_model_id`. */
  gen_models?: PlaygroundRunHistoryGenModelEmbed | PlaygroundRunHistoryGenModelEmbed[] | null;
  thumbnail_url: string | null;
  preview_urls: string[];
  /** Same length as `preview_urls` — short labels for file-type badges. */
  preview_file_types: string[];
  preview_files: Array<{ id: string; file_name: string }>;
  /** When present, used to build previews if `preview_urls` is empty. */
  user_files?: Array<{
    id: string;
    file_path?: string | null;
    file_type?: string | null;
    file_name?: string | null;
    thumbnail_url?: string | null;
  }>;
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

export type PlaygroundRunHistoryModelsCatalogItem = {
  id: string;
  model_id?: string | null;
  model_name?: string | null;
  brand_name: string | null | { name?: string | null; logo?: string | null; slug?: string | null };
  model_product?: string | null;
  model_variant?: string | null;
};

export type PlaygroundRunHistoryModelsResponse = {
  items: PlaygroundRunHistoryModelsCatalogItem[];
  total?: number;
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
  runHistoryFileTypeFilter: "all" | "images" | "videos" | "audio";
  runHistoryTagIds: string[];
  /** Distinct models from the user's full run history (not route-scoped `items`). */
  runHistoryFilterModels: PlaygroundRunHistoryFilterModelOption[];
  /** Recent playground models for this user (distinct gen_model_id by latest run). */
  recentPlaygroundModels: PlaygroundItem[];
  recentPlaygroundModelsLoading: boolean;
  selectedRunHistoryModelId: string | null;
  setSelectedRunHistoryModelId: (id: string | null) => void;
  setRunHistoryGenModelFilter: (id: string | null) => void;
  setRunHistoryFileTypeFilter: (v: "all" | "images" | "videos" | "audio") => void;
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
    file_type_filter?: "all" | "images" | "videos" | "audio";
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
  /** Optional UI overrides for schema form rendering. */
  "x-ui-config"?: any;
  types?: "images" | "videos" | "audio" | "all";
};

export type StructuredXUiComponent = { type: string; settings: Record<string, unknown> };
export type StructuredXUiConfig = {
  showDesc: boolean;
  label: string | null;
  hidden: boolean;
};

export type PlaygroundMediaFilePickerInputProps = {
  fieldName: string;
  fieldSchema?: JsonSchemaProperty;
  description?: ReactNode;
  error?: ReactNode;
  isRequired?: boolean;
};

export type NumberSliderProps = {
  fieldName: string;
  label: ReactNode;
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
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  isRequired?: boolean;
  min: number;
  max: number;
  readOnly?: boolean;
  /** JSON Schema `default`, e.g. `"1024*768"`. */
  defaultValue?: unknown;
};

/** `x-ui-component` type `BoxPicker` — enum string choices rendered as selectable boxes. */
export type BoxPickerProps = {
  fieldName: string;
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  isRequired?: boolean;
  options: string[];
  readOnly?: boolean;
  defaultValue?: unknown;
};

/** `x-ui-component` type `AspectRatioPicker` — enum ratio choices rendered as ratio-shaped boxes. */
export type AspectRatioPickerProps = {
  fieldName: string;
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  isRequired?: boolean;
  options: string[];
  readOnly?: boolean;
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
