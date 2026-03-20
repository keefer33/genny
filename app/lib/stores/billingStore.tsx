import { create } from "zustand";
import type { CreditTopUpOption } from "~/lib/tokenUtils";
import useAppStore from "./appStore";
import { endpoint } from "../utils";

interface Transaction {
  id: string;
  amount_cents: number;
  amount_dollars: number;
  tokens_purchased: number;
  status: string;
  created_at: string;
  completed_at: string | null;
  stripe_payment_intent_id: string;
}

interface BillingStoreState {
  paymentModalOpen: boolean;
  selectedTopUp: CreditTopUpOption | null;
  clientSecret: string | null;
  paymentLoading: boolean;

  transactions: Transaction[];
  currentPage: number;
  totalPages: number;
  transactionsLoading: boolean;

  openPaymentModal: () => void;
  closePaymentModal: () => void;
  setSelectedTopUp: (option: CreditTopUpOption | null) => void;
  setClientSecret: (secret: string | null) => void;
  setPaymentLoading: (loading: boolean) => void;

  setTransactions: (transactions: Transaction[]) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
  setTransactionsLoading: (loading: boolean) => void;
  fetchTransactions: (page?: number, limit?: number) => Promise<any>;
  createPaymentIntent: (amountDollars: number) => Promise<any>;

  resetBillingState: () => void;
}

const useBillingStore = create<BillingStoreState>((set) => ({
  paymentModalOpen: false,
  selectedTopUp: null,
  clientSecret: null,
  paymentLoading: false,

  transactions: [],
  currentPage: 1,
  totalPages: 1,
  transactionsLoading: false,

  openPaymentModal: () => set({ paymentModalOpen: true }),
  closePaymentModal: () =>
    set({
      paymentModalOpen: false,
      selectedTopUp: null,
      clientSecret: null,
      paymentLoading: false,
    }),
  setSelectedTopUp: (option) => set({ selectedTopUp: option }),
  setClientSecret: (secret) => set({ clientSecret: secret }),
  setPaymentLoading: (loading) => set({ paymentLoading: loading }),

  setTransactions: (transactions) => set({ transactions }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (pages) => set({ totalPages: pages }),
  setTransactionsLoading: (loading) => set({ transactionsLoading: loading }),

  fetchTransactions: async (page: number = 1, limit: number = 10) => {
    const appStore = useAppStore.getState();
    const api = appStore.getApi();
    const session = appStore.getUser();

    if (!api || !session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      const offset = (page - 1) * limit;

      const { count, error: countError } = await api
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      if (countError) {
        console.error("Error getting transaction count:", countError);
        return { success: false, error: "Failed to fetch transactions" };
      }

      const { data: transactions, error: transactionsError } = await api
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError);
        return { success: false, error: "Failed to fetch transactions" };
      }

      return {
        success: true,
        data: {
          transactions: transactions || [],
          total: count || 0,
          page,
          limit,
        },
      };
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return { success: false, error: "Failed to fetch transactions" };
    }
  },

  createPaymentIntent: async (amountDollars: number) => {
    try {
      const apiKey = useAppStore.getState().getAuthApiKey();
      const response = await fetch(`${endpoint}/stripe/create-payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey || ""}`,
        },
        body: JSON.stringify({ amount: amountDollars }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to create payment intent" };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error creating payment intent:", error);
      return { success: false, error: "Network error" };
    }
  },

  resetBillingState: () =>
    set({
      paymentModalOpen: false,
      selectedTopUp: null,
      clientSecret: null,
      paymentLoading: false,
      transactions: [],
      currentPage: 1,
      totalPages: 1,
      transactionsLoading: false,
    }),
}));

export default useBillingStore;
