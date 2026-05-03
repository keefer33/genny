import { create } from "zustand";
import { endpoint } from "~/lib/utils";
import useAppStore from "~/lib/stores/appStore";
import { assertAuthFetchOk, authFetch, authFetchJson } from "~/lib/stores/authFetch";

// ─── Types (Composio API shapes) ───────────────────────────────────────────

export interface ToolkitMeta {
  created_at: string;
  updated_at: string;
  description: string;
  logo: string;
  app_url?: string | null;
  categories?: Array<{ name?: string; slug?: string; id?: string }>;
  triggers_count: number;
  tools_count: number;
  version: string;
  available_versions?: string[];
}

export interface ToolkitItem {
  slug: string;
  name: string;
  auth_schemes?: string[];
  composio_managed_auth_schemes?: string[];
  is_local_toolkit?: boolean;
  no_auth?: boolean;
  auth_guide_url?: string | null;
  deprecated?: { toolkitId?: string };
  meta: ToolkitMeta;
}

export interface ToolkitsListResponse {
  items: ToolkitItem[];
  next_cursor: string | null;
  total_pages: number;
  current_page: number;
  total_items: number;
}

export interface CategoryItem {
  name: string;
  id: string;
}

export interface CategoriesListResponse {
  items: CategoryItem[];
  next_cursor: string | null;
  total_pages: number;
  current_page: number;
  total_items: number;
}

export interface ToolkitDetail extends ToolkitItem {
  enabled?: boolean;
  auth_config_details?: unknown[];
  base_url?: string;
  get_current_user_endpoint?: string;
  get_current_user_endpoint_method?: string;
}

export interface ToolItem {
  slug: string;
  name: string;
  description: string;
  toolkit: { slug: string; name: string; logo: string };
  input_parameters?: Record<string, unknown>;
  no_auth?: boolean;
  available_versions?: string[];
  version: string;
  output_parameters?: Record<string, unknown>;
  scopes?: string[];
  tags?: string[];
  human_description?: string;
  is_deprecated?: boolean;
  deprecated?: Record<string, unknown>;
}

export interface ToolsListResponse {
  items: ToolItem[];
  next_cursor: string | null;
  total_pages: number;
  current_page: number;
  total_items: number;
}

export interface ConnectedAccountItem {
  id: string;
  toolkit?: { slug: string };
  auth_config?: { id: string; auth_scheme?: string };
  status?: string;
  created_at?: string;
  updated_at?: string;
  state?: Record<string, unknown>;
  is_disabled?: boolean;
}

export interface ConnectedAccountsListResponse {
  items: ConnectedAccountItem[];
  next_cursor?: string | null;
  total_pages?: number;
  current_page?: number;
  total_items?: number;
}

export interface ConnectLinkResponse {
  redirect_url: string;
  link_token: string;
  expires_at: string;
  connected_account_id: string;
}

// ─── Store state & actions ─────────────────────────────────────────────────

export type ToolkitsSortBy = "usage" | "alphabetically";

interface ToolsListState {
  toolkitsData: ToolkitsListResponse | null;
  toolkitsLoading: boolean;
  toolkitsError: string | null;
  categoriesData: CategoriesListResponse | null;
  categoriesLoading: boolean;
  categoriesError: string | null;
  searchQuery: string;
  searchInput: string;
  categoryFilter: string;
  sortBy: ToolkitsSortBy;
  cursor: string | null;
}

interface ToolsDetailState {
  toolkitDetail: ToolkitDetail | null;
  toolkitDetailLoading: boolean;
  toolkitDetailError: string | null;
  toolkitDetailStatus: number | null;
  toolsData: ToolsListResponse | null;
  toolsLoading: boolean;
  toolsError: string | null;
}

interface ToolsConnectionsState {
  connectedAccounts: ConnectedAccountItem[];
  connectedAccountsLoading: boolean;
  connectedAccountsError: string | null;
}

/** Tools list keyed by toolkit slug (for agent tool selector). */
interface ToolsByToolkitState {
  toolsByToolkit: Record<string, ToolItem[]>;
  toolsByToolkitLoading: boolean;
}

interface ToolsActions {
  setSearchInput: (value: string) => void;
  setCategoryFilter: (value: string) => void;
  setSortBy: (value: ToolkitsSortBy) => void;
  submitSearch: () => void;
  clearSearch: () => void;

  loadToolkits: (params: {
    category?: string;
    search?: string;
    sort_by?: ToolkitsSortBy;
    cursor?: string | null;
    limit?: number;
  }) => Promise<void>;
  loadCategories: () => Promise<void>;
  loadToolkitBySlug: (slug: string) => Promise<void>;
  loadTools: (params: {
    toolkit_slug: string;
    cursor?: string | null;
    limit?: number;
  }) => Promise<void>;
  /** Load tools for multiple toolkits in parallel; stores in toolsByToolkit. */
  loadToolsForToolkits: (toolkitSlugs: string[]) => Promise<void>;
  resetDetail: () => void;

