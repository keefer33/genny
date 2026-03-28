import { create } from "zustand";
import useAppStore from "./appStore";
import { authFetchJson } from "./authFetch";
import { endpoint } from "../utils";

export interface UsageLogEntry {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  usage_amount: number;
  generation_id: string | null;
  transaction_id: string | null;
  type_id: number | null;
  meta: any;
  usage_log_types?: {
    id: number;
    log_type: "credit" | "debit";
    reason_code: string;
    meta_data: any;
  } | null;
  user_generations?: {
    id: string;
    model_id: string;
    models?: {
      id: string;
      name: string;
    } | null;
  } | null;
  transactions?: {
    id: string;
    amount_dollars: number;
    amount_cents: number;
  } | null;
}

export type FetchUsageLogResult =
  | {
      success: true;
      data: {
        logs: UsageLogEntry[];
        total: number;
        page: number;
        limit: number;
      };
    }
  | { success: false; error: string };

interface UsageLogStoreState {
  logs: UsageLogEntry[];
  currentPage: number;
  totalPages: number;
  logsLoading: boolean;

  setLogs: (logs: UsageLogEntry[]) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
  setLogsLoading: (loading: boolean) => void;
  fetchUsageLog: (page?: number, limit?: number) => Promise<FetchUsageLogResult>;

  resetUsageLogState: () => void;
}

const useUsageLogStore = create<UsageLogStoreState>((set) => ({
  logs: [],
  currentPage: 1,
  totalPages: 1,
  logsLoading: false,

  setLogs: (logs) => set({ logs }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (pages) => set({ totalPages: pages }),
  setLogsLoading: (loading) => set({ logsLoading: loading }),

  fetchUsageLog: async (page: number = 1, limit: number = 10) => {
    const appStore = useAppStore.getState();
    const session = appStore.getUser();

    if (!session?.user?.id || !appStore.getAuthApiKey()) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      const json = await authFetchJson<{
        success?: boolean;
        data?: {
          logs: UsageLogEntry[];
          total: number;
          page: number;
          limit: number;
        };
      }>(`${endpoint}/user/usage-log?${qs.toString()}`, undefined, {
        errorMessage: "Failed to fetch usage log",
      });

      if (!json.success || !json.data) {
        return { success: false, error: "Failed to fetch usage log" };
      }

      return {
        success: true,
        data: {
          logs: json.data.logs ?? [],
          total: json.data.total ?? 0,
          page: json.data.page ?? page,
          limit: json.data.limit ?? limit,
        },
      };
    } catch (error) {
      console.error("Error fetching usage log:", error);
      return { success: false, error: "Failed to fetch usage log" };
    }
  },

  resetUsageLogState: () =>
    set({
      logs: [],
      currentPage: 1,
      totalPages: 1,
      logsLoading: false,
    }),
}));

export default useUsageLogStore;
