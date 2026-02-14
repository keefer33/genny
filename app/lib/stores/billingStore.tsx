import { create } from "zustand";
import { TOKEN_PACKAGES } from "~/lib/tokenUtils";
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
  // Payment Modal State
  paymentModalOpen: boolean;
  selectedPackage: (typeof TOKEN_PACKAGES)[0] | null;
  clientSecret: string | null;
  paymentLoading: boolean;

  // Transactions State
  transactions: Transaction[];
  currentPage: number;
  totalPages: number;
  transactionsLoading: boolean;

  // Actions
  openPaymentModal: () => void;
  closePaymentModal: () => void;
  setSelectedPackage: (packageInfo: (typeof TOKEN_PACKAGES)[0] | null) => void;
  setClientSecret: (secret: string | null) => void;
  setPaymentLoading: (loading: boolean) => void;

  // Transaction Actions
  setTransactions: (transactions: Transaction[]) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
  setTransactionsLoading: (loading: boolean) => void;
  fetchTransactions: (page?: number, limit?: number) => Promise<any>;
  createPaymentIntent: (amount: number) => Promise<any>;

  // Reset
  resetBillingState: () => void;
}

const useBillingStore = create<BillingStoreState>((set, get) => ({
  // Initial state
  paymentModalOpen: false,
  selectedPackage: null,
  clientSecret: null,
  paymentLoading: false,

  transactions: [],
  currentPage: 1,
  totalPages: 1,
  transactionsLoading: false,

  // Payment Modal Actions
  openPaymentModal: () => set({ paymentModalOpen: true }),
  closePaymentModal: () =>
    set({
      paymentModalOpen: false,
      selectedPackage: null,
      clientSecret: null,
      paymentLoading: false,
    }),
  setSelectedPackage: (packageInfo) => set({ selectedPackage: packageInfo }),
  setClientSecret: (secret) => set({ clientSecret: secret }),
  setPaymentLoading: (loading) => set({ paymentLoading: loading }),

  // Transaction Actions
  setTransactions: (transactions) => set({ transactions }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (pages) => set({ totalPages: pages }),
  setTransactionsLoading: (loading) => set({ transactionsLoading: loading }),

  // Fetch transactions from Supabase
  fetchTransactions: async (page: number = 1, limit: number = 10) => {
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
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      if (countError) {
        console.error("Error getting transaction count:", countError);
        return { success: false, error: "Failed to fetch transactions" };
      }

      // Get transactions with pagination
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

  // Create payment intent with Stripe
  createPaymentIntent: async (amount: number) => {
    try {
      const session = useAppStore.getState().getUser();
      const apiKey = useAppStore.getState().getAuthApiKey();
      const response = await fetch(`${endpoint}/stripe/create-payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey || ""}`,
        },
        body: JSON.stringify({ amount }),
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

  // Reset all billing state
  resetBillingState: () =>
    set({
      paymentModalOpen: false,
      selectedPackage: null,
      clientSecret: null,
      paymentLoading: false,
      transactions: [],
      currentPage: 1,
      totalPages: 1,
      transactionsLoading: false,
    }),
}));

export default useBillingStore;
