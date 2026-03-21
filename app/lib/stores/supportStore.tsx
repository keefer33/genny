import { create } from "zustand";
import useAppStore from "./appStore";
import { assertAuthFetchOk, authFetch } from "./authFetch";
import { endpoint } from "../utils";

export type TicketStatus = "opened" | "closed" | "pending";

export interface SupportTicketRow {
  id: string;
  created_at: string;
  user_id: string;
  status: TicketStatus;
}

export interface SupportTicketDetail {
  id: string;
  created_at: string;
  user_id: string;
  status: TicketStatus;
}

export interface SupportThreadMessage {
  id: string;
  created_at: string;
  ticket_id: string;
  user_id: string;
  message: string;
}

export function getStatusColor(status: TicketStatus): string {
  switch (status) {
    case "opened":
      return "blue";
    case "closed":
      return "gray";
    case "pending":
      return "yellow";
    default:
      return "gray";
  }
}

interface SupportStoreState {
  // List state
  tickets: SupportTicketRow[];
  ticketsLoading: boolean;

  // Detail state
  ticket: SupportTicketDetail | null;
  threads: SupportThreadMessage[];
  ticketLoading: boolean;

  // Create ticket modal
  newMessage: string;
  createSubmitting: boolean;

  // Reply form (detail page)
  reply: string;
  replySubmitting: boolean;

  // Setters
  setTickets: (tickets: SupportTicketRow[]) => void;
  setTicketsLoading: (loading: boolean) => void;
  setTicket: (ticket: SupportTicketDetail | null) => void;
  setThreads: (threads: SupportThreadMessage[]) => void;
  setTicketLoading: (loading: boolean) => void;
  setNewMessage: (message: string) => void;
  setReply: (reply: string) => void;

  // Actions
  fetchTickets: () => Promise<void>;
  fetchTicketDetail: (ticketId: string) => Promise<{ success: boolean; notFound?: boolean }>;
  createTicket: (message: string) => Promise<{ success: boolean; error?: string }>;
  sendReply: (ticketId: string) => Promise<{ success: boolean; error?: string }>;

  // Reset detail when leaving page
  resetDetail: () => void;
}

const useSupportStore = create<SupportStoreState>((set, get) => ({
  tickets: [],
  ticketsLoading: false,
  ticket: null,
  threads: [],
  ticketLoading: false,
  newMessage: "",
  createSubmitting: false,
  reply: "",
  replySubmitting: false,

  setTickets: (tickets) => set({ tickets }),
  setTicketsLoading: (ticketsLoading) => set({ ticketsLoading }),
  setTicket: (ticket) => set({ ticket }),
  setThreads: (threads) => set({ threads }),
  setTicketLoading: (ticketLoading) => set({ ticketLoading }),
  setNewMessage: (newMessage) => set({ newMessage }),
  setReply: (reply) => set({ reply }),

  fetchTickets: async () => {
    const appStore = useAppStore.getState();
    const session = appStore.getUser();
    if (!session?.user?.id || !appStore.getAuthApiKey()) return;

    set({ ticketsLoading: true });
    try {
      const res = await authFetch(`${endpoint}/support`);
      await assertAuthFetchOk(res, "Failed to load support tickets");
      const json = (await res.json()) as {
        success?: boolean;
        data?: { tickets: SupportTicketRow[] };
      };
      set({ tickets: json.data?.tickets ?? [] });
    } catch (e) {
      console.error("Error loading support tickets:", e);
      set({ tickets: [] });
    } finally {
      set({ ticketsLoading: false });
    }
  },

  fetchTicketDetail: async (ticketId: string) => {
    const appStore = useAppStore.getState();
    const session = appStore.getUser();
    if (!session?.user?.id || !appStore.getAuthApiKey()) {
      return { success: false, notFound: true };
    }

    set({ ticketLoading: true });
    try {
      const res = await authFetch(`${endpoint}/support/${encodeURIComponent(ticketId)}`);
      if (res.status === 404) {
        set({ ticket: null, threads: [], ticketLoading: false });
        return { success: false, notFound: true };
      }
      await assertAuthFetchOk(res, "Failed to load ticket");
      const json = (await res.json()) as {
        success?: boolean;
        data?: { ticket: SupportTicketDetail; threads: SupportThreadMessage[] };
      };

      const payload = json.data;
      if (!payload?.ticket) {
        set({ ticket: null, threads: [], ticketLoading: false });
        return { success: false, notFound: true };
      }

      set({
        ticket: payload.ticket,
        threads: payload.threads ?? [],
        ticketLoading: false,
      });
      return { success: true };
    } catch (e) {
      console.error("Error loading ticket:", e);
      set({ ticket: null, threads: [], ticketLoading: false });
      return { success: false, notFound: true };
    }
  },

  createTicket: async (message: string) => {
    const appStore = useAppStore.getState();
    const session = appStore.getUser();
    if (!session?.user?.id || !appStore.getAuthApiKey()) {
      return { success: false, error: "Not authenticated" };
    }

    const trimmed = message.trim();
    if (!trimmed) return { success: false, error: "Please enter a message" };

    set({ createSubmitting: true });
    try {
      const res = await authFetch(`${endpoint}/support`, {
        method: "POST",
        body: JSON.stringify({ message: trimmed }),
      });
      await assertAuthFetchOk(res, "Failed to create ticket");

      set({ newMessage: "", createSubmitting: false });
      await get().fetchTickets();
      return { success: true };
    } catch (e: unknown) {
      const err = e as Error;
      set({ createSubmitting: false });
      return { success: false, error: err?.message || "Failed to create ticket" };
    }
  },

  sendReply: async (ticketId: string) => {
    const appStore = useAppStore.getState();
    const session = appStore.getUser();
    const { reply: replyText } = get();
    if (!session?.user?.id || !appStore.getAuthApiKey()) {
      return { success: false, error: "Not authenticated" };
    }

    const trimmed = replyText.trim();
    if (!trimmed) return { success: false, error: "Please enter a message" };

    set({ replySubmitting: true });
    try {
      const res = await authFetch(`${endpoint}/support/${encodeURIComponent(ticketId)}/replies`, {
        method: "POST",
        body: JSON.stringify({ message: trimmed }),
      });
      await assertAuthFetchOk(res, "Failed to send reply");
      const json = (await res.json()) as {
        success?: boolean;
        data?: { thread: SupportThreadMessage };
      };
      const row = json.data?.thread;

      if (row) {
        set((state) => ({
          threads: [...state.threads, row],
          reply: "",
          replySubmitting: false,
        }));
      } else {
        set({ replySubmitting: false });
      }
      return { success: true };
    } catch (e: unknown) {
      const err = e as Error;
      set({ replySubmitting: false });
      return { success: false, error: err?.message || "Failed to send reply" };
    }
  },

  resetDetail: () => set({ ticket: null, threads: [], reply: "" }),
}));

export default useSupportStore;