  loadConnectedAccounts: () => Promise<void>;
  createConnectLink: (params: {
    toolkit_slug: string;
    callback_url?: string;
  }) => Promise<ConnectLinkResponse | null>;
  deleteConnectedAccount: (id: string) => Promise<boolean>;

  getConnectionForToolkit: (toolkitSlug: string) => ConnectedAccountItem | null;
}

type ToolsState = ToolsListState &
  ToolsDetailState &
  ToolsConnectionsState &
  ToolsByToolkitState &
  ToolsActions;

export const useToolsStore = create<ToolsState>((set, get) => ({
  toolkitsData: null,
  toolkitsLoading: false,
  toolkitsError: null,
  categoriesData: null,
  categoriesLoading: false,
  categoriesError: null,
  searchQuery: "",
  searchInput: "",
  categoryFilter: "",
  sortBy: "usage",
  cursor: null,

  toolkitDetail: null,
  toolkitDetailLoading: false,
  toolkitDetailError: null,
  toolkitDetailStatus: null,
  toolsData: null,
  toolsLoading: false,
  toolsError: null,

  connectedAccounts: [],
  connectedAccountsLoading: false,
  connectedAccountsError: null,

  toolsByToolkit: {},
  toolsByToolkitLoading: false,

  setSearchInput: (value) => set({ searchInput: value }),
  setCategoryFilter: (value) => set({ categoryFilter: value }),
  setSortBy: (value) => set({ sortBy: value }),
  submitSearch: () => set({ searchQuery: get().searchInput, cursor: null }),
  clearSearch: () => set({ searchInput: "", searchQuery: "", cursor: null }),

  loadToolkits: async ({ category, search, sort_by, cursor, limit = 24 }) => {
    set({ toolkitsLoading: true, toolkitsError: null });
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    if (sort_by) params.set("sort_by", sort_by);
    if (cursor) params.set("cursor", cursor);
    if (limit) params.set("limit", String(limit));
    try {
      const apiKey = useAppStore.getState().getAuthApiKey();
      if (!apiKey) {
        set({ toolkitsError: "Sign in to browse toolkits", toolkitsLoading: false });
        return;
      }
      const json = await authFetchJson<ToolkitsListResponse>(
        `${endpoint}/tools/toolkits?${params.toString()}`,
        undefined,
        { errorMessage: "Failed to load toolkits" }
      );
      if (cursor && get().toolkitsData?.items) {
        set({
          toolkitsData: {
            ...json,
            items: [...get().toolkitsData!.items, ...(json.items ?? [])],
          },
          toolkitsLoading: false,
        });
      } else {
        set({ toolkitsData: json, toolkitsLoading: false });
      }
    } catch (err) {
      set({
        toolkitsError: err instanceof Error ? err.message : "Failed to load toolkits",
        toolkitsLoading: false,
      });
    }
  },

  loadCategories: async () => {
    set({ categoriesLoading: true, categoriesError: null });
    try {
      const apiKey = useAppStore.getState().getAuthApiKey();
      if (!apiKey) {
        set({ categoriesError: "Sign in to load categories", categoriesLoading: false });
        return;
      }
      const res = await authFetch(`${endpoint}/tools/toolkits/categories`);
      await assertAuthFetchOk(res, "Failed to load categories");
      const json: CategoriesListResponse = await res.json();
      set({ categoriesData: json, categoriesLoading: false });
    } catch (err) {
      set({
        categoriesError: err instanceof Error ? err.message : "Failed to load categories",
        categoriesLoading: false,
      });
    }
  },

  loadToolkitBySlug: async (slug) => {
    set({
      toolkitDetailLoading: true,
      toolkitDetailError: null,
      toolkitDetailStatus: null,
      toolkitDetail: null,
    });
    const encoded = encodeURIComponent(slug);
    try {
      const apiKey = useAppStore.getState().getAuthApiKey();
      if (!apiKey) {
        set({ toolkitDetailError: "Sign in to view toolkit", toolkitDetailLoading: false });
        return;
      }
      const res = await authFetchJson<ToolkitDetail>(
        `${endpoint}/tools/toolkits/${encoded}`,
        undefined,
        { errorMessage: "Failed to load toolkit" }
      );
      set({ toolkitDetail: res, toolkitDetailLoading: false });
    } catch (err) {
      set({
        toolkitDetailError: err instanceof Error ? err.message : "Failed to load toolkit",
        toolkitDetailLoading: false,
      });
    }
  },

  loadTools: async ({ toolkit_slug, cursor, limit = 50 }) => {
    set({ toolsLoading: true, toolsError: null });
    const params = new URLSearchParams();
    params.set("toolkit_slug", toolkit_slug);
    if (cursor) params.set("cursor", cursor);
    if (limit) params.set("limit", String(limit));
    try {
      const apiKey = useAppStore.getState().getAuthApiKey();
      if (!apiKey) {
        set({ toolsError: "Sign in to view tools", toolsLoading: false });
        return;
      }
      const json = await authFetchJson<ToolsListResponse>(
        `${endpoint}/tools/tools?${params.toString()}`,
        undefined,
        { errorMessage: "Failed to load tools" }
      );
      set({ toolsData: json, toolsLoading: false });
    } catch (err) {
      set({
        toolsError: err instanceof Error ? err.message : "Failed to load tools",
        toolsLoading: false,
      });
    }
  },

  loadToolsForToolkits: async (toolkitSlugs: string[]) => {
    const slugs = [...new Set(toolkitSlugs)].filter(Boolean);
    if (slugs.length === 0) {
      set({ toolsByToolkit: {}, toolsByToolkitLoading: false });
      return;
    }
    set({ toolsByToolkitLoading: true });
    const apiKey = useAppStore.getState().getAuthApiKey();
    if (!apiKey) {
      set({ toolsByToolkit: {}, toolsByToolkitLoading: false });
      return;
    }
    try {
      const results = await Promise.all(
        slugs.map(async (slug) => {
          const params = new URLSearchParams();
          params.set("toolkit_slug", slug);
          params.set("limit", "100");
          const res = await authFetch(`${endpoint}/tools/tools?${params.toString()}`);
          if (!res.ok) return { slug, items: [] as ToolItem[] };
          const json: ToolsListResponse = await res.json();
          return { slug, items: json.items ?? [] };
        })
      );
      const next: Record<string, ToolItem[]> = {};
      for (const { slug, items } of results) next[slug] = items;
      set((s) => ({
        toolsByToolkit: { ...s.toolsByToolkit, ...next },
        toolsByToolkitLoading: false,
      }));
    } catch {
      set({ toolsByToolkitLoading: false });
    }
  },

  resetDetail: () =>
    set({
      toolkitDetail: null,
      toolkitDetailLoading: false,
      toolkitDetailError: null,
      toolkitDetailStatus: null,
      toolsData: null,
      toolsLoading: false,
      toolsError: null,
    }),

  loadConnectedAccounts: async () => {
    const apiKey = useAppStore.getState().getAuthApiKey();
    if (!apiKey) {
      set({
        connectedAccounts: [],
        connectedAccountsError: null,
        connectedAccountsLoading: false,
      });
      return;
    }
    set({ connectedAccountsLoading: true, connectedAccountsError: null });
    try {
      const res = await authFetch(`${endpoint}/tools/connected-accounts`);
      if (res.status === 401) {
        set({
          connectedAccounts: [],
          connectedAccountsError: null,
          connectedAccountsLoading: false,
        });
        return;
      }
      await assertAuthFetchOk(res, "Failed to load connections");
      const payload: unknown = await res.json().catch(() => ({}));
      const json =
        payload &&
        typeof payload === "object" &&
        (payload as { success?: unknown }).success === true
          ? ((payload as { data?: ConnectedAccountsListResponse }).data ?? { items: [] })
          : (payload as ConnectedAccountsListResponse);
      set({ connectedAccounts: json.items ?? [], connectedAccountsLoading: false });
    } catch (err) {
      set({
        connectedAccountsError: err instanceof Error ? err.message : "Failed to load connections",
        connectedAccounts: [],
        connectedAccountsLoading: false,
      });
    }
  },

  createConnectLink: async ({ toolkit_slug, callback_url }) => {
    const apiKey = useAppStore.getState().getAuthApiKey();
    if (!apiKey) return null;
    try {
      return await authFetchJson<ConnectLinkResponse>(
        `${endpoint}/tools/connected-accounts/link`,
        {
          method: "POST",
          body: JSON.stringify({ toolkit_slug, callback_url }),
        },
        { errorMessage: "Failed to create connect link" }
      );
    } catch (err) {
      console.error("[toolsStore] createConnectLink:", err);
      throw err;
    }
  },

  deleteConnectedAccount: async (id) => {
    const apiKey = useAppStore.getState().getAuthApiKey();
    if (!apiKey || !id) return false;
    try {
      const res = await authFetch(
        `${endpoint}/tools/connected-accounts/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );
      await assertAuthFetchOk(res, "Failed to remove connection");
      set((state) => ({
        connectedAccounts: state.connectedAccounts.filter((c) => c.id !== id),
      }));
      return true;
    } catch (err) {
      console.error("[toolsStore] deleteConnectedAccount:", err);
      throw err;
    }
  },

  getConnectionForToolkit: (toolkitSlug) => {
    const accounts = get().connectedAccounts;
    return accounts.find((a) => a.toolkit?.slug === toolkitSlug) ?? null;
  },
}));
