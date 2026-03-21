import { create } from "zustand";
import { endpoint } from "~/lib/utils";
import { assertAuthFetchOk, authFetch } from "~/lib/stores/authFetch";
import useAppStore from "~/lib/stores/appStore";

// ─── Types (list API) ─────────────────────────────────────────────────────

export interface McpServerSummary {
  id: string;
  qualifiedName: string;
  namespace: string | null;
  slug: string | null;
  displayName: string;
  description: string;
  iconUrl: string | null;
  verified: boolean;
  useCount: number;
  remote: boolean | null;
  isDeployed: boolean;
  createdAt: string;
  homepage: string;
  owner: string | null;
  score: number | null;
}

export interface McpServersPagination {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

export interface McpServersListResponse {
  servers: McpServerSummary[];
  pagination: McpServersPagination;
}

// ─── Types (detail API) ────────────────────────────────────────────────────

export interface McpServerConnection {
  type: string;
  configSchema?: Record<string, unknown>;
  deploymentUrl?: string;
  bundleUrl?: string;
  runtime?: string;
  stdioFunction?: string;
}

export interface McpServerTool {
  name: string;
  description: string | null;
  inputSchema?: { type: string; properties?: Record<string, unknown> };
}

export interface McpServerResource {
  name: string;
  uri: string;
  description?: string;
  mimeType?: string;
}

export interface McpServerPrompt {
  name: string;
  description?: string;
  arguments?: Array<{ name: string; description?: string; required?: boolean }>;
}

export interface McpServerEventTopic {
  topic: string;
  name: string;
  description?: string;
}

export interface McpServerDetail {
  qualifiedName: string;
  displayName: string;
  description: string;
  iconUrl: string | null;
  remote: boolean;
  deploymentUrl: string | null;
  connections: McpServerConnection[];
  tools: McpServerTool[] | null;
  resources: McpServerResource[] | null;
  prompts: McpServerPrompt[] | null;
  eventTopics: McpServerEventTopic[] | null;
  security: { scanPassed: boolean } | null;
}

// ─── Connect (Smithery Connect) ───────────────────────────────────────────

export interface McpConnectResponse {
  connectionId: string;
  name: string;
  mcpUrl: string;
  status?:
    | { state: "connected" }
    | { state: "auth_required"; authorizationUrl?: string }
    | { state: "error"; message: string };
}

export interface McpConnectionItem {
  connectionId: string;
  name: string;
  mcpUrl: string;
  qualifiedName?: string;
  status?:
    | { state: "connected" }
    | { state: "auth_required"; authorizationUrl?: string }
    | { state: "error"; message: string };
  createdAt?: string;
  iconUrl?: string | null;
  /** From API list; may include displayName, qualifiedName, iconUrl */
  server_details?: {
    iconUrl?: string;
    displayName?: string;
    qualifiedName?: string;
    description?: string;
  };
  /** Server info from MCP (title, description, etc.) */
  serverInfo?: {
    name?: string;
    title?: string;
    description?: string;
    version?: string;
    websiteUrl?: string;
    icons?: Array<{ src: string }>;
  };
}

export interface McpConnectionsListResponse {
  connections: McpConnectionItem[];
  nextCursor: string | null;
}

// ─── Constants ─────────────────────────────────────────────────────────────

export const MCP_SERVERS_PAGE_SIZE = 21;

// ─── Store state & actions ─────────────────────────────────────────────────

interface McpServersListState {
  listData: McpServersListResponse | null;
  listLoading: boolean;
  listError: string | null;
  searchQuery: string;
  searchInput: string;
  page: number;
  connections: McpConnectionItem[];
  connectionsLoading: boolean;
  connectionsError: string | null;
}

interface McpServersDetailState {
  detailServer: McpServerDetail | null;
  detailLoading: boolean;
  detailError: string | null;
  detailStatus: number | null;
}

interface McpServersActions {
  // List setters
  setSearchInput: (value: string) => void;
  setPage: (page: number) => void;
  submitSearch: () => void;
  clearSearch: () => void;

  // List fetch (page 1 replaces list; use loadMore to append next page)
  loadList: (params: { page: number; searchQuery: string }) => Promise<void>;
  loadMore: () => Promise<void>;

  // Detail fetch
  loadServer: (qualifiedName: string) => Promise<void>;

  // Detail reset (e.g. when leaving detail page)
  resetDetail: () => void;

  // Create MCP connection (Smithery Connect). Pass full server detail from loadServer.
  // Optional params are sent to Smithery as metadata.params (e.g. from connection configSchema).
  createConnection: (params: {
    serverDetails: McpServerDetail;
    params?: Record<string, unknown>;
  }) => Promise<McpConnectResponse | null>;

  // List MCP connections (Smithery Connect)
  loadConnections: () => Promise<void>;

  // Check if the current user has a connection for a server (by qualifiedName)
  getConnectionForServer: (qualifiedName: string) => Promise<{
    connected: boolean;
    connection?: McpConnectionItem;
  }>;

