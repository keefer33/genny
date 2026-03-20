import { create } from "zustand";
import { notifications } from "@mantine/notifications";
import useAppStore from "~/lib/stores/appStore";
import { endpoint } from "~/lib/utils";

/** Chat row from GET /chats (user_models_chats). */
export interface ChatRow {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  agent_id: string;
  metadata: Record<string, unknown>;
}

/** Message row from GET /chats/:id/messages (user_models_chats_messages). */
export interface ChatMessageRow {
  id: string;
  created_at: string;
  chat_id: string;
  /** Stored as json/jsonb in DB; API may return object or JSON string. */
  message:
    | string
    | {
        id?: string;
        role: "user" | "assistant";
        content: Array<{ type: string; text?: string; imageUrl?: string }>;
      };
  /** Stored as json/jsonb in DB; API may return object or JSON string. */
  usage:
    | string
    | { inputTokens?: number; outputTokens?: number; totalTokens?: number; total_cost?: number }
    | null;
}

/** UI message shape for MessageBubble (same as agentsStore.UIMessage). */
export interface ChatUIMessage {
  id: string;
  role: "user" | "assistant";
  content: Array<{ type: string; text?: string; imageUrl?: string }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    total_cost?: number;
  };
}

/** User agent row from user_agents table. */
export interface UserAgentRow {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  name: string;
  model_name: string;
  config: Record<string, unknown> | null;
}

/** Agent config.settings shape (tools = per-toolkit tool slugs + systemPrompt). */
export interface UserAgentSettings {
  /** Map toolkit slug -> enabled tool slugs e.g. { gmail: ["GMAIL_SEND_EMAIL"], github: ["GITHUB_CREATE_ISSUE"] } */
  tools?: Record<string, string[]>;
  systemPrompt?: string;
}

/** Type for agent.config when it has settings. */
export interface UserAgentConfigWithSettings {
  settings?: UserAgentSettings;
  [key: string]: unknown;
}

function safeJsonParse(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function chatMessageRowToUIMessage(row: ChatMessageRow): ChatUIMessage {
  const parsedMessage = safeJsonParse(row.message) as
    | {
        id?: string;
        role?: "user" | "assistant";
        content?: Array<{ type: string; text?: string; imageUrl?: string }>;
      }
    | string
    | null
    | undefined;

  const messageObj =
    parsedMessage && typeof parsedMessage === "object" ? (parsedMessage as any) : null;

  const parsedUsage = safeJsonParse(row.usage) as
    | {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
        total_cost?: number;
      }
    | null
    | undefined;

  const totalCost =
    typeof parsedUsage?.total_cost === "number" && Number.isFinite(parsedUsage.total_cost)
      ? parsedUsage.total_cost
      : undefined;

  return {
    id: row.id,
    role: messageObj?.role === "user" ? "user" : "assistant",
    content: Array.isArray(messageObj?.content) ? messageObj.content : [],
    usage:
      parsedUsage?.totalTokens != null
        ? {
            input_tokens: parsedUsage.inputTokens ?? 0,
            output_tokens: parsedUsage.outputTokens ?? 0,
            total_tokens: parsedUsage.totalTokens ?? 0,
            ...(totalCost != null ? { total_cost: totalCost } : {}),
          }
        : totalCost != null
          ? { total_cost: totalCost }
          : undefined,
  };
}

interface ChatsState {
  chats: ChatRow[];
  getChats: () => ChatRow[];
  chatsLoading: boolean;
  agents: UserAgentRow[];
  agentsLoading: boolean;
  messages: ChatUIMessage[];
  streamingContent: string;
  /** File URLs received during current stream (so streaming bubble can show images). Cleared when stream ends. */
  streamedFileUrls: string[];
  /** Current stream phase for UI: start, reasoning, tool_input, step_start, etc. Cleared on usage/error/done. */
  streamStatus: { status: string; tool_name?: string } | null;
  runChatLoading: boolean;

  selectedModelName: string | null;
  selectedChat: ChatRow | null;
  selectedAgent: UserAgentRow | null;
  agentPickerOpen: boolean;
  setSelectedModelName: (name: string | null) => void;
  setSelectedChat: (chat: ChatRow | null) => void;
  setSelectedAgent: (agent: UserAgentRow | null) => void;
  setAgentPickerOpen: (open: boolean) => void;

  setMessages: (messages: ChatUIMessage[]) => void;
  clearChats: () => void;
  loadMessagesForChat: (userId: string, chatId: string) => Promise<void>;
  runChat: (
    userId: string,
    chatId: string | null,
    agentId: string,
    prompt: string
  ) => Promise<void>;

  listChats: (userId: string, agentId?: string) => Promise<ChatRow[]>;
  createChat: (
    userId: string,
    agentId: string,
    metadata?: Record<string, unknown>
  ) => Promise<ChatRow | null>;
  getChat: (userId: string, chatId: string) => Promise<ChatRow | null>;
  updateChat: (
    userId: string,
    chatId: string,
    metadata: Record<string, unknown>
  ) => Promise<boolean>;
  deleteChat: (userId: string, chatId: string) => Promise<boolean>;
  listChatMessages: (
    userId: string,
    chatId: string,
    options?: { limit?: number; order?: "asc" | "desc" }
  ) => Promise<ChatMessageRow[]>;
  createChatMessage: (
    userId: string,
    chatId: string,
    message: {
      id: string;
      role: "user" | "assistant";
      content: Array<{ type: string; text?: string }>;
    },
    usage?: Record<string, unknown>
  ) => Promise<ChatMessageRow | null>;
  loadAgents: (userId: string) => Promise<void>;
  createUserAgent: (
    userId: string,
    name: string,
    modelName: string,
    config?: Record<string, unknown> | null
  ) => Promise<UserAgentRow | null>;
  updateUserAgent: (
    userId: string,
    agentId: string,
    payload: { name?: string; model_name?: string; config?: Record<string, unknown> | null }
  ) => Promise<boolean>;
  deleteUserAgent: (userId: string, agentId: string) => Promise<boolean>;
}

async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = useAppStore.getState().getAuthApiKey();
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  return fetch(url, { ...init, headers });
}

