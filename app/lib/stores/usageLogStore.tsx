import { create } from "zustand";
import useAppStore from "./appStore";

export interface UsageLogEntry {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  usage_amount: number;
  generation_id: string | null;
  transaction_id: string | null;
  type_id: number | null;
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

interface UsageLogStoreState {
  logs: UsageLogEntry[];
  currentPage: number;
  totalPages: number;
  logsLoading: boolean;

  setLogs: (logs: UsageLogEntry[]) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
  setLogsLoading: (loading: boolean) => void;
  fetchUsageLog: (page?: number, limit?: number) => Promise<any>;

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
    const api = appStore.getApi();
    const session = appStore.getUser();

    if (!api || !session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      const offset = (page - 1) * limit;

      const { count, error: countError } = await api
        .from("user_usage_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      if (countError) {
        console.error("Error getting usage log count:", countError);
        return { success: false, error: "Failed to fetch usage log" };
      }

      const { data: logsData, error: logsError } = await api
        .from("user_usage_log")
        .select(
          `
          *,
          usage_log_types (
            id,
            log_type,
            reason_code,
            meta_data
          ),
          user_generations (
            id,
            model_id,
            models (
              id,
              name
            )
          ),
          transactions (
            id,
            amount_dollars,
            amount_cents
          )
        `
        )
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (logsError) {
        console.error("Error fetching usage log:", logsError);
        return { success: false, error: "Failed to fetch usage log" };
      }

      return {
        success: true,
        data: {
          logs: logsData || [],
          total: count || 0,
          page,
          limit,
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

