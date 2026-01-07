import { create } from "zustand";
import useAppStore from "./appStore";

export interface TokensLogEntry {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  token_amount: number;
  generation_id: string | null;
  transaction_id: string | null;
  type_id: number | null;
  tokens_log_types?: {
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

interface TokensLogStoreState {
  // Tokens Log State
  logs: TokensLogEntry[];
  currentPage: number;
  totalPages: number;
  logsLoading: boolean;

  // Actions
  setLogs: (logs: TokensLogEntry[]) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
  setLogsLoading: (loading: boolean) => void;
  fetchTokensLog: (page?: number, limit?: number) => Promise<any>;

  // Reset
  resetTokensLogState: () => void;
}

const useTokensLogStore = create<TokensLogStoreState>((set, get) => ({
  // Initial state
  logs: [],
  currentPage: 1,
  totalPages: 1,
  logsLoading: false,

  // Actions
  setLogs: (logs) => set({ logs }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (pages) => set({ totalPages: pages }),
  setLogsLoading: (loading) => set({ logsLoading: loading }),

  // Fetch tokens log from Supabase
  fetchTokensLog: async (page: number = 1, limit: number = 10) => {
    const appStore = useAppStore.getState();
    const api = appStore.getApi();
    const session = appStore.getUser();

    if (!api || !session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      const offset = (page - 1) * limit;

      // Get total count
      const { count, error: countError } = await api
        .from("user_tokens_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      if (countError) {
        console.error("Error getting tokens log count:", countError);
        return { success: false, error: "Failed to fetch tokens log" };
      }

      // Get tokens log entries with pagination and join with tokens_log_types, user_generations, and transactions
      const { data: logsData, error: logsError } = await api
        .from("user_tokens_log")
        .select(
          `
          *,
          tokens_log_types (
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
        console.error("Error fetching tokens log:", logsError);
        return { success: false, error: "Failed to fetch tokens log" };
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
      console.error("Error fetching tokens log:", error);
      return { success: false, error: "Failed to fetch tokens log" };
    }
  },

  // Reset all tokens log state
  resetTokensLogState: () =>
    set({
      logs: [],
      currentPage: 1,
      totalPages: 1,
      logsLoading: false,
    }),
}));

export default useTokensLogStore;
