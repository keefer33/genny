import { create } from "zustand";
import type { CreditTopUpOption } from "~/lib/tokenUtils";
import useAppStore from "./appStore";
import { assertAuthFetchOk, authFetch } from "./authFetch";
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
    if (!appStore.getAuthApiKey()) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      const response = await authFetch(`${endpoint}/user/transactions?${params.toString()}`);
      await assertAuthFetchOk(response, "Failed to fetch transactions");
      const json = (await response.json()) as {
        success?: boolean;
        data?: {
          transactions: Transaction[];
          total: number;
          page: number;
          limit: number;
        };
        error?: string;
        message?: string;
      };

      if (!json.success || !json.data) {
        return {
          success: false,
          error: json.error || json.message || "Failed to fetch transactions",
        };
      }

      return {
        success: true,
        data: {
          transactions: json.data.transactions ?? [],
          total: json.data.total ?? 0,
          page: json.data.page ?? page,
          limit: json.data.limit ?? limit,
        },
      };
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch transactions",
      };
    }
  },

  createPaymentIntent: async (amountDollars: number) => {
    try {
      const response = await authFetch(`${endpoint}/stripe/create-payment-intent`, {
        method: "POST",
        body: JSON.stringify({ amount: amountDollars }),
      });

      await assertAuthFetchOk(response, "Failed to create payment intent");
      const data = await response.json();

      return { success: true, data };
    } catch (error) {
      console.error("Error creating payment intent:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
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