  // Delete MCP connection
  deleteConnection: (connectionId: string) => Promise<boolean>;
}

type McpServersState = McpServersListState & McpServersDetailState & McpServersActions;

export const useMcpServersStore = create<McpServersState>((set, get) => ({
  listData: null,
  listLoading: true,
  listError: null,
  searchQuery: "",
  searchInput: "",
  page: 1,
  connections: [],
  connectionsLoading: false,
  connectionsError: null,

  detailServer: null,
  detailLoading: false,
  detailError: null,
  detailStatus: null,

  setSearchInput: (value) => set({ searchInput: value }),
  setPage: (page) => set({ page }),
  submitSearch: () => set({ searchQuery: get().searchInput, page: 1 }),
  clearSearch: () => set({ searchInput: "", searchQuery: "", page: 1 }),

  loadList: async ({ page, searchQuery }) => {
    set({ listLoading: true, listError: null });
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(MCP_SERVERS_PAGE_SIZE));
    params.set("remote", "true");
    params.set("isDeployed", "true");
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    try {
      const res = await fetch(`${endpoint}/mcpservers/list?${params.toString()}`);
      if (!res.ok) {
        throw new Error(
          res.status === 503 ? "MCP servers list is not configured." : "Failed to load servers"
        );
      }
      const json: McpServersListResponse = await res.json();
      set({ listData: json, page });
    } catch (err) {
      set({
        listError: err instanceof Error ? err.message : "Failed to load MCP servers",
      });
    } finally {
      set({ listLoading: false });
    }
  },

  loadMore: async () => {
    const { page, searchQuery, listData, listLoading } = get();
    if (listLoading || !listData?.pagination || page >= listData.pagination.totalPages) return;
    set({ listLoading: true });
    const nextPage = page + 1;
    const params = new URLSearchParams();
    params.set("page", String(nextPage));
    params.set("pageSize", String(MCP_SERVERS_PAGE_SIZE));
    params.set("remote", "true");
    params.set("isDeployed", "true");
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    try {
      const res = await fetch(`${endpoint}/mcpservers/list?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load more servers");
      const json: McpServersListResponse = await res.json();
      set({
        listData: {
          servers: [...(listData.servers ?? []), ...(json.servers ?? [])],
          pagination: json.pagination,
        },
        page: nextPage,
      });
    } catch (err) {
      set({
        listError: err instanceof Error ? err.message : "Failed to load more servers",
      });
    } finally {
      set({ listLoading: false });
    }
  },

  loadServer: async (qualifiedName) => {
    set({ detailLoading: true, detailError: null, detailStatus: null, detailServer: null });
    const encoded = encodeURIComponent(qualifiedName);
    try {
      const res = await fetch(`${endpoint}/mcpservers/list/${encoded}`);
      set({ detailStatus: res.status });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ??
            (res.status === 404 ? "Server not found" : "Failed to load server")
        );
      }
      const json: McpServerDetail = await res.json();
      set({ detailServer: json });
    } catch (err) {
      set({
        detailError: err instanceof Error ? err.message : "Failed to load MCP server",
      });
    } finally {
      set({ detailLoading: false });
    }
  },

  resetDetail: () =>
    set({
      detailServer: null,
      detailLoading: false,
      detailError: null,
      detailStatus: null,
    }),

  createConnection: async ({ serverDetails, params }) => {
    const apiKey = useAppStore.getState().getAuthApiKey();
    if (!apiKey) {
      console.error("[mcpserversStore] createConnection: not authenticated");
      return null;
    }
    try {
      const res = await authFetch(`${endpoint}/mcpservers/connect`, {
        method: "POST",
        body: JSON.stringify({ serverDetails, params }),
      });
      await assertAuthFetchOk(res, "Failed to create connection");
      return (await res.json()) as McpConnectResponse;
    } catch (err) {
      console.error("[mcpserversStore] createConnection:", err);
      throw err;
    }
  },

  loadConnections: async () => {
    const apiKey = useAppStore.getState().getAuthApiKey();
    if (!apiKey) {
      set({ connections: [], connectionsError: null });
      return;
    }
    set({ connectionsLoading: true, connectionsError: null });
    try {
      const res = await authFetch(`${endpoint}/mcpservers/connections`);
      if (res.status === 401) {
        set({ connections: [], connectionsError: null });
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Failed to list connections");
      }
      const json: McpConnectionsListResponse = await res.json();
      set({ connections: json.connections ?? [] });
    } catch (err) {
      set({
        connectionsError: err instanceof Error ? err.message : "Failed to load connections",
        connections: [],
      });
    } finally {
      set({ connectionsLoading: false });
    }
  },

  getConnectionForServer: async (qualifiedName) => {
    const apiKey = useAppStore.getState().getAuthApiKey();
    if (!apiKey || !qualifiedName) {
      return { connected: false };
    }
    try {
      const res = await authFetch(
        `${endpoint}/mcpservers/connections/check?qualifiedName=${encodeURIComponent(qualifiedName)}`
      );
      if (res.status === 401 || !res.ok) {
        return { connected: false };
      }
      const json = (await res.json()) as { connected: boolean; connection?: McpConnectionItem };
      return {
        connected: Boolean(json.connected),
        connection: json.connection,
      };
    } catch {
      return { connected: false };
    }
  },

  deleteConnection: async (connectionId) => {
    const apiKey = useAppStore.getState().getAuthApiKey();
    if (!apiKey || !connectionId) return false;
    try {
      const res = await authFetch(
        `${endpoint}/mcpservers/connections/${encodeURIComponent(connectionId)}`,
        {
          method: "DELETE",
        }
      );
      await assertAuthFetchOk(res, "Failed to delete connection");
      set((state) => ({
        connections: state.connections.filter((c) => c.connectionId !== connectionId),
      }));
      return true;
    } catch (err) {
      console.error("[mcpserversStore] deleteConnection:", err);
      throw err;
    }
  },
}));
