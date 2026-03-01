import { create } from "zustand";
import useAppStore from "./appStore";

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
    const api = appStore.getApi();
    const session = appStore.getUser();
    if (!api || !session?.user?.id) return;

    set({ ticketsLoading: true });
    try {
      const { data, error } = await api
        .from("user_support_tickets")
        .select("id, created_at, user_id, status")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ tickets: (data as SupportTicketRow[]) || [] });
    } catch (e) {
      console.error("Error loading support tickets:", e);
      set({ tickets: [] });
    } finally {
      set({ ticketsLoading: false });
    }
  },

  fetchTicketDetail: async (ticketId: string) => {
    const appStore = useAppStore.getState();
    const api = appStore.getApi();
    const session = appStore.getUser();
    if (!api || !session?.user?.id) return { success: false, notFound: true };

    set({ ticketLoading: true });
    try {
      const { data: ticketData, error: ticketError } = await api
        .from("user_support_tickets")
        .select("id, created_at, user_id, status")
        .eq("id", ticketId)
        .eq("user_id", session.user.id)
        .single();

      if (ticketError || !ticketData) {
        set({ ticket: null, threads: [], ticketLoading: false });
        return { success: false, notFound: true };
      }

      const { data: threadData, error: threadError } = await api
        .from("user_support_tickets_threads")
        .select("id, created_at, ticket_id, user_id, message")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (threadError) throw threadError;

      set({
        ticket: ticketData as SupportTicketDetail,
        threads: (threadData as SupportThreadMessage[]) || [],
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
    const api = appStore.getApi();
    const session = appStore.getUser();
    if (!api || !session?.user?.id) return { success: false, error: "Not authenticated" };

    const trimmed = message.trim();
    if (!trimmed) return { success: false, error: "Please enter a message" };

    set({ createSubmitting: true });
    try {
      const { data: ticket, error: ticketError } = await api
        .from("user_support_tickets")
        .insert({ user_id: session.user.id })
        .select("id")
        .single();

      if (ticketError) throw ticketError;
      if (!ticket?.id) throw new Error("No ticket id returned");

      const { error: threadError } = await api.from("user_support_tickets_threads").insert({
        ticket_id: ticket.id,
        user_id: session.user.id,
        message: trimmed,
      });

      if (threadError) throw threadError;

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
    const api = appStore.getApi();
    const session = appStore.getUser();
    const { reply: replyText } = get();
    if (!api || !session?.user?.id) return { success: false, error: "Not authenticated" };

    const trimmed = replyText.trim();
    if (!trimmed) return { success: false, error: "Please enter a message" };

    set({ replySubmitting: true });
    try {
      const { data, error } = await api
        .from("user_support_tickets_threads")
        .insert({
          ticket_id: ticketId,
          user_id: session.user.id,
          message: trimmed,
        })
        .select("id, created_at, ticket_id, user_id, message")
        .single();

      if (error) throw error;
      if (data) {
        set((state) => ({
          threads: [...state.threads, data as SupportThreadMessage],
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