const userChoseNewChatRef = { current: false };

export const useChatsStore = create<ChatsState>((set, get) => ({
  chats: [],
  getChats: () => get().chats,
  chatsLoading: false,
  agents: [],
  agentsLoading: false,
  messages: [],
  streamingContent: "",
  streamedFileUrls: [],
  streamStatus: null,
  runChatLoading: false,

  selectedModelName: null,
  selectedChat: null,
  selectedAgent: null,
  agentPickerOpen: false,
  userChoseNewChatRef,
  setSelectedModelName: (name) => set({ selectedModelName: name }),
  setSelectedChat: (chat) => set({ selectedChat: chat }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  setAgentPickerOpen: (open) => set({ agentPickerOpen: open }),

  setMessages: (messages: ChatUIMessage[]) => set({ messages }),

  clearChats: () => set({ chats: [], selectedChat: null, messages: [], selectedModelName: null }),

  loadMessagesForChat: async (userId: string, chatId: string) => {
    const rows = await get().listChatMessages(userId, chatId, { order: "asc" });
    set({ messages: rows.map(chatMessageRowToUIMessage) });
  },

  runChat: async (userId: string, chatId: string | null, agentId: string, prompt: string) => {
    const apiKey = useAppStore.getState().getAuthApiKey();
    if (!apiKey) return;
    set({ runChatLoading: true, streamingContent: "", streamedFileUrls: [], streamStatus: null });
    const userMessage: ChatUIMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: [{ type: "text", text: prompt }],
    };
    set((s) => ({ messages: [...s.messages, userMessage] }));

    try {
      const res = await authFetch(`${endpoint}/agents/run`, {
        method: "POST",
        body: JSON.stringify({
          chat_id: chatId,
          agent_id: agentId,
          prompt,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? res.statusText);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      const streamedFileUrls: string[] = [];
      let lastUsage: {
        input_tokens?: number;
        output_tokens?: number;
        total_tokens?: number;
        total_cost?: number;
      } | null = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6)) as {
                  type: string;
                  content?: string;
                  url?: string;
                  error?: string;
                  status?: string;
                  tool_name?: string;
                  input_tokens?: number;
                  output_tokens?: number;
                  total_tokens?: number;
                };
                if (data.type === "text" && data.content) {
                  assistantText += data.content;
                  set({ streamingContent: assistantText });
                } else if (data.type === "file" && data.url) {
                  streamedFileUrls.push(data.url);
                  set((s) => ({ streamedFileUrls: [...s.streamedFileUrls, data.url!] }));
                } else if (data.type === "stream_status" && data.status != null) {
                  set({
                    streamStatus: {
                      status: data.status,
                      ...(data.tool_name != null ? { tool_name: data.tool_name } : {}),
                    },
                  });
                } else if (data.type === "usage") {
                  const totalCostRaw = (data as { total_cost?: unknown }).total_cost;
                  const totalCost =
                    typeof totalCostRaw === "number"
                      ? totalCostRaw
                      : typeof totalCostRaw === "string"
                        ? Number(totalCostRaw)
                        : undefined;
                  lastUsage = {
                    input_tokens: data.input_tokens,
                    output_tokens: data.output_tokens,
                    total_tokens: data.total_tokens,
                    total_cost: Number.isFinite(totalCost) ? totalCost : undefined,
                  };
                  set({ streamStatus: null });
                } else if (data.type === "error") {
                  set({ streamStatus: null });
                  throw new Error(data.error ?? "Stream error");
                }
              } catch (e) {
                if (e instanceof SyntaxError) continue;
                throw e;
              }
            }
          }
        }
      }

      const usage = lastUsage;
      const content: ChatUIMessage["content"] = [
        { type: "text", text: assistantText },
        ...streamedFileUrls.map((url) => ({ type: "image" as const, imageUrl: url })),
      ];
      const assistantMessage: ChatUIMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content,
        usage:
          usage != null
            ? {
                input_tokens: usage.input_tokens ?? 0,
                output_tokens: usage.output_tokens ?? 0,
                total_tokens: usage.total_tokens ?? 0,
                ...(usage.total_cost != null ? { total_cost: usage.total_cost } : {}),
              }
            : undefined,
      };
      set((s) => ({
        messages: [...s.messages, assistantMessage],
        streamingContent: "",
        streamedFileUrls: [],
        streamStatus: null,
        runChatLoading: false,
      }));
    } catch (err) {
      set({
        runChatLoading: false,
        streamingContent: "",
        streamedFileUrls: [],
        streamStatus: null,
      });
      notifications.show({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to run chat",
        color: "red",
      });
    }
  },

  listChats: async (userId: string, agentId?: string) => {
    set({ chatsLoading: true });
    try {
      const q = agentId ? `?agent_id=${encodeURIComponent(agentId)}` : "";
      const res = await authFetch(`${endpoint}/chats${q}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to list chats");
      }
      const data = await res.json();
      const list = (Array.isArray(data) ? data : []) as ChatRow[];
      set({ chats: list });
      return list;
    } catch (err) {
      console.error("[chatsStore] listChats:", err);
      set({ chats: [] });
      return [];
    } finally {
      set({ chatsLoading: false });
    }
  },

  createChat: async (userId: string, agentId: string, metadata?: Record<string, unknown>) => {
    try {
      const res = await authFetch(`${endpoint}/chats`, {
        method: "POST",
        body: JSON.stringify({ agent_id: agentId, metadata: metadata ?? {} }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to create chat");
      }
      const chat = (await res.json()) as ChatRow;
      set((s) => ({ chats: [chat, ...s.chats] }));
      return chat;
    } catch (err) {
      console.error("[chatsStore] createChat:", err);
      notifications.show({ title: "Error", message: (err as Error).message, color: "red" });
      return null;
    }
  },

  getChat: async (userId: string, chatId: string) => {
    try {
      const res = await authFetch(`${endpoint}/chats/${encodeURIComponent(chatId)}`);
      if (!res.ok) return null;
      return (await res.json()) as ChatRow;
    } catch {
      return null;
    }
  },

  updateChat: async (userId: string, chatId: string, metadata: Record<string, unknown>) => {
    try {
      const res = await authFetch(`${endpoint}/chats/chat/${encodeURIComponent(chatId)}`, {
        method: "PATCH",
        body: JSON.stringify({ metadata }),
      });
      if (!res.ok) return false;
      const updated = (await res.json()) as ChatRow;
      set((s) => ({
        chats: s.chats.map((c) => (c.id === chatId ? updated : c)),
      }));
      return true;
    } catch {
      return false;
    }
  },

  deleteChat: async (userId: string, chatId: string) => {
    try {
      const res = await authFetch(`${endpoint}/chats/chat/${encodeURIComponent(chatId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to delete chat");
      }
      set((s) => ({ chats: s.chats.filter((c) => c.id !== chatId) }));
      return true;
    } catch (err) {
      console.error("[chatsStore] deleteChat:", err);
      notifications.show({ title: "Error", message: (err as Error).message, color: "red" });
      return false;
    }
  },

  listChatMessages: async (
    userId: string,
    chatId: string,
    options?: { limit?: number; order?: "asc" | "desc" }
  ) => {
    const params = new URLSearchParams();
    if (options?.limit != null) params.set("limit", String(options.limit));
    if (options?.order) params.set("order", options.order);
    const q = params.toString() ? `?${params.toString()}` : "";
    const res = await authFetch(
      `${endpoint}/chats/chat/${encodeURIComponent(chatId)}/messages${q}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const list = (data?.data ?? []) as ChatMessageRow[];
    return list;
  },

  createChatMessage: async (
    userId: string,
    chatId: string,
    message: {
      id: string;
      role: "user" | "assistant";
      content: Array<{ type: string; text?: string }>;
    },
    usage?: Record<string, unknown>
  ) => {
    try {
      const res = await authFetch(`${endpoint}/chats/chat/${encodeURIComponent(chatId)}/messages`, {
        method: "POST",
        body: JSON.stringify({ message, usage: usage ?? null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to create message");
      }
      return (await res.json()) as ChatMessageRow;
    } catch (err) {
      console.error("[chatsStore] createChatMessage:", err);
      return null;
    }
  },
  loadAgents: async (userId: string) => {
    if (!userId) return;
    set({ agentsLoading: true });
    try {
      const res = await authFetch(`${endpoint}/agents/user-agents`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to load agents");
      }
      const data = await res.json();
      const list = (Array.isArray(data) ? data : []) as UserAgentRow[];
      set({ agents: list });
    } catch (err) {
      console.error("[chatsStore] loadAgents:", err);
      set({ agents: [] });
    } finally {
      set({ agentsLoading: false });
    }
  },
  createUserAgent: async (
    userId: string,
    name: string,
    modelName: string,
    config?: Record<string, unknown> | null
  ) => {
    if (!userId || !name.trim()) return null;
    try {
      const res = await authFetch(`${endpoint}/agents/user-agents`, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          model_name: modelName,
          config: config ?? null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to create agent");
      }
      const agent = (await res.json()) as UserAgentRow;
      set((s) => ({
        agents: [agent, ...s.agents],
        selectedAgent: agent,
        selectedModelName: agent.model_name,
      }));
      notifications.show({
        title: "Agent created",
        message: "Your agent was created successfully.",
        color: "green",
      });
      return agent;
    } catch (err) {
      console.error("[chatsStore] createUserAgent:", err);
      notifications.show({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to create agent",
        color: "red",
      });
      return null;
    }
  },
  updateUserAgent: async (
    userId: string,
    agentId: string,
    payload: { name?: string; model_name?: string; config?: Record<string, unknown> | null }
  ) => {
    try {
      const body: Record<string, unknown> = {};
      if (typeof payload.name === "string") body.name = payload.name;
      if (typeof payload.model_name === "string") body.model_name = payload.model_name;
      if (payload.config !== undefined) body.config = payload.config;
      const res = await authFetch(`${endpoint}/agents/user-agents/${encodeURIComponent(agentId)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to update agent");
      }
      const updated = (await res.json()) as UserAgentRow;
      set((s) => ({
        agents: s.agents.map((a) => (a.id === agentId ? updated : a)),
        selectedAgent: s.selectedAgent?.id === agentId ? updated : s.selectedAgent,
      }));
      return true;
    } catch (err) {
      console.error("[chatsStore] updateUserAgent:", err);
      notifications.show({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to update agent",
        color: "red",
      });
      return false;
    }
  },
  deleteUserAgent: async (userId: string, agentId: string) => {
    try {
      const res = await authFetch(`${endpoint}/agents/user-agents/${encodeURIComponent(agentId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to delete agent");
      }
      set((s) => {
        const wasSelected = s.selectedAgent?.id === agentId;
        return {
          agents: s.agents.filter((a) => a.id !== agentId),
          ...(wasSelected
            ? {
                selectedAgent: null,
                selectedChat: null,
                selectedModelName: null,
                chats: [],
                messages: [],
              }
            : {}),
        };
      });
      notifications.show({
        title: "Agent deleted",
        message: "The agent was removed.",
        color: "green",
      });
      return true;
    } catch (err) {
      console.error("[chatsStore] deleteUserAgent:", err);
      notifications.show({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to delete agent",
        color: "red",
      });
      return false;
    }
  },
}));
